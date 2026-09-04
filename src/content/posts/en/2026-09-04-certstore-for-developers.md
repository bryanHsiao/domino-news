---
title: "Put the CA in certstore and Everything Trusts It? DRAPI's Outbound Actually Uses the JVM Truststore, Not certstore"
description: "Once a certificate is in certstore.nsf, developers hit two practical questions: how does my service — the Domino REST API especially — serve HTTPS straight from it? And when my own code calls out over HTTPS, does it validate the peer against certstore too? The second answer breaks a common misconception: on one server, certificate trust is actually split across three separate places. Part three of the certstore series, grounded in hands-on testing on Domino 12.0.2, covers DRAPI's keepconfig.d TLSCertStore config, what certstore's trusted roots are really for, and disentangles certstore / Domino Directory / JVM cacerts once and for all."
pubDate: 2026-09-04T07:30:00+08:00
lang: en
slug: certstore-for-developers
tags:
  - "Domino REST API"
  - "Security"
sources:
  - title: "Enable HTTPS using Domino Certificate Manager — HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/dominohttps.html"
  - title: "Managing TLS certificates with Certificate Manager — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html"
  - title: "Configuring the Certstore database for TLS — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_config_certstore_for_tls.html"
  - title: "DRAPI + Keycloak OIDC login field notes (with hands-on certstore integration tests) — this site's author's test repo"
    url: "https://github.com/bryanHsiao/drapi-oidc-keycloak"
relatedJava: []
relatedSsjs: []
cover: "/covers/certstore-for-developers.webp"
coverStyle: "collage"
---

[Part 1](/domino-news/en/posts/certstore-getting-started) moved certificates into `certstore.nsf`; [Part 2](/domino-news/en/posts/certstore-acme) had it request and renew them automatically from Let's Encrypt. The certificate is now "in the store" — but a developer immediately hits two practical questions:

1. How does my service — the **Domino REST API (DRAPI)** especially — serve HTTPS **directly** from the certificate in `certstore.nsf`, instead of pointing at yet another keystore file?
2. Conversely, when my own code (DRAPI, a LotusScript agent) calls **out** over HTTPS, does it validate the peer's certificate against `certstore.nsf` too?

The answer to the second breaks a very common misconception. This is part three of the certstore series — finishing it from the developer's side, and several of the conclusions below are things I tested by hand on my own **Domino 12.0.2 + DRAPI v1.1.7** setup.

---

## TL;DR

- **DRAPI can consume certstore directly.** Drop a JSON file in `{notesdata}/keepconfig.d` with `{ "TLSCertStore": true }`, and DRAPI pulls its certificate from `certstore.nsf` to serve HTTPS — no separate keystore file to maintain.
- **Pick a certificate with `TLSCertStoreName`.** A string or an array (multiple hosts matched via SNI), wildcards supported. Omit it and it loads the certificate matching the server document's "Fully qualified Internet host name."
- **A difference I hit in testing:** with one wildcard certificate, **DRAPI works because *you* name it; Domino HTTP looks it up by the machine's FQDN**, so the credential's Host names must include the FQDN — a wildcard alone isn't enough.
- **certstore's trusted roots are for connections coming IN.** The docs: "Trusted root certificates allow web servers to accept the trusted root certificates from connecting clients," plus completing partial chains. Inbound direction.
- **Your outbound calls don't trust via certstore.** Testing confirmed **DRAPI's outbound trust reads only the JVM truststore** (`<Domino>\jvm\lib\security\cacerts`); server-side LotusScript `NotesHTTPRequest` in 14.5 uses the **Domino Directory**. On one machine, trust is split across three places.

---

## The serving side: let DRAPI consume certstore directly

To serve HTTPS, DRAPI (Keep) can point at its own keystore: JKS/PFX (`TLSFile` + `TLSPassword` + `TLSType`) or PEM (`TLSFile` + `PEMCert`). But since the certificate is already managed in `certstore.nsf` by CertMgr (Parts 1 and 2), it's less work to have DRAPI pull it straight from there.

The official way is to drop a JSON file in `{notesdata}/keepconfig.d` to [enable HTTPS using Domino Certificate Manager](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/dominohttps.html). The simplest form:

```json
{
  "TLSCertStore": true
}
```

DRAPI then finds the certificate in `certstore.nsf` matching the server document's **Fully qualified Internet host name** (directly, or via a matching wildcard). To name one explicitly, add `TLSCertStoreName` — a string or an array:

```json
{
  "TLSCertStore": true,
  "TLSCertStoreName": ["foo.bar.com", "api.bar.com"]
}
```

With several names, DRAPI matches incoming requests via **SNI**; you can also give a wildcard `["*.bar.com"]`. Restart DRAPI on all servers afterward. The payoff: one certificate, auto-renewed by CertMgr, consumed by both DRAPI and the web server.

### Tested: one wildcard certificate, but DRAPI and Domino HTTP look it up differently

