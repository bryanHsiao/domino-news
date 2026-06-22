---
title: "NotesViewEntry × NotesViewEntryCollection: Reading Every Row of a View Fast, Without Opening Documents"
description: "To read a few field values from every document in a view, many people loop the documents and GetItemValue each one — but that opens every document, and a few thousand rows is painfully slow. NotesViewEntry reads the view's already-computed ColumnValues without opening a document at all; NotesViewEntryCollection is the collection of those rows, skips category/total rows, and supports set operations and StampAll batch updates. This article covers the 'read the view fast' pair, why ColumnValues is the performance key, and an entry's identity and hierarchy properties."
pubDate: 2026-06-22T07:30:00+08:00
lang: en
slug: notes-view-entry
tags:
  - "LotusScript"
  - "Tutorial"
  - "Performance"
sources:
  - title: "NotesViewEntry class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_2925.html"
  - title: "NotesViewEntryCollection class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRYCOLLECTION_9327.html"
  - title: "NotesView class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
relatedJava: ["ViewEntry", "ViewEntryCollection"]
relatedSsjs: ["ViewEntry", "ViewEntryCollection"]
---

You need to read "order number, amount, status" from every document in a view for a report. The instinctive approach: loop the documents in the view and `doc.GetItemValue("...")` each one. It works — but it **opens every single document once**, and across a few thousand rows it gets slow enough to make you question your life choices.

Here's the key: **those values are already computed and displayed by the view.** What you want is already in the view's index; you don't need to open the documents again. [`NotesViewEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_2925.html) (a row in the view) hands you that row's column values directly through `ColumnValues`; [`NotesViewEntryCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRYCOLLECTION_9327.html) is the collection of those rows. This pair is the right answer for "reading a view fast."

---

## TL;DR

- `NotesViewEntry` is "a row in a view" (per the docs); `NotesViewEntryCollection` is the collection of those rows.
- **The core advantage**: `entry.ColumnValues` reads the view's already-computed column values — **without opening a document** — an order-of-magnitude speedup over looping documents and `GetItemValue`.
- Get it from: `view.AllEntries` (all), `view.GetAllEntriesByKey(key)` (by sort key), `view.GetEntryByKey(key)` (a single one).
- Walk a collection with `GetFirstEntry` / `GetNextEntry` / `GetNthEntry`; it **contains only document rows, not category or total rows**.
- An entry's identity / hierarchy properties: `UniversalID`, `NoteID`, `IsCategory` / `IsDocument` / `IsTotal`, `IndentLevel`, `ChildCount`.
- Batch operations: `StampAll` (set one field across the whole batch), set operations `Intersect` / `Merge` / `Subtract`, `PutAllInFolder`.

## Two classes, one relationship

- **`NotesViewEntryCollection`** — the official definition: "Represents a collection of view entries, selected according to specific criteria." A batch of view rows.
- **`NotesViewEntry`** — "A view entry represents a row in a view." One of those rows.

Get it from a [`NotesView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html):

```lotusscript
Dim view As NotesView
Set view = db.GetView("Orders")
Dim vc As NotesViewEntryCollection
Set vc = view.AllEntries
```

To filter by sort key, use `view.GetAllEntriesByKey(key)`.

## The core advantage: ColumnValues without opening a document

This is the whole point. `NotesViewEntry.ColumnValues` is an array of **that row's value in each view column** — values the view already computed and stored in the index. So:

```lotusscript
Dim entry As NotesViewEntry
Set entry = vc.GetFirstEntry()
Do Until entry Is Nothing
    Dim cols As Variant
    cols = entry.ColumnValues        ' the row's column values, no document opened
    Print cols(0) & " / " & cols(1) & " / " & cols(2)
    Set entry = vc.GetNextEntry(entry)
Loop
```

Compare that to "loop the documents and `GetItemValue` each" — that reads every full document from disk into memory. When you only need the columns visible in the view, and the view already has them, `ColumnValues` is an order-of-magnitude difference. **Reports, exports, batch inventory — anything that "just reads the values shown in the view" should go this way.**

> A caution the other direction: `ColumnValues` is indexed by the **view's column order**, not by field name. Change the column order in the view design and the `n` in `cols(n)` shifts with it — so the cost of this trick is "coupled to the view design." When you need stable field names, or a field the view doesn't show, fall back to `entry.Document.GetItemValue(...)`.

## An entry's identity and hierarchy

Each entry also carries document identity and view-hierarchy information:

| Property | Holds |
|---|---|
| `UniversalID` | the document's UNID (unique across replicas) |
| `NoteID` | the row's note ID |
| `Document` | the corresponding `NotesDocument` (only when you need to open it) |
| `IsDocument` / `IsCategory` / `IsTotal` | whether the row is a document / category / total row |
| `IndentLevel` / `ChildCount` / `DescendantCount` | position in the view hierarchy and descendant counts |
| `IsConflict` | whether it's a replication/save conflict document |

`IsCategory` / `IsTotal` are handy — the docs state a ViewEntryCollection "never contain categories or totals", but if you switch to a `NotesViewNavigator` to walk the view, you'll meet category and total rows, and these flags tell them apart.

## Batch operations: StampAll and set operations

A collection isn't just for reading — it can modify in bulk:

- **`StampAll(itemName, value)`** — set one field across **every document in the collection to the same value at once**, without opening and saving each one; the server processes it in bulk and it's very fast. Perfect for "set Status to Closed across this batch."
- **Set operations**: `Intersect`, `Merge`, `Subtract`, `Contains` — apply set logic across two collections.
- `PutAllInFolder` / `RemoveAll` / `UpdateAll` and other batch actions.

```lotusscript
' Set Status to Closed across the batch matching a key
Dim vc As NotesViewEntryCollection
Set vc = view.GetAllEntriesByKey("2026-Q2")
Call vc.StampAll("Status", "Closed")
```

## What about Java and SSJS?

| Language | Counterpart | Obtained via |
|---|---|---|
| Java (`lotus.domino.*`) | `ViewEntry` / `ViewEntryCollection` | `view.getAllEntries()` / `view.getAllEntriesByKey(key)` |
| SSJS / XPages | `ViewEntry` / `ViewEntryCollection` | same |

Consistent across all three: `getColumnValues()` reads column data without opening a document, `stampAll()` does the bulk update, the set operations are the same. When XPages back-end code builds a report or export, "read ColumnValues instead of opening documents" is the same performance key.
