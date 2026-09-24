---
title: "Field Notes from panagenda's MakeNotesFaster Webinar: Slow Notes Is Usually Configuration, Not Old Laptops"
description: "In panagenda's MakeNotesFaster webinar, Christoph Adler breaks HCL Notes 14.5.1 FP1 client performance on Windows down to two decisions: run the right version, configure it right. Here are the points most useful to admins — one brutal real-world customer number, why ODS quietly steals startup time on every open, whether you should delete cache.ndk regularly (he debunks the myth outright), keeping the data directory off network shares, the three traps in an antivirus exclusion set, and the Monday-morning checklist he closes with."
pubDate: 2026-09-26T07:30:00+08:00
lang: en
slug: panagenda-makenotesfaster-webinar
tags:
  - "Performance"
  - "Admin"
  - "Community"
sources:
  - title: "MakeNotesFaster webinar (panagenda, on-demand)"
    url: "https://www.panagenda.com/webinars/makenotesfaster1/"
  - title: "MakeNotesFaster slides PDF (panagenda, 2026-09-15)"
    url: "https://www.panagenda.com/download/webinar/20260915_EN_HCL_Webinar_Slides_MakeNotesFaster.pdf"
  - title: "What's new in Domino 14.5.1 Fixpack 1 — HCL (official)"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html"
relatedJava: []
relatedSsjs: []
---

panagenda posted a webinar worth watching: [MakeNotesFaster](https://www.panagenda.com/webinars/makenotesfaster1/), presented by Head of Solution Consulting **Christoph Adler** (with Senior Solution Architect Marc Thomas), on HCL Notes 14.5.1 FP1 client performance on Windows. The framing is blunt: "Notes is slow" is rarely an unavoidable Notes problem — it usually comes down to two decisions, **which version you run and how you configure it**. Scope is the Notes Standard client's local configuration (not Domino server tuning, Nomad, macOS, or app design). Here are the points most useful to administrators.

## TL;DR

- **Slow is a configuration problem, not old laptops**: he brought real customer numbers showing bad config makes Notes crawl even on current hardware.
- **ODS[^ods] is the invisible startup killer**: too-old a database file structure and the client converts it upward in memory on *every* open — a `names.nsf` left at an old ODS alone can cost 60 seconds of startup.
- **Stop deleting cache.ndk on a schedule**: he lists "delete cache.ndk regularly" as a Myth outright; the fix is the quota, not deletion.
- **Never put the data directory on a network share** (including folder redirection, roaming profiles, OneDrive sync) — he flags this as the "fix it before anything else" item.
- **Antivirus exclusions aren't turning protection off**: they're a narrow, auditable scope — plus three traps that make an exclusion *look* set but do nothing.
- It closes with an actionable **"Monday morning checklist."**

## First, the cost: slow is config, not old laptops

Adler opened with a customer case measured the week before: **16,000 users, professional services, current hardware, no antivirus exclusions configured**, upgraded from 9.0.1 to 14.0 FP5 with no real performance work. The result:

| Action | Measured | Healthy |
|---|---|---|
| Cold start | **2+ minutes** | < 10 seconds |
| Warm start | **35–40 seconds** | up to 5 seconds |
| Client upgrade | **22 minutes** | 4–8 minutes |

These are numbers from **current hardware** — "bad configuration, not old laptops." Put in business terms: 30 seconds twice a day across 1,000 users is **17 hours of waiting per working day**. Client performance is a user-experience metric; user experience is a business metric.

## ODS: stealing time on every open

This was the most worth-recording stretch. **ODS (On Disk Structure)** is the physical structure of the database file itself — the container, not the content. Every Notes/Domino release has an ODS it works with natively, and the client **cannot natively open an older ODS**: it converts the file upward in memory, one level at a time, until it reaches the ODS it works with natively, and only then opens it. The catch — **that work happens on every open, not once**.

The concrete cost: a `names.nsf` left at an old ODS (say ODS 20) on a 14.5.1 FP1 client is **at least 60 seconds** of startup for that one file alone, and `names.nsf` is read at every single client start.

The good news is that **since 12.0.2, upgrading the Notes client auto-upgrades the local databases in its data directory to the latest ODS (55)** and supersedes the old notes.ini settings that used to control this (servers never auto-upgrade; behavior is unchanged in 14, 14.5, and 14.5.1). One distinction worth drawing: that's the client upgrading *existing* local databases; the *default create ODS for new databases* is a separate matter — per HCL's table it's still ODS 52, and `Create_R12_Databases=1` is what creates new databases at 55 (the site's [ODS versions piece](/domino-news/en/posts/domino-ods-versions) breaks this down in full). You pay a one-time cost: a copy-style compact plus a full view rebuild at first open, roughly twice the largest local NSF in free disk, and **the first start after the upgrade is the slowest one the user will see — warn them**.

So the old ODS parameters in notes.ini deserve a cleanup (he gave a verdict table):

