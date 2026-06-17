---
title: "The ODS Developers Rarely Notice: Domino's Database Format Versions, and What Actually Triggers an Upgrade"
description: "You write LotusScript / XPages all day and probably never think about a database's ODS (on-disk structure) version — until a feature like LargeSummary needs a certain ODS, or you move an old database between servers and aren't sure whether its ODS follows. This article covers the ODS-to-release mapping from a developer's angle, the most counterintuitive point (upgrading the server version does not upgrade the ODS), and exactly what triggers an ODS change and what governs it — then answers a concrete case: an R9 ODS51 database, new-copied from an R12 client to an R12 server, does its ODS change automatically?"
pubDate: 2026-06-22T07:30:00+08:00
lang: en
slug: domino-ods-versions
tags:
  - "Domino Server"
  - "Admin"
  - "Tutorial"
sources:
  - title: "Domino on-disk structure (ODS) — HCL Domino 14.5"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/inst_dominoondiskstructure_t.html"
  - title: "Controlling the ODS versions of server-based databases — HCL Domino"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/upgrading_ods_on_servers.html"
  - title: "Controlling the ODS version of client-based databases — HCL Domino"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/upgrading_ods_on_clients.html"
relatedJava: []
relatedSsjs: []
---

As a developer you spend all day in LotusScript, XPages, and agents, and you've probably never actively wondered: the database you're working with — **which version is its underlying file format?** That version is the **ODS (on-disk structure)**, and normally it's invisible, until one day it suddenly becomes a problem —

- you want to use a feature (like the [LargeSummary covered in the previous article](/domino-news/posts/domino-large-summary-field-too-large/)) and it requires the database to be at a certain ODS or higher;
- or you move an old database around between servers and can't tell whether the ODS follows, or when it changes.

This article lays out, from a developer's angle, how ODS has evolved and — the key part — **what triggers an upgrade and what governs it**, then answers a very concrete case a lot of people are unsure about: **an R9-era, ODS 51 database, manually new-copied from an R12 client to a second R12 server — does its ODS change automatically?**

---

## TL;DR

- **ODS = a database's file-format version.** Each Domino release has a default ODS; a higher ODS unlocks bigger databases, more ACL entries, LargeSummary, and so on.
- **The counterintuitive part: upgrading the server version does not upgrade the ODS.** Per the official table, new databases on Domino **12 / 14 still default to ODS 52**; to get ODS 55 you must set `Create_R12_Databases=1`.
- **Just opening an old database on a newer server does not auto-upgrade its ODS.** Only a **copy-style compact** (`compact -c` / dbmt `-ods`) does.
- **The target ODS is governed by the notes.ini `Create_Rx_Databases` setting** (unset = default 52).
- **A new copy / new replica is "creating a new file"** → it takes the create-ODS of wherever the file is created; **a plain OS-level file copy preserves the ODS** as-is.
- The Notes **client, on startup**, auto-upgrades **local** databases below the default ODS via copy-style compact (a client behavior; servers don't do this).

## What ODS is (the developer version)

The official definition is short: "Domino on-disk structure (ODS) refers to the file format of a database." It's the database's file-format version.

For a developer, ODS is something you usually ignore — but it decides "what this database can withstand." A higher ODS unlocks capabilities older formats can't do: larger database ceilings, more ACL entries, and the **LargeSummary** from the last article (raising a single document's summary limit from 64K to 16MB). So ODS isn't purely an ops topic — the moment you want a feature that "needs a certain ODS or higher," it becomes your problem.

## Mapping: which ODS goes with which release

