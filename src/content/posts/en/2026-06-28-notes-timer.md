---
title: "NotesTimer: Firing an Event Every Few Seconds in the Notes Client"
description: "Want to do something every few seconds on an open Notes client screen — auto-refresh a view, poll for new documents, update a status display? NotesTimer is exactly that: give it an interval in seconds at creation and it fires an Alarm event periodically. This article covers creating it, the Interval / Enabled / Comment properties, binding a handler with On Event, and the four limitations you must know: UI-only (not agents), declare it globally, the handler must finish within the interval, and it's enabled by default."
pubDate: 2026-06-28T07:30:00+08:00
lang: en
slug: notes-timer
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesTimer class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTIMER_CLASS.html"
  - title: "NotesTimer class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESTIMER_CLASS.html"
  - title: "NotesUIWorkspace class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-timer.webp"
coverStyle: "pencil-sketch"
---

You want to do something every few seconds on an open Notes client screen: refresh a view, check whether new documents have arrived, update a "last synced at" display. LotusScript has no crude `Sleep` loop for this (it would freeze the UI), but it does have a class built for exactly this — [`NotesTimer`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESTIMER_CLASS.html).

The official definition: "Represents a mechanism for triggering an event every fixed number of seconds." You give it a number of seconds at creation, and it periodically fires an **Alarm event**; you write what to do in the event-handler sub. Simple — but with a few limitations that bite if you don't know them.

---

## TL;DR

- Create with `New NotesTimer(interval [, comment])` — `interval` is the trigger interval in seconds.
- **Properties** (read-write): `Interval` (interval in seconds), `Enabled` (whether active — **a new object is enabled by default**), `Comment`.
- Bind the event to a handler sub with **`On Event Alarm From timer Call yourSub`**; the sub takes a `NotesTimer` argument.
- **Four limitations to know**:
  - **UI-only, not agents**: the docs say plainly it's "intended for use in Notes UI objects and not agents."
  - **Declare it globally**: put it in a routine like `PostOpen` and the object is destroyed when the routine exits, taking the timer with it.
  - **The handler must finish within the interval**, or things pile up and break.
  - **Not supported in COM.**

## Creating it and binding the event

The key is *where* you declare it. The timer variable must be declared **globally** (module level), not inside a routine that ends — otherwise it's reclaimed the moment the routine exits:

```lotusscript
' global declaration (in Declarations, not inside a Sub)
Dim timer As NotesTimer

Sub Postopen(Source As Notesuidocument)
    Set timer = New NotesTimer(5, "auto-refresh")   ' every 5 seconds
    On Event Alarm From timer Call OnTick
End Sub

Sub OnTick(Source As NotesTimer)
    ' what to do every 5 seconds — must finish within 5 seconds
    Dim ws As New NotesUIWorkspace
    Call ws.ViewRefresh()      ' e.g. refresh the current view
End Sub
```

`On Event Alarm From timer Call OnTick` wires the timer's Alarm event to the `OnTick` sub; the sub's first argument receives the triggering `NotesTimer` object. (This is adapted from the [official NotesTimer example](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESTIMER_CLASS.html); the [`NotesUIWorkspace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html) in the handler is the current workspace covered earlier on the site.)

## Control: Enabled and Interval

- **`Enabled`** — a read-write `Boolean`. To pause, `timer.Enabled = False`; to resume, `= True`. Note the docs' warning: **a newly created NotesTimer is enabled by default** — it starts counting the instant you `New` it; you don't have to switch it on.
- **`Interval`** — read-write; you can change the interval mid-flight.
- **`Comment`** — just a note.

To "set it up now, start it later," set `timer.Enabled = False` right after creating it, then enable it when needed.

## The four limitations in detail

**1. UI-only, not agents.** Verbatim: "NotesTimer is intended for use in Notes UI objects and not agents." This is the same thread as the site's [UI classes](/domino-news/posts/notes-ui-workspace-document/) and [NotesAgent](/domino-news/posts/notes-agent/) pieces — the timer depends on a live UI event loop, and a background agent has no such loop. To do something periodic server-side, use a scheduled agent, not NotesTimer.

**2. Declare it globally.** The docs: "If you declare it in a routine such as PostOpen... it is destroyed when the routine exits." This is the most common trap — `Dim timer As NotesTimer` then New inside PostOpen, and the moment PostOpen ends the timer is gone and never fires. The variable declaration belongs in Declarations.

**3. The handler must finish within the interval.** The docs: the handler must complete "in a time period less than the NotesTimer object's interval." Set 5 seconds but the handler takes 8, and you have a problem. Make the interval longer than the handler's worst case, or set `Enabled = False` at the start of the handler and `= True` when it's done.

**4. Not supported in COM.** A pure Notes client LotusScript construct.

## What about Java and SSJS?

As with the earlier UI classes and composite apps, the cross-language verdict is **no counterpart**:

| Language | Counterpart | Why |
|---|---|---|
| Java (`lotus.domino.*`) | None | the back-end Java API has no UI-event-loop-bound timer like this |
| SSJS / XPages | None | for periodic work on the web you reach for the browser's `setInterval` / XPages partial-refresh polling — a completely different mechanism |

`NotesTimer` is one of the few classes that belongs **only to the Notes client UI** — its premise is a live desktop UI with an event loop. Without that premise (server, web), it doesn't exist, and you want the mechanism native to each context (a scheduled agent, `setInterval`).
