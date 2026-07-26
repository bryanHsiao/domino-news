---
title: "NotesUIView: the Only Class That Knows What the User Selected"
description: "A view action button is supposed to act on the rows the user highlighted — but the back-end NotesView has no concept of a selection. That gap is exactly what NotesUIView fills. A field report on the front-end view class: its Documents property (the live selection), the bridge back to the back-end View, the QueryOpenDocument / QueryClose events you hook to intercept the user, and the hard boundary that keeps all of it out of web and agent code."
pubDate: 2026-07-26T07:30:00+08:00
lang: en
slug: notes-ui-view
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesUIView (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIVIEW_CLASS.html"
  - title: "NotesUIWorkspace (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html"
  - title: "NotesView (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
relatedJava: []
relatedSsjs: []
---

You add an action button to a view: "Approve selected." The user ticks three rows, clicks it, and your code needs *those three documents*. So you reach for the back-end `NotesView` — and there's nothing there. `NotesView` can give you every document, the first document, a document by key; it cannot tell you which rows are highlighted in front of the user, because a back-end view has no user and no selection. That state lives one layer up, in the Notes client, and there's exactly one class that exposes it: [`NotesUIView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIVIEW_CLASS.html).

This is a field report on that front-end view class — what it's for, the one property that justifies its existence, and the boundary that keeps it firmly in classic-client (and Nomad) territory, out of web and agent code. Tested against the Notes client; `NotesUIView` is new-ish only in the sense that it's front-end — it's not supported in COM, and it has no web equivalent.

---

## TL;DR

- `NotesUIView.Documents` is "the documents that are currently selected in a view" — a `NotesDocumentCollection` of exactly what the user highlighted. This is the property you came for; the back-end `NotesView` has no equivalent.
- You get a `NotesUIView` from `ws.CurrentView` (where `ws` is a `NotesUIWorkspace`) or, inside a view event, from the `Source` parameter the event hands you.
- `.View` bridges back to the back-end `NotesView` for the same view, so you cross front-to-back exactly once and do the heavy lifting on the back end.
- The events — `QueryOpenDocument`, `QueryClose`, `QueryRecalc`, `PostOpen` — are where you intercept the user before the client acts. `Continue = False` in a `Query*` event cancels the action.
- It's Notes-client / Nomad only. No web, no agent, no COM.

## The property that justifies the class

Everything else about `NotesUIView` is convenience; `Documents` is the reason it exists. Reach it and you have the selection as a normal back-end collection:

```lotusscript
Sub Click(Source As Button)
    Dim ws As New NotesUIWorkspace
    Dim uiview As NotesUIView
    Set uiview = ws.CurrentView

    Dim selected As NotesDocumentCollection
    Set selected = uiview.Documents          ' exactly the rows the user ticked

    If selected.Count = 0 Then
        Messagebox "Select at least one document first."
        Exit Sub
    End If

    Dim doc As NotesDocument
    Set doc = selected.GetFirstDocument()
    Do Until doc Is Nothing
        Call doc.ReplaceItemValue("Status", "Approved")
        Call doc.Save(True, False)
        Set doc = selected.GetNextDocument(doc)
    Loop
End Sub
```

Notice the shape: one front-end call (`uiview.Documents`) to learn the selection, then the loop is pure back-end `NotesDocumentCollection` work. That's the pattern for every "act on the selected rows" button — cross the boundary once, at the top, and never again.

## Getting the object, and crossing back

Two ways in. Outside an event — an action button, a toolbar button — you ask the [`NotesUIWorkspace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html): `Set uiview = ws.CurrentView`. Inside a view event, the client hands you the object as the event's `Source` parameter, so you don't construct anything.

Crossing the other direction is the `.View` property: it returns the back-end [`NotesView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) for the view currently on screen. That's how you go from "what's displayed" to "the full design and data" — read the view's columns, run a `GetDocumentByKey`, whatever needs the back end. A few read-only front-end conveniences ride along too: `ViewName`, `ViewAlias`, `CaretNoteID` (the row the cursor sits on, distinct from the multi-row selection), and `CaretCategory`. For calendar views there's `CalendarDateTime` / `CalendarDateTimeEnd`, the start and end of the region the user clicked.

## The events: intercepting before the client acts

The other half of `NotesUIView` is its event surface, declared on the view's design. The `Query*` events fire *before* the client does something and can cancel it; the `Post*` events fire *after*.

The one you'll reach for most is `QueryOpenDocument` — it fires when the user tries to open a row, before the document opens, so it's where you redirect ("this record is locked, open the read-only copy instead") or block the open outright. Set `Continue = False` and the open is cancelled:

```lotusscript
Sub Queryopendocument(Source As Notesuiview, Continue As Variant)
    Dim doc As NotesDocument
    Set doc = Source.Documents.GetFirstDocument()
    If doc.Status(0) = "Archived" Then
        Messagebox "Archived records open in the archive database."
        Continue = False
    End If
End Sub
```

`QueryClose` guards leaving the view, `QueryRecalc` fires before a refresh, and `PostOpen` runs once after the view is up (a good spot to set an initial selection with `SelectDocument`, or clear one with `DeselectAll`). The rule is uniform: `Query*` can veto by setting `Continue = False`; `Post*` is notification only.

## The boundary — why none of this reaches the web

`NotesUIView` needs a user sitting in front of a Notes client (or Nomad, which *is* the client). That's not a limitation to work around; it's the definition. There is no "current view" in a web request, an XPages page, or a scheduled agent — no window, no selection, no cursor. So front-end classes like this simply don't exist in those contexts, and code that touches `NotesUIView` can't be lifted into an agent or a web library unchanged. When you need "the selected documents" on the web, you're in a completely different model (an XPages view panel's `getSelectedIds`, say) — the concept survives, the class does not.

## What about Java and SSJS?

There's no counterpart, and the reason is structural. The Domino Java API is a back-end API — it has `lotus.domino.View`, but nothing for the client UI, because Java on Domino runs in agents and server code where there's no front end to represent. SSJS lives in XPages, which has its own component model (`viewPanel`, `dataView`) and its own selection API rather than a `NotesUIView`. So this is a case where LotusScript reaches somewhere the other two deliberately don't: the running Notes client. If you're modernising a selected-rows action for the web, you're not porting `NotesUIView` — you're rebuilding the interaction in the target stack's own terms.
