---
title: "NotesRichTextItem: writing rich text fields from LotusScript"
description: "NotesRichTextItem inherits from NotesItem, so every NotesItem property and method is already available — but it adds 22 methods of its own for paragraph styles, tables, embedded objects, and Navigator/Range traversal of existing rich-text content. This post catalogues construction, the 22 methods grouped by purpose, the inheritance contract, and the gotchas you hit in real code."
pubDate: "2026-04-30T03:12:47+08:00"
lang: "en"
slug: "notes-rich-text-item"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesRichTextItem (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "NotesItem (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESITEM_CLASS.html"
  - title: "NotesDocument CreateRichTextItem method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATERICHTEXTITEM_METHOD.html"
  - title: "NotesEmbeddedObject (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
---

## A premise the docs put up front: it inherits from NotesItem

The documentation opens with:

> NotesRichTextItem inherits from NotesItem. Because NotesRichTextItem inherits from NotesItem, all of the NotesItem properties and methods can be used on a NotesRichTextItem, too.

So everything on `NotesItem` (`Name`, `Type`, `Text`, `Values`, `Remove()`, etc.) is already on a `NotesRichTextItem`. This post only covers what `NotesRichTextItem` adds on top.

It defines exactly **one** of its own properties — `EmbeddedObjects` (read-only): every embedded file, OLE object, and object link inside the rich-text item.

The interesting surface is the 22 methods.

## Two ways to construct one

### A — From the document

```lotusscript
Set rt = doc.CreateRichTextItem("Body")
```

`Body` is the field name. If a same-named field already exists on the document, the existing one is returned.

### B — `New` directly

```lotusscript
Dim rt As New NotesRichTextItem(doc, "Body")
' or
Set rt = New NotesRichTextItem(doc, "Body")
```

Same effect; pick whichever reads better. `CreateRichTextItem` is the right call from OLE automation contexts (no `New` available).

## 22 methods in five buckets

### 1. Append text (the workhorse)

| Method | Purpose |
|---|---|
| `AppendText(text$)` | Append plain text in the current style (bold, italic, etc.) |
| `AddNewLine(count%)` | Insert N line breaks |
| `AddPageBreak()` | Insert a hard page break |
| `AddTab(count%)` | Insert N tabs |

### 2. Style and paragraph format

| Method | Purpose |
|---|---|
| `AppendStyle(style)` | Apply a `NotesRichTextStyle` (bold, font size, colour) to subsequent text |
| `AppendParagraphStyle(pStyle)` | Apply a `NotesRichTextParagraphStyle` (indent, alignment) to subsequent paragraphs |
| `GetNotesFont(faceName$, addOnFail%)` | Look up a font ID for `NotesRichTextStyle.NotesFont` |

### 3. Tables, sections, doclinks

| Method | Purpose |
|---|---|
| `AppendTable(rows%, cols%)` | Insert a table; returns a `NotesRichTextTable` |
| `AppendDocLink(targetDoc/view/db, comment$)` | Insert a doclink |
| `AppendRTItem(otherRT)` | Append the entire contents of another rich-text item |
| `BeginSection(...)` / `EndSection()` | Wrap a region as a collapsible section |

### 4. Embedded files / objects

| Method | Purpose |
|---|---|
| `EmbedObject(type%, className$, source$, [name$])` | Embed a file attachment, OLE object, or OLE object link |
| `GetEmbeddedObject(name$)` | Look up a `NotesEmbeddedObject` by name |

`EmbedObject`'s `type%` uses these built-in constants:

```lotusscript
EMBED_ATTACHMENT  = 1454   ' file attachment
EMBED_OBJECT      = 1453   ' OLE object
EMBED_OBJECTLINK  = 1452   ' OLE object link
```

### 5. Navigator / Range / read / housekeeping

| Method | Purpose |
|---|---|
| `CreateNavigator()` | Returns a `NotesRichTextNavigator` to walk the rich-text structure (sections, tables, links) |
| `CreateRange()` | Returns a `NotesRichTextRange` to select / copy / delete a region |
| `BeginInsert(element)` / `EndInsert()` | Move the insertion point from "the end" to before/after a specified element |
| `GetFormattedText(stripTabs%, lineLen%, paraLen%)` | Plain text **with** linebreaks/wrapping preserved |
| `GetUnformattedText()` | Plain text, all whitespace flattened — best for `InStr` searches |
| `Update()` | Force-process pending operations (`doc.Save` does this for you most of the time) |
| `Compact()` | Compact the rich-text storage (worth running after heavy editing churn) |

## A practical example: a reply email with an attachment

```lotusscript
Sub SendReplyWithAttachment(targetMail As String, attachPath As String)
    Dim s As New NotesSession
    Dim db As NotesDatabase
    Dim doc As NotesDocument
    Dim body As NotesRichTextItem
    Dim style As NotesRichTextStyle

    Set db = s.GetDatabase("", "mail.box")
    Set doc = db.CreateDocument()
    doc.Form = "Memo"
    doc.SendTo = targetMail
    doc.Subject = "Monthly report attached"

    ' Build the rich-text body
    Set body = doc.CreateRichTextItem("Body")

    ' Plain prose
    Call body.AppendText("Hi,")
    Call body.AddNewLine(2)
    Call body.AppendText("Attached is this month's sales report. Please review.")
    Call body.AddNewLine(2)

    ' Switch to bold red
    Set style = s.CreateRichTextStyle()
    style.Bold = True
    style.NotesColor = COLOR_RED
    Call body.AppendStyle(style)
    Call body.AppendText("Note: please confirm by Friday whether further analysis is needed.")

    ' Attach the file
    Call body.EmbedObject(EMBED_ATTACHMENT, "", attachPath)

    ' Send
    Call doc.Send(False)
End Sub
```

Four things this snippet gets right:

1. `CreateRichTextItem("Body")` — Body is the rich-text field a Memo form expects
2. Every `AppendText` after `AppendStyle` inherits that style until the next `AppendStyle`
3. `EmbedObject` uses the named constants (`EMBED_ATTACHMENT` etc.) — clearer than the raw integers
4. `doc.Send(False)` calls `Update` for you; no manual `body.Update()` needed

## Three gotchas worth knowing

### Gotcha 1: `Save` before `EmbedObject`?

The docs don't require it. But if you embed a large attachment (>several MB) into a brand-new in-memory document, you may hit memory pressure. In that case, call `doc.Save(True, False)` once before the embed.

### Gotcha 2: `GetFormattedText` vs `GetUnformattedText`

Both return plain text, but:

- `GetFormattedText(False, 80, 0)` keeps line breaks, wraps at 80 chars — good for an email-quote view
- `GetUnformattedText()` flattens everything to one whitespace-collapsed string — what you want for `InStr` matching or full-text comparison

Picking the wrong one will give your search logic surprising false negatives.

### Gotcha 3: rich text isn't readable from `@Formula`

```
@GetField("Body")     ' returns "" rather than the rich-text content
@Text(Body)           ' same — no good
```

Use `@Abstract([TextOnly];0;"";"Body")` from formula, or `GetUnformattedText()` from LotusScript.

## Companion classes worth knowing

| Goal | Class |
|---|---|
| Style (bold, colour, font size) | `NotesRichTextStyle` |
| Paragraph format (indent, alignment, lists) | `NotesRichTextParagraphStyle` |
| Build a table | `NotesRichTextTable` (returned by `AppendTable`) |
| Walk the structure of an existing rich-text item | `NotesRichTextNavigator` (returned by `CreateNavigator`) |
| Select / copy / delete a region | `NotesRichTextRange` (returned by `CreateRange`) |
| Read or write embedded files | [`NotesEmbeddedObject`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html) (via the `EmbeddedObjects` property or `GetEmbeddedObject`) |

`NotesRichTextItem` is the entry point for the entire Notes "write content into a document" API chain — formatting, tables, attachments all hang off it.
