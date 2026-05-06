---
title: "NotesView.GetAllDocumentsByKey: The Lookup Workhorse, and Five Things That Trip People Up"
description: "GetAllDocumentsByKey is the LotusScript lookup method everyone uses — pass a key, get back the matching documents. But the small print — keys match the view's sorted column (not document fields), exactMatch defaults to False (so it's prefix-match unless you opt in), backslash-categorised columns silently break it, and the returned collection has no defined order — gets missed even by experienced devs. This piece walks the signature, the by-key family, five real pitfalls, and complete examples."
pubDate: 2026-05-09T07:30:00+08:00
lang: en
slug: getalldocumentsbykey
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesView class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEW_CLASS.html"
  - title: "NotesView.GetAllDocumentsByKey method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETALLDOCUMENTSBYKEY_METHOD.html"
  - title: "NotesView.GetDocumentByKey method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETDOCUMENTBYKEY_METHOD.html"
relatedJava: ["View"]
relatedSsjs: ["View"]
---

## Why almost every LotusScript developer has used this method

`GetAllDocumentsByKey` on the [`NotesView`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEW_CLASS.html) class is the everyday lookup primitive in Notes development — pass a key, get back every document that matches. "All orders for this customer this year." "All tasks tagged to this project." "All contracts under this account." It's almost always GetAllDocumentsByKey under the hood.

But the method has design quirks the docs spell out and most people don't read all the way through. There are five common pitfalls, and this guide walks each one.

## Signature

```
Set collection = notesView.GetAllDocumentsByKey( keyArray [, exactMatch%] )
```

| Parameter | Type | Notes |
|---|---|---|
| `keyArray` | String, Integer, Long, Double, or array of String / Number / `NotesDateTime` / `NotesDateRange` | The key to match (single key, or array of keys aligned with multiple sorted columns) |
| `exactMatch%` | Boolean, optional | `True` for exact match, `False` (default) for partial / prefix match |
| Return | `NotesDocumentCollection` | All matching documents; on no-match, returns an *empty* collection (count = 0), not Nothing |

## Three concepts to internalise first

### 1. The key matches the view's *sorted column*, not a document field

The most common newbie misread: "key" is **not** matching against a document field directly. It's matching against the value of a **sorted column** in the view, as that column would compute it for each doc.

Quoting the docs: "For the GetAllDocumentsByKey method to work, you must have at least one sorted column for each key."

In practice:

- View's first sorted column is `Customer` (display formula = `customer` field) → key = a customer name → just works.
- View's first sorted column is a formula `Customer + " - " + ProjectName` → key has to be the full computed string `"Customer X - Project Y"`, not either field alone.

The column's "Programmatic name" doesn't matter — only what the column **computes** for each document.

### 2. `exactMatch%` defaults to **False** (prefix match)

This default is the most-cited footgun. If you write:

```lotusscript
Set col = view.GetAllDocumentsByKey("cat")
```

You'll get back **`cat`, `category`, `catalog`, `catfish`** — because the default is prefix match. Per the docs:

- `exactMatch=True` → "'cat' matches 'cat' but does not match 'category,' while '20' matches '20' but does not match '201.'"
- `exactMatch=False` (default) → "'T' matches 'Tim' or 'turkey,' but does not match 'attic,' while 'cat' matches 'catalog' or 'category.'"

For strict equality, always pass `True`:

```lotusscript
Set col = view.GetAllDocumentsByKey("cat", True)   ' only "cat", not "category"
```

### 3. Multi-column keys use an array, in column order

When the view has two sorted columns (say `Customer`, then `Year`), to query "this customer's docs from 2026":

```lotusscript
Dim keys(0 To 1) As String
keys(0) = "Bryan Inc."
keys(1) = "2026"
Set col = view.GetAllDocumentsByKey(keys, True)
```

Array order **must match** the sorted-column order. The array can be **shorter** than the number of sorted columns (one key matches just the first column, the others stay unconstrained), but never longer.

## The whole by-key method family

GetAllDocumentsByKey isn't alone — it has siblings:

| Method | Returns | Use when |
|---|---|---|
| `GetDocumentByKey(key, [exact])` | A single `NotesDocument`, or **Nothing** on no-match | You expect a unique key and only want the first hit (fastest) |
| [`GetAllDocumentsByKey(key, [exact])`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETALLDOCUMENTSBYKEY_METHOD.html) | `NotesDocumentCollection`, empty if no match | You want every matching doc as full document objects |
| `GetAllEntriesByKey(key, [exact])` | `NotesViewEntryCollection` | You want view entries (not docs) — to access `ColumnValues`, unread state, position, or other view-only metadata |
| `GetAllReadEntries()` | `NotesViewEntryCollection` | All entries in the view that the current user has read |
| `GetAllUnreadEntries()` | `NotesViewEntryCollection` | Same, but unread |

