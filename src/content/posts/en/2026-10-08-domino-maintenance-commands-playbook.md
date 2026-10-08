---
title: "Domino Maintenance Commands in Practice — Option Rules, the Transaction-Log Branch, and Scenario Playbooks (Daily / Repair / Won't Open)"
description: "The options for updall, compact, and fixup are all over the web, but the same compact run with -b vs -B — and whether transaction logging is on — produces wildly different results: one keeps the DBIID, the other reassigns it and breaks your backup chain. This piece turns HCL's own maintenance manual into a practical reference: three syntax rules first (parameter position, case-sensitivity -b≠-B, keyword options), then compact's three compaction styles, then the full command sequences for three scenarios — scheduled daily maintenance, corruption repair, and work-hours-no-downtime — each marked for whether transaction logging is enabled."
pubDate: 2026-10-08T07:30:00+08:00
lang: en
slug: domino-maintenance-commands-playbook
tags:
  - "Domino Server"
  - "Admin"
  - "Tutorial"
sources:
  - title: "Administrator's manual for Domino server maintenance (full updall/compact/fixup options and scenario procedures) — HCL Customer Support (KB0030639, official)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0030639"
  - title: "Server maintenance checklist (task frequency + the transaction-log branch) — HCL Customer Support (KB0030754, official)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0030754"
  - title: "Compact options — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/tune_compactoptions_r.html"
  - title: "Fixup options — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_fixupoptions_r.html"
relatedJava: []
relatedSsjs: []
---

You need to maintain an NSF, so you grab a `load compact ...` string off the web and paste it into the console. It seems to run — but you may not realize that the same `compact`, run with `-b` versus `-B`, differs a lot: one keeps the `DBIID`, the other reassigns it — and a reassigned `DBIID` breaks the chain between the database and your certified backup tool. Add whether transaction logging is on, and the whole set of options you should be using changes.

This isn't a "can't remember the commands" problem — it's a "wrong option does damage" problem. This piece turns HCL's own maintenance manual into a practical reference: three syntax rules first, then `compact`'s compaction styles sorted out, then full command sequences for three scenarios — each marked for whether transaction logging is enabled. If you want the conceptual layer first — which symptom calls for which command — start with [this piece](/domino-news/en/posts/domino-updall-fixup-compact/); this one picks up at "so how do I actually set the options."

---

## TL;DR

- **Three syntax rules**: options go before or after the database path; `compact`'s duplicate letters are **case-sensitive** (`-b` ≠ `-B`), `updall`'s aren't; a few options need a keyword (e.g. `-LargeSummary on`).
- **`compact` has three compaction styles** — pick the right one before worrying about options: in-place keeping the `DBIID` (`-b`, fastest, transaction-log-safe), in-place with file shrink but a new `DBIID` (`-B`), copy-style rebuild (`-c`, for corruption / structural change / ODS upgrade), and online background replica-style (`-REPLICA`).
- **Transaction logging is the branch that runs through everything**: with logging on, don't routinely run `fixup` (a crash restart auto-recovers), and compact with `-b`, not `-B`/`-c` (keep the `DBIID`); after any compaction that reassigns the `DBIID`, take a full backup immediately.
- **Three scenarios, one sequence each** (full commands below): scheduled daily, corruption repair, work-hours-no-downtime.
- **`fixup` is not routine maintenance**: HCL recommends running it only on signs of corruption, and even less so on a single non-clustered server.

## Three syntax rules

Before you type anything, keep these three easy-to-trip rules from the manual in mind:

