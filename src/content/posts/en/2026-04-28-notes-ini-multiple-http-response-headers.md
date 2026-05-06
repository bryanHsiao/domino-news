---
title: "Domino V12 lets notes.ini hold multiple HTTPAdditionalRespHeader entries"
description: "Older Domino releases let you put exactly one HTTPAdditionalRespHeader in notes.ini — a second line silently overwrote the first. HCL added a numbered convention (HTTPAdditionalRespHeader01, 02, …) in V12.0.x so you can ship a full security-header baseline through notes.ini alone, which is the only path that still works when HTTP won't start and the Internet Site documents are unreachable."
pubDate: "2026-04-28T18:00:00+08:00"
lang: "en"
slug: "notes-ini-multiple-http-response-headers"
tags:
  - "Tutorial"
  - "Domino Server"
  - "Security"
  - "Admin"
sources:
  - title: "KB0124025 — How to apply multiple HTTPAdditionalRespHeader in notes.ini (HCL Software Customer Support)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0124025"
  - title: "KB0038786 — HTTPAdditionalRespHeader notes.ini parameter (HCL Software Customer Support)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0038786"
  - title: "Notes.ini Entry — HTTPAdditionalRespHeader (admincamp.de)"
    url: "https://admincamp.de/customer/notesini.nsf/85255a87005060c585255a850068ca6f/cd0d86347059d1a9c1257fb6004a41e2?OpenDocument="
  - title: "KB0100440 — Difference between 'Tell HTTP Restart' and 'Tell HTTP refresh' commands (HCL Software Customer Support)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0100440"
cover: "/covers/notes-ini-multiple-http-response-headers.png"
coverStyle: "collage"
relatedJava: []
relatedSsjs: []
---

## Why this matters

Domino shops typically configure security HTTP headers (HSTS, CSP, X-Frame-Options, etc.) using one of two models:

1. **Internet Site documents + Web Site Rules** — UI-driven, per-site policies. Custom HTTP headers go in a Web Site Rule document.
2. **Server document only (no Internet Sites enabled) + `notes.ini`** — simpler, server-wide. Custom headers can [only be set via `HTTPAdditionalRespHeader`](https://admincamp.de/customer/notesini.nsf/85255a87005060c585255a850068ca6f/cd0d86347059d1a9c1257fb6004a41e2?OpenDocument=) in notes.ini.

For shops on model 2, `notes.ini` is the **only** place to put security headers — not a fallback, just the day-to-day config surface. For shops on model 1, `notes.ini` is also the firefighting path when the HTTP task won't start and the admin client can't get in.

Both situations hit the same historical limit: [`HTTPAdditionalRespHeader` has been around since 9.0.1 FP6](https://admincamp.de/customer/notesini.nsf/85255a87005060c585255a850068ca6f/cd0d86347059d1a9c1257fb6004a41e2?OpenDocument=), but **only ever supported one header**. A second `HTTPAdditionalRespHeader=...` line silently overwrote the first (notes.ini's last-write-wins behaviour), so you had to pick one security control (X-Frame-Options OR CSP, never both) and ship with the rest exposed.

HCL [removed that cap in Domino V12.0.x](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0124025) with a small naming convention.

## The old (single) syntax

```ini
HTTPAdditionalRespHeader=X-Frame-Options: SAMEORIGIN
```

A second `HTTPAdditionalRespHeader=...` line overwrites the first, so in practice you got exactly one header. Layering HSTS, CSP, and X-Frame-Options at the same time through notes.ini was simply not possible.

## The new (multiple) syntax

The first header keeps the original name (no number). Every additional header uses a **two-digit suffix** starting at `01`:

```ini
HTTPAdditionalRespHeader=X-Frame-Options: SAMEORIGIN
HTTPAdditionalRespHeader01=X-XSS-Protection: 1; mode=block
HTTPAdditionalRespHeader02=Content-Security-Policy: default-src 'self'
HTTPAdditionalRespHeader03=Strict-Transport-Security: max-age=31536000; includeSubDomains
HTTPAdditionalRespHeader04=X-Content-Type-Options: nosniff
```

Things to know:

- The suffix is **two digits starting at `01`**, not `1` — `HTTPAdditionalRespHeader1` is ignored
- Order in the file doesn't change runtime behaviour (Domino reads all of them), but consecutive numbering keeps the file readable
- Run `tell http restart` (or restart the server) before the changes take effect
- Available in **HCL Domino 12.0.x and later** — older releases are still capped at one

## A minimum-viable security-header baseline

If your server currently has no security headers, dropping these five lines into `notes.ini` covers most of what SSL Labs / Mozilla Observatory grade you on:

```ini
HTTPAdditionalRespHeader=Strict-Transport-Security: max-age=31536000; includeSubDomains
HTTPAdditionalRespHeader01=X-Frame-Options: SAMEORIGIN
HTTPAdditionalRespHeader02=X-Content-Type-Options: nosniff
HTTPAdditionalRespHeader03=Referrer-Policy: strict-origin-when-cross-origin
HTTPAdditionalRespHeader04=Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'
```

The CSP line will almost certainly need tuning for your application — `unsafe-inline` is technically wrong, but Notes-style web apps lean heavily on inline styles, so start loose enough that nothing breaks, then tighten it. For HSTS, `max-age=31536000` is one year — the first time you enable it, ship with something small (say `300` for five minutes) until you've confirmed every endpoint really is HTTPS-clean, then bump it up.

## Choosing between the two models

If your environment **has Internet Sites enabled**, Web Site Rules tend to be the better long-term home for custom headers:

- Per-site policies (`*.example.com` can differ from `api.example.com`)
- Edit history is preserved (who changed what, when)
- Changes pick up on [`tell http refresh`](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0100440) instead of `tell http restart` — refresh keeps user sessions alive and doesn't blow away the in-memory caches

If your environment **only uses the Server document and never enabled Internet Sites**, `notes.ini` was always your only option. The V12 multi-header support is a real feature unlock for you, not a "fallback patch".

Note that `tell http refresh` and `tell http restart` cover different scopes:

- **`tell http refresh`** reloads only Web Site documents (and the rules / file protection / authentication realms attached to them)
- **`tell http restart`** reloads the Server document, `notes.ini`, HTTPD.CNF, servlets — everything else

So changes to `HTTPAdditionalRespHeader` in `notes.ini` always require `tell http restart` (or a full server restart) to take effect.
