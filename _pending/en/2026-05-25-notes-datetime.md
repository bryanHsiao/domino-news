---
title: "NotesDateTime + NotesDateRange: LotusScript's Date/Time Workhorses"
description: "Two of the most frequently touched utility classes in any Domino codebase — NotesDateTime represents a single point in time, NotesDateRange spans a start-to-end interval. This article covers instantiation (New vs session.CreateDateTime), the three time-zone property families (Local / GMT / Zone) and when to use which, the six Adjust* methods for date arithmetic, TimeDifference vs TimeDifferenceDouble precision, ConvertToZone's in-place mutate semantics, NotesDateRange's four-property flat shape (with zero methods), the SetAnyDate / SetAnyTime wildcards used for view searches, the timezone trap when reading from NotesItem.DateTimeValue, and two practical examples (a stale-document reminder agent + a cross-timezone meeting scheduler)."
pubDate: 2026-05-25T07:30:00+08:00
lang: en
slug: notes-datetime
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDateTime class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html"
  - title: "NotesDateRange class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATERANGE_CLASS.html"
  - title: "CreateDateTime method (NotesSession) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEDATETIME_METHOD.html"
  - title: "CreateDateRange method (NotesSession) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEDATERANGE_METHOD.html"
relatedJava: ["DateTime", "DateRange"]
relatedSsjs: []
cover: "/covers/notes-datetime.png"
coverStyle: "art-deco"
---

## TL;DR

