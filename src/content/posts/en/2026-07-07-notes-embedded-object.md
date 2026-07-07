---
title: "Attachments in LotusScript: EmbedObject, NotesEmbeddedObject, and the GetAttachment Shortcut"
description: "Attaching a file, listing what's attached, extracting it to disk, and removing it — all from code. This article covers NotesRichTextItem.EmbedObject with the EMBED_ATTACHMENT constant, the NotesEmbeddedObject class, ExtractFile, and the two traps that catch people: NotesDocument.EmbeddedObjects does NOT return file attachments (use GetAttachment or the rich-text item), and ExtractFile errors on anything that isn't an attachment."
pubDate: 2026-07-07T07:30:00+08:00
lang: en
slug: notes-embedded-object
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesEmbeddedObject class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "EmbedObject method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD.html"
  - title: "ExtractFile method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXTRACTFILE_METHOD.html"
relatedJava: ["EmbeddedObject", "RichTextItem"]
relatedSsjs: ["EmbeddedObject", "RichTextItem"]
cover: "/covers/notes-embedded-object.webp"
coverStyle: "minimalist-mono"
---

An agent needs to attach a generated PDF to a document and mail it; another needs to sweep incoming documents, pull every attachment to a network folder, and delete the originals. Both are everyday jobs, and both run through one class — [`NotesEmbeddedObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html) — plus a couple of methods on `NotesRichTextItem` and `NotesDocument`. The API carries some OLE-era baggage, so the trick is knowing which parts still matter.

---

## TL;DR

- A `NotesEmbeddedObject` "represents any one of the following: An embedded object, An object link, A file attachment." For modern work, **file attachments are the case that matters** — OLE embedding/linking is Windows-only legacy.
- **Attach a file**: `Set eo = rtitem.EmbedObject(EMBED_ATTACHMENT, "", "c:\path\file.pdf")`. The type constants are `EMBED_ATTACHMENT` (1454), `EMBED_OBJECT` (1453), `EMBED_OBJECTLINK` (1452).
- **Find one attachment by name**: `doc.GetAttachment(fileName$)` — it finds the attachment *regardless of which rich text item holds it* (or none), which is its whole point.
- **Extract to disk**: `Call eo.ExtractFile(path$)` — attachments only; it **errors on OLE objects/links**, so always gate on `eo.Type = EMBED_ATTACHMENT`.
- **Trap**: `NotesDocument.EmbeddedObjects` "does not return file attachments" — iterate `rtitem.EmbeddedObjects` (per rich text item) or use `GetAttachment` instead.
- `doc.HasEmbedded` is a quick Boolean check for "does this document carry anything attached/embedded."

## Attaching a file

[`EmbedObject`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD.html) lives on the rich text item. For a plain file attachment, the type is `EMBED_ATTACHMENT`, the class string is empty, and the source is the path to the file:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtitem As NotesRichTextItem
Dim eo As NotesEmbeddedObject
Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
Set rtitem = New NotesRichTextItem(doc, "Body")
Set eo = rtitem.EmbedObject(EMBED_ATTACHMENT, "", "c:\reports\q1.pdf")
doc.Form = "Main Topic"
doc.Subject = "Here's the Q1 report, attached"
Call doc.Save(True, True)
```

That snippet is the official example (with the file path updated). The optional fourth `name$` argument applies only to OLE objects, not attachments, so you leave it off here. One requirement from the docs: the database needs a default view set for `EmbedObject` to work.

## Finding attachments — and the EmbeddedObjects trap

There are three ways to reach attached files, and the difference between them is the part worth memorising:

- `doc.HasEmbedded` — read-only Boolean, `True` if the document has *anything* embedded, linked, or attached. A cheap gate before you do more work.
- `doc.GetAttachment(fileName$)` — returns the `NotesEmbeddedObject` for a named attachment, or `Nothing`. Its strength, per the docs, is that it finds "file attachments which are not contained in a rich text item... as well as file attachments that are contained in a rich text item." So you don't need to know *where* the file is attached. (Caveat: the returned object's `Parent` is `Nothing`, since you didn't reach it through a rich text item.)
- `rtitem.EmbeddedObjects` — the array of embedded objects in *that* rich text item, which **does** include file attachments.

The trap is the fourth option people reach for first: `doc.EmbeddedObjects`. The class page is explicit that the document-level version **"does not return file attachments"** — so a loop over `doc.EmbeddedObjects` silently skips exactly the thing you're usually after. Use the rich-text-item array or `GetAttachment`.

## Extracting and removing

To pull attachments to disk, iterate the rich text item's objects, gate on the attachment type, and call [`ExtractFile`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXTRACTFILE_METHOD.html). This is the official pattern:

```lotusscript
Dim doc As NotesDocument
Dim rtitem As Variant
Dim fileCount As Integer
Const MAX = 100000
fileCount = 0
'...set value of doc...
Set rtitem = doc.GetFirstItem("Body")
If (rtitem.Type = RICHTEXT) Then
  Forall o In rtitem.EmbeddedObjects
    If (o.Type = EMBED_ATTACHMENT) And (o.FileSize > MAX) Then
      fileCount = fileCount + 1
      Call o.ExtractFile("c:\reports\newfile" & Cstr(fileCount))
      Call o.Remove
      Call doc.Save(True, True)
    End If
  End Forall
End If
```

Two things to carry into production from this official snippet. First, the `o.Type = EMBED_ATTACHMENT` guard isn't optional — `ExtractFile` raises an error on OLE objects and object links, so extracting without the check will blow up the moment a document has a non-attachment embedded object. Second, note the extracted names (`newfile1`, `newfile2`…) have no extension — that's an HCL-example quirk; in real code extract with the original name or a real extension so the file opens.

`o.Remove` deletes the attachment, and (like all rich-text edits) the change isn't persisted until `doc.Save`. Useful `NotesEmbeddedObject` properties along the way: `Name`, `FileSize` (bytes, for attachments), `Type`, `Class` and `Verbs` (OLE only), and `Source`.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesEmbeddedObject` | `EmbeddedObject` | `EmbeddedObject` |
| `NotesRichTextItem.EmbedObject` | `RichTextItem.embedObject` | `RichTextItem.embedObject` |

The Java and SSJS surfaces mirror this — `rtitem.embedObject(...)`, `doc.getAttachment(...)`, `eo.extractFile(...)`, the same `EMBED_ATTACHMENT` constant and the same "document-level `getEmbeddedObjects()` omits attachments" behaviour. The advice carries across unchanged: reach attachments through `getAttachment` or the rich-text item, not the document-level collection.
