---
title: "Domino Transaction Logging: the Three Styles, Why It Replaces Routine Fixup, and How It Drives Compact's DBIID"
description: "In the maintenance-command rules, 'is transaction logging on?' is always the branch that decides which option you type — with logging, don't run fixup routinely, compact with -b to keep the DBIID, and take a fresh backup after anything that changes the DBIID. But what is transaction logging, and why does it flip so many rules at once? This piece explains it: it records database changes into one log and replays it automatically on a crash restart, so logged databases need no consistency check (and no routine fixup); the three styles (circular / linear / archived) and their trade-offs; and why operations that rebuild a database (copy-style compact, fixup on a corrupt database, enabling logging) assign a new DBIID, invalidate the old log, and force a full backup."
pubDate: 2026-10-13T07:30:00+08:00
lang: en
slug: domino-transaction-logging
tags:
  - "Domino Server"
  - "Admin"
  - "Backup"
sources:
  - title: "Transaction logging (the concept: one log, automatic crash recovery on restart, logged DBs need no consistency check) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_transactionlogging_c.html"
  - title: "Setting up a Domino server for transaction logging (Server document settings, the three styles, log-disk requirements, style change reassigns DBIID) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_settingupadominoserverfortransactionlogging_t.html"
  - title: "Transaction logging with backup and restore (archived style and backup / media recovery) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_backupandrestorerequirements.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-transaction-logging.webp"
coverStyle: "minimalist-mono"
---

If you've seen the Domino maintenance-command rules, you'll have noticed that "**is transaction logging on?**" is always the branch that decides everything: with logging, don't schedule `fixup` routinely; compact with `-b`, not the file-shrinking `-B`; and after anything that changes the `DBIID`, take a fresh full backup immediately.

How does one setting flip so many rules at once? Because transaction logging changes how Domino protects data and recovers from a crash at the lowest level. This piece lays it out — what it is, how the three styles differ, and why it ties into `fixup`, `compact`, and your backups. (For the maintenance commands themselves, see [Domino maintenance commands in practice](/domino-news/en/posts/domino-maintenance-commands-playbook/); this piece is the *why* behind those "is translog on?" branches.)

---

## TL;DR

- **What it does**: records every database change on the server into **one** transaction log first, in batches (log extents `Sxxxxxxx.TXN` plus a control file `NLOGCTRL.LFH`).
- **Crash recovery**: on restart, Domino runs to the end of the log and recovers the writes that weren't on disk at the time of the crash. In HCL's words: **"Logged databases do not require a consistency check"** — so a logged database needs no consistency check, and no routine `fixup`.
- **Three styles**: `circular` (default, fixed space, 4GB ceiling, overwrites the oldest), `linear` (like circular but no 4GB ceiling), `archived` (log extents are reused only after a backup tool archives them; with no backup tool new log files keep accumulating and can fill the log disk). `archived` is the style built for the archive-and-media-recovery workflow; circular and linear are mainly for crash recovery.
- **Why it drives the DBIID**: log records are tied to a database's `DBIID`. Operations that **rebuild** a database — **enabling logging the first time, changing the logging style, a copy-style / file-shrinking `compact`, or `fixup` on a corrupt database** — assign a **new DBIID**, which invalidates the old log records, so you must **take a fresh full backup** afterward. In-place `-b` compaction keeps the DBIID — that's exactly why.
- **Setup**: enable it on the Server document's Transactional Logging tab (restart required); give the log its own **dedicated / mirrored disk** (at least 1GB).

## What it does: changes go to a log first

Without logging, Domino writes changes straight into each NSF; a crash mid-write can leave a database inconsistent, and you lean on `fixup` to scan it afterward.

With transaction logging on, changes are **written into one central transaction log first, in batches** (one per server, stored as `Sxxxxxxx.TXN` log extents plus an `NLOGCTRL.LFH` control file), then flushed to the individual databases. That buys two kinds of recovery:

- **Crash recovery**: on restart, Domino "runs through the end of the transaction logs and recovers any writes that were not made to disk at the time of the crash" — it reapplies, from the log, the writes that hadn't hit disk when the crash happened ([official Transaction logging concept](https://help.hcl-software.com/domino/11.0.1/admin/admn_transactionlogging_c.html)).
- **Media recovery**: with a third-party backup tool that uses the Domino C API Toolkit, you can restore a full backup and then apply the logged updates made since that backup, bringing the database up to a more recent state.

## The three styles: circular / linear / archived

There are three styles for how the log reclaims space:

