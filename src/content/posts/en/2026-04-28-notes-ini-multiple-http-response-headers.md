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
cover: "/covers/notes-ini-multiple-http-response-headers.png"
---

## Why this matters

Setting security HTTP headers (HSTS, CSP, X-Frame-Options, etc.) on a Domino web server gives you two entry points:

1. **Internet Site documents** or Web Site Rules — UI-driven, per-site
2. **`HTTPAdditionalRespHeader` in `notes.ini`** — server-wide

The first is the right default. But when the HTTP task won't start, the Internet Site documents are unreachable, and the admin client can't get in either, the second path is your only firefighting option. And until recently you hit an awkward fact: [`HTTPAdditionalRespHeader` has been around since 9.0.1 FP6](https://admincamp.de/customer/notesini.nsf/85255a87005060c585255a850068ca6f/cd0d86347059d1a9c1257fb6004a41e2?OpenDocument=), but **only ever supported one header**. A second `HTTPAdditionalRespHeader=...` line silently overwrote the first (notes.ini's last-write-wins behaviour), so you had to pick one security control (X-Frame-Options OR CSP, never both) and ship with the rest exposed.

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

## Internet Site documents are still the right default

The notes.ini path is for **firefighting** and for **a server-wide baseline**. Day-to-day, prefer Internet Site documents + Web Site Rules:

- Per-site policies (`*.example.com` differs from `api.example.com`)
- Changes apply without restarting the HTTP task
- Edit history (who changed what, when) is preserved

Treat `notes.ini` as the **last line of defence** — you rarely use it, but you'll be glad it's there when HTTP won't start.
