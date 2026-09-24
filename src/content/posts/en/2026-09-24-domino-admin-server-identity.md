---
title: "Who Is the Domain Administration Server? One Domino ACL Setting Behind Entitlement Aggregation, CertMgr, and AdminP"
description: "An additional server cold-boots and floods the console every 5 seconds with 'Error connecting to server…', trying to reach every server in the domain. The culprit wasn't entitlement config at all — it was a single ACL setting that had quietly made this server the 'domain administration server.' This piece covers how many meanings 'administration server' has in Domino, what actually decides the domain-admin identity, which subsystems it silently drives (domain-wide entitlement aggregation, CertMgr, AdminP), and how to split those responsibilities apart."
pubDate: 2026-09-24T07:30:00+08:00
lang: en
slug: domino-admin-server-identity
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Entitlement tracking — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html"
  - title: "Running CertMgr — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/secu_le_running_certificate_manager.html"
  - title: "CertMgr_Server notes.ini — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/secu_le_CertMgr_Server.html"
  - title: "Configuring Entitlement Tracking in Domino 12 (dpastov, origin of the DISABLE setting)"
    url: "https://dpastov.blogspot.com/2023/11/configuring-entitlement-tracking-in.html"
relatedJava: []
relatedSsjs: []
---

Start with a real symptom. An additional server (a Domino 12.0.2 lab box) cold-boots and floods console.log every 5 seconds:

```
Entitlement Tracking Aggregator processing directory CN=ap02/O=TheNet!!entitlementtrack.ncf
Error connecting to server ap02/TheNet: server not responding…
Error connecting to server ap03/TheNet: …
Error connecting to server DominoIQ-01/TheNet: …
```

It's **walking every server in the domain**, trying to pull each one's entitlement data, and flooding the log whenever it can't reach one. Which is odd — this is just an additional server; it has no business iterating over the whole domain. The culprit, it turned out, had nothing to do with entitlement config: it was a single ACL setting that had quietly made this server the "domain administration server." So this piece is about a thing that trips a lot of people up — **how many meanings "administration server" has in Domino, what decides the domain-admin identity, and which subsystems it silently drives.**

## TL;DR

