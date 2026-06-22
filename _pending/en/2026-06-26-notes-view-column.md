---
title: "NotesViewColumn: Reading a View's Columns, Their Formulas, and Sorting in Code"
description: "You want to inventory a view — which columns it has, whether each is a field or a formula, what's sorted or categorized, what's hidden — without opening Designer. NotesViewColumn reads that from code. This article covers getting it from view.Columns, the Title / ItemName / Formula / Position / IsSorted / IsCategory / IsHidden / IsField / IsFormula properties, and how it lines up with the earlier NotesViewEntry's ColumnValues (the same Position index)."
pubDate: 2026-06-26T07:30:00+08:00
lang: en
slug: notes-view-column
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesViewColumn class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWCOLUMN_CLASS.html"
  - title: "NotesView class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
  - title: "Formula property (NotesViewColumn) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FORMULA_PROPERTY_VIEWCOLUMN.html"
relatedJava: ["ViewColumn"]
relatedSsjs: ["ViewColumn"]
---

You inherit an undocumented database and want to figure out what a view actually looks like: which columns it has, whether each shows a field or a formula, which are sorted, which is a category, which are hidden. Clicking through Designer column by column works — but what about a tool to inventory dozens of views?

That's what [`NotesViewColumn`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWCOLUMN_CLASS.html) is for. The official definition: "Represents a column in a view or folder." It lets you **read a view's column definitions from code** — the same "read the design" capability as the earlier [`NotesForm`](/domino-news/posts/notes-form/) piece reading form design. And it lines up neatly with the recent [`NotesViewEntry`](/domino-news/posts/notes-view-entry/): the values in `ViewEntry.ColumnValues` correspond to exactly these columns.

---

## TL;DR

- Get it from [`NotesView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html)'s `Columns` property (an array of all the view's columns).
- **Read the title and source**: `Title` (column header), `ItemName` (the programmatic name, usually the field name), `Formula` (if the column is a formula).
- **Tell the column's type**: `IsField` (value comes from a field), `IsFormula` (value comes from a simple function or formula), `IsCategory` (it's a category column).
- **Sorting and display**: `IsSorted`, `IsResortAscending`, `IsHidden`, `Width`, `IsResize`.
- `Position` — the column's place in the view, **left to right, starting at 1**. That index lines up with `ViewEntry.ColumnValues`.

## Getting and walking them

```lotusscript
Dim view As NotesView
Set view = db.GetView("Orders")
Dim col As NotesViewColumn
Forall col In view.Columns
    Print col.Position & ": " & col.Title & " (" & col.ItemName & ")"
End Forall
```

`view.Columns` gives you the array of the view's columns; read each one's properties and you've inventoried the whole view's column structure.

## What each property says

| Property | Holds |
|---|---|
| `Title` | column header (read-write) |
| `ItemName` | "the programmatic name of a column, which is usually the field (item) name" (read-only) |
| `Formula` | the column's formula (read-write, if it's a formula column) |
| `Position` | the column's place, **left to right starting at 1** (read-only) |
| `IsField` | whether the value comes from a field (read-only) |
| `IsFormula` | whether the value comes from a simple function / formula (read-only) |
| `IsCategory` | whether it's a category column (read-only) |
| `IsSorted` | whether it auto-sorts (read-write) |
| `IsHidden` | whether it's hidden (read-write) |
| `Width` / `IsResize` | column width / whether resizable |

To "auto-generate view documentation," these are the key ones: `IsField` / `IsFormula` distinguish a column that shows a field directly from one that's computed; if it's a formula, read [`Formula`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FORMULA_PROPERTY_VIEWCOLUMN.html) to pull that formula out.

## Lining it up with NotesViewEntry

This is `NotesViewColumn`'s most useful pairing. The recent `NotesViewEntry.ColumnValues` piece flagged a trap: **the `n` in `ColumnValues(n)` is the view's column order, not a field name.**

`NotesViewColumn.Position` is the source of that `n`. So you can build a "Position → Title / ItemName" lookup from `view.Columns` first, then read each entry's `ColumnValues` and map "the value in column n" back to "what that column is" — which is the key combination for dynamic reports and exports where the columns aren't hard-coded:

```lotusscript
' build a column lookup first
Dim titles List As String
Forall c In view.Columns
    titles(Cstr(c.Position)) = c.Title
End Forall
' then reading an entry's values maps back to column names
```

## What about Java and SSJS?

| Language | Counterpart | Obtained via |
|---|---|---|
| Java (`lotus.domino.*`) | `ViewColumn` | `view.getColumns()` |
| SSJS / XPages | `ViewColumn` | `view.getColumns()` |

Consistent across all three: `getColumns()` for the array, `getItemName()` / `getFormula()` / `isCategory()` and so on. When you write a Domino design-inventory or documentation tool, the column-property mapping here carries straight over.