- **`circular` (default)**: writes into a **fixed-size** space in a loop, overwriting the oldest once full. Maximum 4GB (`Maximum log space` defaults to 500MB, caps at 4096MB). Crash recovery only, simplest performance.
- **`linear`**: overwrites like circular, but with **no 4GB ceiling** — for when you want more log space than 4GB and aren't on archive media yet.
- **`archived` (HCL's eventual recommendation)**: a log extent is reused only **after a backup tool archives it**. It's the style built for the traditional **archive-and-media-recovery** workflow (a Domino C API Toolkit backup tool) ([official: transaction logging with backup and restore](https://help.hcl-software.com/domino/12.0.0/admin/admn_backupandrestorerequirements.html)); the catch is that **without a backup tool to archive them, Domino keeps creating new log files that only pile up and can fill the log disk**. HCL's guidance: start with circular or linear, and move to archived only if you actually need it.

## Why it "replaces" routine fixup

This is the root of the familiar "with translog, don't schedule fixup" rule. HCL is blunt: a logged database **"do[es] not require a consistency check"** — because on a crash restart Domino has already used the log to recover it to a consistent state, so `fixup` doesn't need to scan it again.

So `fixup` becomes a **fallback** in a logged environment: the Server document's "Automatic fixup of corrupt databases" is on by default, and only when Domino **can't recover a database even from the log** does it run `fixup` on it automatically. You almost never need `fixup` as routine maintenance (which is why the [maintenance-commands piece](/domino-news/en/posts/domino-maintenance-commands-playbook/) says "with logging on, don't run fixup routinely").

## How it drives compact and the DBIID

The link between logging and `compact` is the **DBIID** (database instance ID). Every record in the log is tied to a database's DBIID; once a database is **rebuilt** and gets a new DBIID, the old log records no longer match and are invalid.

Operations that reassign the DBIID:

- **Enabling logging on a database for the first time**, or **changing the logging style** (official: "After you change the logging style, Domino assigns a new DBIID to each database").
- **A copy-style or file-shrinking `compact`** (`-c`, `-B`) — those effectively rewrite the database.
- **`fixup` on a corrupt database.**

After any of these, the old log can't follow the new database, so you **must take a fresh full backup** to rebase your backup on the new DBIID. In-place `-b` compaction (reclaim space only, no file shrink) **keeps the DBIID** — which is exactly why the maintenance piece says "with logging, compact with `-b`, not `-B`": `-b` doesn't break the database-to-log relationship.

## Setup: the Server document + a dedicated disk

You enable it on the **Server document's Transactional Logging tab** ([official steps](https://help.hcl-software.com/domino/11.0.1/admin/admn_settingupadominoserverfortransactionlogging_t.html)):

- **Transactional Logging**: set to Enabled — a **restart is required** for it to take effect.
- **Log path**: defaults to `\LOGDIR` under the data directory, but HCL recommends a **separate, mirrored** disk (e.g. a RAID 0/1 device with its own controller), at least **1GB**; Domino formats between 3 and 64 log files. Putting the log on the same disk as the data costs you on both performance and safety.
- **Maximum log space**: for circular / linear, default 500MB, cap 4GB.
- **Automatic fixup of corrupt databases**: on by default — the fallback when the log can't recover a database.
- **Runtime/Restart performance**: Standard by default; you can favor runtime (fewer checkpoints) or restart recovery (more checkpoints).

## How to check whether it's on

Three places confirm it:

- **The Server document (most authoritative)**: on the Transactional Logging tab, is "Transactional logging" set to Enabled, and which style? This is where the setting **comes from**.
- **notes.ini**: `TRANSLOG_Status=1` means on (`0` or absent means off); `TRANSLOG_Style` tells you the style ([HCL wiki](https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/TransLog_Style): `0` = circular, `1` = archived, `2` = linear). Note: these `TRANSLOG_*` values are written from the Server document and get overwritten by it — **read them to see the current state, but change it in the Server document, not by editing notes.ini directly** (a direct edit won't stick).
- **The log path**: when on, the log directory (default `LOGDIR` under the data directory) holds `Sxxxxxxx.TXN` log extents and an `NLOGCTRL.LFH` control file; when off, those files aren't there.

## Wrap-up

- **What it is**: database changes are written into one central transaction log first, then flushed to the NSFs.
- **What you get**: automatic recovery on a crash restart, and **logged databases need no consistency check** — so `fixup` drops to a fallback, not routine maintenance.
- **Three styles**: `circular` (default, ≤4GB, overwrites) / `linear` (no 4GB ceiling) / `archived` (needs a backup tool to archive, for the archive / media-recovery workflow; without one the log files pile up and can fill the disk).
- **DBIID link**: enabling logging, changing the style, a copy-style / file-shrinking `compact`, or `fixup` on a corrupt database all reassign the DBIID and invalidate the old log → **take a fresh full backup afterward**; in-place `-b` keeps the DBIID.
- **Setup**: enable on the Server document's Transactional Logging tab (restart required), with the log on a dedicated / mirrored disk (≥1GB).