Selection rule: **one hit → `GetDocumentByKey`; full doc objects → `GetAllDocumentsByKey`; view metadata (column values, unread) → `GetAllEntriesByKey`.** The entry-based variants are *lighter* — you don't load full docs into memory — and noticeably faster on large result sets.

## Complete examples

### Single-key lookup

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim view As NotesView
    Dim col As NotesDocumentCollection
    Dim doc As NotesDocument

    Set db = session.CurrentDatabase
    Set view = db.GetView("(byCustomer)")  ' first sorted column = Customer
    If view Is Nothing Then
        Error 1, "View (byCustomer) not found"
    End If

    ' Strict match — only docs where Customer = "Bryan Inc." exactly
    Set col = view.GetAllDocumentsByKey("Bryan Inc.", True)

    If col.Count = 0 Then
        Print "No matches"
        Exit Sub
    End If

    Print "Found " & col.Count & " match(es):"
    Set doc = col.GetFirstDocument()
    Do Until doc Is Nothing
        Print "  - " & doc.Subject(0)
        Set doc = col.GetNextDocument(doc)
    Loop
End Sub
```

### Multi-column lookup

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim view As NotesView
    Dim col As NotesDocumentCollection

    Set db = session.CurrentDatabase
    Set view = db.GetView("(byCustomerYear)")  ' sorted: Customer, Year

    Dim keys(0 To 1) As Variant
    keys(0) = "Bryan Inc."
    keys(1) = "2026"

    Set col = view.GetAllDocumentsByKey(keys, True)
    Print "Bryan Inc. orders in 2026: " & col.Count
End Sub
```

## Five pitfalls

### 1. The column isn't sorted — silently returns nothing

If the view's first column doesn't have "Sort: Ascending / Descending / Click on column header to sort" enabled, the method **does not work**. But it doesn't raise an error — it returns an empty collection, so you assume "no matches."

To debug: open the view in Designer, click the first column, properties panel → Sorting tab → confirm Sort is Ascending or Descending.

### 2. Backslash-categorised columns (`Cat\\Subcat`) silently break [`GetDocumentByKey`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_GETDOCUMENTBYKEY_METHOD.html)

Per the docs: "columns formatted with both categories and subcategories using the '\\\\' character will prevent the method from locating documents."

If a sorted column uses backslashes for two-level categories (`Region\Country`, `Year\Month`), the by-key methods can't find documents in it. Workaround: split into two separate sorted columns and use an array key.

### 3. `exactMatch=False` (the default) catches what it shouldn't

Covered above. **Always pass `exactMatch%=True`** unless you genuinely want prefix matching. Leaving it default is one of those "what felt sensible in 1996 doesn't feel sensible now" defaults — designed for "find customers whose name starts with C" rather than the strict-lookup case modern code usually wants.

### 4. Date / DateTime keys must be `NotesDateTime`, not strings

Passing the string `"2026-05-09"` mostly won't match — Notes view sorted columns store dates as Date objects, not strings. The right way:

```lotusscript
Dim dt As New NotesDateTime("2026-05-09")
Set col = view.GetAllDocumentsByKey(dt, True)
```

Only when the column itself is a string-displayed date (e.g. via `@Text(@Date(date_field))`) should the key be a string. For genuine date fields, always wrap in `NotesDateTime`.

### 5. The returned collection has no defined order, no ColumnValues access

"Documents returned by this method are in no particular order, and do not provide access to ColumnValues." This catches people doing both:

- **Need view-order processing** → switch to `GetAllEntriesByKey`, then iterate `NotesViewEntry`.
- **Need the column values that the view computed** (without re-loading every field on the doc) → same fix; `NotesViewEntry.ColumnValues` is the property you want.

`GetAllDocumentsByKey`'s output is a bare collection of documents in undefined order. If order or column data matters, you're on the entry path, not the document path.

## What about Java and SSJS?

| Language | Equivalent |
|---|---|
| LotusScript | `view.GetAllDocumentsByKey(...)` |
| Java | `lotus.domino.View.getAllDocumentsByKey(...)` — same signature, same case-sensitivity behaviour, same parameter semantics |
| SSJS (XPages) | Same as Java (SSJS uses `lotus.domino.*` via Java imports) |

The Domino API stays consistent across these three — once you've internalised the LS version, Java / SSJS work the same way; the only differences are syntactic packaging (`Set col = view...` in LS vs `DocumentCollection col = view.getAllDocumentsByKey(...)` in Java).

## Closing

GetAllDocumentsByKey looks deceptively simple — three parameters, one return value — but the `exactMatch%=False` default, the "key matches sorted column" concept, and the "empty collection on miss / no defined order" caveats are exactly the things that bite even experienced devs. Half a minute reviewing this list before writing your next lookup beats the hour you'll otherwise spend debugging why `Set col = view.GetAllDocumentsByKey("cat")` is also pulling back catalog and category.
