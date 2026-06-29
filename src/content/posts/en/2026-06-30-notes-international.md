---
title: "NotesInternational: Stop Hard-Coding Date Separators and Currency Symbols"
description: "NotesInternational is a read-only window onto the regional settings of whatever machine your code runs on — date order, separators, AM/PM strings, currency symbol and format, time zone, and the DST flag. This article covers getting it from session.International, the property groups worth knowing, a runnable example that detects the locale's date order, and the three traps: it reflects the host OS (not the end user), it's read-only, and its TimeZone sign convention is the classic counter-intuitive Notes one."
pubDate: 2026-06-30T07:30:00+08:00
lang: en
slug: notes-international
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesInternational class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESINTERNATIONAL_CLASS.html"
  - title: "Examples: NotesInternational class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESINTERNATIONAL_CLASS.html"
  - title: "Example: AMString property — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_AMSTRING_PROPERTY.html"
relatedJava: ["International"]
relatedSsjs: ["International"]
---

You write an agent that formats a date as `month & "/" & day & "/" & year`, test it on your machine, and it's fine. Then it runs on a server configured for a European locale where dates read day-first, or a customer copies it to a host where the decimal separator is a comma — and suddenly "01/02" means the wrong day and your currency totals look wrong.

The fix isn't to guess. Domino already knows the regional settings of the machine the code is running on, and exposes them through [`NotesInternational`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESINTERNATIONAL_CLASS.html). It's a small, read-only class — but it's the difference between locale-correct output and code that only works on the developer's laptop.

---

## TL;DR

- `session.International` returns a **read-only** `NotesInternational` — a live view of the host OS's regional settings.
- It reflects **the machine the code runs on**: a scheduled agent reads the *server's* settings, client code reads the *client's*. It is not the remote browser's locale in a web app.
- Date order is exposed as three booleans — `IsDateDMY` / `IsDateMDY` / `IsDateYMD` — plus the `DateSep` / `TimeSep` separators, so you can build a correct pattern instead of hard-coding `/` and `:`.
- Currency and number formatting: `CurrencySymbol`, `CurrencyDigits`, `DecimalSep`, `ThousandsSep`, `IsCurrencySuffix`, `IsCurrencySpace`, `IsCurrencyZero`.
- `TimeZone` uses the classic Notes convention — **positive means west of GMT** (Eastern Standard Time is `5`, not `-5`), and the docs hedge that it isn't a clean signed offset for every zone.
- The class has **no methods** — it's pure properties. Use it to interpret or format [`NotesDateTime`](/domino-news/en/posts/notes-datetime) values, not to change anything.

---

## Getting the object

`NotesInternational` is contained by `NotesSession` — there's no constructor, you read it off the session:

```lotusscript
Dim session As New NotesSession
Dim intl As NotesInternational
Set intl = session.International
```

The class description is explicit about how live it is:

> "Represents the international settings in the operating environment, for example, the Windows Control Panel international settings. When any of these settings is changed in the operating environment, Domino recognizes the new settings immediately."

So you don't cache it across a long-running process expecting a frozen snapshot — read it when you need it.

## What it exposes

Every property is read-only. The useful ones fall into four groups.

**Date and time shape**

| Property | Role |
|---|---|
| `IsDateDMY` / `IsDateMDY` / `IsDateYMD` | Which order the locale writes dates in |
| `DateSep` | Separator between date parts (`/`, `-`, `.`) |
| `TimeSep` | Separator between time parts (`:`) |
| `IsTime24Hour` | 24-hour vs 12-hour clock |
| `AMString` / `PMString` | The locale's words for AM / PM |

**Numbers and currency**

| Property | Role |
|---|---|
| `DecimalSep` / `ThousandsSep` | Decimal point and grouping separators |
| `CurrencySymbol` | e.g. `$`, `€`, `¥` |
| `CurrencyDigits` | Decimal digits in the number format |
| `IsCurrencySuffix` | Whether the symbol follows the number (`100$` vs `$100`) |
| `IsCurrencySpace` | Whether there's a space between symbol and number |
| `IsCurrencyZero` | Whether a leading zero shows before the decimal |

