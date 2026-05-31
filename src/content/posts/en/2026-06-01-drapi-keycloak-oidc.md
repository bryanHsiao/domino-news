---
title: "Implementation Notes: DRAPI Login via Keycloak OIDC — Works on Domino 12.0.2, No Need to Wait for 14"
description: "Wiring DRAPI (Domino REST API) up to a modern IdP like Keycloak, Azure AD, or Okta is widely assumed to require Domino 14, since most of the public documentation centres on the 14-era OIDC story. In practice, DRAPI's oidc mode works on Domino 12.0.2 — no server upgrade required. This article is the implementation notebook from reproducing the full setup locally: picking among DRAPI's three OIDC modes (jwt / oidc / oidc-idpcat), debugging the three-layer auth architecture (identity / mapping / authorization), and the four traps that ate the most time — the biggest of which is providerUrl using localhost failing across machines because Java resolves IPv4 by default. Full step-by-step lives in the companion GitHub repo and Pages site; this article doesn't repeat the setup, it focuses on decisions and pitfalls."
pubDate: 2026-06-01T07:30:00+08:00
lang: en
slug: drapi-keycloak-oidc
tags:
  - "Domino"
  - "Tutorial"
sources:
  - title: "DRAPI + Keycloak OIDC implementation notes — GitHub repo"
    url: "https://github.com/bryanHsiao/drapi-oidc-keycloak"
  - title: "DRAPI + Keycloak OIDC implementation notes — public site"
    url: "https://bryanhsiao.github.io/drapi-oidc-keycloak/"
  - title: "Authentication — HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html"
  - title: "Configuring OIDC-based SSO for web users (Domino 12.0.2)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/secu_config_oidc_based_sso_for_web.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/drapi-keycloak-oidc.webp"
coverStyle: "low-poly-3d"
---

You want to plug DRAPI (Domino REST API) into a modern IdP — Keycloak, Azure AD, Okta — to bypass the legacy LTPA cookie and `domcfg.nsf` form-login. The instinct is to assume this requires Domino 14, since most of the public OIDC documentation centres on 14-era features.

It turns out DRAPI's **`oidc` mode works on Domino 12.0.2** — no server upgrade required. The setup has plenty of steps, but every one has official support; it's not a hack.

