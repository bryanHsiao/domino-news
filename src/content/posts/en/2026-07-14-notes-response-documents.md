---
title: "Response Documents in LotusScript: MakeResponse, ParentDocumentUNID, and Walking the Thread"
description: "Domino's parent-child document hierarchy — main document, responses, responses-to-responses — is built and traversed with a handful of NotesDocument members. This article covers MakeResponse (and the Save you must call after it), ParentDocumentUNID for walking up to the parent, and the Responses property, whose one load-bearing limitation is that it returns only immediate children — so a full tree needs recursion."
pubDate: 2026-07-14T07:30:00+08:00
lang: en
slug: notes-response-documents
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDocument.MakeResponse method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html"
  - title: "NotesDocument.Responses property — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RESPONSES_PROPERTY.html"
  - title: "NotesDocument.ParentDocumentUNID property — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PARENTDOCUMENTUNID_PROPERTY.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
---

Threaded discussions, a purchase order with its line items, a ticket with its follow-ups — these are all the same Domino shape: a **main document** with **response documents** hanging off it, and sometimes responses hanging off those. LotusScript builds and walks that tree with just a few `NotesDocument` members. They're simple, but two of them have a sharp edge that quietly produces wrong results if you don't know it.

---

## TL;DR

- [`Call child.MakeResponse(parent)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_MAKERESPONSE_METHOD.html) makes `child` a response to `parent` — "the two documents must be in the same database." It only sets the link; **you must call `Save` after it** or the relationship is lost.
- Walk **up** with `ParentDocumentUNID` (read-only) — the parent's UNID, or `""` if none — fed to `db.GetDocumentByUNID(...)`.
- Walk **down** with `Responses` (a read-only `NotesDocumentCollection`). The catch: "Each document in the collection is an immediate response to the first document. **Responses-to-responses are not included.**" A full tree needs **recursion**.
- `IsResponse` (read-only Boolean) tells you whether a document is a response. A document can be **both** a response and a parent.
- `Responses` isn't available on a brand-new unsaved document (it returns `Nothing` until the document is saved/reopened), and it's empty if the database has "Disable specialized response hierarchy information" turned on.

## Building the link: MakeResponse

You make a document a response by calling `MakeResponse` on it and passing the parent. The method just writes the internal parent link — it doesn't save, and it doesn't by itself change how the document is classified on a form in the UI:

```lotusscript
Set resp = db.CreateDocument
resp.Form = "Response"
Call resp.ReplaceItemValue("Subject", "A reply")
Call resp.MakeResponse(main)      ' set the parent link
Call resp.Save(True, False)       ' REQUIRED — MakeResponse alone doesn't persist
```

The docs are explicit: "You must call Save after this method if you want to save the change you have made." Skip the `Save` and the response link evaporates when the handle goes out of scope. (Both documents must live in the same database — you can't respond across databases.)

## Walking up: ParentDocumentUNID

From a response, [`ParentDocumentUNID`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PARENTDOCUMENTUNID_PROPERTY.html) gives you the parent's universal ID — a read-only string, empty if the document has no parent. Pair it with `GetDocumentByUNID` to fetch the actual parent:

```lotusscript
If resp.IsResponse Then
    Dim parent As NotesDocument
    Set parent = db.GetDocumentByUNID(resp.ParentDocumentUNID)
    Print "Parent subject: " & parent.GetItemValue("Subject")(0)
End If
```

Note it's **read-only** — you don't reparent a document by assigning this property; you use `MakeResponse`. It only reports the link.

## Walking down: Responses — and the recursion trap

`Responses` returns the responses to a document as a collection. Here's the limitation that catches people, verbatim from the [property docs](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RESPONSES_PROPERTY.html): "Each document in the collection is an immediate response to the first document. Responses-to-responses are not included."

So `main.Responses` gives you the direct children — not the grandchildren. If your data is only one level deep, you're fine. If it nests, a single `Responses` call silently misses everything below the first level, and your count is wrong in exactly the quiet way that's hard to notice. The fix is a recursive walk:

```lotusscript
Sub PrintTree(doc As NotesDocument, depth As Integer)
    Dim responses As NotesDocumentCollection
    Dim child As NotesDocument
    Set responses = doc.Responses
    Set child = responses.GetFirstDocument
    Do Until child Is Nothing
        Print String(depth * 2, " ") & child.GetItemValue("Subject")(0)
        Call PrintTree(child, depth + 1)     ' recurse into grandchildren
        Set child = responses.GetNextDocument(child)
    Loop
End Sub
```

Two more things about `Responses`: it isn't populated on a brand-new unsaved document (it returns `Nothing` until the document has been saved and reopened, because the hierarchy is stored in the saved document), and it comes back empty if the database has **"Disable specialized response hierarchy information"** enabled in its properties — a performance option that turns off exactly this tracking.

## Putting it together

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim main As NotesDocument
    Dim resp As NotesDocument
    Set db = session.CurrentDatabase

    ' Main document
    Set main = db.CreateDocument
    main.Form = "MainTopic"
    Call main.ReplaceItemValue("Subject", "Parent topic")
    Call main.Save(True, False)

    ' Response linked to it
    Set resp = db.CreateDocument
    resp.Form = "Response"
    Call resp.ReplaceItemValue("Subject", "A reply")
    Call resp.MakeResponse(main)
    Call resp.Save(True, False)

    ' Walk the whole tree from the main document
    Print main.GetItemValue("Subject")(0)
    Call PrintTree(main, 1)
End Sub
```

One last framing worth keeping straight: the hierarchy link and the UI are separate concerns. `MakeResponse` sets the parent-child relationship in the data; making that tree *display* as an indented thread in a view requires a view designed with response hierarchy ("Show responses in a hierarchy") turned on. The link exists whether or not any view shows it.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `doc.MakeResponse(parent)` | `doc.makeResponse(parent)` | `document.makeResponse(...)` |
| `doc.ParentDocumentUNID` | `doc.getParentDocumentUNID()` | `document.getParentDocumentUNID()` |
| `doc.Responses` | `doc.getResponses()` | `document.getResponses()` |

The `lotus.domino.Document` surface mirrors these across Java and SSJS, with the same rules: `makeResponse` needs a `save`, `getResponses()` returns immediate children only, and `getParentDocumentUNID()` is read-only. In XPages the SSJS `NotesXspDocument` wraps the same backend document; reach the raw `Document` via `.getDocument()` when you need these members.