1. **Option position is flexible.** `load updall -R sales.nsf` and `load updall sales.nsf -R` both run; the order of database path and options doesn't matter.
2. **`compact` is case-sensitive, `updall` isn't.** This is the one that bites: in `compact`, `-b` and `-B` are **two different functions** (in-place vs in-place-with-shrink), so the wrong case is a different behavior. `updall`'s option letters are case-insensitive — HCL's own docs use `-R` and `-r`, `-X` and `-x` interchangeably for the same thing.
3. **Some options need an `on`/`off` keyword to take effect** — e.g. the official Compact options `-daos on|off` (DAOS attachment consolidation) and `-nifnsf on|off` (view indexes stored separately) both require `on` or `off`: `load compact -nifnsf on dbname.nsf`; the switch alone does nothing.

## `compact`: pick the compaction style first, then the options

`compact`'s options look messy because underneath it's really **three (strictly four) different compaction styles**, and the options decide which one you get ([official Compact options](https://help.hcl-software.com/domino/12.0.2/admin/tune_compactoptions_r.html)):

| Style | Option | Reassigns `DBIID`? | Online/offline | When |
|---|---|---|---|---|
| In-place, reclaim space only | `-b` | **No** | Online | Most common, fastest, least impact; **transaction-log-safe** |
| In-place, reclaim and shrink | `-B` | **Yes** | Online | When you need the file to actually get smaller |
| Copy-style (rebuild) | `-c` | Yes | Offline (unless `-L`) | Corruption, structural change, ODS upgrade |
| Replication-style | `-REPLICA` | New replica | Online, background | Large / system databases you want compacted with near-zero downtime |

A few key points:

- **The core `-b` vs `-B` difference is the `DBIID`.** `-b` reclaims unused space in place but **doesn't shrink the file**, keeping the original `DBIID`, so its relationship with transaction logging stays intact; `-B` shrinks the file but **assigns a new `DBIID`**. With transaction logging on, use `-b` for routine compaction; use `-B` when you genuinely need the shrink, and take a full backup of all databases right after.
- **`-c` is copy-style**: it writes a fresh copy, then deletes the old file — so you need enough free disk for that copy, and it's the first choice for **corruption** (a full rewrite clears up a range of problems along the way). Structural changes (database property changes, ODS upgrades) also push Domino to copy-style automatically.
- **Companion options**: `-S nn` compacts only databases with "unused space ≥ nn%" (e.g. `-S 10`); `-D` discards built view indexes (copy-style, often before a tape backup — the cost is the next view open rebuilds and is slower); `-i` ignores errors and continues (copy-style only); `-L` lets users keep access during copy-style compaction (but a user edit cancels the compaction).

## `updall`: tell "update" from "rebuild"

`updall` runs nightly by default (notes.ini's `ServerTasksAt2`), refreshing the views and full-text indexes that need it and clearing deletion stubs and long-unused view indexes along the way. When you run it by hand, the key is telling "update" from "rebuild" ([official Updall options](https://help.hcl-software.com/domino/11.0.1/admin/admn_updalloptions_r.html)):

- **Update**: `-V` updates view indexes only (not full-text), `-F` updates full-text only (not views). The lightweight day-to-day operation.
- **Rebuild**: `-R` rebuilds all used views, `-X` rebuilds full-text indexes. Rebuilding is **resource-heavy** — HCL lists it as "the last resort for database corruption," not a daily thing. The tail of a typical corruption repair is `updall -R -X` (rebuild both views and full-text).

## `fixup`: only when it's actually called for

`fixup` does a **consistency check**: at server restart it scans databases that weren't closed properly (crash, power loss, hardware error) and tries to fix the inconsistencies left by half-finished writes. It is not routine maintenance ([official Fixup options](https://help.hcl-software.com/domino/14.0.0/admin/admn_fixupoptions_r.html)):

- Common options: `-F` scans all documents (without it, only those modified since last run); `-O` takes an open database offline to fix it; `-C` verifies and reports **without modifying** (verify only); `-N` doesn't purge corrupted documents; `-J` runs on databases **with transaction logging enabled** (without it, `fixup` generally skips logged databases); `-L` logs every database it checks.
- **The most important point**: with transaction logging on, you **don't need** `fixup` to keep things consistent — on a crash restart Domino auto-recovers from the log. HCL explicitly says `fixup` isn't recommended as routine maintenance, and on a single non-clustered server, only when the server went down due to database corruption.

## Scenario playbooks

Put it together and HCL's maintenance manual ([KB0030639](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0030639)) already gives you ready-made command sequences. Copy them straight; pick the line that matches whether transaction logging is on.

### Scenario 1: scheduled daily (preventive)

- `updall` already runs nightly — you don't schedule it yourself.
- Compact weekly (off-peak, weekends) to save disk:
  - No transaction logging: `load compact -B -S 10`
  - Transaction logging on: `load compact -b -S 10`
  (`-S 10` = compact only databases with ≥ 10% unused space; `-b` keeps the `DBIID`, `-B` reassigns it.)
- **Don't schedule `fixup`.** If you've never had a corruption-caused crash, don't run it routinely.

### Scenario 2: database corrupt, won't open

When the console throws `database.nsf is damaged` / `is CORRUPT - Now Read-Only!`, follow the official recovery sequence — **check for transaction logging first**:

- **Transaction logging on**:
  ```
  load fixup database.nsf -J -F
  load compact database.nsf -b
  load updall database.nsf -R -X
  ```
- **No transaction logging**:
  ```
  load fixup database.nsf -F
  load compact database.nsf -c -i
  load updall database.nsf -R -X
  ```
- Still won't repair: **create a replica to replace the original** — making a replica forces a full rebuild and clears corruption that `fixup`/`compact` can't.

(These steps change the transaction-log-related `DBIID`, so if you run archival logging, take a full backup immediately after.)

### Scenario 3: work hours, no downtime

You can't take the database offline during the day but have to act:

1. Diagnose only, change nothing: `load fixup database.nsf -L -F -O -C` (`-C` verify only — reports, doesn't modify).
2. If you truly must act and can't wait for off-peak: `load compact database.nsf -c -L -i` (`-L` lets users keep access during compaction).
3. After either, rebuild views and full-text off-peak: `load updall database.nsf -R -X`.

## Transaction logging changes everything

If you remember one thing from this piece, remember this: **whether transaction logging is on decides which set of options you should use.**

- **Logging on**: don't run `fixup` routinely (restart auto-recovers); to run `fixup` on a logged database you need `-J`; compact with `-b` (keeps the `DBIID`), **not** `-B` or `-c` — those reassign the `DBIID` and force your backup chain to start over.
- **Any compaction that reassigns the `DBIID`** (`-B`, `-c`, and `-REPLICA`, which builds a new replica): if you use a certified backup tool, take a full backup immediately after so the tool re-recognizes the database.

## When not to run it (especially fixup)

The manual specifically warns that `fixup` often gets run when it shouldn't:

- **First crash**: a crash can cause inconsistency, but without transaction logging Domino already runs a consistency check on restart and fixes it. No errors means no need to `fixup` by hand.
- **Crash unrelated to a database**: if the NSD / crash stack shows nothing database-related, you can largely rule out corruption — nothing to repair.
- **Repeated crashes with NSD pointing at one database**: that's when `fixup` is genuinely warranted, and HCL recommends running it with the **server stopped**.

## Wrap-up

Domino's maintenance commands aren't hard — pairing the options is. Hold the three syntax rules first (position is free, `compact` is case-sensitive, keyword options); pick `compact`'s style before anything (`-b` keeps the `DBIID`, `-B` shrinks and reassigns it, `-c` copy-style for corruption, `-REPLICA` online background); tell `updall`'s "update `-V`/`-F`" from "rebuild `-R`/`-X`"; run `fixup` only when it's called for. When a scenario hits, run the playbook's sequence and pick the line that matches your transaction-logging state. And the thread through all of it is always transaction logging — it decides whether you can run `fixup`, which compact style to use, and whether you owe a full backup afterward.
