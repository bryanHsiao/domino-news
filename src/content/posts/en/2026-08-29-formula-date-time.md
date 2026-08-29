---
title: "Date Arithmetic in Formula: @Adjust to Add/Subtract, @Now/@Today for Now, and @Modified's Two Versions"
description: "Date math in formula isn't a big date library — it's a few @functions. Add or subtract with @Adjust (seven positions for year/month/day/hour/minute/second, positive or negative); get now with @Now (full timestamp) or @Today (date only); get document times with @Created/@Modified. This piece also flags two traps: @Now re-evaluates every run and hurts efficiency in column/selection formulas, and @Modified (modified initially) vs @ModifiedInThisFile (last modified in this file) differ once you have replicas. Part five of the Formula @function series."
pubDate: 2026-08-29T07:30:00+08:00
lang: en
slug: formula-date-time
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@Adjust — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADJUST.html"
  - title: "@Now — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOW.html"
  - title: "@Modified — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MODIFIED.html"
cover: "/covers/formula-date-time.webp"
coverStyle: "art-deco"
---

Date arithmetic in formula isn't a sprawling date library — it's a few @functions. One to add and subtract, one to get "now," another for a document's created/modified time. This part strings them together and flags two easy traps.

---

## TL;DR

- **Add/subtract with [`@Adjust`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADJUST.html):** `@Adjust(date; year; month; day; hour; minute; second; [DST])` — seven positions for seven units, `0` for the ones you don't change, positive or negative.
- **Get now:** `@Now` returns a full timestamp, `@Today` only the date.
- **Document times:** `@Created` (created), `@Modified` (modified).
- **Subtracting two timestamps = the difference in seconds** (a number); use `@Adjust` to add time.
- **Two traps:** `@Now` re-evaluates every run and hurts efficiency in column/selection formulas; `@Modified` and `@ModifiedInThisFile` are **not the same thing** once replicas exist.

---

## @Adjust: the workhorse for date math

"Thirty days from now," "a month ago," "two hours later" — all `@Adjust`. The docs define it: "Adjusts the specified time-date value by the number of years, months, days, hours, minutes, and/or seconds you specify. The amount of adjustment may be positive or negative."

Seven positions are seven units — **year, month, day, hour, minute, second** — plus an optional trailing `[DST]` (for daylight saving):

```
@Adjust(Date; 0; 0; 30; 0; 0; 0)      → 30 days later
@Adjust(Date; 0; 1; 0; 0; 0; 0)       → one month later
@Adjust(Date; 0; 0; -7; 0; 0; 0)      → 7 days earlier
@Adjust(@Now; 0; 0; 0; 2; 0; 0)       → two hours later
```

Units you don't change get `0` (all are **required**, none can be omitted). It takes a single date or a list of dates. Negative goes backward. Using `@Adjust` rather than computing seconds by hand means the calendar arithmetic — month ends, leap years — is handled for you.

## @Now / @Today: getting "now"

- **[`@Now`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOW.html):** the docs in a line — "Returns the current time-date" — the full date and time. It takes the local machine's time by default; add `[SERVERTIME]` to take a server's time (for distributed apps that need synchronized timestamps).
- **`@Today`:** the date only, no hours/minutes/seconds.

One trap to remember: **`@Now` re-evaluates every time the formula runs** — it's not a stored constant. The docs warn outright that "using @Now in column or selection formulas may impact the efficiency of your application," and it leaves views showing a constant "refresh needed." So be careful with `@Now`/`@Today` in view column and selection formulas; for "the time the document was created," use `@Created`, not `@Now`.

## @Created / @Modified: the document's times

- **`@Created`:** when the document was created.
- **[`@Modified`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MODIFIED.html):** when it was modified.

Here's a replica-environment subtlety worth keeping straight. The docs define two near-neighbor functions:

- `@Modified` "returns a time-date value indicating when the document was modified initially."
- `@ModifiedInThisFile` "returns a time-date value indicating when the document was last modified in the current file."

The difference is **"this file":** for the same document across different replicas, `@ModifiedInThisFile` records "when it was last changed in this copy," which can differ between them. To ask "was this document touched in the copy I'm holding," use `@ModifiedInThisFile`; don't conflate it with `@Modified`.

## Pulling out a part, and computing a difference

For a part of a date, there's a set of extractors: `@Year`, `@Month`, `@Day`, `@Hour`, `@Minute`, `@Second`, `@Weekday` (day of week).

For "how long between," just **subtract** two timestamps — the result is the **difference in seconds** (a number):

```
(@Now - Created) / 86400      → days since this document was created
```

(`86400` is the number of seconds in a day.) Mind the direction: **subtracting gives a number (seconds)**, **adding time uses `@Adjust`** — don't mix the two up.

## Wrap-up

Add and subtract with `@Adjust` (seven units, positive/negative, all required); get now with `@Now` (full, with the re-evaluation trap) or `@Today`; get document times with `@Created`/`@Modified` (`@ModifiedInThisFile` keeps replicas straight); compute a difference by plain subtraction into seconds.

The next part turns to what puts these **together**: **control flow and variables** — `@If`, `@Do`, temp variables `x := ...`, and `@While`/`@For`, structuring a complex formula.