- `CREATE_R8/R85/R9/R10_DATABASES` → **remove** (each pins new and compacted databases below 55)
- `NSF_UpdateODS=1` / `NSF_AlwaysUpdateODS=1` → **remove** (superseded by the automatic upgrade, or already the default since 12.0.2)
- `NSF_AlwaysUpdateODS=0` → **remove** (it blocks the automatic upgrade — keep only as a deliberate, temporary decision)
- `CREATE_R12_DATABASES=1` → keep (it's what creates new databases at ODS 55; also keeps the config explicit and stops an older `CREATE_R*` entry from winning)

His line: remove the parameter, and remove the policy that re-pushes it. (The whole session targets [14.5.1 FP1](/domino-news/en/posts/domino-1451-fp1).)

## Off network shares, one replica per replica ID

The second big theme is the file system. **The data directory (and the program directory) belong on local, directly-attached storage** — and he named the variants people overlook: mapped drive / UNC / DFS / home drive / NAS, Windows folder redirection, roaming profiles that copy the data directory at logon, OneDrive Known Folder Move whose scope covers the data directory, and non-persistent VDI where the "local" disk is a remote volume in disguise. On a network path you get microsecond local reads turning into millisecond SMB reads thousands of times per session, corruption after network glitches, non-reproducible crashes, and logon/logoff storms.

And one more: **each replica ID must exist exactly once per data directory**. `File > Application > New Copy` creates a new replica ID, but **a Windows file copy does not** — so `mail (1).nsf`, a restore placed beside the original, and "I made a backup before we upgraded" all create two files with the same replica ID. The result is replication against the wrong file, avoidable save conflicts, and unread marks and folder membership drifting apart (for why unread marks drift, see [Notes unread marks](/domino-news/en/posts/domino-unread-marks)). **Renaming the surplus file doesn't help; the replica ID travels with it.**

## cache.ndk: stop deleting it on a schedule

This part is right up this site's alley — he **debunks the folklore** directly. First, the three files have very different deletion costs:

| File | What it holds | Cost of deleting it |
|---|---|---|
| `cache.ndk` | design elements cached from server replicas (forms, views, script libraries…) | just a cold cache |
| `desktop8.ndk` | the workspace: every database used, design-element lists, pointers | all workspace tabs and icons, and a lot more, rebuilt by hand |
| `bookmark.nsf` | bookmarks, workspace pages, personal customizations (like view column order) | bookmarks and every personal UI customization, gone |

(An aside: HCL's docs still refer to `desktop6.ndk`, but in a 14.5.1 data directory the file is `desktop8.ndk`.)

Then the three myths, judged:

- **"cache.ndk should be deleted regularly" → Myth.** It's a diagnostic step, valid once — not a maintenance task.
- **"a big cache.ndk is a problem in itself" → mostly Myth.** Size is a symptom; investigate the applications behind it.
- **"cache corruption is a common root cause" → it happens, far less often than it's blamed.**

The fix is the **quota, not deletion**: the cache is quota-limited, 30 MB by default, and a client that constantly hits the quota is thrashing (evict, re-fetch, evict, re-fetch). Find out whether anyone is hitting it, then **raise the quota, don't shrink it** (editing the ini doesn't resize an existing file — delete cache.ndk once afterwards so it's recreated under the new ceiling). Order of operations: infrastructure first (data directory on local SSD, excluded from AV/EDR, out of profile sync and OneDrive) → then the quota → then the one-time delete. To clear a single misbehaving application, open cache.ndk's `ByURL` / `ByURLCat` views and delete just the elements matching that replica ID — no need to punish the whole cache.

## Antivirus exclusions: not turning protection off

He uses Microsoft Defender as the example (the principle carries; the syntax doesn't). The scanner hits Notes especially hard because Notes reads and writes **thousands of small files** continuously, each one additionally evaluated by the AV engine — the count hurts, not the file size — and the scanner works at a low level that can lock or quarantine a file Notes is using, up to a crash.

The 14.5.1 FP1 exclusion set is **three directories plus the Notes-owned binaries** (process exclusions by full path only). He named three traps that make an exclusion *look* correct in the console but do nothing on the client:

1. **Environment variables** in the exclusion string that don't expand.
2. **Image names only**: an image name matches a same-named binary anywhere on the device; a full path binds the exclusion to the one in the write-protected program directory.
3. **A pinned build folder**: the `notes2.exe` path carries the plug-in build level and changes with every fix pack, so pinning it **lapses silently** — use the wildcard.

One more: a folder exclusion doesn't cover **reparse-point (junction)** subfolders, and profile containers and folder redirection create junctions, so add an explicit entry for each. His stance is clear: this isn't switching protection off — it's a **narrow, auditable scope with a documented reason and a review date per entry**. Scheduled scans, EDR, behavioral detection, and real-time protection against any non-Notes process all stay on.

## The close: a "Monday morning checklist"

Adler condenses the whole session into an actionable list:

1. Get the data directory off every network path, redirection, and sync scope
2. Verify AV exclusions for the three Notes paths and the Notes binaries (full paths, wildcard for `notes2.exe`)
3. Install 14.5.1 FP1, then **re-verify** the exclusions
4. Remove icons, bookmarks, and replicator entries pointing at servers that no longer exist
5. Clean the matching connection and account documents (FQDNs, not IP addresses)
6. Clean notes.ini: legacy ports, `DELEGATED_*`, the obsolete ODS parameters, and the policy that re-pushes them
7. Stop deleting cache.ndk — check `log.nsf` for the quota message first, then raise the quota
8. One local replica per replica ID, and a scheduled local compact
9. One location document, defined centrally and enforced at client start
10. Measure before and after — two stopwatch numbers close a ticket credibly

## Where to watch

The full session (with the per-topic detail and the PowerShell examples for Defender) is on-demand at [panagenda's MakeNotesFaster page](https://www.panagenda.com/webinars/makenotesfaster1/), and the [slides PDF](https://www.panagenda.com/download/webinar/20260915_EN_HCL_Webinar_Slides_MakeNotesFaster.pdf) is downloadable too. The series has a next session (the closing slide previews 2026-10-20).

[^ods]: ODS (On Disk Structure) is the physical format version of an NSF/NTF database file — how the file is organized on disk, independent of the documents inside it. Each Notes/Domino release works with a particular ODS natively; ODS 55 is the latest (maximum) version to date.
