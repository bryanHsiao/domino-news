---
title: "updall, fixup, compact: Which One to Run When a Database Is Broken, Bloated, or Its Views Are Wrong"
description: "Domino's three database-maintenance commands are the easiest to reach for blindly: run fixup because a view is stale, run fixup because the file got fat, run compact because it won't open — and get nowhere. Each treats a different illness: updall handles indexes (views / full-text), fixup repairs corruption (documents / structure), compact reclaims space (bloat). This piece sorts them by symptom, plus the official escalation order for corruption: updall first, then fixup, then compact -c."
pubDate: 2026-09-18T07:30:00+08:00
lang: en
slug: domino-updall-fixup-compact
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Fixing corrupted databases (escalation order) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_fixingcorrupteddatabases_r.html"
  - title: "Updall options — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_updalloptions_r.html"
  - title: "Fixup options — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_fixupoptions_r.html"
  - title: "Running the database maintenance tool from a Program document — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_running_the_database_maintenance_tool_from_a_program_document_t.html"
relatedJava: []
relatedSsjs: []
---

When a database acts up, the most common mistake is **grabbing the wrong tool**: run `fixup` because a view is stale, `fixup` because the file keeps growing, `compact` because it won't open — and spend an hour getting nowhere. `updall`, `fixup`, and `compact` treat **different illnesses**; knowing "which symptom calls for which" saves far more time than trial and error.

## TL;DR

- **`updall` = indexes** (views / full-text). Views showing stale data, wrong order, missing documents → run this first.
- **`fixup` = repair corruption** (documents / database structure). A database that won't open, corruption errors → this is your tool; after an improper server shutdown, Domino runs fixup automatically on affected databases at startup.
- **`compact` = reclaim space** (a file that got fat, needs slimming). Also used to change compaction style or enable features.
- **Official escalation for corruption**: `updall` first → then `fixup` → then `compact -c`.
- With **transaction logging** on, corruption is far rarer.

## `updall`: when a view or full-text index is wrong

`updall` handles **indexes** — it updates and rebuilds view indexes and full-text indexes. **Symptoms**: a view shows old data, sorts wrong, is missing documents that should be there, or full-text search returns odd results. That's usually not damaged data — it's a **stale or damaged index**, and rebuilding the index fixes it without touching a single document.

- `updall` (no argument) updates all indexes that need it across the server's databases.
- `updall <database>` handles just one database.
- To **force a rebuild** (not just an update) of a database's views, use [`updall`'s rebuild option](https://help.hcl-software.com/domino/11.0.1/admin/admn_updalloptions_r.html) (e.g. `-r`); full-text has its own flags (e.g. `-f`).

In the client, <kbd>Shift+F9</kbd> rebuilds one view and <kbd>Ctrl+Shift+F9</kbd> rebuilds all views in a database — that's updall's work under the hood.

## `fixup`: when a database is corrupt and won't open

`fixup` is the **corruption-repair** tool — it checks and fixes document- and structure-level damage. **Symptoms**: a database that won't open, a "database is corrupt" error, or databases acting strange after an improper server shutdown (Domino runs fixup **automatically at startup** on affected databases in that case).

Note that fixup is a **later-stage** measure: to make a database openable, it may **discard documents it can't repair**. So when you hit corruption, **prefer restoring from backup**, or recovering via transaction logging; `fixup` is the "still won't open" option. Pick among the [fixup options](https://help.hcl-software.com/domino/12.0.0/admin/admn_fixupoptions_r.html) (`-f` full check, `-j` for logged databases, etc.) by situation.

## `compact`: when the file is bloated and needs slimming

`compact`'s day job is to **reclaim unused space and shrink the file** — after you delete lots of documents the file doesn't shrink on its own; those gaps get recovered by compact. **Symptoms**: an `.nsf` that keeps growing and eating space, or one you'd like to slim after clearing out a lot of documents.

Common styles:

- **`-B` (in-place, recover space)**: compacts in place and returns space to the OS; in most cases it can run **online (server up)**.
- **`-c` (copy-style)**: rebuilds via a temporary copy — needs extra disk space, but can make structural changes, and it's the last step in the corruption escalation (below).

compact is also how you **enable certain features** (DAOS, document IDs) or change compaction settings — those often require `-c`.

## For corruption: the official escalation order

Each tool has its day job, but when you're staring at one corrupt database, [the docs](https://help.hcl-software.com/domino/12.0.0/admin/admn_fixingcorrupteddatabases_r.html) give a clear escalation to try in order:

1. **`updall` first**: "Run Updall to fix corrupted views and full-text indexes; **if a corrupted view is the problem, try Updall before trying Fixup**." — if only a view is broken, updall is enough; no need for fixup.
2. **then `fixup`**: "Run Fixup to fix corrupted views and documents." — when updall can't resolve it and documents are involved, escalate to fixup.
3. **finally `compact -c`**: "Run Compact with the `-c` option to fix corruption problems that Fixup doesn't correct." — for what fixup can't fix, a copy-style compact rebuilds the whole database as a last resort.

The docs also note these are "**primarily used for solving corruption problems in unlogged databases**" — with transaction logging on, corruption is far less frequent to begin with, which is the cheapest prevention.

## Scheduling and running online

All three can be scheduled from a **Program document** ([docs](https://help.hcl-software.com/domino/11.0.1/admin/admn_running_the_database_maintenance_tool_from_a_program_document_t.html)) — e.g. a nightly `updall` to refresh indexes, a periodic `compact -B` to reclaim space. Whether it runs online depends on the tool and options: `updall` and `compact -B` usually can; some `fixup` operations need the database not to be open.

## Wrap-up

The split in one line: **view/full-text wrong → `updall` (indexes); won't open / corrupt → `fixup` (repairs documents, but reach for backup first); file bloated → `compact` (reclaim space)**. For actual corruption, walk the official escalation updall → fixup → compact -c. Keep transaction logging on and you'll run all three far less. For what to check first when the server itself acts up, see [Domino console troubleshooting commands](/domino-news/en/posts/domino-console-troubleshooting).
