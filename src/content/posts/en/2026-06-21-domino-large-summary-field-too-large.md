---
title: "'Field is too large (32K)' Is Lying to You: The Real Wall Is Usually the 64K Summary Buffer"
description: "An XPages save failure: the message says '32K', but every field checks out under 32K (the biggest is 26K) and it still won't save. Because the number the error names is usually not your problem — the wall you actually hit is 'a document's combined summary data is capped at 64K'. This article builds the summary / non-summary mental model and the two size limits first, then explains why ODS and LargeSummary are two different things, then forks the fixes on one question: should this data be summary at all?"
pubDate: 2026-06-21T07:30:00+08:00
lang: en
slug: domino-large-summary-field-too-large
tags:
  - "Domino Server"
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Increase the document summary data limit to 16 MB — HCL Domino 14.5.1"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/admn_increase_document_summary_data_limit.html"
  - title: "Enhancements introduced in ODS 55 in Domino 12 — HCL Domino 14.5.1"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/ods_55_introduced_in_domino_12.html"
  - title: "IsSummary (NotesItem - LotusScript) — HCL Domino Designer 14.5.1"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISSUMMARY_PROPERTY.html"
  - title: "ReplaceItemValue (NotesDocument - LotusScript) — HCL Domino Designer 14.5.1"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACEITEMVALUE_METHOD.html"
relatedJava: ["Item"]
relatedSsjs: ["Item"]
---

A user presses Submit on an XPages form, the save fails, and out comes:

```text
Notes error: Field is too large (32K) or View's column & selection formulas are too large
```

So you go hunting, as the message tells you, for "the field over 32K." You check every field — none crosses 32K, the largest is 26,245 bytes. And the document as a whole is actually **big** — around **7,847,405 bytes (close to 8MB)** — yet every field is within limits. Everything looks safe, yet it won't save. Copy the document to a test database, type a few more characters into any field, and the error reproduces every time.

The thing is: **the number this error names is usually not the wall you actually hit.** It says "32K", but here the wall is a different number that never gets named anywhere in the message — **a document's combined summary data is capped at 64K**.

Sit with that contrast for a second: **the document body is nearly 8MB, yet a 64K limit blocks it.** That absurdity is itself the clue — the 64K doesn't govern the whole document, only the slice of it flagged as summary. A document can be huge (rich text, attachments, long content all fit); the only scarce thing, the thing that overflows, is that 64K of summary budget.

This article builds the mental model first (the two kinds of item in a document, the two size limits), then explains why ODS and LargeSummary are two separate things, and finally forks the fix on one question: **should this data be summary at all?**

---

## TL;DR

- Every item in a document carries a **summary flag**. Summary items go into a compact block that views / folders / search can read quickly; non-summary items don't.
- **Two numbers, two walls**: a single summary item is capped at **32K**; a document's combined summary data is capped at **64K**. The error can only name 32K, but many "but no field is over the limit" cases are hitting the 64K wall.
- Items created by `ReplaceItemValue` / `AppendItemValue` **default to summary** — which is why programmatic writes fill up the 64K without anyone noticing.
- **ODS is the bottle, LargeSummary is the cap**: ODS55 lets the file format *hold* large summary data, but the limit only opens once you run `compact -LargeSummary on`. Bumping ODS (e.g. upgrading to R12) does not open that cap.
- Fork the fix by asking "should this be summary?": **yes** → enable LargeSummary on the database (64K → 16MB); **no** → set the item's `IsSummary = False` in code to move it out of the summary block.

---

## A document actually holds two kinds of item

To read this error correctly, you first need to know how Domino stores a document. Every item in it carries a **summary / non-summary** flag — which is not the same thing as "how big the data is." It's "does this value go into the block that views read quickly."

- **summary item**: the value goes into the document's **summary buffer**. Views, folders, selection formulas, and some search/index paths read that buffer to display, sort, categorize, and filter *without opening the whole document*. Status, category, dates, key fields — the values that need to show up in a list — are summary by nature.
- **non-summary item**: the value isn't in the buffer, it lives only in the document body. Long text, rich text, JSON, attachments — content used only on the document page, not needed in a list — belong here (rich text is non-summary by nature).