On my own setup (Domino 12.0.2, DRAPI v1.1.7, one Let's Encrypt `*.domino.com.tw` wildcard), I moved both Domino HTTP (443) and DRAPI (8880) onto certstore for their certificates, and hit a difference the docs don't spell out:

- **DRAPI is "you name it":** in `tls.json` you write `TLSCertStoreName: ["*.domino.com.tw"]` yourself, and DRAPI fetches by that name — so **the wildcard is enough on its own.**
- **Domino HTTP is "it looks up by FQDN":** Domino web (443) queries certstore using the machine's Fully qualified Internet host name (e.g. `ldat05.domino.com.tw`). In testing, when the credential held **only the wildcard `*.domino.com.tw` and no FQDN**, the 443 handshake simply failed — certstore didn't take over; after adding the machine's **FQDN to that credential's Host names**, 443 worked (still presenting `*.domino.com.tw`).

So the same wildcard certificate is picked up by DRAPI but requires the FQDN in Host names for Domino HTTP to find it. Once wired, the server document's "TLS key file name" field can be left blank and certstore takes over — cleaner than leaving a dead `keyfile.kyr` string in there. ([Configuring certstore as the web server's TLS source](https://help.hcl-software.com/domino/14.5.1/admin/conf_config_certstore_for_tls.html) is the path you wired up in Part 1; the full walkthrough is in my [field notes](https://github.com/bryanHsiao/drapi-oidc-keycloak).)

## certstore's trusted roots are for connections coming IN

CertMgr has an ["Adding trusted root certificates" feature](https://help.hcl-software.com/domino/14.5.1/admin/secu_le_using_certificate_manager.html). The name sounds like "my list of CAs to trust," but the docs define it in the inbound direction: "Trusted root certificates allow web servers to accept the trusted root certificates from connecting clients. Trusted root certificates are also useful for automatically completing partial certificate chains presented by CAs."

Two uses, unpacked: one, **accepting certificates that connecting clients present** (for client-certificate authentication / mutual TLS, you first have to trust the root that signed those client certs); two, **completing partial certificate chains a CA hands over**. Both are "someone connects in to my server" situations. In other words, `certstore.nsf` is centered on the **serving side**: what certificate my server presents, and which incoming certificates it accepts.

## Which trust store do your outbound calls use? Not certstore

Here's the common misconception. Plenty of people assume "I put the CA in certstore, so my code's outbound HTTPS should trust it now" — **it doesn't.** When your code connects **out**, it validates the peer's certificate against a different trust store, separate from certstore:

| Scenario (direction) | Trust store used |
| --- | --- |
| Web / DRAPI **serving** HTTPS (presenting its own cert) | `certstore.nsf` TLS Credentials |
| Server accepting an incoming **client certificate** | `certstore.nsf` trusted roots |
| **DRAPI calling out** (fetching IdP metadata / token / JWKS) | **JVM truststore (`cacerts`)** |
| LotusScript `NotesHTTPRequest` **calling out** (14.5 server-side) | **Domino Directory** |
| LotusScript `NotesHTTPRequest` calling out (pre-14.5 server-side) | data dir's `cacerts.pem` |
| Java agent / XPages SSJS calling out | **JVM's `cacerts`** keystore |

**What your code trusts on an outbound call has nothing to do with certstore.** I verified this by hand with DRAPI doing OIDC. When DRAPI logs in against an external IdP (Keycloak / ADFS) and doesn't trust the IdP's certificate, login stalls with **`Error fetching token`**. I put the IdP's CA **only** into certstore's Trusted Root, removed it from the JVM cacerts, and restarted DRAPI — and DRAPI **still didn't trust it** (that provider vanished from idpList). Conversely, importing the same CA into DRAPI's JVM truststore with Domino's own keytool:

```
"<Domino>\jvm\bin\keytool" -import -trustcacerts -alias keycloak-test ^
  -file kc-cert.pem ^
  -keystore "<Domino>\jvm\lib\security\cacerts" -storepass changeit -noprompt
```

brought the provider straight back to idpList and login worked. **The conclusion is hard: DRAPI's outbound path goes through JSSE and reads only the `<Domino>\jvm\lib\security\cacerts` JVM truststore; certstore's Trusted Root does not feed DRAPI's Java outbound connections.** One common red herring: testing with `curl`, where `curl` fails but `curl -k` (skip verification) passes, or PowerShell's curl differs from `curl.exe` — that's just different tools using different trust mechanisms, and doesn't mean DRAPI will trust the peer.

As for server-side LotusScript `NotesHTTPRequest`, Domino 14.5 moved its trusted roots from `cacerts.pem` into the **Domino Directory** — a change the site covers in depth in [Domino 14.5 Changes Where NotesHTTPRequest Loads Trusted CAs From](/domino-news/en/posts/notes-httprequest-14-5-trust-store) (including the upgrade-day self-signed-CA breakage and the `NotesHTTPRequest_Use_CACerts=1` escape hatch), so it isn't repeated here; the single takeaway is that it's the **Domino Directory**, not certstore.

So on one server, "certificate trust" is split across at least three places: certstore (serving and accepting), the Domino Directory (LS outbound), and the JVM cacerts (DRAPI and Java / SSJS outbound). To have a self-signed CA trusted everywhere, you set it in each of them — don't assume that landing it in certstore makes it global.

## Wrap-up

That closes the certstore trilogy: [Part 1](/domino-news/en/posts/certstore-getting-started) consolidated certificates out of scattered kyr files into `certstore.nsf`, [Part 2](/domino-news/en/posts/certstore-acme) had it request and renew from Let's Encrypt automatically, and Part 3 is the developer's side — DRAPI consuming the store's certificate directly via `keepconfig.d`'s `TLSCertStore` (with the tested quirk that DRAPI takes a named wildcard while Domino HTTP needs the FQDN to find it), while certstore's trusted roots serve incoming connections and your code's outbound trust lives elsewhere (the JVM cacerts for DRAPI and Java / SSJS, the Domino Directory for LS `NotesHTTPRequest` in 14.5). Keep the two directions — "serving / accepting" versus "validating on the way out" — straight, and certstore's place in your system stops being fuzzy.
