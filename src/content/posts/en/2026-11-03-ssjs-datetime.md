---
title: "Three Kinds of Date in XPages — You Have to Know Which One You're Holding"
description: "The thing that bites you with dates in XPages SSJS isn't a method you can't call — it's not noticing that three different 'dates' are in play at once: the back-end NotesDateTime, the Java-layer java.util.Date, and JavaScript's own Date. What you read from a document is a NotesDateTime; what @Today hands you might be something else, and putting the wrong one in the wrong place throws or stores a bad value. This covers building a NotesDateTime in SSJS (session.createDateTime), converting between the three types (toJavaDate), the common methods (adjustDay / setNow / timeDifference / convertToZone), and the two classic traps — 'Today has no time' and '@Today isn't necessarily a NotesDateTime'."
pubDate: 2026-11-03T07:30:00+08:00
lang: en
slug: ssjs-datetime
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesDateTime (JavaScript) (class, methods, properties, time zones; toJavaDate) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_DateTime.html"
  - title: "NotesSession (JavaScript) (createDateTime) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Session.html"
  - title: "NotesDateTime sample JavaScript code for XPages (SSJS samples: setNow / adjustDay / convertToZone / toJavaDate) — HCL ddwiki (official)"
    url: "https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/NotesDateTime_sample_JavaScript_code_for_XPages"
relatedJava: []
relatedSsjs: []
coversClass: "DateTime"
apiLang: "ssjs"
cover: "/covers/ssjs-datetime.webp"
coverStyle: "minimalist-mono"
---

The thing that actually bites you with dates in XPages SSJS isn't a method you can't call — it's not noticing that **three** different "dates" are flowing through your code at once:

- **`NotesDateTime`**: the back-end Domino date type. What you read from a document field, or from `getCreated()`, is this.
- **`java.util.Date`**: the Java-layer date. SSJS runs on Java underneath, and plenty of things hand you one of these.
- **JavaScript's `Date`**: the one you know from the client — but in server-side SSJS it is not the same thing as the two above.

The same "2026-11-03," wrapped in a different type, has different capabilities, compares differently, and writes back to a document differently. Put the wrong one in the wrong place and, at best, you get a type error; at worst, you store a value that looks right but has drifted by a time zone or a time-of-day. This piece covers how to build a `NotesDateTime` in SSJS, how to convert between the three types, the common methods, and the two traps that catch everyone.

---

## TL;DR

- **There's one reliable way to build a `NotesDateTime`: `session.createDateTime(...)`.** Officially it "Creates a NotesDateTime object that represents a specified date and time" — the argument is a string (date, space, time) or a Date.
- **To convert to a Java `Date`, use `toJavaDate()`** — officially "Converts a NotesDateTime object to a Date object." It's the bridge you'll cross most between the three types.
- **Common methods**: `adjustDay` / `adjustHour` / `adjustMonth`… (shift), `setNow` (set to now), `timeDifference` (seconds between two values), `convertToZone` (change zone).
- **Trap one: "Today" has no time.** `createDateTime("Today")` gives a date with no time; the docs tell you to then `setNow()` or write an explicit time like `"Today 12:00:00 AM"`.
- **Trap two: `@Today` isn't necessarily a `NotesDateTime`.** To write a date into a document field, `session.createDateTime("Today")` is the safe path — don't just drop `@Today()`'s result into `replaceItemValue` (details below).

## Building a NotesDateTime: session.createDateTime

In SSJS you don't `new` a [`NotesDateTime`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_DateTime.html) — officially it "Represents a date and time," and there's a single entry point to create one: `session.createDateTime`. The official [NotesSession](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Session.html) page describes it as "Creates a NotesDateTime object that represents a specified date and time."

```javascript
// string: date space time
var dt:NotesDateTime = session.createDateTime("2026-11-03 09:30:00");

// keywords work too
var today:NotesDateTime = session.createDateTime("Today");

// or feed it a Date
var fromDate:NotesDateTime = session.createDateTime(new Date());
```

It's the same concept as LotusScript's `New NotesDateTime(...)` and Java's `session.createDateTime(...)`, just the SSJS spelling.

## Three types, how to convert

This is where SSJS gets messier than LS or Java, because all three date types brush past each other in the same block. Keep the directions straight:

- **Read from a document → `NotesDateTime`.** `doc.getCreated()`, `doc.getLastModified()`, or a date field read back are all `NotesDateTime`.
- **Hand it to anything that wants a Java `Date` (formatting, other Java APIs) → `toJavaDate()`.** This is the officially stated conversion: "Converts a NotesDateTime object to a Date object."
- **Back to a `NotesDateTime` (e.g. to write to a document) → `session.createDateTime(thatDate)`.**