The read-write `Boolean` [`NotesItem.IsSummary`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISSUMMARY_PROPERTY.html) is that flag. The official definition: "Indicates whether an item contains summary or non-summary data." `True` = summary (can appear in views / folders), `False` = non-summary (can't).

**The key is that the combined size of all summary items in a document is capped.** So "no individual field is over 32K" is nowhere near enough evidence — Domino isn't judging which field on your form looks biggest, it's checking whether the summary buffer as a whole is full.

## Two numbers, two walls

Plainly:

| Wall | Limit | When you hit it |
|---|---|---|
| single summary item | **32K** | one field's value is too big on its own |
| combined summary per document | **64K** | a pile of medium summary fields add up |

The error `Field is too large (32K)` can only report the first wall (and it's bolted onto "view formula too large" in the same sentence). But the one that sends people in circles is the second: **no single field is over 32K, but a dozen fields in the twenty-something-K range, plus storage overhead, push past 64K.** That's exactly this case — the largest field was 26K while the document's summary was already pressed up against 64K, so "a few more characters" tipped it over.

> A branch worth naming: if the error shows up while **opening a view, rebuilding an index, or changing view design**, the part to investigate is the message's second half — "view column / selection formula too large" — which has nothing to do with the summary buffer. Here it appeared **on save** and reproduced by adding text, which points squarely at summary.

## Why programmatic writes hit the wall most easily

With plain Notes form fields, you generally know at design time which ones should show in a view. But XPages, agents, WebQuerySave code, back-end services — anything that **writes documents in code** — has one default that's easy to forget: a new item created by [`ReplaceItemValue`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REPLACEITEMVALUE_METHOD.html) defaults to `IsSummary = True`.

So this innocent-looking code drops a payload into the summary buffer:

```lotusscript
Call doc.ReplaceItemValue("LargePayload", payload)
Call doc.Save(True, False)
```

If `LargePayload` is JSON, an approval trail, an external-system response, or a plain note — something that doesn't need to appear in a list, sort, or filter — it **shouldn't be spending the summary budget at all**. Every field like that eats into the 64K, until one day a user types a few extra characters and it overflows.

## ODS is the bottle, LargeSummary is the cap

The easiest wrong call in this case: **"The database is already ODS55, so how can it still hit 64K?"**

Because ODS and LargeSummary are two different things:

- **ODS55 (the bottle)** is a file-format capability. Per HCL's [ODS55 documentation](https://help.hcl-software.com/domino/14.5.1/admin/ods_55_introduced_in_domino_12.html): from Domino 12, ODS55 raises a single summary field to **16 MB**, non-summary fields to roughly 1 GB, and a document to a maximum of 4 GB.
- **LargeSummary (the cap)** is whether that capability is turned on *for this database*. You enable it with `compact -LargeSummary on` — and **bumping the ODS does not open the cap automatically**.

That's exactly the trap here: the database had run since R9.0.1 FP6 and was upgraded to R12 last year, so its ODS rode up to 55 — but the **LargeSummary flag was never turned on**. `show directory` confirmed it: not enabled. A bigger bottle, with the cap still screwed shut.

The docs also flag two boundaries worth remembering:

- a view's **key length + data length still can't exceed 64KB** (LargeSummary doesn't help that).
- once enabled, if a document really does end up with an item larger than **65,406 bytes**, **pre-R12 Notes clients and Domino servers may be unable to access it** — watch out in mixed-version environments.

> For how ODS itself evolved and exactly what triggers an upgrade (e.g. whether copying an old-ODS database to a newer server bumps it), there's a [follow-up piece](/domino-news/posts/domino-ods-versions/) that unpacks this.

## The fix: first ask "should this be summary?"

Don't reflexively reach for LargeSummary on sight of this error. Ask one question first, then fork:

### Should be summary → enable LargeSummary on the database

If those large fields genuinely **need to be shown in views, consumed by DQL / search, sorted or categorized**, then they're meant to be summary, and the move is to let the database hold more summary data. That was the choice in this case.

**Confirm the current state first.** On site I used `show directory` (`sh dir`) at the server console to check this database's LargeSummary status — it came back not enabled, exactly matching the "ODS went up, the flag never did" diagnosis. Only after confirming "the capability is there, the switch is off" did I run:

```text
load compact -c -LargeSummary on "xxx.nsf"
```

HCL also documents the short form `-ls on`. The ceiling goes from 64K to 16 MB. Things to keep in mind:

- **This is structural maintenance, not an ordinary space-reclaiming compact.** Confirm your restore path, pick a maintenance window, check replica / cluster / client version compatibility. A database upgraded from an older release — ODS bumped but the flag never flipped — is an extremely common gap.
- ⚠️ **LargeSummary applies to the Domino server only. The docs state plainly that "The Notes client's document summary data limit is only 32 KB."** Pure web / XPages (server-side) is fine, but if the same documents are also opened and edited in a Notes client, the client's limit doesn't loosen just because the server enabled LargeSummary.
- Disabling is just `off` instead of `on`, but don't toggle it casually — data already written as large summary doesn't become safe again the moment you turn the flag off.

### Should not be summary → set it non-summary in code

If those large fields are really payload that has no business in a view (JSON, full approval history, external sync data, long text shown only on the detail page), the right fix isn't to raise the ceiling — it's to **move them out of the summary buffer**.

Think back to that nearly-8MB document from the opening: it could grow that large and still only the summary slice overflowed — which is exactly why large payload belongs in non-summary. There's plenty of room over there (a single field up to ~1GB, a document up to 4GB); don't make a blob of attachment or a wall of JSON fight for space in a summary budget of only 64K. The write looks like:

```lotusscript
Dim item As NotesItem
Set item = doc.ReplaceItemValue("ExternalPayload", payload)
item.IsSummary = False
```

For existing documents, write a repair agent that opens each target item, changes `IsSummary`, and saves. Two cautions:

- ⚠️ **Don't convert blindly.** If a field is used by a view column, selection formula, category, sort, or existing code, moving it to non-summary will blank a column, break a filter, or change query results.
- ⚠️ **Watch out for "reset".** A common real-world gotcha: if the document is later opened and saved through a **Notes form that contains that field**, the field's summary flag can be re-asserted to the form's default (back to summary). The official property page doesn't spell this out, but environments mixing client forms with back-end code should guard against it.

## How I'd diagnose it

```text
1. Where does the error fire: on save → check item / summary; opening a view / rebuilding index → check view design
2. Copy the problem document to a test area, add a little text, confirm you can cross the limit reproducibly
3. List the document's items, inspect each one's ValueLength / Type / IsSummary
4. Check the database's ODS level + whether LargeSummary is enabled
5. Decide whether each large item should be summary at all
6. Should be → enable LargeSummary; should not → fix the write path + repair existing docs to non-summary
```

In this case step 2 was the clue: no single field over 32K, yet it failed the moment a little text was added — a sign that all but announces "this document was already sitting against a combined limit", pulling the focus from "find the big field" back to "the whole summary total."

**Remember the judgment in one line: when "every field is within its limit but a few extra characters tip it over", the problem isn't any one field — it's the combined summary total.** This case's nearly-8MB document, whose biggest field was only 26K, is the loudest possible version of that signal — the document's size was never the point; the only thing that mattered was whether that 64K of summary budget was full.

## What about Java and SSJS?

- **Java (`lotus.domino.Item`)**: same concept via `isSummary()` / `setSummary()`; `getValueLength()` returns the internal stored bytes including overhead, which is handy for auditing summary usage.
- **SSJS / XPages**: the back-end `NotesItem` also has `IsSummary`. When XPages writes a document, check whether your data source and the item your code finally creates is still summary.

In one line: **the point isn't "see the error, enable LargeSummary." It's to first decide whether the data should be summary at all — if yes, make the database hold it; if no, move it out of the summary buffer.**