- **"Administration Server" has two levels in Domino**: every database has one (AdminP[^adminp] uses it to maintain *that db's* ACL); but **only the one on the Domino Directory (`names.nsf`) equals the "domain administration server" — the domain-level identity**. Mistaking "some db's admin server" for "the domain's admin server" is where this went wrong.
- **The domain-admin identity silently drives domain-level machinery** — the one that bites hardest here is **domain-wide entitlement aggregation**, which HCL specifies runs only on the domain administration server.
- **How it was tripped**: to let an isolated additional server act as its own CertMgr server, someone set `names.nsf`'s Administration Server to it → it self-identified as domain admin → `dircat` started domain-level entitlement aggregation → walked every server in the domain → flooded on the unreachable ones.
- **The split**: CertMgr doesn't actually require the admin identity (`CertMgr_Server` pins it explicitly, and HCL only calls the admin server "a good choice"). Point `names.nsf`'s Administration Server back at the real domain admin, pin CertMgr with `CertMgr_Server`, and the two concerns come apart.
- **Only `names.nsf` decides the domain identity**: the Administration Server on `admin4.nsf` or `certstore.nsf` doesn't matter (proven in this case — they were left alone and aggregation still stopped).

## "Administration Server" isn't one thing

In Domino Administrator, every database's ACL advanced page has an "Administration Server" field. What it means: **which server's AdminP maintains *that db's* ACL and the person names in its Readers/Authors fields** (renames, deletions, group expansion). Every db has one, each independent.

But when the database you're looking at is **`names.nsf` (the Domino Directory)**, that field means something bigger — it sets the **administration server identity for the entire domain**. Domain-level automation keys off *this one*, not any other db's.

That's the confusion: `admin4.nsf`, `certstore.nsf`, and some application db might all list the same server as their Administration Server, and it's easy to read that as "this box is an admin server all over the place, nothing unusual." But **only the one on `names.nsf` promotes it to domain admin** — and drags a pile of domain-level behavior along with it.

## What the domain-admin identity silently drives

### Entitlement tracking: two layers, only aggregation is tied to the domain admin

Domino 12's [Entitlement Tracking](https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html) has **two layers** that get conflated:

| Layer | Who does it | Database | Scope |
|---|---|---|---|
| **Local collection** | each server's `update` task | `entitlementtrack.ncf` | its own db's only |
| **Domain-wide aggregation** | `dircat` (Directory Cataloger) | `entitlements.nsf` | the whole domain |

HCL describes local collection as "Approximately once a day, each Domino 12 server scans every database on the server and collects the highest level of access for each entitled user" — **every server does it, over its own databases**. Aggregation, on the other hand, is spelled out:

> The entitlement data collected daily by each Domino server in a domain is also aggregated for the entire domain **on the domain administration server**. The directory catalog task manages the synchronization process…

In other words: **the moment a server thinks it's the domain admin, `dircat` starts domain-level aggregation** — going down the server list in `names.nsf` and pulling each one's `entitlementtrack.ncf`. Fine when everything's reachable; but in a lab where the VPN is often down, every unreachable server means another error every 5 seconds. That's where the flood came from.

### CertMgr: recommended on the admin server, but **not required**

CertMgr / `certstore.nsf` is a domain-wide certificate mechanism. [HCL's docs](https://help.hcl-software.com/domino/14.0.0/admin/secu_le_running_certificate_manager.html) say "The Domino administration server for the domain **is a good choice**" — note *a good choice*: **recommended, not mandatory**. It's easy to read that as "CertMgr must run on the domain admin server," so to get one box running CertMgr on its own, someone changes `names.nsf`'s Administration Server. That's the step that plants the trap.

## The trip: an SSL setting accidentally switching on entitlement aggregation

Put those two together and the causal chain is clear:

```
Setting up SSL/CertMgr, set names.nsf's Administration Server to this additional server (thinking CertMgr required it)
  → it self-identifies as the domain administration server
    → dircat starts domain-level entitlement aggregation
      → walks the full server list in names.nsf
        → pulls each entitlementtrack.ncf → VPN unreachable → Error connecting every 5 seconds
```

Two dead-ends came up while diagnosing — worth recording so you don't repeat them:

- **`DISABLE_ENTITLEMENT_TRACKING=1` doesn't fix this.** It's the only disable setting floating around online ([dpastov](https://dpastov.blogspot.com/2023/11/configuring-entitlement-tracking-in.html)), but it targets the **local collection** layer (building `entitlementtrack.ncf`), not the **aggregation** layer. Cold-start test in this case: with it set in notes.ini, `dircat` still aggregated. Wrong layer.
- **`tell dircat quit` only treats the symptom.** `dircat` is the aggregation task; stop it and the log goes quiet immediately — but a cold boot auto-starts it and the problem returns. Fine as a stopgap, not a fix.

## The split: separate the two things the admin identity bundles

The key insight is that misread recommendation — **CertMgr doesn't need `names.nsf`'s admin identity**:

- [`CertMgr_Server`](https://help.hcl-software.com/domino/12.0.2/admin/secu_le_CertMgr_Server.html), a notes.ini setting HCL defines as "Defines the server that has `certstore.nsf`", lets you **name the CertMgr server explicitly** without the admin identity.
- `certstore.nsf`'s own Administration Server can be independent of `names.nsf`.

So split the two things that were riding one switch:

| Setting | Change to | Effect |
|---|---|---|
| `names.nsf` Administration Server | the real domain admin server | this box no longer self-IDs as domain admin → **stops domain-level aggregation** |
| notes.ini `CertMgr_Server` | this box (`set config CertMgr_Server=<this>/…`) | it recognizes itself as CertMgr server locally → HTTPS keeps working |
| `certstore.nsf` Administration Server | this box (confirm; already was) | CertMgr independence |

After a `docker restart` cold-start test: entitlement aggregation didn't recur, the `Error connecting…` flood was gone, and HTTPS 443 plus CertMgr (including the ACME extension) were intact. The **one side effect** is a harmless cold-start warning — "Cannot update CertMgr Server in Directory profile": because `names.nsf`'s admin is now another server, this box lacks rights to write "I'm the CertMgr server" back into the Directory Profile broadcast. For an island lab with manually-swapped certs and no other server replicating its `certstore.nsf`, that's a non-issue (you'd only care for ACME auto-renewal or several web servers sharing a certstore).

## Only `names.nsf` decides the domain identity

Here's the concept the whole thing converges on, with proof: during the fix's verification, `admin4.nsf`'s (Administration Requests) Administration Server was **left as that additional server, untouched**, and entitlement aggregation stopped anyway. Which shows —

**The domain administration server identity is decided solely by the Administration Server on `names.nsf` (the Domino Directory).** Every other db's "Administration Server" just says "whose AdminP maintains *this db's* ACL," unrelated to the domain identity:

- `names.nsf` Administration Server = **the domain-admin identity** → triggers domain-level aggregation; the only one to touch.
- `admin4.nsf`, `certstore.nsf` Administration Server = who maintains each one's ACL → leave them local. Pointing `admin4.nsf` at an unreachable server would instead strand local AdminP request maintenance — worse.

## Wrap-up

"Administration server" is an overloaded term in Domino: on a single db it's just "who maintains this db's ACL via AdminP"; on `names.nsf` it's the "domain administration server" — the domain-level identity that quietly drives machinery like domain-wide entitlement aggregation. When one setting causes seemingly unrelated symptoms, figure out **which layer** you actually touched. Two lessons here: mislabeling an additional server as the domain admin trips aggregation, and `DISABLE_ENTITLEMENT_TRACKING` targets the collection layer — useless against aggregation, so don't burn time on the wrong layer. For the certificate/CertMgr context, the site's [certstore series](/domino-news/en/posts/certstore-getting-started) walks through it in full.

[^adminp]: AdminP (the Administration Process) is Domino's background maintenance process for cross-db ACL and name maintenance — when someone is renamed or removed, it updates the related person names across the domain's databases. Which server runs it for a given db is set by that db's "Administration Server."
