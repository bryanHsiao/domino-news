---
title: "Domino Server Troubleshooting: Before You Restart the Whole Server, Run These Console Commands"
description: "Something's off with the server — a feature stopped working, a task looks stuck, memory or disk is tight. The reflex is to restart the whole server, but that's blunt and wipes the scene. This piece organizes the most useful Domino console commands by the problem you're facing: show tasks to see what's running/stuck, show server for overall health, tell <task> to restart just the one task that's misbehaving (e.g. tell http restart, not the whole box), and dbcache show/flush/disable for the database cache. Look first, then decide what to touch."
pubDate: 2026-09-17T07:30:00+08:00
lang: en
slug: domino-console-troubleshooting
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Show Tasks command — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_showtasks_r.html"
  - title: "Tell command — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admn_tell_r.html"
  - title: "Dbcache Show command — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admn_dbcacheshow_r.html"
  - title: "Using a console to send commands to a server — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html"
relatedJava: []
relatedSsjs: []
---

Something's off with the server — a feature suddenly stopped working, a task looks stuck, memory or disk is tight. The first instinct is often "let's just restart the whole thing." But a full restart is blunt: it kicks off every connection, wipes the scene, and nine times out of ten you actually only needed to deal with **one task**. Before you touch anything, run a few console commands to **see clearly what's going on** — here are the most useful ones, organized by the problem you're facing.

(How to send commands: type them at the server's live console; or use the remote console in Domino Administrator; or `domino console`. The [docs](https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html) cover the ways to connect. Commands are case-insensitive and most abbreviate — `sh ta` = `show tasks`.)

## TL;DR

- **See what's running / what's stuck** → `show tasks`
- **Overall server health** (sessions, availability, pending mail) → `show server`
- **Deal with only the misbehaving task** (not the whole box) → `tell <task> …`, e.g. `tell http restart`
- **Database-cache problems / need exclusive access to a .nsf** → `dbcache show` / `dbcache flush` / `dbcache disable`
- The rule: **look first, act second** — restart one task, not the whole server, whenever you can.

## See what's running: `show tasks`

Almost every troubleshooting session starts here. The [docs](https://help.hcl-software.com/domino/12.0.0/admin/admn_showtasks_r.html): `Show Tasks` displays "the server name, the Domino program directory path, and the status of the active server tasks," and "**Idle tasks are indicated**."

So at a glance you see whether HTTP, Router, Indexer, Agent Manager and the rest are present, what each is busy with, or idle. When **a task is stuck**, it often sits frozen in some odd state; when a feature is down, first check whether its task even came up (web down? look for `HTTP Server` first) — just scan the `show tasks` output for the task you care about and read its status.

## Overall health: `show server`

`show server` gives you the server's vitals: the availability index, current session count, transactions per minute, pending mail, queued work. To judge "is the whole box slammed" (high load, availability dropping, sessions spiking), this beats a restart by a mile. Pair it with `show stat` (or `show stat <name>`) for finer numbers.

## Restart only the task that's broken: `tell`

This is the key to "don't restart the whole server." [`tell`](https://help.hcl-software.com/domino/10.0.1/admn_tell_r.html) "issue[s] a command to a server program or task" — it targets **one task**. Some are common (`tell <task> quit` stops a task); others are specific to a particular task.

The most useful ones:

- **Restart just HTTP**: `tell http restart` (or `tell http quit` then `load http`). When the web breaks, what you cycle is the HTTP task, not the whole server — everything non-web keeps running. (We described the nightly "cycle HTTP up and down" band-aid in [the xspupload-upload-failure piece](/domino-news/en/posts/domino-xspupload-upload-fail) — this is what it uses.)
- **Stop / restart a task**: `tell <task> quit` to stop, then `load <task>` to bring it back.
- **Task-specific commands**: e.g. `tell http show ...`, `tell amgr ...`, `tell router ...` — each task has its own set.

`load <task>` starts a task; `tell <task> quit` stops it — together they're how you individually recycle one service **without touching the whole box**.

## The database cache: `dbcache show` / `flush` / `disable`

Sometimes the problem is the **database cache** — a .nsf is held open by the server, and your backup / copy / compact stalls. The [docs](https://help.hcl-software.com/domino/10.0.1/admn_dbcacheshow_r.html):

- **`dbcache show`**: displays "the names of the databases currently in the cache" — the list of databases cached (held open) right now. To learn whether a database is still held by the server, start here.
- **`dbcache flush`**: closes and releases the databases currently open in the cache, freeing them from memory. Flush before an operation that needs exclusive access to a .nsf.
- **`dbcache disable`**: temporarily turns the cache off, for when you need exclusive access to a file and don't want to fight a cached instance.

## Other "just look" commands

- `show diskspace` for disk space (first thing to check when disk is tight).
- `show users` for currently connected users.
- `show stat <name>` for specific statistics (e.g. `show stat Database.*`, `show stat Mem.*`).

## Wrap-up

When the server acts up, don't jump to restarting the whole box — it's blunt and it wipes the scene. First `show tasks` to see who's running and who's stuck, `show server` for overall health, and once you've pinned down which task it is, `tell <task> restart` / `tell <task> quit` + `load <task>` to touch **just that one**. Database held open? `dbcache show` / `flush`. Make "look first, then act precisely" the reflex — it beats reflexive full restarts, and steps on fewer landmines.
