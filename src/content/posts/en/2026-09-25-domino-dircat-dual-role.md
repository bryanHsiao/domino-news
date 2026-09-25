---
title: "The Two Jobs of dircat: You Think It Only Builds the Directory Catalog — Since Domino 12 It Also Runs Entitlement Auditing"
description: "See dircat (Directory Cataloger) in show tasks and most people think 'directory catalog' — aggregating multiple Domino Directories into one lookup-friendly directory. That's its day job. But since Domino 12 the task quietly took a second one: aggregating each server's entitlement data into entitlements.nsf, a licensing-compliance audit with nothing to do with directories. This covers dircat's real job (condensed vs extended catalogs, and why DIRCAT5.NTF isn't CATALOG.NTF), its hidden second role since Domino 12, and how one task with two jobs bites."
pubDate: 2026-09-25T07:30:00+08:00
lang: en
slug: domino-dircat-dual-role
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Directory catalogs — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_directorycatalogs_c.html"
  - title: "Setting up a condensed directory catalog — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_settingupacondenseddirectorycatalog_c.html"
  - title: "Entitlement tracking — HCL Domino Admin Help (official)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-dircat-dual-role.webp"
coverStyle: "bw-grain"
---

See `dircat` (Directory Cataloger) in `show tasks` and your first thought is probably "oh, the directory catalog thing" — aggregating the company's several Domino Directories into one directory that's easy to look names up in. Right, that's its **day job**. But since Domino 12, this task quietly picked up a second one with nothing to do with directories: **aggregating each server's entitlement data for licensing-compliance auditing**. One task, two unrelated identities — and the second one is exactly why a server that shouldn't be minding everyone else's business suddenly starts "connecting to every server in the domain."

## TL;DR

- **Day job**: dircat aggregates multiple Domino Directories into a **Directory Catalog**, so clients and servers can quickly look up addresses, names, groups, and resources.
- **Two catalog types**: **condensed** (`DIRCAT5.NTF`, for Notes clients, hugely compressed, works offline) vs **extended** (`PUBNAMES.NTF`, for servers, faster and more flexible lookups).
- **Second job (since Domino 12)**: dircat also "manages the synchronization process" that aggregates each server's entitlement data into `entitlements.nsf` — **entitlement/licensing compliance tracking**, unrelated to directories.
- **One gotcha**: build a condensed catalog from `DIRCAT5.NTF` — **not `CATALOG.NTF`** (that's the *database* catalog, a completely different thing).
- **The cost of one task, two jobs**: once a box is wrongly promoted to domain admin, dircat's second identity fires — walking the whole domain to aggregate entitlement data, flooding on whatever it can't reach.

## Day job: aggregating Domino Directories into one catalog

HCL's definition of a directory catalog is plain:

> A directory catalog is an optional directory database that typically contains information aggregated from multiple Domino directories.

Its purpose is to let clients and servers "look up mail addresses and other information about the people, groups, mail-in databases, and resources throughout an organization" — **look people and addresses up across several domains / Domino Directories** without paging through each one.

dircat is the task that builds and maintains this catalog. HCL describes its actions: the first run **builds** it; after that it usually **updates** — "it checks for changes to the contents of fields in the source Domino Directories, and then makes the appropriate changes to the directory catalog" — with partial and full rebuilds also available. Scheduled runs, incremental updates: that's its daily routine.

## Two catalog types: condensed vs extended

| Type | Template | Used on | Character |
|---|---|---|---|
| **Condensed** | `DIRCAT5.NTF` | Notes clients | **combines multiple documents into single documents**; hugely compact; offline name lookups |
| **Extended** | `PUBNAMES.NTF` (same template as the Domino Directory) | servers | "faster and more flexible directory lookups" |

The condensed compression is dramatic: HCL's own example takes a directory of "more than 350,000 users and total 3GB" down to a condensed catalog of "only about 50MB" — by "combin[ing] multiple documents from Domino directories into single documents," which is what lets it fit on a client for offline use. Note that a **condensed catalog is no longer supported on a server** ("Using a condensed directory catalog on a server is no longer supported"); on servers, use extended.

**A common gotcha**: to build a condensed catalog, select **`DIRCAT5.NTF`** — HCL explicitly warns "DO NOT select the Catalog (V6) template (`CATALOG.NTF`)." `CATALOG.NTF` is the *database* catalog (what databases exist on a server) — a different thing with a confusingly similar name; pick it and the whole thing is wrong.

## Second job: since Domino 12, dircat also aggregates entitlements

Here's the part a lot of people miss. Since Domino 12, the **domain-wide aggregation** for [Entitlement Tracking](https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html) was also handed to dircat. HCL's wording:

> The entitlement data collected daily by each Domino server in a domain is also aggregated for the entire domain on the domain administration server. **The directory catalog task manages the synchronization process**…

In other words: **the same dircat**, besides maintaining the directory catalog, is responsible for aggregating each server's daily-collected entitlement data (each user's highest access level, for HCL licensing compliance) into `entitlements.nsf`. This runs only on the domain administration server.

Why hand it to dircat? Probably because dircat is already the "aggregate data across servers" specialist, so aggregating entitlement data reuses the same synchronization machinery. But **as a responsibility, it's a different job from building the directory catalog** — one is looking up addresses for people, the other is counting licenses for the vendor. The name only tells you about the first.

## One task, two identities — how it bites

The trouble is that both jobs **share one auto-starting dircat**:

- You see `dircat` in `show tasks` (see the site's [console troubleshooting piece](/domino-news/en/posts/domino-console-troubleshooting)), and the name alone won't tell you which identity it's in, or whether it's doing both.
- Worse, entitlement aggregation is **tied to the domain administration server identity**. Once a box is wrongly promoted to domain admin (say, someone changed `names.nsf`'s Administration Server while setting up CertMgr), dircat's second identity fires — walking the server list in `names.nsf` to aggregate entitlement data across the domain, throwing an error every 5 seconds on whatever it can't reach. The full cause-and-fix is in [the Domino admin-server identity piece](/domino-news/en/posts/domino-admin-server-identity).
- **How to tell which job it's doing**: read `console.log`. "Entitlement Tracking Aggregator processing directory CN=…!!`entitlementtrack.ncf`" is the second identity (entitlement aggregation); ordinary directory-catalog build/update messages are the day job.

## Wrap-up

dircat is a task with a misleading name: it says "Directory Cataloger," and its day job really is building the directory catalog — condensed for clients, extended for servers. But since Domino 12 it carries a second identity the name never mentions: licensing-compliance entitlement aggregation. Know that, and the next time you see dircat "connecting to every server in the domain" on an additional server, you won't assume the directory is broken — that's its second job running, and what to check is whether this box was accidentally made the domain administration server.
