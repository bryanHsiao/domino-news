---
title: "NotesUIScheduler: Driving the Embedded Free/Busy Grid From LotusScript"
description: "A custom room-booking or meeting form has the embedded scheduler control — the busy-time grid where you add attendees and see everyone's free/busy. NotesUIScheduler is how you drive that control from code: get it by name off the UI document, add or remove participants, refresh the schedule data, and read back the interval the user picked. A field report on the one front-end scheduling class, its GetScheduleData refresh, and the two events you hook."
pubDate: 2026-08-02T07:30:00+08:00
lang: en
slug: notes-ui-scheduler
tags:
  - "LotusScript"
  - "Notes UI"
  - "Tutorial"
sources:
  - title: "NotesUIScheduler (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUISCHEDULER_CLASS.html"
  - title: "NotesUIDocument (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDOCUMENT_CLASS.html"
  - title: "NotesDateTime (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-ui-scheduler.webp"
coverStyle: "pencil-sketch"
---

You're building a custom meeting or room-booking form, and it has an embedded scheduler — the busy-time grid where you drop in attendees and a room and see everyone's free/busy laid out. The control renders itself; the question is how you drive it from code: prefill the required attendees, add the room as a resource, refresh the grid, and read back the slot the user settled on so you can save the meeting. That's exactly what [`NotesUIScheduler`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUISCHEDULER_CLASS.html) is for.

Unlike the empty [`Button` / `Field` / `Navigator`](/domino-news/en/posts/button-field-navigator) classes, this one has real state — fifteen display properties, four methods, two events. This is a field report on the one front-end scheduling class: how you get it, manage its participants, refresh its data, and hook its interval. It's new with Release 6, front-end (Notes client) only, and not supported in COM.

---

## TL;DR

- `NotesUIScheduler` "represents an embedded scheduler in a document." You get it by name off the open UI document: `Set sched = uidoc.GetSchedulerObject("SchedulerName")` — the embedded scheduler must be named and present on the form.
- Manage attendees with `AddParticipant`, `RemoveParticipants`, and `GetParticipants`; then call `GetScheduleData` to refresh the free/busy grid after the participant list changes.
- The `Interval` property is the meeting slot the grid is showing / the user picked — read it to save the meeting, or set it to move the selection.
- The `Display*` properties (`DisplayRooms`, `DisplayResources`, `DisplayMeetingSuggestions`, `DisplayCheckboxes`, …) toggle what the grid shows.
- Two events: `OnIntervalChange` (the user dragged a new slot) and `OnSuggestionsAvailable` (the selected-names set changed).

## Getting the object

The scheduler is an embedded control you place and *name* on the form in Designer. At runtime you reach it from the open [`NotesUIDocument`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDOCUMENT_CLASS.html), not by constructing it:

```lotusscript
Dim ws As New NotesUIWorkspace
Dim uidoc As NotesUIDocument
Set uidoc = ws.CurrentDocument

Dim sched As NotesUIScheduler
Set sched = uidoc.GetSchedulerObject("RoomScheduler")   ' the control's name in Designer
```

If the name doesn't match a scheduler on the current form, you get nothing back — so the name string is the one thing to keep in sync with the form design. `SchedulerName` (read-only) reflects it back if you need to confirm which control you're holding.

## Participants and the refresh

The four methods are all about the attendee list. `AddParticipant` adds a person, room, or resource; `RemoveParticipants` takes them out; `GetParticipants` reads the current set. The one to remember is `GetScheduleData` — after you change the participant list, the grid doesn't re-query free/busy on its own, so you call `GetScheduleData` to refresh it:

```lotusscript
Call sched.AddParticipant("CN=Alex Chen/O=Acme")
Call sched.AddParticipant("Conference Room 3/Acme")   ' a room resource
Call sched.GetScheduleData()                           ' re-query busy time for the new set
```

Forgetting the refresh is the classic bug here: you add three required attendees in code, the grid still shows the old two, and the meeting suggestions are computed against the wrong set. Add participants, then refresh.

## Reading the chosen slot

The `Interval` property is the meeting time the grid is focused on — the start/end the user dragged to, or the suggestion they accepted. It's how the front-end selection gets back into your code: read `Interval` when the user confirms, and write the start and end into the meeting document (as [`NotesDateTime`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html) values) before saving. You can also *set* `Interval` to move the grid's selection programmatically — handy for seeding the form with a proposed time. The remaining display properties (`ScheduleGridStart`, `DisplayHoursPerDay`, `TimeZone`, `DisplayRooms`, `DisplayResources`, `DisplayMeetingSuggestions`) are the knobs for how much of the grid the user sees and in which time zone — set them once when the form opens.

## The two events

`OnIntervalChange` fires when the user drags to a different slot — the hook for "recompute cost / check the room capacity / update a label" as the proposed time moves. `OnSuggestionsAvailable` fires when the selected-names set changes and fresh meeting suggestions have been computed — the hook for reacting once the free/busy for a new participant list is ready. Both are front-end events on the control, same `Query*`-less notification model as the rest of the UI classes: they tell you something happened, and you reach back through the scheduler (and the UI document) to act on it.

## What about Java and SSJS?

There's no counterpart to the *control*, for the usual reason — it's a Notes-client UI element, and neither the Domino Java API nor XPages SSJS has a `NotesUIScheduler`. What does carry across is the free/busy *data* underneath it: on the back end you compute or read busy time through [`NotesCalendar`](/domino-news/en/posts/notes-calendar) and the calendar/scheduling store, and a modern web scheduler is built on the Domino REST API's calendar endpoints rather than an embedded control. So the grid is classic-client-only; the availability data it visualises is reachable everywhere, just through a different door.
