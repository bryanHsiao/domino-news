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
    url: "https://help.hcl-software.com/domino/14.5.1/admin/wn_145_security_features.html"
  - title: "Mandating level of port encryption — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/mandated_port_encryption.html"
  - title: "Encrypting NRPC communication on a server port — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_encryptingnrpccommunicationonaserverport_t.html"
  - title: "Configuring the level of port encryption and authentication — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_port_encryption_t.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/mandated-port-encryption.png"
coverStyle: "photoreal-3d"
---

## The `?` icon you see after upgrading to 14.5

The first time admins open the [Server] - [Server] view in the Domino Directory (`names.nsf`) after a 14.5 upgrade, they notice **a new rightmost column where every server document carries a `?` (unknown.png) icon**.

[The Japanese-language HCL KB0127764](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0127764) gives the answer directly: that `?` is not a bug or an error. It's the compliance status indicator for the new 14.5 feature **Mandated NRPC Port Encryption**, where `?` means "feature disabled, no evaluation has run, status unknown."

## Layer 1 vs Layer 2: two things that are easy to confuse

The 14.5 docs use "port encryption," "mandated port encryption," and "Encrypt network data" in places that overlap — but they refer to two distinct layers:

| Layer | What it is | 14.5 default |
|---|---|---|
| **Layer 1: per-port encryption capability** | Server document → Ports → Notes Network Ports → "[Encrypt network data](https://help.hcl-software.com/domino/14.5.1/admin/conf_encryptingnrpccommunicationonaserverport_t.html)" checkbox per port | **On** (fresh install — per HCL: "[NRPC port encryption is enabled for increased security level](https://help.hcl-software.com/domino/14.5.1/admin/conf_port_encryption_t.html)") |
| **Layer 2: mandate enforcement** | Directory Profile's Mandated Port Encryption settings (the subject of this article) | **Off** (the `?` icon's origin) |

### What Layer 1 does

NRPC (Notes Remote Procedure Call) is the protocol Domino servers use to talk to each other and that Notes clients use to talk to servers. The Layer 1 "Encrypt network data" checkbox has been around for many releases. [HCL's documentation](https://help.hcl-software.com/domino/14.5.1/admin/conf_encryptingnrpccommunicationonaserverport_t.html) frames its threat model as "prevent the network eavesdropping that's possible with a network protocol analyzer" — stop somebody running wireshark or tcpdump on your network from reading NRPC traffic.

There's a critical nuance, though. The [same doc](https://help.hcl-software.com/domino/14.5.1/admin/conf_encryptingnrpccommunicationonaserverport_t.html) states "Network data encryption occurs if you enable network data encryption on either side of a network connection" — either side enabling encryption is enough, typically "server enables, client follows along." Sounds great, but the inverse: **if the other side won't accept encryption — older version, deliberate refusal, configuration drift — that link may run in plaintext**. Layer 1 doesn't give the admin a way to insist "every link in the domain must be encrypted."

### What Layer 2 fills in

Layer 2 is precisely that "insist" lever. The [official Mandated Port Encryption page](https://help.hcl-software.com/domino/14.5.1/admin/mandated_port_encryption.html) puts it directly: "Enables and enforces NRPC port encryption on both the client and server. If configured by an administrator, encryption needs to be enforced even if the other side does not want to use encryption" — enforce even when the other side declines.

So:

- **Layer 1** = "I *can* do encryption"
- **Layer 2** = "I *insist* on encryption — won't accept anything else"

Two concepts, two configuration surfaces. The "default enabled" you see is **Layer 1**; the `?` icon corresponds to **Layer 2** (default disabled).

## What 14.5 actually adds: mandate + monitor

Per the [14.5 security features release note](https://help.hcl-software.com/domino/14.5.1/admin/wn_145_security_features.html), the feature delivers two things:

| Aspect | What it does |
|---|---|
| **Mandate (enforce)** | Once enabled in the Directory Profile, the local 14.5 server or client requires encryption on every authenticated NRPC session — the connection drops if the other side won't accept |
| **Monitor (log only)** | Without enforcing, you enable logging first to observe which connections are currently in plaintext and *would* break under enforcement — admins get an evaluation window |

So admins can adopt this through "**watch first, then enforce**" rather than "enable and pray nothing breaks."

## `?` is one of several status icons

The [official Mandated Port Encryption page](https://help.hcl-software.com/domino/14.5.1/admin/mandated_port_encryption.html) describes this column as a compliance indicator that switches icons based on configuration. In practice admins will see:

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

## Risk assessment if Layer 2 is left off

Layer 1 alone isn't enough (per the earlier section). Whether to also enable Layer 2 depends on the environment:

| Environment | Risk of leaving Mandated off |
|---|---|
| Single-DC, pure intranet office | Low — the internal network is trusted. The "lateral-movement-then-sniff-NRPC" risk persists, though |
| Cross-DC / VPN over Internet | Medium-high — any segment outside your control means plaintext NRPC is readable end-to-end |
| Regulated industries (finance, healthcare, government) | High — compliance audits expect provable "all traffic encrypted" guarantees, which Layer 1's "either side" model can't demonstrate cleanly |
| Multi-partner B2B server-to-server | High — the other side's environment is outside your control; downgrade risk isn't manageable |

The [HCL Layer 1 documentation](https://help.hcl-software.com/domino/14.5.1/admin/conf_encryptingnrpccommunicationonaserverport_t.html) frames the threat model as "network eavesdropping ... with a network protocol analyzer" — assuming an attacker is already running packet capture on your network. **Pure intranet office** treats that risk as low; **cross-network or public-Internet links** treat it as high. "Lateral movement" and "compliance auditability" are industry considerations not enumerated by HCL but practically influence whether to enable Mandated.

Practical guidance:

- **Pure internal, no regulatory requirements**: Layer 1's default is sufficient; Mandated is nice-to-have
- **Any cross-segment traffic, compliance-bound, or B2B partner links**: schedule Mandated, at minimum starting in logging mode to gather evidence

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
