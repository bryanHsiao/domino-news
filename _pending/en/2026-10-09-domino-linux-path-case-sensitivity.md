---
title: "Domino on Linux: the Case-Sensitivity Trap, and Why the Path Cache Hides It"
description: "After moving Domino from Windows to Linux, a URL with the wrong case (the folder on disk is /FFH/ but you request /ffh/) sometimes 404s with 'File does not exist' and sometimes works — the same URL, flaky, and it always works by the time you go to check, so everyone assumes it's fine. The truth: Linux's filesystem is case-sensitive, and the Domino HTTP task caches successful path lookups, so the 404 only shows up when the cache is cold AND the very first hit uses the wrong case. This piece uses three rounds of curl tests on a real R12 (12.0.2 FP8) Linux server to reproduce the trap cleanly, explains why it stays hidden, and measures the symlink and directory-link workarounds."
pubDate: 2026-10-09T07:30:00+08:00
lang: en
slug: domino-linux-path-case-sensitivity
tags:
  - "Domino Server"
  - "Admin"
  - "Tutorial"
sources:
  - title: "Creating, updating, and deleting directory and database links (.dir / .nsf link files) — HCL Domino (official)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_creatingupdatinganddeletingdirectoryanddatabasel_t.html"
  - title: "Case sensitivity of Domino database paths on UNIX/Linux (the risk of names differing only by case) — Data Protection for HCL Domino (official product docs)"
    url: "https://www.ibm.com/support/pages/known-issues-and-limitations-version-81x-data-protection-hcl-domino"
  - title: "URL commands for opening servers, databases, and views (server / appFileAndPath / name are all case insensitive) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html"
relatedJava: []
relatedSsjs: []
---

You move a Domino application from Windows to Linux. A URL that was fine on Windows — say `/ffh/doc.nsf/...`, where the folder on disk is actually `FFH` (uppercase) — starts acting up: sometimes it returns `File does not exist` (HTTP 404), sometimes it works.

You try to catch the bug, but every time you go to open it, it's fine. So it gets filed under "intermittent, can't reproduce, probably nothing" and left alone.

It isn't intermittent. It's **guaranteed, just hidden**: Linux's filesystem is case-sensitive, so `/ffh/` doesn't match the physical `/FFH/`; but the Domino HTTP task caches path lookups it has resolved, so once anyone opens it with the **correct** case, the wrong case works too afterward. That's why you only see the 404 in the one moment when **the cache is cold and the very first hit uses the wrong case** — the rest of the time, with a warm cache, it tests clean. This piece reproduces it on a real, running R12 (Domino 12.0.2 FP8, on Linux / WSL2).

---

## TL;DR

- **Root cause**: Linux's filesystem is case-sensitive (Windows isn't). Domino maps the `/FFH/doc.nsf` part of a URL to the physical folder and `.nsf` file on disk; a case mismatch means the OS says "no such file" → `File does not exist` / 404.
- **Why it's flaky**: behaviorally the Domino HTTP task **remembers resolved paths** (call it a path cache — the internal mechanism isn't documented, but that's the measured behavior). Once someone opens it with the right case (`/FFH/`) it's warm, and the wrong case (`/ffh/`) rides on it afterward. So the 404 only appears when **the cache is cold and the first hit uses the wrong case** — and because that state is server-side, one correct-case hit fixes it for everyone.
- **Don't conflate two kinds of case-sensitivity**: this cache trap is only at the **OS file layer** (folder name + `.nsf` filename, Linux only, recovers once the cache is warm). Design elements **inside** the NSF (`.xsp` / view / form names) are a different matter — they're **always** case-sensitive on both Windows and Linux, unrelated to the cache, with no workaround; get the case wrong and it fails. The two even throw different 404 messages, which you can use to tell them apart (below).
- **Reproducing it**: you can't with a warm cache. To reproduce cleanly, `dbcache flush` + `restart task http` to clear the cache, probe readiness with a **neutral URL** (not the target path, which would warm the cache), then grab the very first hit with the wrong case.
- **Workarounds** (both measured): an OS symlink or a Domino directory link mapping the lowercase name to the physical uppercase path. **The real fix**: make every URL in the application use the exact on-disk case.

