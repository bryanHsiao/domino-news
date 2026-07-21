---
title: "DQL View Date-Column Lookups: Three Ways a Type or Time Zone Silently Eats Your Results"
description: "\"Converting the column to a date, some documents match and some don't — weird.\" A field report: a DQL view-column date query that returned inconsistent results turned out to have three independent causes. DQL never auto-converts types (so the column's output type must match your query term), the source field held mixed text/date values, and @dt without a time-zone offset is UTC — which corrupts boundary documents without changing the total count. Two verified fixes, tested 6/6."
pubDate: 2026-07-20T07:30:00+08:00
lang: en
slug: dql-view-date-column
tags:
  - "DQL"
  - "Tutorial"
sources:
  - title: "DQL: date and time — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_date_and_time.html"
  - title: "DQL syntax — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_syntax.html"
  - title: "DQL view column lookups — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_view_column.html"
  - title: "Field report: DQL view date-column type & time-zone case (domino-dev-kb)"
    url: "https://bryanhsiao.github.io/domino-dev-kb/cases/2026-07-16-dql-view-date-column/"
relatedJava: ["DominoQuery"]
relatedSsjs: ["DominoQuery"]
cover: "/covers/dql-view-date-column.webp"
coverStyle: "paper-craft"
---

An engineer came to me with a puzzle: "I converted the view column to a date and query by it — but some documents match and some don't. It's weird." A DQL date lookup that works for *some* documents is the worst kind of bug, because it looks like it works. We took it apart with single-variable tests, and the "one weird bug" turned out to be **three independent causes** stacked on top of each other. Every one of them fails silently — no error, just a wrong count you'd never question.

