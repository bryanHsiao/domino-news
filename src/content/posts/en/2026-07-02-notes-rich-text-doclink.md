---
title: "NotesRichTextDocLink & NotesRichTextSection: Doclinks and Collapsible Sections in Code"
description: "Two rich-text features you'd normally insert by hand in Designer — a doclink that jumps to a database, view, or document, and a collapsible section — are scriptable. But neither class is one you construct: you create the elements through NotesRichTextItem (AppendDocLink, BeginSection/EndSection) and read them back through NotesRichTextNavigator. This article covers that write-vs-read split, the doclink properties, the BeginSection/EndSection rule, and the gotchas."
pubDate: 2026-07-02T07:30:00+08:00
lang: en
slug: notes-rich-text-doclink
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextDocLink class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTDOCLINK_CLASS.html"
  - title: "AppendDocLink method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDDOCLINK_METHOD.html"
  - title: "NotesRichTextSection class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTSECTION_CLASS.html"
relatedJava: ["RichTextDoclink", "RichTextSection"]
relatedSsjs: ["NotesRichTextDoclink", "NotesRichTextSection"]
---

You're assembling a notification email from an agent and you want it to contain a clickable link straight into the source document — not a URL, a real Notes doclink. Or you're building a long report and want the appendix tucked into a collapsible section the reader can expand. Both are rich-text elements, and both are scriptable — but not the way you might expect.

Neither [`NotesRichTextDocLink`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTDOCLINK_CLASS.html) nor `NotesRichTextSection` is a class you `New`. They're *read* objects. You **create** the elements through `NotesRichTextItem` methods, and you get a class instance back only when you **navigate** existing rich text with `NotesRichTextNavigator`. That write-with-one-API, read-with-another split is the thing to understand first.

---

## TL;DR

- **Create a doclink** with `Call rtitem.AppendDocLink(target, comment$ [, hotspotText$])`, where `target` is a `NotesDatabase`, `NotesView`, or `NotesDocument`.
- **Create a section** by bracketing content: `rtitem.BeginSection(title$, …)` → append text → `rtitem.EndSection`. You **cannot** wrap rich text that already exists.
- You only get a `NotesRichTextDocLink` / `NotesRichTextSection` *object* back by navigating with `NotesRichTextNavigator` and the element types `RTELEM_TYPE_DOCLINK` / `RTELEM_TYPE_SECTION` — to read, edit, or remove an existing one.
- Doclink properties are read-write: `DbReplicaID`, `ViewUNID`, `DocUNID`, `HotSpotText`, `DisplayComment`, `ServerHint`.
- `AppendDocLink` needs a **default view set on the target database** to resolve the link.
- Section: `Title` and `IsExpanded` are read-write; `BarColor` and `TitleStyle` are read-only (set them at `BeginSection` or via `SetBarColor` / `SetTitleStyle`). Note the naming mismatch — the property is `IsExpanded`, the `BeginSection` argument is `expand`.
- Both classes are **new with Release 6**.

## Doclinks

The class is just "Represents a doclink in a rich text item" — a clickable hotspot that jumps to a database, view, or document. You don't create it directly; you call `AppendDocLink` on the rich text item, and the target's *type* decides what kind of link you get. Straight from the official examples:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim newDoc As NotesDocument
Dim rtitem As NotesRichTextItem
Set db = session.CurrentDatabase
Set newDoc = New NotesDocument(db)
Set rtitem = New NotesRichTextItem(newDoc, "Body")

' Link to a database
Call rtitem.AppendDocLink(db, db.Title)

' Link to a view
Dim view As NotesView
Set view = db.GetView("Boots")
Call rtitem.AppendDocLink(view, view.Name & " in " & db.Title)

' Link to a document
Dim doc As NotesDocument
Set doc = view.GetFirstDocument
Call rtitem.AppendDocLink(doc, doc.Subject(0) & " in " & view.Name)
```

The second argument is the hover comment. There's an optional third argument (Release 5+) for the visible boxed hotspot text — without it the link renders as a small token: `Call rtitem.AppendDocLink(db, db.Title, "Open the database")`. One caveat the [`AppendDocLink`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDDOCLINK_METHOD.html) docs call out: "For this method to work you must set a default view in the database."

To touch an *existing* doclink — change its target, retitle the hotspot, or remove it — you navigate to it. The class description spells out the route: "To access a NotesRichTextDocLink object, use the NotesRichTextNavigator methods in conjunction with the type RTELEM_TYPE_DOCLINK." Then its read-write `DbReplicaID` / `ViewUNID` / `DocUNID` / `HotSpotText` / `DisplayComment` / `ServerHint` are yours to edit, and two removal methods differ in a useful way: `Remove` deletes the doclink entirely, while `RemoveLinkage` "Removes the doclink link from the rich text item while keeping hotspot text and formatting" — i.e. it de-links but leaves the words.

## Collapsible sections

[`NotesRichTextSection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTSECTION_CLASS.html) — "Represents a collapsible section in a rich text item" — has the strictest creation rule of the two. You cannot enclose existing content; you must bracket new content as you append it:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase
Dim doc As New NotesDocument(db)
Dim rt As New NotesRichTextItem(doc, "Body")

Dim titleStyle As NotesRichTextStyle
Set titleStyle = session.CreateRichTextStyle
titleStyle.Bold = True

Dim bar As NotesColorObject
Set bar = session.CreateColorObject
bar.NotesColor = COLOR_BLUE

' Begin a collapsed section, append its content, then end it
Call rt.BeginSection("Appendix", titleStyle, bar, False)   ' expand = False -> collapsed
Call rt.AppendText("This content lives inside the collapsible section.")
Call rt.AddNewLine(1)
Call rt.EndSection

Call doc.Save(True, False)
```

*(The doclink snippets above are verbatim from the official examples; this section snippet is adapted from the documented signatures — the official section example pages 404 under the 14.5.1 path.)*

The docs are explicit about the rule: "You cannot create a section containing existing rich text. You must start the section with BeginSection, append rich text, and end the section with EndSection." `BeginSection`'s parameters are `title$`, an optional title `NotesRichTextStyle`, an optional bar `NotesColorObject`, and `expand` (True = expanded, default False = collapsed). To read or modify an existing section you navigate with `RTELEM_TYPE_SECTION`; then `Title` and `IsExpanded` are read-write, and `SetBarColor` / `SetTitleStyle` adjust the look. Watch the naming: the property is `IsExpanded`, but the creation argument is `expand`.

## One shared caveat

Both elements share the open-document quirk: if you edit the rich text of a document that's currently open in the UI, the new doclink or section won't render until the document is closed and reopened. For agent-generated documents that aren't open this never bites, but it surprises people scripting against a `NotesUIDocument`.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesRichTextDocLink` | `RichTextDoclink` | `NotesRichTextDoclink` |
| `NotesRichTextSection` | `RichTextSection` | `NotesRichTextSection` |

The same create-via-`NotesRichTextItem`, read-via-`NotesRichTextNavigator` split holds across all three languages — `appendDocLink`, `beginSection` / `endSection`, and the `RTELEM_TYPE_*` navigator types are the same. The classes are the read-side handles, not constructors, in every language.
