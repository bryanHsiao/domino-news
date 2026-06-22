---
title: "NotesRichTextTable: Dropping a Table into Rich Text from Code"
description: "You're assembling a rich text email or document in code with NotesRichTextItem and need a table to lay out a summary or report — NotesRichTextItem.AppendTable creates a NotesRichTextTable. This article covers creating one, RowCount / ColumnCount, AddRow / RemoveRow, SetColor / SetAlternateColor for striped rows, RightToLeft, and how to walk an existing table with NotesRichTextNavigator — plus a key limitation: you can't read a cell's contents unless you already know the rich text's exact structure."
pubDate: 2026-06-24T07:30:00+08:00
lang: en
slug: notes-rich-text-table
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextTable class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTTABLE_CLASS.html"
  - title: "NotesRichTextItem class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "AppendTable method (NotesRichTextItem) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDTABLE_METHOD.html"
relatedJava: ["RichTextTable"]
relatedSsjs: ["RichTextTable"]
---

You're assembling a rich text notification email in code with [`NotesRichTextItem`](/domino-news/posts/notes-rich-text-item/), and the body needs a small table — order line items, an approval summary, a reconciliation list. Plain text can't lay out clean gridlines, and that's where [`NotesRichTextTable`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTTABLE_CLASS.html) comes in.

The official definition is short: "Represents a table in a rich text item." (new in Release 6). Like the other classes in this site's Rich Text series, it isn't created with `New` — it grows out of a rich text item: call `AppendTable`, and what comes back is the table object.

---

## TL;DR

- Create it with [`NotesRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html)'s [`AppendTable`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDTABLE_METHOD.html), which "Inserts a table in a rich text item."
- Properties (mostly read-only): `RowCount` / `ColumnCount`, `Color` / `AlternateColor` (primary / alternate color), `RightToLeft` (read-write, right-to-left reading order).
- Methods: `AddRow`, `RemoveRow`, `SetColor`, `SetAlternateColor`.
- Walk an existing table with `NotesRichTextNavigator` using `RTELEM_TYPE_TABLE` to find the table and `RTELEM_TYPE_TABLECELL` to get cells (cells are ordered by row, then column).
- **The key limitation**, verbatim: you can't determine a cell's contents (text paragraphs, runs, doclinks…) unless you know the rich text's exact structure.

## Creating it: AppendTable

```lotusscript
Dim doc As NotesDocument
Set doc = db.CreateDocument()
Dim body As NotesRichTextItem
Set body = doc.CreateRichTextItem("Body")

Dim table As NotesRichTextTable
Set table = body.AppendTable(3, 2)   ' 3 rows, 2 columns
```

`AppendTable`'s basic arguments are "how many rows, how many columns" (it also has optional arguments for left-column labels, margins, paragraph styles). What you get back is a `NotesRichTextTable`.

## Properties and methods

| Member | What it does |
|---|---|
| `RowCount` / `ColumnCount` | read-only, number of rows / columns |
| `AddRow(count, targetRow)` | add rows |
| `RemoveRow(count, targetRow)` | remove rows |
| `Color` / `SetColor(color)` | the table's primary color |
| `AlternateColor` / `SetAlternateColor(color)` | the alternate color (the second color when the style uses two) |
| `SetRowDisplay` | control how rows display |
| `RightToLeft` | read-write, whether the reading order is right to left |

**The alternate color** is handy — set `SetColor` + `SetAlternateColor` and the table alternates color row by row (zebra striping), which makes a long table far more readable:

```lotusscript
Dim session As New NotesSession
Dim white As NotesColorObject
Dim gray As NotesColorObject
Set white = session.CreateColorObject() : white.NotesColor = COLOR_WHITE
Set gray = session.CreateColorObject() : gray.NotesColor = COLOR_GRAY
Call table.SetColor(white)
Call table.SetAlternateColor(gray)
```

## Walking an existing table

To read a table in an existing document (not build a new one), use a [`NotesRichTextNavigator`](/domino-news/posts/notes-rich-text-navigator/): find the table with `RTELEM_TYPE_TABLE` and walk cell by cell with `RTELEM_TYPE_TABLECELL` (the docs: cells are ordered "by row, then column").

But there's a limitation you must know, and the docs state it plainly:

> "You cannot determine the contents of a cell (text paragraphs, text runs, doclinks, and so on) unless you know the exact structure of the rich text item."

In other words — you can reach "which cell", but **whether that cell holds text, a doclink, or something else, you have to know the structure in advance** to decode it. Rich text is fundamentally a stream of mixed elements, and a table cell won't label the types for you. So "automatically parsing the contents of arbitrary rich text tables" is harder than it sounds; the controllable scenario is "the table was built by your own code and you know its structure."

## What about Java and SSJS?

| Language | Counterpart | Created via |
|---|---|---|
| Java (`lotus.domino.*`) | `RichTextTable` | `rtitem.appendTable(rows, cols)` |
| SSJS / XPages | `RichTextTable` | same |

Consistent across all three: `appendTable` to create, `addRow` / `removeRow`, the alternate-color pattern. To produce table-bearing rich text in a back-end Java agent (an automated reconciliation email, say), this carries straight over. Pair it with the site's [`NotesRichTextStyle`](/domino-news/posts/notes-rich-text-style/) to control fonts and colors along the way.
