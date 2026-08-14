---
title: "Why Can't You Just Use java.util.Date for Notes Dates in Java?"
description: "To work with a Notes date in Java you can't just use java.util.Date — there's a lotus.domino.DateTime in the way. It's a heavyweight back-end object with a handle behind it, so it leaks memory in a loop if you don't recycle it; it stores dates as strings and throws on bad input; and toJavaDate() is the bridge that converts it into Java's own date type so you can reach java.time. This piece covers how Java's DateTime is created, read, and written, how it crosses into Java's time world, and the recycle burden LotusScript doesn't carry over."
pubDate: 2026-08-15T07:30:00+08:00
lang: en
slug: java-datetime
tags:
  - "Java"
sources:
  - title: "DateTime class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS_JAVA.html"
  - title: "Session.createDateTime (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEDATETIME_METHOD_JAVA.html"
  - title: "DateTime.toJavaDate (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TOJAVADATE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/java-datetime.webp"
coverStyle: "bw-grain"
---

The moment you need to do something with a Notes date in Java — compare it, add days, write it back — you hit something awkward: you can't just use `java.util.Date`. Domino's date in the Java API is a class called [`DateTime`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATETIME_CLASS_JAVA.html), and it lives in a different world from Java's own time types. You go into `DateTime`, do the work, and come back out.

This `DateTime` has three things that trip up people coming from LotusScript: it's a **back-end object that leaks memory**, it stores dates as **strings**, and it crosses to and from `java.util.Date` over a bridge called `toJavaDate()`. This piece walks all three.

---

## TL;DR

- **`DateTime` is a back-end object, not a Java date.** The docs say it "represents a date and time" and extends `Base`. It's backed by a handle the garbage collector can't see — create it in a loop without `recycle` and it leaks.
- **Create it with `session.createDateTime(...)`.** It takes `String`, `java.util.Date`, or `java.util.Calendar`; the time zone is set automatically from Domino's regional settings. Pass a string and a bad or empty value throws an "Invalid date" exception.
- **`toJavaDate()` is the exit.** It converts a `DateTime` into a `java.util.Date`, and from there onto modern `java.time`.
- **Reads and writes go through string properties:** `getDateOnly` / `getTimeOnly` / `getGMTTime` / `getLocalTime` all return strings; `getLocalTime` is writable.
- **Date math happens on the object:** `setNow`, `adjustDay` / `adjustHour` / `adjustMonth` / `adjustYear`, `timeDifference` (returns the gap between two times in seconds).

---

## What it is: a back-end object that represents a date

The docs define `DateTime` briefly — it "represents a date and time," extends `Base`, and is held by `Session`, `Document`, `Database`, `View`, and others. The load-bearing phrase is "extends `Base`": like `Document` and `Session`, `DateTime` is a heavyweight back-end object with a C handle behind it.

That sets its defining trait: **it leaks memory**. In a loop over tens of thousands of documents, calling `session.createDateTime(...)` or reading a `DateTime` out of a field each time, those objects pile up. This is exactly the trap the site's [recycle() piece](/domino-news/en/posts/java-recycle-memory) describes, and `DateTime` is the easiest one to overlook — it looks like "just a date," not something as heavy as `Document`. But in the Java API, dates need collecting too.

## Creating it: three doors into createDateTime

You don't `new` a `DateTime` — you ask the `Session` for one. [`createDateTime`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEDATETIME_METHOD_JAVA.html) has three overloads:

```java
public DateTime createDateTime(String date)             throws NotesException
public DateTime createDateTime(java.util.Date date)     throws NotesException
public DateTime createDateTime(java.util.Calendar date) throws NotesException
```

- Pass a **`String`**: the most intuitive, and the most dangerous — the docs state plainly, "An invalid date-time or empty string results in an 'Invalid date' exception." Bad format or an empty string throws, so wrap untrusted string sources in try/catch.
- Pass a **`java.util.Date`**: cleanest, built straight from Java's own date.
- Pass a **`java.util.Calendar`**: carries a time zone with it (supported since Release 6).

On time zones, the docs say the created `DateTime` picks up its zone automatically from Domino's regional settings — the same as LotusScript, but in Java you'll more often need to handle it explicitly; see below.

## The bridge: toJavaDate()

`DateTime` isn't great for modern date math itself; the real exit is [`toJavaDate()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_TOJAVADATE_METHOD_JAVA.html):

```java
public java.util.Date toJavaDate() throws NotesException
```

The docs put it in one line — it "Converts a Notes date and time into a java.util.Date object." Once you hold a `java.util.Date`, you've stepped out of Domino's time world into Java's own, and modern `java.time` is one step away:

```java
java.util.Date jd = dt.toJavaDate();
java.time.LocalDateTime ldt =
    jd.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
```

(That last bit is plain Java, not the Domino API — but it's the practical path for getting a Notes date into `LocalDate` / `LocalDateTime` for real date math. `DateTime` is for talking to Domino; `java.time` is for calculating.)

## Reading and writing: the properties are strings

Several of `DateTime`'s read properties return **strings**, not numbers:

- `getDateOnly()`: the date part as a string.
- `getTimeOnly()`: the time part as a string.
- `getGMTTime()`: the value converted to GMT, as a string.
- `getLocalTime()`: the local-zone value as a string — and this one is **writable**.
- `getTimeZone()`: an integer, the hours to add for GMT conversion.

For math, the operations act on the object directly: `setNow()` sets it to the current moment, `adjustDay(n)` / `adjustHour(n)` / `adjustMonth(n)` / `adjustYear(n)` add or subtract that unit, and `timeDifference(other)` returns the gap between two `DateTime`s in seconds. These map almost one-to-one onto LotusScript's `NotesDateTime` — the only difference is that every intermediate `DateTime` you create needs collecting when you're done.

## A complete example

Create a date, compute thirty days out, cross to a Java type, and remember to collect:

```java
DateTime due = session.createDateTime("2026-08-15");   // a bad string throws
due.adjustDay(30);                                     // +30 days in place

java.util.Date jd = due.toJavaDate();                  // cross the bridge to Java time

DateTime now = session.createDateTime("Today");
now.setNow();                                          // overwrite the seed, set to this instant
int secs = due.timeDifference(now);                    // due minus now: seconds until due (timeDifferenceDouble returns a double)

due.recycle();                                         // back-end object — collect when done
now.recycle();
```

Those two `recycle()` lines aren't optional — in code that runs repeatedly (an agent, a loop), every uncollected `DateTime` is one more on the pile.

## What about LotusScript and SSJS?

- **LotusScript:** `NotesDateTime` offers nearly the same `AdjustDay`, `TimeDifference`, `LocalTime`, but its **memory is automatic** — you never recycle by hand, which is where LS is more comfortable than Java in this corner. The site has [NotesDateTime](/domino-news/en/posts/notes-datetime) and [time-zone handling](/domino-news/en/posts/notes-datetime-timezone) pieces.
- **SSJS / XPages:** it's the same `lotus.domino.DateTime` underneath — `createDateTime` and `toJavaDate` are both there; still a back-end object, still worth collecting. You can also drop straight to `java.util.Date` / `java.time` in SSJS — the same "just use the Java type" instinct as the site's [working with java.util.Vector in XPages](/domino-news/en/posts/ssjs-vector-multivalue) piece.