This article is the notebook from reproducing the full setup on a local box. It focuses on three things: how to pick among DRAPI's three OIDC modes, why DRAPI's three-layer auth architecture changes how you debug, and the four traps that consume the most time. The complete step-by-step is in the [GitHub repo](https://github.com/bryanHsiao/drapi-oidc-keycloak) and its companion [Pages site](https://bryanhsiao.github.io/drapi-oidc-keycloak/); this article doesn't repeat the setup — it focuses on decisions and pitfalls.

---

## TL;DR

- [**DRAPI has three OIDC modes**](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html): `jwt` (public keys only), `oidc` (standard OIDC providers, needs clientId + clientSecret), `oidc-idpcat` (**requires Domino 14+**, shares idpcat.nsf config with Domino server).
- **This demo uses `oidc` mode** — clientId / clientSecret go straight into `keepconfig.d`, independent of Domino server version.
- **Domino 12.0.2 is enough** — [12.0.2 already shipped OIDC web login configuration](https://help.hcl-software.com/domino/12.0.2/admin/secu_config_oidc_based_sso_for_web.html); no need to wait for 14.
- **Three independent auth layers**: identity (OIDC verifies who you are) → mapping (token claims map to a Person doc) → authorization (scope determines what you can do). Any layer can fail with the same "login failed" surface — debug needs to traverse them in order.
- **Four pitfalls**: missing `adminui` block / **`providerUrl` set to localhost failing across machines because Java resolves IPv4 by default** (the worst) / browser localStorage caching stale OIDC config / default client scopes not back-applying to existing clients.
- **Complete setup** — WSL Ubuntu + Keycloak install, realm / client / scope config, DRAPI keepconfig.d wiring, PEM cert trust, curl reachability checks — all on the [repo + Pages site](https://bryanhsiao.github.io/drapi-oidc-keycloak/).

---

## Why this demo is worth running once

A few motivations:

1. **Replacing `domcfg.nsf` form login**: The traditional `domcfg.nsf` login form is hard-wired to Domino accounts and painful to integrate with modern IdPs. OIDC is the industry standard; Keycloak is a mature open-source option; combining them lets you wire single sign-on across systems.
2. **DRAPI is the entry point for modern stacks**: For React, Vue, plain SPAs, and mobile apps, DRAPI is the primary path to Domino data. If that authentication layer speaks OIDC, the entire frontend toolchain can use industry-standard IdP libraries.
3. **Running it locally eliminates version anxiety**: A lot of teams stall on "our server is 12.x, we have to wait for 14 before we can use OIDC." Actually trying it shows `oidc` mode works on 12.0.2 — this is a documentation-coverage misperception, not a technical limit.

---

## DRAPI's three OIDC modes

The [official DRAPI authentication doc](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html) splits OIDC configuration into three modes, picked based on environment and requirements:

| Mode | Fits when | Domino version | clientId/Secret lives in |
|---|---|---|---|
| **`jwt`** | Provider gives you public keys only, or you're hand-building JWT verification | Any version | DRAPI config (`iss` / `kid` / `keyFile`) |
| **`oidc`** | Standard OIDC providers (Keycloak / Entra ID / Okta), want independent DRAPI configuration | **12.0.2+** | Directly in `keepconfig.d` |
| **`oidc-idpcat`** | Shared IdP configuration with Domino server | **Requires 14+** | Domino's `idpcat.nsf`, centrally managed |

### Why this demo picked `oidc`

- **Works on Domino 12.0.2** — `oidc-idpcat` requires 14+; demo environments still on 12.x can't use it
- **Decoupled from Domino server auth** — DRAPI carries its own clientId / clientSecret, doesn't depend on the Domino server's IdP setup. Useful when DRAPI and the Domino server need to point at different IdPs
- **Single JSON file** — config is centralized in `keepconfig.d`; no cross-file chase into `idpcat.nsf`

The `oidc-idpcat` advantage (per the [official doc](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)) is shared cache and shared diagnostics — when Domino server and DRAPI both authenticate against the same provider, the token cache and diagnostics are unified. **When the server eventually moves to 14+**, migrating this demo from `oidc` to `oidc-idpcat` is the natural next step.

---

## Three independent auth layers

When OIDC against DRAPI fails, the most common reaction is to treat "login failed" as "OIDC config is wrong" and start digging through Keycloak. In practice, DRAPI's OIDC handling has **three independent checkpoints, and any of them can fail with the same "login failed" message**:

| Layer | What it checks | Failure symptom |
|---|---|---|
| **1. Identity (who are you)** | OIDC flow itself, Keycloak authentication | Token never returned / Keycloak rejects on its side |
| **2. Identity mapping (which Domino user does this token correspond to)** | Token claim (e.g. email) maps to Person doc Internet address | Token obtained but no matching Domino user, treated as unknown |
| **3. Authorization (what can this user do)** | DRAPI scope (e.g. `$DATA` / `$SETUP`) matches client's assigned scopes | User identified, but missing scope, API call rejected |

Debug by traversing the layers in order:

```
Login failed
  ├─ Keycloak realm log shows an error?      → Layer 1, OIDC itself
  ├─ DRAPI log shows "user not found in directory"?  → Layer 2, mapping
  └─ DRAPI log shows "missing scope"?         → Layer 3, authorization
```

Treating these as independent checkpoints dramatically speeds up debugging — you stop wasting time on Keycloak realm settings when the actual problem is a layer-2 mapping issue.

---

## Key config — `keepconfig.d` JSON shape

DRAPI's OIDC configuration lives in JSON files under the `keepconfig.d/` directory ([official doc shows the format](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html)). The minimal `oidc` mode structure:

```json
{
  "oidc": {
    "keycloak": {
      "active": true,
      "providerUrl": "https://192.168.x.x:8443/realms/domino",
      "clientId": "Domino",
      "clientSecret": "your-keycloak-client-secret",
      "userIdentifier": "email",
      "scope": "$DATA",
      "adminui": {
        "active": true,
        "displayName": "Keycloak SSO"
      }
    }
  }
}
```

Fields that matter most:

- **`providerUrl`** — the base URL of the Keycloak realm. **Must not be `localhost`** (see Pitfall 2 below)
- **`clientId` / `clientSecret`** — the client configured in the Keycloak realm. The docs recommend using `Domino` as the clientId
- **`userIdentifier`** — which token claim DRAPI uses to map to a Domino user. Setting `email` means using the token's email claim against the Person doc's Internet address. For LDAP DN mapping, also set `userIdentifierInLdapFormat: true`
- **`scope`** — the scope DRAPI accepts. `$DATA` for document read/write, `$SETUP` for administration, `keepconfigadmin` for keepconfig management
- **`adminui` block** — this block **must not be omitted**, otherwise the provider won't appear in the DRAPI Admin UI login dropdown and the URL ends up at `/admin/undefined` (Pitfall 1)

A fuller example including `additionalClientIds`, `userIdentifierInLdapFormat`, multi-scope, etc., is in the [`keepconfig.d` template inside the repo](https://github.com/bryanHsiao/drapi-oidc-keycloak).

---

## Four traps that consume the most time

### Pitfall 1: Missing `adminui` block routes to `/admin/undefined`

You set up the `oidc` block, `providerUrl` and `clientId` both look right, but the DRAPI Admin UI's login dropdown shows no Keycloak option — picking any other option lands on `/admin/undefined`.

**Root cause**: `adminui` is the metadata block DRAPI uses to tell the management UI "expose this provider in the dropdown." Without it, the provider is registered on the backend but the UI has no idea how to surface it to users.

**Fix**: every OIDC provider config needs an `adminui: { active: true, displayName: "..." }`, where `displayName` is the human-readable label shown in the dropdown.

### Pitfall 2: `providerUrl` set to `localhost` fails across machines (the worst one)

Common setup: Keycloak runs in WSL Ubuntu, DRAPI runs on Windows. The intuition is to set `providerUrl` to `https://localhost:8443/realms/...`. Keycloak can hit itself fine; DRAPI gets connection refused.

**Root cause**: DRAPI is Java; Java's default `localhost` resolution is IPv4, which means `127.0.0.1`. DRAPI running on Windows hits Windows-local `127.0.0.1`, not the Keycloak inside WSL. **WSL and Windows don't share `localhost`.**

**Fix**: change `providerUrl` to WSL's actual IP (e.g. `https://192.168.x.x:8443/...`). For WSL2 the IP visible from Windows is available via `wsl hostname -I`.

**Why this trap eats so much time**: the failure is at the connection layer, not the OIDC config layer. It's easy to misdirect into Keycloak realm settings, cert trust, scope mapping — and waste half a day before returning to basic IP resolution.

**Verification**: from the DRAPI host (Windows), run:

```
curl https://<wsl-ip>:8443/realms/<your-realm>/.well-known/openid-configuration
```

JSON coming back means reachability is OK. If this fails, no amount of OIDC config tuning will help.

### Pitfall 3: Browser localStorage caches stale config

After changing OIDC config (e.g. `providerUrl` or `clientId`), the browser still uses the old redirect URL or client_id and login fails.

**Root cause**: the DRAPI Admin UI caches OIDC discovery results in browser `localStorage`; changing the server config doesn't auto-invalidate that.

**Fix**: after any OIDC config change, open DevTools → Application → Local Storage, wipe storage for the DRAPI site, then retry. Or test in an incognito window.

### Pitfall 4: Default client scopes don't back-apply to existing clients

You add a new default client scope in Keycloak (e.g. `$DATA`) expecting the existing `Domino` client to pick it up automatically — fresh login still fails with missing scope.

**Root cause**: Keycloak's default client scope **only applies to clients created after the setting**; existing clients aren't retroactively updated.

**Fix**: Keycloak Admin Console → Clients → select the `Domino` client → Client Scopes tab → manually Add the scope to "Assigned default client scopes".

---

## Complete setup walkthrough

The article doesn't reproduce the steps (to avoid drift) — the full flow covers:

1. **WSL Ubuntu 24.04 + Java 21 environment**
2. **Keycloak install and startup** (self-hosted, no Docker)
3. **Keycloak realm / client / scope / test user configuration**
4. **HTTPS / hostname setup** (PEM certificate)
5. **DRAPI `keepconfig.d` wiring**
6. **JVM truststore trusting the Keycloak certificate**
7. **Identity mapping** — token email claim to Person doc Internet address
8. **Scope authorization** — `$DATA` / `$SETUP` / `keepconfigadmin`
9. **certstore.nsf integration test notes**

Two places carry the full content:

- **GitHub repo**: [bryanHsiao/drapi-oidc-keycloak](https://github.com/bryanHsiao/drapi-oidc-keycloak)
- **Public site**: [drapi-oidc-keycloak Pages](https://bryanhsiao.github.io/drapi-oidc-keycloak/)

The two stay in sync; the site has cleaner reading layout, the repo can be cloned and walked through against actual config samples.

---

## How this fits with Domino 14 / the 5/31 article

This demo walks the "**external IdP (Keycloak) → DRAPI OIDC**" path, which is **a different layer** from the Domino 14.5.1 `NotesSession` / `Session` OIDC token API mentioned in the [Domino 14 changes article](/domino-news/en/posts/domino-14-key-changes):

- **This demo** (DRAPI + Keycloak `oidc` mode): authenticates web / mobile client requests hitting DRAPI — server-side endpoint auth
- **14.5.1 OIDC token API**: lets server-side LotusScript / Java code actively obtain a token from the Domino OIDC Provider — application-code-initiated OIDC token request

Together they're the two faces of Domino's authentication modernisation from "`domcfg` form / LTPA cookie" to "full OIDC": reader-facing (this demo) and code-facing (the 14.5.1 API).

**When the server eventually moves to Domino 14+**, migrating this demo from `oidc` to `oidc-idpcat` mode is the obvious next step — DRAPI and Domino server share the same `idpcat.nsf` config, share the token cache, and the whole setup gets cleaner.

---

## Closing

"DRAPI + OIDC needs Domino 14" is a widespread misconception — `oidc` mode works on 12.0.2 and is decoupled from server version. The cost of actually getting it running is the number of setup steps plus a few version-specific traps (the `localhost` one in particular) that can eat half a day.

Having walked the full setup once, the biggest takeaway isn't that OIDC is complicated — it's that **DRAPI designed authentication as three independent checkpoints**. Debugging by following identity → mapping → authorization in order takes a fraction of the time of trying to fix everything at once.

The complete implementation repo is up on [GitHub](https://github.com/bryanHsiao/drapi-oidc-keycloak) + [Pages](https://bryanhsiao.github.io/drapi-oidc-keycloak/) — clone and walk through it to reproduce the local demo.