This is that field report. The full [eight-query test matrix is in the knowledge-base case](https://bryanhsiao.github.io/domino-dev-kb/cases/2026-07-16-dql-view-date-column/); here's what each cause is and how to defuse it. (Environment: Domino 12.0.2, a 412-document test database — 404 real mixed-type documents plus 8 control files.)

---

## TL;DR

- **DQL never auto-converts types.** The type of your query term must match the **final output type of the view column** — `'...'` searches text, `@dt(...)` searches dates. A mismatch doesn't error; it silently returns 0.
- Watch the column formula's *output*: `@If(@IsText(x); x; @Text(...))` outputs **text on both branches**, so that's a **text** column — query it with `'...'`, not `@dt`.
- **Mixed-type source data:** if the underlying field stores dates as text in some documents and as datetime in others, an `@dt` query only matches the datetime ones. In the test, a 6-document set returned **4** — the text-typed ones vanished. The 404 real documents held dozens of text dates across several years, meaning an input path is still writing text dates. Clean the data *and* fix the source.
- **The time-zone trap (the dangerous one):** `@dt('...T00:00:00Z')` with no `+08:00` offset is **UTC**. In the test it returned the same total count (6) but with one boundary document missed and one wrongly included — verifying by count alone can't catch it. You must check boundary documents one by one.
- View-column searches reject a date-only `@dt`: `Partial TIMEDATEs NOT supported with view column lookup, specify a full TIMEDATE`.
- **Two fixes, both verified 6/6:** (A) force a zero-padded `yyyy/mm/dd` text column and compare as text, or (B) `@TextToTime` everything to datetime and query with a full timestamp carrying `+08:00`.

## Cause 1: the iron rule — DQL matches types, it does not convert them

This is the rule everything else hangs on. When you write a view-column DQL term, the *type of the value you write* decides what type gets searched. The docs put it plainly — "the type of data searched for is defined by the type of data specified in the query." Write `'2024/01/01'` and you're searching **text**; write `@dt('2024-01-01T00:00:00+08:00')` and you're searching a **datetime**. If the column doesn't output that type, DQL doesn't coerce and doesn't complain — it just finds nothing.

This is the rule behind [DQL view-column lookups](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_view_column.html), and the subtle part is reading the column formula for its *output* type, not its inputs. A formula many people write to "handle both cases" —

```
@If(@IsText(DocDate); DocDate; @Text(DocDate))
```

— outputs **text on both branches**. It's a text column, full stop, even though the field is "sometimes a date." Query that with `@dt` and you get zero, silently. The first diagnostic question is therefore always: *what type does this column's formula actually output?*

## Cause 2: mixed-type source data

Even with the right query type, you can lose documents if the *source field* isn't uniformly typed. In the test database the `DocDate` field held **both** strings and datetimes across the 404 real documents — the very reason the original column formula had that `@IsText(DocDate)` branch. Reproducing it (a mixed-type column queried with `@dt`) returned **4 of 6** documents: the datetime-typed ones matched, the text-typed ones silently dropped out.

Two takeaways. First, a partial result here isn't "some documents are wrong" — it's "documents of the other type are invisible to this query type." Second, dozens of text-typed dates spread across several years means this isn't a one-off import glitch; **something is still writing text dates**. Cleaning the existing data fixes today; finding and fixing the input path stops it recurring.

## Cause 3: the time zone that changes members without changing the count

This is the one that survives casual testing. Per the [DQL date-and-time docs](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_date_and_time.html), "without timezone modifiers (+ or – hh:mm suffixes) all times are taken as UTC values (GMT)." So `@dt('2024-01-01T00:00:00Z')` — or any `@dt` you wrote without `+08:00` — is asking about **UTC midnight**, which in Taipei is 08:00 that morning. Documents right at the day boundary land on the wrong side.

The nasty part, from the test: omitting `+08:00` returned **the same total count** as the correct query — 6 either way — but a boundary document that *should* have matched (T1) was excluded, and one that *shouldn't* have (T4) was included. If your test is "did I get the expected number of rows?", this passes. The only way to catch it is to check the **boundary documents individually**, not the count.

## The partial-TIMEDATE error

One related wall you'll hit while experimenting: a date-only `@dt` doesn't work for view-column lookups at all. `'myview'.datefield < @dt('2024-01-01')` errors with:

> Partial TIMEDATEs NOT supported with view column lookup, specify a full TIMEDATE

The docs say the same in gentler words — "partial date values cannot be found using view searching" — and give the fix: "specify the entire value, for example: `@dt('2018-09-01T00:00:00.000Z')`." For a view lookup you always give a complete timestamp (and, per Cause 3, put the real offset on it).

## The two fixes — both verified 6/6

**Solution A — normalise the column to zero-padded text, compare as text.** The catch is that `@Text(@Date(...))` follows the machine's regional settings and may *not* zero-pad (it produced `2024/1/5`, which sorts and compares wrong). So you force the padding in the formula:

```
_d := @If(@IsText(DocDate); @TextToTime(DocDate); DocDate);
@Text(@Year(_d)) + "/" + @Right("0" + @Text(@Month(_d)); 2) + "/" + @Right("0" + @Text(@Day(_d)); 2)
```

Then query as text against that column:

```
'viewName'.$123 >= '2024/01/01'
```

Zero-padded `yyyy/mm/dd` text sorts chronologically, so range comparisons work. Result in the test: **6/6**.

**Solution B — unify to datetime, query with a full offset-bearing timestamp.** Collapse the mixed types to real dates in the column, then always pass a complete `@dt`:

```
@If(@IsText(DocDate); @TextToTime(DocDate); DocDate)
```

```
'viewName'.$123 >= @dt('2024-01-01T00:00:00+08:00')
```

Result: **6/6**, with the index confirmed in the query plan. Either solution works; pick text-normalisation if the column is display-facing anyway, datetime if you need real date arithmetic downstream.

## And a fourth cause worth ruling out

If after all this a query still comes back short, there's one more silent filter that isn't about type or time zone at all: when the view's **selection formula isn't `@All`**, documents excluded by that selection are simply not in the view for DQL to find — another way rows "disappear" with no error. That mechanism is the subject of the companion [DQL @All pitfalls piece](/domino-news/en/posts/dql-pitfalls); it's the fourth thing to check when the count is wrong and the types are right.

## What about Java and SSJS?

| Language | DQL entry point |
|---|---|
| LotusScript | `NotesDominoQuery` (`db.CreateDominoQuery()`) |
| Java | `lotus.domino.DominoQuery` |
| SSJS / XPages | `DominoQuery` via the Java back-end |

DQL is one query engine reached through a thin per-language wrapper, so none of this is language-specific: the type-matching rule, the UTC default on `@dt`, and the full-timestamp requirement for view lookups behave identically whether you build the query in LotusScript, Java, or SSJS. For getting started with the query language itself, see [DQL: getting started](/domino-news/en/posts/dql-getting-started).