- [**NotesDateTime**](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html) + **NotesDateRange** — two of the most frequently touched utility classes in any Domino codebase, dating back to V3.
- **Construction**: `Dim x As New NotesDateTime("...")` or `session.CreateDateTime("...")` (`New` isn't supported in COM).
- **Don't mix the three time-zone property families**: `LocalTime` (caller's TZ) / `GMTTime` (UTC) / `ZoneTime` (adjusted for whatever TZ + DST the object thinks it's in).
- **Time-zone conversion**: `ConvertToZone(zone, dst)` **mutates the object in place — it doesn't return a new one** — different from most modern languages, so clone first if you need to keep the original.
- **Date arithmetic**: six `Adjust*` methods (`AdjustDay` / `AdjustHour` / `AdjustMinute` / `AdjustSecond` / `AdjustMonth` / `AdjustYear`) — also in-place, with automatic month/year roll-over.
- **Differences**: `TimeDifference(other)` returns a `Long` (whole seconds), `TimeDifferenceDouble(other)` returns a `Double` (sub-second precision, useful for short intervals).
- **NotesDateRange** — a "from time A to time B" interval with 4 properties and **zero methods**; common in calendar / scheduling code.
- Watch out for: `IsValidDate` to check parse success, `SetAnyDate` / `SetAnyTime` are wildcards for view searches (not "clear"), and timezone handling when reading from `NotesItem.DateTimeValue`.

---

## Building a NotesDateTime — two ways

```lotusscript
' Way 1: New constructor (concise, but not COM-supported)
Dim dt1 As New NotesDateTime("2026-05-25 14:30:00")

' Way 2: session factory (required path for COM agents)
Dim session As New NotesSession
Dim dt2 As NotesDateTime
Set dt2 = session.CreateDateTime("2026-05-25 14:30:00")
```

The string format is fairly permissive:

- ISO 8601: `"2026-05-25 14:30:00"`, `"2026-05-25T14:30:00"`
- US: `"05/25/2026 02:30 PM"`
- Date only: `"2026-05-25"` (time portion becomes `SetAnyTime` state)
- Time only: `"14:30:00"` (date portion becomes `SetAnyDate` state)

**Parsing failures don't throw** — the object still gets created, but `IsValidDate = False`. Production code should check:

```lotusscript
Dim dt As NotesDateTime
Set dt = session.CreateDateTime(userInput)
If Not dt.IsValidDate Then
    Print "Invalid date format: " & userInput
    Exit Sub
End If
```

---

## The three timezone property families — Local / GMT / Zone

The most common trap: different properties represent different time zones; mixing them silently produces wrong results.

| Property | Type | Meaning | When to use |
|---|---|---|---|
| `.LocalTime` | String (R/W) | Full date-time in the caller's local TZ | UI display, things readable by the user |
| `.GMTTime` | String (RO) | UTC representation | Logs, cross-system comparison, SLA timing |
| `.ZoneTime` | String (RO) | Adjusted for the object's own TZ + DST flags | Multi-timezone calendar display |
| `.LSLocalTime` | Variant (R/W) | LS native date variant, local | Round-tripping with LS `Date` variables |
| `.LSGMTTime` | Variant (RO) | LS native date variant, UTC | Same, but UTC |

Date-only or time-only extraction:

| Property | Returns |
|---|---|
| `.DateOnly` | Date string in local TZ, e.g. `"05/25/2026"` |
| `.TimeOnly` | Time string in local TZ, e.g. `"14:30:00"` |

Rules of thumb:

- **Storing in NSF / sending to another server** → `GMTTime` or `LSGMTTime` (UTC is unambiguous, can't be misread)
- **Showing to a user** → `LocalTime` (auto-adjusts to client TZ)
- **Arithmetic / comparison** → operate on the object directly; don't round-trip through strings first

---

## The Adjust family — six in-place arithmetic methods

Six methods for six time units, all **in-place mutate** (they modify the object rather than returning a new one):

```lotusscript
Dim dt As New NotesDateTime("2026-05-25 14:30:00")

Call dt.AdjustDay(7)        ' → 2026-06-01 14:30:00
Call dt.AdjustHour(-3)      ' → 2026-06-01 11:30:00
Call dt.AdjustMonth(1)      ' → 2026-07-01 11:30:00
Call dt.AdjustYear(1)       ' → 2027-07-01 11:30:00
Call dt.AdjustMinute(45)    ' → 2027-07-01 12:15:00
Call dt.AdjustSecond(-15)   ' → 2027-07-01 12:14:45
```

**Auto-rollover**: `AdjustDay(35)` from May 1 lands you at June 5, no manual leap-month math needed. Negative values roll backward, semantics are consistent.

Two wildcard methods exist for search predicates, not arithmetic:

```lotusscript
Call dt.SetAnyDate()  ' date becomes "*", used in view formulas to match any date
Call dt.SetAnyTime()  ' time becomes "*", used to match any time
```

Pair these mentally with `SetNow()`, which resets the whole object to the current moment:

```lotusscript
Dim now As New NotesDateTime("")
Call now.SetNow()   ' object is now server's current time
```

---

## Comparison — TimeDifference vs TimeDifferenceDouble

Both compute "self − other" in seconds; the difference is return type and precision:

| Method | Returns | Resolution | Use for |
|---|---|---|---|
| `TimeDifference(other)` | `Long` (integer seconds) | 1 second | Common: timeouts, daily counts, SLA timers |
| `TimeDifferenceDouble(other)` | `Double` | Sub-second (ms-class) | Short interval measurement, perf benchmarks |

```lotusscript
Dim t1 As New NotesDateTime("")
Call t1.SetNow()

' ...do work...

Dim t2 As New NotesDateTime("")
Call t2.SetNow()

Dim elapsedSec As Long
elapsedSec = t2.TimeDifference(t1)
Print "Elapsed " & elapsedSec & " seconds"
```

**Order matters**: `A.TimeDifference(B)` = A − B. Negative means A is earlier than B.

---

## ConvertToZone — in-place timezone conversion

`ConvertToZone(zone, dst)` modifies the object directly, doesn't return a new one:

```lotusscript
Dim dt As New NotesDateTime("2026-05-25 14:30:00")  ' assume local Taipei UTC+8

Call dt.ConvertToZone(0, False)  ' convert to UTC
Print dt.LocalTime  ' "2026-05-25 06:30:00" (note: LocalTime is now different)
```

Two parameters:

- `zone` — integer TZ offset (Taipei is `-8`, New York EST is `5`; **note the sign convention is reversed** from what most people expect — HCL uses "local minus GMT" inverted)
- `dst` — `True` / `False` for whether to apply daylight saving

**To preserve the original**, clone first:

```lotusscript
Dim original As New NotesDateTime("2026-05-25 14:30:00")
Dim cloned As New NotesDateTime(original.LocalTime)  ' rebuild from LocalTime string
Call cloned.ConvertToZone(0, False)  ' only `cloned` changes, `original` stays
```

LS has no first-class deep-clone API, so round-tripping through `LocalTime` is the idiomatic workaround.

---

## NotesDateRange — flat, no methods

The object is very flat: 4 properties, **no methods at all**:

| Property | Type | Purpose |
|---|---|---|
| `.StartDateTime` | NotesDateTime (R/W) | Start moment |
| `.EndDateTime` | NotesDateTime (R/W) | End moment |
| `.Text` | String (R/W) | String representation (e.g. `"05/25/2026 - 06/01/2026"`), read AND write |
| `.Parent` | NotesSession (RO) | Owning session |

Two construction patterns:

```lotusscript
' Pattern 1: build two NotesDateTime, then set on range
Dim startDt As New NotesDateTime("2026-05-25 09:00:00")
Dim endDt As New NotesDateTime("2026-05-25 17:00:00")
Dim range As NotesDateRange
Set range = session.CreateDateRange()
Set range.StartDateTime = startDt
Set range.EndDateTime = endDt

' Pattern 2: set Text directly, Domino parses out the two endpoints
Dim range2 As NotesDateRange
Set range2 = session.CreateDateRange()
range2.Text = "05/25/2026 09:00 AM - 05/25/2026 05:00 PM"
```

**Use case**: `NotesItem` fields storing time-range data (e.g. a meeting's Required attendance times) come back as `NotesDateRange` arrays. Calendar app code almost always reaches for it.

---

## Practical example 1: stale-document reminder agent

A scheduled agent that finds documents not updated in 30+ days and reports them:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Set db = session.CurrentDatabase

    ' Compute the "30 days ago" cutoff
    Dim cutoff As New NotesDateTime("")
    Call cutoff.SetNow()
    Call cutoff.AdjustDay(-30)

    ' Find all docs with LastModified before the cutoff
    Dim docs As NotesDocumentCollection
    Set docs = db.Search("@Modified < [" & cutoff.LocalTime & "]", Nothing, 0)

    Dim doc As NotesDocument
    Set doc = docs.GetFirstDocument()
    Do Until doc Is Nothing
        ' How long has this doc been stale?
        Dim lastMod As NotesDateTime
        Set lastMod = doc.LastModified
        Dim staleDays As Long
        staleDays = -lastMod.TimeDifference(cutoff) / 86400  ' seconds → days

        Print doc.GetItemValue("Subject")(0) & " is " & (staleDays + 30) & " days stale"
        Set doc = docs.GetNextDocument(doc)
    Loop
End Sub
```

---

## Practical example 2: cross-timezone meeting scheduler

Translate "Taipei 09:00" into the attendee's local time:

```lotusscript
Function MeetingTimeForZone(taipeiTime As String, attendeeZone As Integer) As String
    Dim dt As NotesDateTime
    Set dt = New NotesDateTime(taipeiTime)

    ' Convert from Taipei (UTC+8) to the attendee's zone
    Call dt.ConvertToZone(attendeeZone, False)
    MeetingTimeForZone = dt.LocalTime
End Function

' Usage
Print MeetingTimeForZone("2026-05-25 09:00:00", 5)   ' New York EST → 21:00 (day before)
Print MeetingTimeForZone("2026-05-25 09:00:00", 0)   ' UTC → 01:00
Print MeetingTimeForZone("2026-05-25 09:00:00", -8)  ' Taipei → 09:00 (no change)
```

---

## Common traps

### Interacting with `NotesItem.DateTimeValue`

A DateTime value read from a document carries the server's timezone metadata; writing back demands care:

```lotusscript
Dim doc As NotesDocument
Set doc = view.GetFirstDocument()

Dim item As NotesItem
Set item = doc.GetFirstItem("EventDate")

Dim dt As NotesDateTime
Set dt = item.DateTimeValue
' dt carries the server's TZ, not the client's

Print dt.GMTTime  ' ← compare via GMT is safer; no TZ misreading
```

### `SetAnyDate` / `SetAnyTime` aren't "clear"

A lot of people read these as "blank out the date/time"; they're actually **wildcards for search predicates**:

```lotusscript
Dim dt As New NotesDateTime("2026-05-25 14:30:00")
Call dt.SetAnyDate()   ' date becomes wildcard "*", but time 14:30:00 stays
' Use case: drop into a view selection formula to match "any date, time = 14:30"
```

To express "no time information," don't use `SetAnyTime`; either build with an empty string or just don't create the object.

### `Adjust*` mutates, doesn't return

```lotusscript
' ❌ Wrong
Dim tomorrow As NotesDateTime
Set tomorrow = today.AdjustDay(1)  ' AdjustDay returns nothing, tomorrow ends up Nothing

' ✅ Right
Set tomorrow = New NotesDateTime(today.LocalTime)
Call tomorrow.AdjustDay(1)
```

The JavaScript / Python / Java 8 immutable-date conventions don't apply here — LS mutates in place. If you need to preserve the original, clone first.

---

## What about Java and SSJS?

| Language | Equivalent |
|---|---|
| LotusScript | `NotesDateTime` / `NotesDateRange` |
| Java | `lotus.domino.DateTime` / `lotus.domino.DateRange` (same API surface, names drop the `Notes` prefix) |
| SSJS | Use JavaScript's native `Date` (inside XPages, formulas like `@Today()` / `@Now()` complement it) |

The Java side mainly differs in memory management: `lotus.domino.DateTime` objects need `.recycle()` calls when you're done with them, unlike LS where GC handles it. SSJS just uses `new Date()` / `Date.now()` — Domino doesn't add a wrapper.