```javascript
var created:NotesDateTime = doc.getCreated();     // back end → NotesDateTime
var jdate:java.util.Date  = created.toJavaDate();  // to a Java Date for formatting/math
// ... process ...
var back:NotesDateTime = session.createDateTime(jdate);  // convert back to write
doc.replaceItemValue("ProcessedAt", back);
```

In one line: **keep back-end work in `NotesDateTime`, cross to the Java world with `toJavaDate()`, and `createDateTime` your way back to write to a document.**

## Common methods

`NotesDateTime`'s methods share the names you know from LS and Java; SSJS uses them directly. The official [ddwiki SSJS samples](https://ds-infolib.hcltechsw.com/ldd/ddwiki.nsf/dx/NotesDateTime_sample_JavaScript_code_for_XPages) demonstrate all of these:

```javascript
var dt:NotesDateTime = session.createDateTime("Today");
dt.setNow();              // set to now (date + time)
dt.adjustDay(7);          // +7 days; officially: Increments a date-time by a number of days
dt.adjustHour(-3);        // -3 hours

// seconds between two values
var a:NotesDateTime = session.createDateTime("2026-11-03 09:00:00");
var b:NotesDateTime = session.createDateTime("2026-11-03 17:30:00");
var secs = b.timeDifference(a);   // officially: difference in seconds

// change zone
dt.convertToZone(8, false);       // officially: Changes the TimeZone and IsDST properties
```

The read-out properties are worth remembering too: `DateOnly` (just the date string), `TimeOnly` (just the time), `GMTTime` (the value converted to GMT), `LocalTime` (the local-zone string).

## Trap one: "Today" has no time

This one the docs name themselves. `createDateTime("Today")` (and `"Tomorrow"`, `"Yesterday"`) uses Domino's current date but **sets no time** — the official wording tells you to either `setNow()` afterwards or write an explicit time from the start, like `"Today 12:00:00 AM"`.

The consequence is concrete: a `NotesDateTime` that's "date only, no time" has an invalid `TimeZone` (the docs say it returns `0` then), and comparing or subtracting it against a value that *does* have a time gives you results you didn't want. To do time math, fill it out to a full date-and-time first.

```javascript
var d:NotesDateTime = session.createDateTime("Today");
d.setNow();   // add a time, so timeDifference / adjustHour behave
```

## Trap two: @Today isn't necessarily a NotesDateTime

This one is subtler, and it's exactly where mixing the three types catches you. **In SSJS, `@Today()` / `@Now()` don't necessarily return a `NotesDateTime`** — the community (the HCL developer forum) reports they hand back a Java `Date`, and dropping `@Today()`'s result straight into `doc.replaceItemValue(...)` for a date field has thrown type errors for people.

> This is a **community report, not official black-and-white** — confirm it in your own Domino version with `typeof` / `getClass()`. But whatever `@Today` returns, the **conclusion is the same and safe**: to write a date value to a document, make an explicit `NotesDateTime` with `session.createDateTime("Today")` and don't gamble on the type.

```javascript
// the safe way: make an explicit NotesDateTime
doc.replaceItemValue("DueDate", session.createDateTime("Today"));
```

## Time zones, in one line

A `NotesDateTime`'s zone comes from Domino's setting, `convertToZone` changes it, and `GMTTime` gives you the GMT string directly. When XPages passes a `+08:00` value between layers (back end, display, request zone), off-by-an-hour / off-by-a-day is an old problem — the full time-zone story is in [the LotusScript NotesDateTime time-zone piece](/domino-news/posts/notes-datetime-timezone/), and it's the same rules underneath.

## What about Java and LotusScript?

The same `NotesDateTime`, but the emphasis shifts by language:

- **LotusScript**: `New NotesDateTime(...)` or `session.CreateDateTime(...)`, same method names; the basics are in [the NotesDateTime piece](/domino-news/posts/notes-datetime/). There's no "three types to juggle" — in LS it's just `NotesDateTime`.
- **Java**: `session.createDateTime(...)`, with the same `toJavaDate()` / `java.util.Date` round-trip, plus one extra chore — `recycle()` when done. Java date handling is in [Java's NotesDateTime](/domino-news/posts/java-datetime/).
- **The SSJS-specific pain** is exactly this piece's subject: you're caught between `NotesDateTime`, `java.util.Date`, and JavaScript's `Date` all at once — `toJavaDate()` is the bridge, `session.createDateTime` is the way back, and knowing which one you're holding is how dates stop drifting.