## The symptom: the same wrong-case URL, works sometimes, 404s others

Make the scenario concrete. On disk:

```
/local/notesdata/FFH/doc.nsf      ← folder FFH uppercase, file doc.nsf lowercase
```

Users (or old Windows-era links) request the lowercase path `/ffh/doc.nsf/...`. On Windows that's fine, because Windows filenames aren't case-sensitive; move to Linux and `ffh` and `FFH` are two different names.

But when you go to test it, it's often fine — and that's the maddening part: it's **not "always broken," it's "sometimes broken."** The moment you open it by hand (probably typing the correct case, or someone opened it before you), the cache is warm and everything looks healthy. So the problem gets underestimated and left — until one day a freshly restarted server plus a user whose first hit happens to be lowercase produces a 404.

## Why: Linux case-sensitivity × the HTTP task's path cache

Two things stacked on top of each other:

**First, Linux's filesystem is case-sensitive — and Domino's URL model assumes it isn't.** Here's the twist: Domino's URL commands were designed to be **case-insensitive** about the path — the [official reference](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html) states that `server`, `appFileAndPath` (the database path), and `name` are all case insensitive, and on Windows they are. But that promise only holds down to Domino's own layer — what actually opens the file on disk is the Linux filesystem underneath, and **it is case-sensitive**. So when `/FFH/doc.nsf` doesn't match the physical name, the OS reports no such file and Domino returns `File does not exist`. That's the root of the trap: **the case-insensitivity Domino promises breaks at the Linux OS layer.** HCL has flagged this in the UNIX/Linux context too: database names in the data directory that **differ only by case** cause problems (the [Data Protection for Domino known limitations](https://www.ibm.com/support/pages/known-issues-and-limitations-version-81x-data-protection-hcl-domino) warn specifically about case-only path differences).

**Second, behaviorally, a resolved path gets remembered by the HTTP task.** This is the real reason for "works sometimes, 404s others." Once someone opens the correct case `/FFH/` and it resolves, a later request — even the wrong `/ffh/` — rides on that already-warm state and is let through. (Whether it internally caches the resolution or just holds the database open isn't documented by HCL; the measured behavior is as described, and I'll use "path cache" as shorthand.) So the wrong case **isn't stably broken**, it's "broken when the cache is cold, fine once it's warm."

That's also why the trap is so hard to catch: to test it, if your hand slips and opens the correct case first, or the server was already warmed by someone else, you can't reproduce it anymore.

And this state lives on the **server**, not in the user's browser — the whole thing reproduces from the server's own shell with `curl`, no browser at all, and warms the same way. That amplifies the hiddenness: **after a server restart, the first request to touch that path decides the state.** That first requester is usually an admin, or just someone who types the correct case, so it warms and from then on **every user, every client** works even with the wrong case. Only the unlucky one whose first hit after a restart happens to use the wrong case gets the 404 — and the moment anyone hits it with the right case, they're fine too. So the whole thing looks like an "intermittent, just retry" glitch, which is exactly what makes it so hard to pin down.

## Reproducing it (real R12, 12.0.2 FP8)

I tested on a real, running Linux Domino (12.0.2 FP8, WSL2), physical path `/local/notesdata/FFH/doc.nsf`, all with `curl` reading the HTTP code. Across three rounds the first two "couldn't reproduce it" — and the process itself is the point.

**Round 1: test with a warm cache (can't reproduce)**

```
/ffh/...  → 200
/FFH/...  → 200
```

The box had been accessed before, so the path cache is warm and both cases work. This is the state most people test in, and conclude "no problem."

**Round 2: `dbcache flush`, then test (still can't reproduce)**

```
first hit /ffh/ → still 200
```

Useful conclusion: **`dbcache flush` alone isn't enough.** That path-resolution cache doesn't live in dbcache (doc.nsf may still be open, and the HTTP task's cache isn't cleared either).

**Round 3: `dbcache flush` + `restart task http` + grab the first hit (clean reproduction ✅)**

```
1. dbcache flush
2. restart task http
3. probe with a neutral URL /homepage.nsf, three consecutive 200s to confirm HTTP is really ready
   (key: do NOT probe with /FFH/ or /ffh/, or you warm the cache first)
4. [first hit] /ffh/ (lowercase)  → HTTP 404   ← File does not exist, reproduced!
5.            /FFH/ (correct case) → HTTP 200   ← warms the cache
6. again      /ffh/ (lowercase)   → HTTP 200    ← cache warm, wrong case works too
```

Two methodology points:

- **What you need to clear is the HTTP task's cache, not dbcache.** `restart task http` makes it cold; `dbcache flush` alone can't.
- **Probe readiness with a neutral URL.** You have to confirm HTTP is up before the first hit, but if the probe uses the target path (`/FFH/`) it warms the cache and ruins the shot. Use an unrelated `/homepage.nsf` so you don't pollute the target path's cache.

## In one URL, which segments are case-sensitive?

Take `/FFH/doc.nsf/HomePage.xsp` apart and the different segments actually follow different case rules — don't lump them together:

- **Folder + `.nsf` filename (`/FFH/doc.nsf`) → the OS-layer trap, this article's subject.** This segment is a physical file on disk, case-sensitive on Linux. It has a time dimension: cold-cache first hit 404s, warms up and recovers, and a symlink / `.dir` fixes it. Both the folder (`FFH`/`ffh`) and the `.nsf` filename (`doc.nsf`/`Doc.nsf`) were measured and behave identically.
- **Classic view / form names (`?OpenView` / `?OpenForm`) → case-INsensitive.** HCL's URL-commands reference is explicit that `name` is case insensitive, so a classic `?OpenView=SalesList` with the wrong case still opens — this segment is **not** a trap.
- **The XPages `.xsp` page name (`HomePage.xsp`) → case-SENSITIVE.** This is the one that's measured and behaves unlike the other two: `.xsp` goes through the XPages runtime's own page lookup, which is **case-sensitive, the same on Windows and Linux, independent of the OS filesystem and the path cache, with no workaround** — you just have to type it right.

The `.xsp` case, measured (logged-in session, same correct path `/FFH/doc.nsf`, only the `.xsp` page name changed):

```
/FFH/doc.nsf/HomePage.xsp  (page name exact)      → opens normally
/FFH/doc.nsf/homepage.xsp  (page name lowercase)  → 404
/FFH/doc.nsf/HOMEPAGE.xsp  (page name all caps)   → 404
```

**A genuinely useful tell**: an OS-layer case failure and an `.xsp`-page-name case failure throw **different** 404 messages, which you can read backwards to know which layer you're in —

- **OS file layer** (wrong case in the `/ffh` path) → `HTTP Web Server: ... File does not exist` (an English string Domino prints in any locale)
- **XPages `.xsp` layer** (wrong case in the `.xsp` page name) → a different message — an "item not found"-type error (the tested zh-locale server showed 「找不到項目異常」), not "File does not exist".

See `File does not exist` and check the path (folder / `.nsf`) case, remembering it has the cache time-dimension (may only surface on a cold-cache first hit, and a symlink / `.dir` fixes it); see the "item not found" error instead and check the `.xsp` page-name case — that one has nothing to do with the OS or the cache, it's just a wrong name, the same on any platform. The point is that the two messages differ, so the message itself tells you which layer to look at.

## Workarounds: symlink, Domino directory link, and the real fix

**Stop-gap 1: an OS symlink.** Create a lowercase symlink in the data dir pointing at the physical uppercase folder:

```
ln -s /local/notesdata/FFH /local/notesdata/ffh   # owner must be notes
```

Measured to work: with the symlink in place, running "`dbcache flush` + `restart task http` + grab the first `/ffh/` hit" gives **HTTP 200 on the first hit** (versus 404 without the symlink). At the OS layer Linux follows the lowercase `ffh` to the physical `FFH`, Domino follows the symlink to open the `.nsf`, and even the cold first hit works. One confirmation that it's the *path* layer being resolved: without the symlink the cold first hit is stuck at the path layer with a `File does not exist` body; with the symlink the cold first hit is 200 and the body is the Login page (`curl` carries no session, so it's handed on to the auth layer) — the request got past the OS path layer and moved on.
Note: a symlink **only resolves one level** — you linked `ffh`, but any other level with a case mismatch (e.g. `Doc.nsf`) needs its own; and symlinks in the data dir can have side effects on `compact` / `fixup` / replication, so test before production.

**Stop-gap 2: a native Domino directory link.** If you'd rather not touch OS symlinks, use Domino's own link files: a directory link is a text file with a `.dir` extension, a database link a text file with an `.nsf` extension, containing the full path to the physical target ([official docs](https://help.hcl-software.com/domino/14.0.0/admin/admn_creatingupdatinganddeletingdirectoryanddatabasel_t.html)). It's a Domino-layer redirect, cross-platform, and doesn't depend on OS symlinks. Measured to work the same: a `ffh.dir` whose single line is the physical path `/local/notesdata/FFH` turns the same cold-cache first `/ffh/` hit into **HTTP 200**. One measured surprise: `.dir` links are usually thought of as pointing to directories *outside* the data dir, but here `FFH` is *inside* the data dir and the `.dir` pointing at an internal subdirectory worked just as well. (HCL notes that on UNIX a `.dir` must point to a subdirectory — `/sales` is fine, `/` isn't — and that access is still controlled by the database ACL, not the link file.)

Both stop-gaps side by side (all measured — clean cold-cache first hit of lowercase `/ffh/`):

| Approach | Cold-cache first hit `/ffh/` |
|---|---|
| No workaround | **404** |
| OS symlink (`ln -s FFH ffh`) | 200 |
| Domino `.dir` link (`ffh.dir` containing `/local/notesdata/FFH`) | 200 |

**The real fix: consistent exact case in the application.** Both of the above are detours. What you actually want is to align every URL, link, and `@DbName` / `Open` path in the application with the exact on-disk case. A symlink / directory link keeps you from blowing up and buys time; it isn't a long-term answer — every mapping layer is one more exception to remember at maintenance, migration, and backup time. (For what it's worth, a grep of this box's `notes.ini` for `case` / `path cache` / `nocase` / `lowercase` and the like found nothing — as far as I can tell there's **no `notes.ini` switch** to make path lookups case-insensitive, so it's the mappings above or the real fix.)

## Wrap-up

The Domino-on-Linux case-sensitivity trap isn't hard because "Linux is case-sensitive" — it's hard because **the path cache hides it**: the wrong case only 404s when the cache is cold and the first hit is wrong, and the rest of the time, warm, it tests clean, so it gets written off as intermittent. To reproduce, `dbcache flush` + `restart task http` to clear the HTTP task's cache, probe readiness with a neutral URL, then grab the first hit with the wrong case. Stop-gap with an OS symlink or a Domino directory link; the real fix is always aligning the application's URL case with the disk. And keep the case rules in one URL apart: the cache-timed trap is only at the OS file layer (folder + `.nsf`); classic view / form names are case-INsensitive; only the XPages `.xsp` page name is a separate, platform-constant case-sensitivity — and the OS layer and the `.xsp` layer throw different 404 messages, which is exactly how you tell them apart. It's the classic Windows→Linux migration gotcha — Windows's case-insensitivity lets you be sloppy in development, and Linux is where it surfaces.