**Time zone and DST**

| Property | Role |
|---|---|
| `TimeZone` | Integer GMT offset (classic Notes sign convention — see caveats) |
| `IsDST` | Whether the format reflects daylight-saving time |

**Locale words**: `Today`, `Tomorrow`, `Yesterday` give the localized relative-day terms Notes uses in views.

## A worked example

This agent reads several settings and builds a date pattern matching the host locale's order — no hard-coded `/` or MDY assumption:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim intl As NotesInternational
  Set intl = session.International

  ' Report the formatting exceptions vs a US-default baseline
  Dim msg As String
  If intl.CurrencySymbol <> "$" Then
    msg = "Currency symbol is " & intl.CurrencySymbol
  End If
  If intl.DecimalSep <> "." Then
    If msg <> "" Then msg = msg & Chr(10)
    msg = msg & "Decimal separator is " & intl.DecimalSep
  End If
  If intl.IsTime24Hour Then
    If msg <> "" Then msg = msg & Chr(10)
    msg = msg & "Time is 24-hour"
  End If
  If msg = "" Then msg = "Locale matches the US default"
  Print msg

  ' Build a date pattern that matches the locale's actual order
  Dim pattern As String
  If intl.IsDateDMY Then
    pattern = "DD" & intl.DateSep & "MM" & intl.DateSep & "YYYY"
  ElseIf intl.IsDateMDY Then
    pattern = "MM" & intl.DateSep & "DD" & intl.DateSep & "YYYY"
  ElseIf intl.IsDateYMD Then
    pattern = "YYYY" & intl.DateSep & "MM" & intl.DateSep & "DD"
  End If
  Print "Locale date pattern: " & pattern
End Sub
```

The first block is adapted from the official [class example](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESINTERNATIONAL_CLASS.html); the [AM/PM example](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_AMSTRING_PROPERTY.html) shows the same read pattern for the time strings, and the date-order detection is the practical payoff — you now know whether to parse `01/02/2026` as January 2nd or February 1st.

## Three traps

**1. It's the host's settings, not the user's.** This is the one that surprises people. In a scheduled agent, `session.International` reads the *server's* regional settings. In client-side code it reads the *client's*. A web application rendering for a remote browser does **not** get that browser's locale this way — for true per-request locale in a web app you read the HTTP `Accept-Language` header yourself.

**2. It's read-only.** There are no setters and no methods at all — you can only read what the OS reports. To *change* formatting you change the OS regional settings (or build the string yourself from these values).

**3. `TimeZone` sign is the classic Notes convention.** It's an integer where, per the docs, the value "indicates the number of hours which must be added to the time to get Greenwich Mean Time" — so **positive is west of GMT**: GMT is `0`, US Eastern Standard Time is `5`, not `-5`. The docs add "in many cases, but not all" — don't treat it as a clean signed offset for every zone, especially across DST and half-hour zones.

## Pairing with NotesDateTime

`NotesInternational` tells you *how* the locale formats date-times; [`NotesDateTime`](/domino-news/en/posts/notes-datetime) holds the actual values. Use the former to interpret or display the latter — read `DateSep` and the `IsDateXYZ` flags to build a correct display or parse string, rather than hard-coding separators and order. The two are complementary: one is the format rules, the other is the data.

## What about Java and SSJS?

| Language | Counterpart | Obtained via |
|---|---|---|
| LotusScript | `NotesInternational` | `session.International` |
| Java | `lotus.domino.International` | `session.getInternational()` |
| SSJS / XPages | `International` | `session.getInternational()` |

The surface is consistent across all three — the same read-only locale properties. In Java and SSJS the property accessors are `getDateSep()`, `getCurrencySymbol()`, `isDateDMY()` and so on, but the values and the host-OS semantics carry over unchanged.
