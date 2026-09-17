---
title: "Domino Server Troubleshooting: Before You Restart the Whole Server, Run These Console Commands"
description: "Something's off with the server — a feature stopped working, a task looks stuck, memory or disk is tight. The reflex is to restart the whole server, but that's blunt and wipes the scene. This piece organizes the most useful Domino console commands by the problem you're facing: show tasks to see what's running/stuck, show server for overall health, restart task <task> to restart just the one misbehaving task (e.g. restart task http, not the whole box), tell http show thread state to find a stuck thread, and dbcache show/flush/disable for the database cache. Look first, then decide what to touch."
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
  - title: "Restart Task command — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_restarttask_r.html"
  - title: "Restart Server command — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_restartserver_r.html"
  - title: "Web Server Tell commands — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/admn_webservertellcommands_r.html"
  - title: "Dbcache Show command — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/10.0.1/admn_dbcacheshow_r.html"
  - title: "Using a console to send commands to a server — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-console-troubleshooting.webp"
coverStyle: "photoreal-3d"
---

Something's off with the server — a feature suddenly stopped working, a task looks stuck, memory or disk is tight. The first instinct is often "let's just restart the whole thing." But a full restart is blunt: it kicks off every connection, wipes the scene, and nine times out of ten you actually only needed to deal with **one task**. Before you touch anything, run a few console commands to **see clearly what's going on** — here are the most useful ones, organized by the problem you're facing.

(How to send commands: type them at the server's live console; or use the remote console in Domino Administrator; or `domino console`. The [docs](https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html) cover the ways to connect. Commands are case-insensitive and most abbreviate — `sh ta` = `show tasks`.)

## TL;DR

- **See what's running / what's stuck** → `show tasks`
- **Overall server health** (sessions, availability, pending mail) → `show server`
- **Restart only the misbehaving task** (not the whole box) → `restart task <task>` (e.g. `restart task http`); cycle every task with `restart server` (`res ser`)
- **Find which thread is stuck** (slow/stuck web) → `tell http show thread state`; every thread's call stack → NSD
- **Database-cache problems / need exclusive access to a .nsf** → `dbcache show` / `dbcache flush` / `dbcache disable`
- The rule: **look first, act second** — restart one task, not the whole server, whenever you can.

## See what's running: `show tasks`

Almost every troubleshooting session starts here. The [docs](https://help.hcl-software.com/domino/12.0.0/admin/admn_showtasks_r.html): `Show Tasks` displays "the server name, the Domino program directory path, and the status of the active server tasks," and "**Idle tasks are indicated**."

So at a glance you see whether HTTP, Router, Indexer, Agent Manager and the rest are present, what each is busy with, or idle. When **a task is stuck**, it often sits frozen in some odd state; when a feature is down, first check whether its task even came up (web down? look for `HTTP Server` first) — just scan the `show tasks` output for the task you care about and read its status.

## Overall health: `show server`

`show server` gives you the server's vitals: the availability index, current session count, transactions per minute, pending mail, queued work. To judge "is the whole box slammed" (high load, availability dropping, sessions spiking), this beats a restart by a mile. Pair it with `show stat` (or `show stat <name>`) for finer numbers.

## Restart one task, not the whole server

This is the key to "don't restart the whole server." [`tell`](https://help.hcl-software.com/domino/10.0.1/admn_tell_r.html) "issue[s] a command to a server program or task" — it targets **one task** (`tell <task> quit` stops it; each task also has its own set, like `tell router ...`, `tell amgr ...`). To "stop and start" a task there are three ways, and the difference is worth knowing:

- **`tell <task> quit` + `load <task>` (two manual steps)**: `tell http quit` to stop, then `load http` to bring it back. It works, but it's **two separate commands** — type `load http` too soon, before the task has fully unloaded, and it can fail or come up dirty (a race).
- **`restart task <task>` (recommended — e.g. `restart task http`, short `res task http`)**: one command. The [docs](https://help.hcl-software.com/domino/11.0.1/admin/admn_restarttask_r.html): it "shuts down and then restarts a specified server task" — it **handles the "wait until it's fully down, then start" sequencing for you**, so it's safer than the manual two-step and can't race. That's exactly why many senior consultants say "use `restart task http`": a single atomic operation, one fewer way to trip.
- **`restart server` (`res ser`, restart every task on the box)**: the [docs](https://help.hcl-software.com/domino/11.0.1/admin/admn_restartserver_r.html): it "stops the Domino server and then restarts it after a brief delay." Note it restarts **all of Domino's server tasks** and brings them back automatically — it is **not an OS reboot** — which makes it far handier than quitting each task by hand when you really do want the whole box cycled.

**A point many people get wrong: `tell http restart` is not "restart the HTTP task" — it's "reload settings."** The [official Web Server Tell commands](https://help.hcl-software.com/domino/14.5.0/admin/admn_webservertellcommands_r.html) are clear: `tell http restart` "Refreshes the Web server with changes made to settings in the: Server document…; NOTES.INI file that affects the HTTP server task; …" — it's for **applying new config** after editing the Server document / notes.ini (there's an even lighter `tell http refresh`). So: **apply a settings change** → `tell http restart` / `refresh`; **actually stop and restart the HTTP task** (like the nightly "cycle HTTP" from [the xspupload piece](/domino-news/en/posts/domino-xspupload-upload-fail)) → `restart task http`, or `tell http quit` + `load http`.

## Finding "which thread is stuck"

`show tasks` shows **tasks**, not threads. When a service (the web especially) slows down or seems stuck and you want to know **which thread, stuck on what**, there are two levels:

- **`tell http show thread state`**: lists each HTTP worker thread's state and which URL it's currently processing. **A thread stuck on the same request for minutes is usually a hung one** — this is the first thing to check for a slow/stuck web server, and it often points straight at the code or external dependency that's hanging.
- **NSD (Notes System Diagnostic)**: to see **every thread's call stack** across the whole server (where in the code each thread is) plus memory state, use NSD — the last-resort diagnostic for a hung/crashing server, producing a report for deeper analysis (heavier, usually reserved for a genuine hang or an escalation to support).

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

When the server acts up, don't jump to restarting the whole box — it's blunt and it wipes the scene. First `show tasks` to see who's running and who's stuck, `show server` for overall health; once you've pinned down which task, `restart task <task>` (one atomic command, no race) to touch **just that one**, and only `restart server` when you truly want the whole box cycled. Web stuck? `tell http show thread state` to see which thread is stuck on which URL, and NSD if needed. Database held open? `dbcache show` / `flush`. Make "look first, then act precisely" the reflex — it beats reflexive full restarts, and steps on fewer landmines.
