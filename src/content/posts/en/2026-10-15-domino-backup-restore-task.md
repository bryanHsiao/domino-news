---
title: "Domino's Built-in Backup Task (dominobackup.nsf): Domino 12 Finally Ships Backup and Restore — and Why It Also Needs Transaction Logging First"
description: "Before Domino 12, database-level backup and restore meant wiring up a third-party tool (via the C API Toolkit). From 12, Domino ships Backup and Restore as built-in server tasks: one dominobackup.nsf configuration database lets you schedule backups and restore a single database on demand. This piece covers what it is, why — like DAOS — it must have transaction logging enabled first, how to build a config from the platform default in the Configuration view (the Main/Backup/Snapshot/Restore/Prune/Notification tabs), how to run it with load backup's switches (-b/-t/-i/-s/-p), and how to restore from the Database Inventory — including an easy trap: restoring outside the data directory reassigns the DBIID and invalidates the earlier transaction logs."
pubDate: 2026-10-15T07:30:00+08:00
lang: en
slug: domino-backup-restore-task
tags:
  - "Domino Server"
  - "Admin"
  - "Backup"
sources:
  - title: "Setting up backup and restore (dominobackup.nsf, transaction logging required first, the Configuration view platform defaults, the six tabs) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/admn_configuringbackup.html"
  - title: "Running the Backup server task (load backup switches -b / -t / -i / -s / -p / -e / -E) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/admn_runningbackup.html"
  - title: "Restoring databases (Database Inventory, Restore Job, Selected backup, restoring outside the data dir reassigns the DBIID) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/admn_restoringdatabases.html"
relatedJava: []
relatedSsjs: []
---

Before Domino 12, a database-level backup — one that can restore a single database and do point-in-time recovery — meant wiring up a third-party backup tool. From 12, that's **built in**: Domino ships two server tasks, **Backup** and **Restore**, driven by one **`dominobackup.nsf`** configuration database, so you can schedule backups and restore a single database on demand. But it has the exact same hard prerequisite DAOS does — **transaction logging has to be on first** (what that is, how to enable/check it, in [Domino transaction logging](/domino-news/en/posts/domino-transaction-logging/)).

---

## TL;DR

- **What it is**: backup and restore **built in from Domino 12**, driven by `dominobackup.nsf` (the configuration database) plus the **Backup / Restore** server tasks. The first run of the Backup task creates `dominobackup.nsf` for you.
- **Prerequisite**: in HCL's words — **"Domino transaction logging is required on a Domino server that performs backup and restore."** Like DAOS, without logging it's a non-starter.
- **How to configure**: open `dominobackup.nsf` → Configuration view → pick the **default configuration document** for your platform (Linux/Windows) → New Config → fill the **Main / Backup / Snapshot / Restore / Prune / Notification** tabs (path fields have a **Test Formula** button to preview the computed path).
- **How to run**: `load backup` at the console, or schedule it via a Program document. Switches: `-b` (databases/templates, daily), `-t` (back up archived-log TXN files), `-i` (incremental, for point-in-time), `-s` (snapshot), `-p` (prune expired restored copies).
- **How to restore**: in `dominobackup.nsf`'s **Database Inventory**, pick the database → Restore opens a **Restore Job** → choose a **Selected backup** (the only required field) → pick by point-in-time → Submit Restore → `load restore`.
- **One trap**: a blank restore path = restore **in place**; restoring **outside the data directory** **reassigns the DBIID** and invalidates the earlier transaction logs (HCL advises restoring inside the data directory).

## What it is: one config database + two tasks

The heart of the built-in backup is **`dominobackup.nsf`** — a database that holds the settings for what to back up, where to, how to restore, and how to prune old copies. You don't write scripts; you fill in configuration documents, and the two server tasks act on them:

- **Backup task**: backs up one or more databases (and templates) to the target directory, per the configuration. Its first run creates `dominobackup.nsf`.
- **Restore task**: restores a single database on demand — the most useful part of built-in backup: you don't restore a whole server just to recover one database.

This is a **Domino 12** feature; before 12 you relied on a third-party backup tool.

## The prerequisite: enable transaction logging first

Like [DAOS](/domino-news/en/posts/domino-daos-attachment-consolidation/), the built-in backup requires the server to **have transaction logging on**. The official setup page is blunt: **"Domino transaction logging is required on a Domino server that performs backup and restore."**

The reason is consistent: **point-in-time recovery** works by restoring a full backup and then applying the logged updates made since that backup, to bring the database back to a given moment. Without transaction logging there's nothing to apply. So get logging on and confirmed first (enabling and checking it is in [the transaction logging piece](/domino-news/en/posts/domino-transaction-logging/)), then set up backup.

