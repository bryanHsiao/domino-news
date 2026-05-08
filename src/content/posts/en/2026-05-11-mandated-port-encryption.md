---
title: "What That `?` Icon Means in Domino 14.5 — Mandated NRPC Port Encryption Concepts and Modes"
description: "After upgrading to Domino 14.5, admins see a new `?` icon in the rightmost column of the server view in the Domino Directory. It's not a bug — it's the compliance indicator for the new Mandated NRPC Port Encryption feature, sitting in its default disabled state. This piece walks the history of NRPC port encryption, what 14.5 actually adds (mandate + monitor), how to read the icons, and the three enablement modes. Hands-on enablement steps are in the follow-up article."
pubDate: 2026-05-11T07:30:00+08:00
lang: en
slug: mandated-port-encryption
tags:
  - "Security"
  - "Release Notes"
sources:
  - title: "Domino 14.5: A `?` icon appears in the Domino Directory server view (KB0127764, in Japanese) — HCL Software Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0127764"
  - title: "What's new in Domino 14.5 — Security features (HCL admin docs)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html"
  - title: "Mandating level of port encryption — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption.html"
relatedJava: []
relatedSsjs: []
---

## The `?` icon you see after upgrading to 14.5

The first time admins open the [Server] - [Server] view in the Domino Directory (`names.nsf`) after a 14.5 upgrade, they notice **a new rightmost column where every server document carries a `?` (unknown.png) icon**.

[The Japanese-language HCL KB0127764](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0127764) gives the answer directly: that `?` is not a bug or an error. It's the compliance status indicator for the new 14.5 feature **Mandated NRPC Port Encryption**, where `?` means "feature disabled, no evaluation has run, status unknown."

## A bit of background: NRPC port encryption has always existed

NRPC (Notes Remote Procedure Call) is the protocol Domino servers use to talk to each other and that Notes clients use to talk to servers. **NRPC port encryption itself isn't new** — for many releases now you've been able to flip `Encrypt network data` on a port in the server document under Ports → Notes Network Ports.

What was different pre-14.5: encryption was **negotiated between two parties**:

- Both sides want encryption → encrypted
- Only one side wants it, the other doesn't → **plaintext** (compatibility wins)

That's awkward in compliance- or security-sensitive environments. You configure server A to want encryption, but as long as one client or server B doesn't, the connection silently downgrades to clear text. There was no "I insist on encryption — disconnect if you won't" lever for admins.

14.5 fills that gap.

## What 14.5 actually adds: mandate + monitor

Per the [14.5 security features release note](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html), the feature delivers two things:

| Aspect | What it does |
|---|---|
| **Mandate (enforce)** | Once enabled in the Directory Profile, the local 14.5 server or client requires encryption on every authenticated NRPC session — the connection drops if the other side won't accept |
| **Monitor (log only)** | Without enforcing, you enable logging first to observe which connections are currently in plaintext and *would* break under enforcement — admins get an evaluation window |

So admins can adopt this through "**watch first, then enforce**" rather than "enable and pray nothing breaks."

## `?` is one of several status icons

The [official Mandated Port Encryption page](https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption.html) describes this column as a compliance indicator that switches icons based on configuration. In practice admins will see:

| Status | Icon | Meaning |
|---|---|---|
| Not enabled | `?` (unknown) | Feature still disabled — server hasn't evaluated. The "normal" state |
| Logging enabled (monitor) | Lock / transition icon | Enabled, status under evaluation |
| Mandate enforced | Active state icon | Encryption is being enforced |

**So a `?` doesn't need to be "fixed."** If you have no plan to enable this feature, the icon staying `?` is perfectly fine — it doesn't affect server operation.

## Three enablement modes (also the recommended migration path)

| Mode | Directory Profile setting | Server-view icon | Use case |
|---|---|---|---|
| **Disabled** (default) | logging level = off, mandate = off | `?` | Default state right after a 14.5 upgrade |
| **Monitor window** | logging = on, mandate = off | Transition icon | Capture connection records, see which connections would be affected |
| **Enforced** | logging + mandate both on | Active icon | NRPC encryption is mandated — clients that refuse encryption can't connect |

The official recommendation: **enable logging first, watch for several days to confirm no breakage, then enforce**. Skipping straight to enforcement is the textbook way to lock out a legacy node nobody remembered to upgrade.

## Relationship to the 5/10 trust-store article

The [5/10 piece on the NotesHTTPRequest 14.5 trust-store change](/domino-news/en/posts/notes-httprequest-14-5-trust-store) and this one are both 14.5 security hardening, but they cover **two completely separate channels**:

| Topic | Scope | What's encrypted / trusted |
|---|---|---|
| 5/10 trust-store change | LotusScript NotesHTTPRequest making outbound HTTPS calls | TLS cert chain for the outbound connection |
| 5/11 / 5/12 Mandated Port Encryption | NRPC (client–server / server–server internal traffic) | Symmetric encryption on the NRPC port |

Both should be configured. Neither replaces the other.

## Tomorrow: hands-on enablement

This piece focuses on three conceptual questions: what the `?` icon means, why 14.5 introduced this feature, and what status modes you'll see. The follow-up [Mandated Port Encryption hands-on guide](/domino-news/en/posts/mandated-port-encryption-enabling) breaks down the official 10-step procedure:

- The `CheckPortEncryption` scheduled agent (specifically its special handling for pre-14.5 servers)
- Critical Directory Profile fields
- Server ini settings (`DEBUG_MANDATED_ENCRYPTION`, `MANDATEDENC_ACTIVE_REFRESH_TIME`, etc.)
- Desktop policy entries (`DISABLE_MANDATED_ENCRYPTION` etc.)
- The `portenc refresh` / `portenc show` console commands
- Recovery paths if enforcement breaks something

## Closing

If you only remember three things from today:

1. **The `?` icon you see in the 14.5 server view isn't a bug** — it's Mandated Port Encryption sitting in its default disabled, not-yet-evaluated state
2. **The feature plugs the pre-14.5 "negotiated" gap** — admins finally have an "I insist on encryption" option
3. **Adopt via "log first, then enforce"** — going straight to enforcement is how you accidentally lock out a legacy node

Not planning to enable this feature? Leave it. Planning to enable? See tomorrow's hands-on piece.
