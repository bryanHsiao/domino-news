---
title: "Getting 401s from the Domino REST API? Understand Its JWT Authentication and Scopes First"
description: "Almost every DRAPI call has to prove who you are. It doesn't use classic session/LTPA — it uses a JWT bearer token: POST to /api/v1/auth with Domino credentials for a token, then send it in the Authorization header on every request. This piece covers logging in for a token, what the scopes/aud claims control, where tokens come from (Domino-signed JWT, external OIDC, idpcat.nsf), and traps like the signing key changing on restart. Part two of the DRAPI series."
pubDate: 2026-08-20T07:30:00+08:00
lang: en
slug: domino-rest-api-auth
tags:
  - "Domino REST API"
  - "Security"
  - "OIDC"
sources:
  - title: "Domino REST API — Authentication (HCL opensource)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html"
  - title: "Domino REST API — Lab 01: Log in to the REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/walkthrough/lab-01.html"
  - title: "Domino REST API — Functional accounts"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/functionalUsers.html"
---

[Part one](/domino-news/en/posts/domino-rest-api-getting-started) said almost every DRAPI call carries a token. This part covers how you get one, how you send it, and what's actually inside it.

Coming from classic Domino, adjust your mental model first: DRAPI uses **no** session cookie and **no** LTPA. It follows the modern-API standard — a **JWT bearer token**: you exchange Domino credentials for a token, then send that token in a header on every request; the server verifies it to know who you are and what you're allowed to touch.

---

## TL;DR

- **The login endpoint is `POST /api/v1/auth`:** the body is `{"username": "...", "password": "..."}` (a Domino account + its HTTP password), and you get back a JWT.
- **Every later request carries `Authorization: Bearer <token>`.**
- **The token is a [JWT](https://opensource.hcltechsw.com/Domino-rest-api/references/security/authentication.html):** the docs say "All actions in Domino REST API are secured with JWT." Its claims decide who you are (`sub`), what you can reach (`scopes`), who it's for (`aud` must be `Domino`), and when it expires (`exp`).
- **Tokens come from three places:** Domino-signed JWT (the `/auth` endpoint), an external OIDC provider (Entra ID / Keycloak), and OIDC managed centrally via `idpcat.nsf` (HCL's recommendation, Domino 14+).
- **A common trap:** the Domino-signed default is "a random symmetric key that changes every time DRAPI restarts" — so a restart invalidates every previous token. Set RSA key files for stable tokens.

---

## Logging in: POST /api/v1/auth

The most direct route is to exchange a token with Domino's own auth endpoint. The [official login example](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/walkthrough/lab-01.html) does exactly this:

```bash
curl -X POST http://localhost:8880/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"username": "KEEP Admin", "password": "passw0rd"}'
```

`username` is the Domino account, `password` is its HTTP password. A successful login returns a chunk of JSON with your bearer token inside (paste it into [jwt.io](https://jwt.io/) to read what's in it).

Once you have the token, every following request carries it in a header:

```bash
curl http://localhost:8880/api/v1/... \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1Ni.....(your token)"
```

The Swagger UI works the same way — paste the token into the Authorize box and every endpoint you try on the page carries it.

## What's inside the token

A JWT isn't opaque gibberish — it's a readable set of claims. The ones DRAPI cares about:

```json
{
  "sub": "CN=John Doe/O=MyOrg",
  "scopes": "MAIL $DATA",
  "aud": "Domino",
  "iat": 1618506339,
  "exp": 1618509939
}
```

- **`sub`** — who you are, the Domino hierarchical name.
- **`scopes`** — which scopes you can reach, **space-separated** (e.g. `MAIL $DATA`, or a database's scope alias). This is the heart of permissions; the next part covers how a scope is defined.
- **`aud`** — who the token is for; it **must be `Domino`**, or the server rejects it.
- **`exp`** — when it expires. Past that, log in again for a new one.

In other words, "can you do this" isn't recomputed against the ACL on every call — your identity and scopes are **sealed into the token the moment you log in**.

## Where tokens come from: three routes

`/auth` is just one route. Broadly, there are three ways a token gets issued or trusted; the larger your setup, the further down you should go:

1. **Domino-signed JWT:** the `/auth` route above, signed by Domino itself. **By default it uses "a random symmetric key that changes on every Domino REST API restart"** — convenient, but a restart invalidates every token already issued. For tokens that survive a restart, configure permanent RSA public/private key files (`JwtPrivateKeyFile` / `JwtPublicKeyFile`).
2. **External OIDC provider:** have DRAPI trust a standard OIDC provider (Microsoft Entra ID, Keycloak), with tokens signed by them. You set `clientId` and `clientSecret` and discover via `.well-known/openid-configuration`. If your enterprise already has an IdP, this is the natural route.
3. **OIDC managed via `idpcat.nsf`** (HCL's recommendation): keep IdP configuration centralized in `idpcat.nsf`; requires **Domino 14+**.

There are also **functional accounts** ([functional users](https://opensource.hcltechsw.com/Domino-rest-api/references/functionalUsers.html)), but their scope is narrower than you'd guess: the docs limit them to **administrative / monitoring endpoints** (Management console, Metrics, Health check), useful especially when the directory is unavailable — and state plainly that "they don't need access to regular end points." So don't treat them as a general service account for the data API.

## Two practical notes

- **A restart invalidates tokens** (the default self-signed key). In development you'll hit "yesterday's token 401s today" — usually the server restarted and rotated the key. Set RSA key files for stability.
- **Scopes have to line up:** the scopes in your token decide which databases you can touch. Call a resource whose scope isn't in your token and you're blocked. The token is fixed at login time; to reach something else later, get a fresh token carrying the right scope.

The next part moves to **scopes and schemas** — how the names in that `scopes` claim actually map an NSF into REST endpoints.