## How to configure: the Configuration view and six tabs

It's all done inside `dominobackup.nsf` ([official setup steps](https://help.hcl-software.com/domino/12.0.2/admin/admn_configuringbackup.html)):

1. Open `dominobackup.nsf` and go to the **Configuration** view.
2. Select the **default configuration document** for your platform (Linux or Windows) and click **New Config** to copy one from it (the defaults are pre-filled).
3. Fill in the tabs:
   - **Main**: general settings (e.g. which databases to exclude, target directories).
   - **Backup**: the backup destination; path fields have a **Test Formula** button to preview the computed path.
   - **Snapshot** (optional): configure this if you use a third-party snapshot solution.
   - **Restore**: the restore location, which **should match the backup path**; also previewable with Test Formula.
   - **Prune**: when to delete older backed-up copies.
   - **Notification**: backup notifications.
4. Save & Close. The backup / restore / prune commands in your configuration must match each other; a separate **Global Configuration** document supplies overall defaults.

## How to run: load backup's switches

You can schedule backups through a **Program document**, or run `load backup` at the console. The common switches ([official running page](https://help.hcl-software.com/domino/12.0.2/admin/admn_runningbackup.html)):

- **`-b`**: back up **databases and templates** only. HCL recommends running this **once a day** (whatever the log mode).
- **`-t`**: back up the **transaction log TXN files** — **archived style only**; recommended every 2–8 hours, depending on server size and change volume.
- **`-i`**: **incremental** backup (databases new, or with new DBIIDs, since the last full backup), to **support point-in-time recovery**; archived only, recommended every 2–4 hours.
- **`-s`**: run a **snapshot** backup per the Configuration's Snapshot tab.
- **`-p <days>`**: **prune** (delete restored copies marked expired) for the given number of days; omit the number to use the configured retention. Note `-p` does **not** back up.
- **`-e` / `-E`**: `-e` adds an exclusion pattern (repeatable); `-E` ignores the configured Excluded databases field, so combining it with `-e` replaces the configured exclusions entirely.

So a typical cadence is `-b` daily to back up databases, and in an archived environment `-t` and `-i` on shorter intervals to capture logs and increments, backing point-in-time recovery.

## How to restore: Database Inventory → Restore Job

To recover a database ([official restore steps](https://help.hcl-software.com/domino/12.0.2/admin/admn_restoringdatabases.html)):

1. Open `dominobackup.nsf`'s **Database Inventory** view — one document per backed-up database.
2. Select that database's document and click **Restore** to open a **Restore Job** document.
3. Choose a backup: **Selected backup is the only required field**; the Restore time / point-in-time options can pick the matching backup and transaction logs for you.
4. **A blank restore path = restore in place.** An easy trap: **restoring outside the data directory reassigns the DBIID and invalidates the earlier transaction logs** — so HCL advises keeping restores inside the data directory (same principle [the transaction logging piece](/domino-news/en/posts/domino-transaction-logging/) gives for "anything that changes the DBIID needs a fresh backup").
5. Optionally restore deleted documents/folders back into the original database. Also note the restore dialog's **Disable replication** option is **on by default** — so the restored copy has **replication disabled by default**; clear it if you want the copy to replicate.
6. Click **Submit Restore**, then Run Restore Server Cmd or `load restore` at the console; watch progress under **Restore Jobs** in the Backup database.

If you use a **third-party restore** tool, the Global Configuration has a **Restore 3rd party** option; in that case the backup inventory isn't stored in `dominobackup.nsf`.

## Wrap-up

- **What it is**: backup and restore **built in from Domino 12** — the `dominobackup.nsf` config database plus the Backup/Restore server tasks, to schedule backups and restore a single database on demand.
- **Prerequisite**: **transaction logging on first** (officially required); point-in-time recovery relies on the log.
- **How to configure**: Configuration view → platform default document → New Config → fill the Main/Backup/Snapshot/Restore/Prune/Notification tabs (preview paths with Test Formula).
- **How to run**: `load backup` or a Program document; `-b` daily, plus `-t`/`-i` on shorter intervals in an archived setup for logs and increments, `-s` snapshot, `-p` prune.
- **How to restore**: Database Inventory → Restore Job → pick Selected backup → Submit → `load restore`.
- **One trap**: a blank path restores in place; **restoring outside the data directory reassigns the DBIID and invalidates the old logs** — keep it inside the data directory.
