---
title: "NotesDateTime and Time Zones: GMTTime, ConvertToZone, and the Sign Convention That Trips Everyone"
description: "One NotesDateTime is a single instant you can read out three ways — as GMT, as the machine's local time, and as a converted zone. This article covers GMTTime vs LocalTime vs ZoneTime, the TimeZone integer's counter-intuitive Notes sign convention (positive means west of GMT), ConvertToZone and its DST gotcha, LSGMTTime for native date math, and why GMTTime is the only safe form to store and compare across machines."
pubDate: 2026-07-13T07:30:00+08:00
lang: en
slug: notes-datetime-timezone
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDateTime class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html"
  - title: "TimeZone property (NotesDateTime) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TIMEZONE_PROPERTY.html"
  - title: "ConvertToZone method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CONVERTTOZONE_METHOD.html"
relatedJava: ["DateTime"]
relatedSsjs: ["DateTime"]
---

A user in Taipei creates a record at 9 AM; a scheduled agent on a server in Frankfurt processes it; a report renders it for a reader in New York. If you stored and compared the raw local-time strings, all three see a different "9:00" and your sort order is nonsense. [`NotesDateTime`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS.html) has the tools to get this right — but they come with a sign convention and a DST rule that catch almost everyone the first time.

The mental model that unlocks the class: **one `NotesDateTime` is a single absolute instant**, and GMTTime / LocalTime / ZoneTime are three *views* of it. `ConvertToZone` changes the view, not the instant. This is the third angle on the class — the general [`NotesDateTime` walkthrough](/domino-news/en/posts/notes-datetime) covers construction and arithmetic; this one is about zones.

---

## TL;DR

- **`GMTTime`** (read-only) is the instant as Greenwich Mean Time — the same value no matter which machine reads it. This is the canonical form: **store and compare on GMTTime.**
- **`LocalTime`** (read-write) is the instant in the running machine's zone; **`ZoneTime`** (read-only) is the instant in whatever zone `ConvertToZone` set (equal to LocalTime until you convert).
- **`TimeZone`** (read-only integer) uses the classic Notes convention: it's "the number of hours which must be added to the time to get Greenwich Mean Time" — so **positive means *west* of GMT** (US Eastern is `5`, not `-5`). The docs hedge "in many cases, but not all," so don't treat it as a clean universal offset.
- **`ConvertToZone(newzone, dst)`** re-views the instant in another zone — it changes `TimeZone`/`IsDST`/`ZoneTime` but "does not affect the GMTTime and the LocalTime properties." Its DST gotcha: it "uses the daylight saving time rules of the zone being converted *from*, not the zone being converted *to*."
- For native date math use **`LSGMTTime`** / **`LSLocalTime`** (LotusScript `Date` variants); the string `GMTTime`/`LocalTime` are for storage and display.

## Three views of one instant

```lotusscript
Dim dt As New NotesDateTime("04/16/96 05:36 PM")
Print "LocalTime: " & dt.LocalTime      ' machine-zone string
Print "TimeZone : " & dt.TimeZone       ' integer offset (see below)
Print "GMTTime  : " & dt.GMTTime        ' absolute GMT string
```

On a US-Eastern machine that same instant prints its GMTTime as `04/16/96 09:36:00 PM GMT`; on a machine 11 zones west it prints a *different local* time but the **same GMTTime**. That's the whole point: `GMTTime` is machine-independent, so two `NotesDateTime` values created on different servers compare and sort correctly only when you compare on GMT — not on the locale-formatted `LocalTime` strings.

## The TimeZone sign convention

This is the one that produces off-by-hours bugs. Per the [`TimeZone`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TIMEZONE_PROPERTY.html) docs, the integer "indicates the number of hours which must be added to the time to get Greenwich Mean Time." So GMT is `0`, US Eastern Standard Time is `5`, and Alaska-Hawaii is `10` — **positive is west of GMT**, the opposite sign from the `UTC+8` / `UTC−5` notation most developers carry in their heads. Taipei (UTC+8) reads as `-8` here. The docs add "in many cases, but not all," their own hedge that half-hour zones and historical rules don't map to a clean integer — so read `TimeZone` as Notes' internal marker, not as a portable offset you do arithmetic on.

## ConvertToZone, and its DST trap

[`ConvertToZone(newzone, dst)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CONVERTTOZONE_METHOD.html) re-labels the same absolute instant into another zone's view. The official example walks an instant across every zone:

```lotusscript
Sub Initialize
  Dim dateTime As New NotesDateTime("Today 06:00")
  Dim msg As String
  msg = "Zone" & Chr(9) & "Time"
  For i = -12 To 12
    Call dateTime.ConvertToZone(i, True)
    msg = msg & Chr(10) & dateTime.TimeZone & Chr(9) & dateTime.ZoneTime
  Next
  Messagebox msg,, "Today 06:00 across zones"
End Sub
```

Two things the docs are explicit about. First, the conversion "does not affect the GMTTime and the LocalTime properties" — after `ConvertToZone` you read the result from `ZoneTime`, while `GMTTime` (the absolute instant) and `LocalTime` stay put. Second, the DST trap: it "uses the daylight saving time rules of the zone being converted *from*, not the zone being converted *to*." So converting between two zones with different DST rules can produce a wall-clock time that's off by the DST offset — if precise wall time in the target zone matters, verify against that zone's actual rules rather than trusting the conversion blindly.

## Native date math: LSGMTTime

`GMTTime` and `LocalTime` return locale-formatted *strings* — good for storage and display, awkward for computation. When you need to feed a value into LotusScript date math or `Format$`, use the `LS*` variants, which return a native `Date`:

```lotusscript
Dim dt As New NotesDateTime("2026-07-09 09:00:00")
Dim gmt As Variant
gmt = dt.LSGMTTime          ' a LotusScript Date, in GMT — safe for comparison
```

Use `LSGMTTime` (or the string `GMTTime`) as the canonical value you persist and compare; reach for `LocalTime` / `ZoneTime` only when you're formatting something for a human to read. For elapsed time between two instants, `TimeDifference` returns the gap in seconds (`self` minus the parameter), and `TimeDifferenceDouble` returns the same as a `Double` to avoid overflow on multi-decade spans — because both operands carry their own zone information, the difference is computed on the absolute instants and is zone-correct.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesDateTime` | `DateTime` | `DateTime` |

Java's `lotus.domino.DateTime` (via `session.createDateTime(...)`) exposes the same model — `getGMTTime()`, `getLocalTime()`, `getTimeZone()`, `convertToZone(int, boolean)`, `timeDifference()` — with the identical sign convention and DST caveat. Java has no `LS*` native-variant analogue; it offers `toJavaDate()` for a `java.util.Date` instead. SSJS reaches the same backing class through `session.createDateTime(...)`. The one rule to carry everywhere: persist and compare on GMT.