The common mapping (modern rows per the [official HCL ODS documentation](https://help.hcl-software.com/domino/14.5.0/admin/inst_dominoondiskstructure_t.html)):

| ODS | Roughly the release | Note |
|---|---|---|
| 43 | R6 / R7 | historical format |
| 48 | R8.0 | |
| 51 | R8.5 | the format of the old database in this article's case |
| 52 | R9 | **carried forward as the "default" new-db ODS for R10 / R11 / R12 / R14** |
| 53 | R10 | needs `Create_R10_Databases=1`; supports larger DBs / folders |
| 55 | R12 | needs `Create_R12_Databases=1`; the structural basis for LargeSummary / bigger fields; R14 / 14.5 also max out at 55 |

Notice that **52 spans several generations** — which is exactly where the next, counterintuitive point comes from.

## The counterintuitive part: upgrading the server ≠ upgrading the ODS

Many people assume "the server is on R12 / R14, so the database's ODS is automatically the newest." **It isn't.**

The [server-side ODS control docs](https://help.hcl-software.com/domino/12.0.0/admin/upgrading_ods_on_servers.html) are explicit: new databases on Domino 12 / 14 **still default to ODS 52**; to use ODS 55 you must set:

```text
Create_R12_Databases=1
```

And **simply "opening" an old-ODS database on a newer server, or using it day to day, does not auto-upgrade its ODS.** Verbatim: existing databases are only upgraded to the target version when they "are compacted using copy-style compacting." In other words — ODS does not jump up just because you moved to a new server or opened it a few times.

## So when does the ODS actually change?

Organize the triggers into three groups — this is the table to remember:

**ODS does NOT change:**

- **An OS-level file copy** (copying the `.nsf` directly) — no rewrite, ODS preserved as-is.
- **Just opening / using / replicating data.**
- **In-place maintenance**: `fixup`, `updall`, in-place compact (the kind that doesn't rebuild the file).

**ODS DOES change:**

- **Copy-style compact** (`load compact -c`, or preferably `load dbmt … -ods`) — it rewrites the whole database at "the destination's create-ODS." This is the only upgrade path the docs explicitly name.
- **Creating a New Copy / New Replica** — this is "creating a new database file," and the new file takes the create-ODS of "whichever machine the file is created on."
- **The [Notes client's startup auto-upgrade](https://help.hcl-software.com/domino/14.0.0/admin/upgrading_ods_on_clients.html)** — after startup the client checks for **local** databases below the default ODS and copy-style-compacts them up to the client default (a client-only behavior; servers don't do this).

**What governs the target ODS:**

Whether it's a new file or a copy-style compact, the ODS it lands at is governed by the notes.ini `Create_Rx_Databases` setting on "**the machine where the file is created / rewritten**":

| Setting | ODS of the new file / after copy-style compact |
|---|---|
| (unset) | default **52** |
| `Create_R10_Databases=1` | 53 |
| `Create_R12_Databases=1` | 55 |

## Back to your case: ODS51, new-copied from an R12 client to R12 ap02

Now we can answer precisely. An R9-era database stuck at **ODS 51** (originally on ap01), manually "**new-copied**" from an **R12 client** to **R12 ap02** — does its ODS change?

It depends on what "new-copy" means:

- **If it's a New Copy / New Replica (creating a new database through Notes)**: this creates a **new file on ap02**, so the new file's ODS = **ap02's create-ODS**:
  - ap02 without `Create_R12_Databases=1` → the new file is **ODS 52** (**it leaves 51, but it will not be 55**).
  - ap02 with `Create_R12_Databases=1` → the new file is **ODS 55**.
  - Either way, the result does **not stay at ODS 51** — because it's a *new file* taking the destination's settings, not inheriting the source.
- **If it's an OS-level file copy** (moving the `.nsf` directly): no rewrite, so **ODS 51 is preserved**.
- **If the copy lands in the client's local data directory**: the client will copy-style-compact it up to the **client's default ODS** on its next startup.

So "does it change automatically?" The answer is: **it depends on whether you do a "new copy/replica" or a "file copy," and on the destination's `Create_Rx_Databases` setting.** A lot of people assume "R12 means the newest ODS" or "a copy always preserves the original ODS" — both intuitions are wrong in different situations. The real decider is "**where the new file gets created, and how that machine is configured.**"

## How to check, how to control

- **Check a database's ODS**: it's shown in the database properties; on the server you can also use a command like `show database <db>` to see format info.
- **To upgrade an existing DB**: set `Create_Rx_Databases=1` on the destination server, then run a **copy-style compact** on the DB (prefer `load dbmt … -ods`; the `-ods` flag skips databases already at the target ODS so you don't compact for nothing).
- **To deliberately keep an old ODS** (for compatibility): don't run a copy-style compact and don't New-Copy it on a higher-configured server; an OS-level file copy preserves the format.

## How this connects to LargeSummary

This also completes the chain the [previous LargeSummary article](/domino-news/posts/domino-large-summary-field-too-large/) left open. That piece described a trap: a customer's database was upgraded from R9 to R12, its ODS looked like 55, **yet LargeSummary was off**.

Put the two together and the full set of layers is:

```text
server version (R12/R14)
   ↓ does NOT auto-upgrade ODS
ODS version (needs Create_R12_Databases=1 + a copy-style compact to reach 55)
   ↓ ODS55 only means "the structure can hold it", not "the feature is on"
LargeSummary (still needs compact -LargeSummary on to actually enable)
```

Every layer is "necessary but not sufficient" — upgrading the layer above does not pull the one below up with it. **ODS is the bottom of that chain, the layer developers most easily ignore, yet the one that decides whether the layers above can be unlocked at all.** Next time a feature "won't work even though the version is clearly new enough," check the ODS and its create settings first — the answer is often right there.
