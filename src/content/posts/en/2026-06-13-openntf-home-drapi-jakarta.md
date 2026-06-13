---
title: "OpenNTF Runs Its Home App Outside Domino — Purely on DRAPI, on Open Liberty"
description: "Jesse Gallagher rebuilt OpenNTF's home app from XPages into a Jakarta EE application, with DRAPI (the Domino REST API) as its entire data layer, then packaged it as a WAR and deployed it to Open Liberty — running outside Domino. The point isn't 'another rewrite': it validates a path where a Jakarta EE app written for Domino is genuinely portable — the data stays in NSF, but the runtime isn't tied to Domino. This piece covers what he did, the stack, why it matters, and the rough edges he flags himself."
pubDate: 2026-06-13T07:30:00+08:00
lang: en
slug: openntf-home-drapi-jakarta
tags:
  - "Domino"
  - "DRAPI"
  - "OpenNTF"
sources:
  - title: "Running the New OpenNTF Home With DRAPI — Jesse Gallagher (frostillic.us)"
    url: "https://frostillic.us/blog/posts/2026/5/13/running-the-new-openntf-home-outside-domino"
  - title: "OpenNTF"
    url: "https://www.openntf.org/"
  - title: "HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/index.html"
relatedJava: []
relatedSsjs: []
---

Every Domino developer has fielded this question: isn't your app locked inside the NSF, dead the moment it leaves Domino? In May 2026, [Jesse Gallagher gave a very concrete counter-example on his blog](https://frostillic.us/blog/posts/2026/5/13/running-the-new-openntf-home-outside-domino) — he took [OpenNTF](https://www.openntf.org/)'s new home app and ran the whole thing **outside** Domino.

The data still lives in Domino, but the app itself is a standard Jakarta EE application running on Open Liberty — an ordinary Java application server — reaching Domino's data through DRAPI[^drapi]. In other words: **the data stays in NSF, but the runtime is no longer tied to Domino.**

This is worth writing up not because "someone rewrote an app again", but because it takes a path that gets talked about a lot yet rarely runs end-to-end — "Domino as the data backend, the front end running elsewhere" — and actually makes it work.

## What happened

OpenNTF's home page used to be an XPages app. Jesse rebuilt it as a Jakarta EE version, treating it as a testbed for "portable Java code." The key move is the last step: he extracted the code from the NSF, packaged it as a Maven-based WAR[^war], and deployed it to Open Liberty — a Java server with nothing to do with Domino.

What makes that possible is the DRAPI data layer. The app doesn't touch the NSF directly or rely on Domino's Java runtime; it calls Domino as a REST data source. That's why swapping the runtime didn't force a rewrite of the data side.

## The stack

| Layer | What's used |
|---|---|
| App framework | Jakarta EE — Jakarta Pages, Servlet, REST, MVC and other standard specs |
| Runtime | Open Liberty (a standard Java application server) |
| Data layer | DRAPI (Keep) as the NoSQL data source |
| Data access | a custom Jakarta NoSQL[^jnosql] driver mapped to DRAPI endpoints (generated via OpenAPI Generator) |
| Authentication | Jakarta Security + OIDC[^oidc] |
| Authorisation | JWT[^jwt] tokens; anonymous users get read-only access via self-signed tokens |

Jesse describes most of this as just "the same specs" — because Jakarta EE is a standard, the same code runs on any compliant server, and that's exactly where the portability comes from.

## Why it matters

For anyone investing long-term in DRAPI, this is a weighty signal: **a Jakarta EE app written for Domino can be genuinely portable.** The same codebase can run on Domino's built-in Jakarta EE support or move to Open Liberty, carried by standard specs plus the DRAPI abstraction layer.

It also extends the thread this site has been pulling — from the [DRAPI quickstart](/domino-news/posts/hcl-domino-rest-api-quickstart/) to [DRAPI sign-in via Keycloak OIDC](/domino-news/posts/drapi-keycloak-oidc/) — all of which treat Domino as a modern REST backend. This pushes the same idea to its limit: even the runtime drops Domino. For teams that want to modernise the front end incrementally without throwing away years of data in the NSF, there's now a complete, referenceable implementation to look at.

## The rough edges

Jesse is candid about the current limitations, and they're worth copying down as reminders:

- **DRAPI doesn't expose replica IDs and some other Domino-specific attributes** — concepts that only exist in the NSF aren't reachable through the REST layer.
- **The app's data models must stay in sync with the DRAPI schema** — you maintain both definitions by hand; change one side, remember to change the other.
- **Relying on server-side OIDC configuration cuts into portability** — when the config is bound to the server, the "just move it to another machine" selling point weakens.

In short, this is a strong **proof of concept**, not a "drop it into production" template. But it establishes feasibility.

## What it means for you

If you're evaluating DRAPI, or wondering what a next-generation Domino front end looks like, this writeup is worth reading in full (link at the top). Its value is in turning "Domino data + non-Domino runtime" from a slogan into a real case that runs — with its weaknesses laid out plainly. For the boundaries of what DRAPI itself can do, compare against the [official documentation](https://opensource.hcltechsw.com/Domino-rest-api/index.html).

[^drapi]: DRAPI = Domino REST API, HCL's modern REST interface for Domino, letting external programs access NSF data over standard HTTP/JSON.
[^war]: WAR = Web Application Archive, the standard Java packaging format for a web application, deployable to any compliant Java application server.
[^jnosql]: Jakarta NoSQL is the Jakarta EE standard spec for NoSQL data access, giving programs one uniform interface over different NoSQL sources.
[^oidc]: OIDC = OpenID Connect, a standard authentication protocol built on OAuth 2.0, supported by modern IdPs (Keycloak, Azure AD, Okta, etc.).
[^jwt]: JWT = JSON Web Token, a signed, self-verifiable token format commonly used to pass identity and authorisation between services.
