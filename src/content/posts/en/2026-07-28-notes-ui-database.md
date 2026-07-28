---
title: "NotesUIDatabase: the One Place to Catch a Delete"
description: "In the Notes client a user can delete a document from any view, with the Delete key, a cut, or a drag to the trash — you can't guard each path separately. NotesUIDatabase is the single chokepoint that sees all of them: its QueryDocumentDelete event fires once, database-wide, before anything is marked for deletion. A field report on the front-end database class — the Database bridge, the delete/archive events, and the soft-delete guard you hang off the one event that catches every path."
pubDate: 2026-07-28T07:30:00+08:00
lang: en
slug: notes-ui-database
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesUIDatabase (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDATABASE_CLASS.html"
  - title: "NotesUIWorkspace (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html"
  - title: "NotesDatabase (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
relatedJava: []
relatedSsjs: []
---

You want to stop users from hard-deleting records — keep an audit trail, or flip a `Deleted` flag instead of really removing the note. So you start looking for where to hook it, and the problem is that "delete" in the Notes client isn't one path. A user can hit the Delete key in any view, cut a document, drag it to the trash, or delete from a different view than the one you guarded. Guarding each view's events means guarding all of them, forever, including the ones someone adds next year.

There's one chokepoint that sees every path: `NotesUIDatabase` and its `QueryDocumentDelete` event. It fires once, database-wide, before anything is marked for deletion — no matter which view or gesture triggered it. This is a field report on the front-end database class: the companion to [`NotesUIView`](/domino-news/en/posts/notes-ui-view), scoped to the whole database instead of one view, and the natural home for delete and archive guards.

---

## TL;DR

- `NotesUIDatabase` represents the database currently open in the Notes client; its events are declared on the database's globals (the Database Script) and cover the whole database, not one view.
- `QueryDocumentDelete` "occurs just before a document or selected set of documents is marked for deletion or cut" — the single place to intercept a delete. `Continue = False` vetoes it.
- `Source.Documents` is the set the current event is processing (the docs about to be deleted), so you do a soft-delete right in the handler: flip a flag, veto the real delete.
- `.Database` bridges back to the back-end [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html); you get the `NotesUIDatabase` from `ws.CurrentDatabase` or the event's `Source` parameter.
- Same edge as `NotesUIView`: Notes client / Nomad only — no web, agent, or COM.

## The delete chokepoint

`QueryDocumentDelete` is the event that earns this class its place. The reference describes it precisely: it "occurs just before a document or selected set of documents is marked for deletion or cut." *Just before*, and it covers deletion *and* cut — so the Delete key, the menu, and a cut-to-move all funnel through it. Inside the handler, `Source.Documents` is the set being deleted, and `Continue = False` cancels the operation. That's everything you need for a soft-delete:

```lotusscript
Sub Querydocumentdelete(Source As Notesuidatabase, Continue As Variant)
    Dim col As NotesDocumentCollection
    Set col = Source.Documents          ' the documents about to be deleted
    Dim doc As NotesDocument
    Set doc = col.GetFirstDocument()
    Do Until doc Is Nothing
        Call doc.ReplaceItemValue("Deleted", "1")
        Call doc.ReplaceItemValue("DeletedBy", Source.Database.Parent.EffectiveUserName)
        Call doc.Save(True, False)
        Set doc = col.GetNextDocument(doc)
    Loop
    Continue = False                    ' veto the real delete — the flag is the delete
End Sub
```

The flag becomes the delete, the note stays, and a view filtered on `Deleted != "1"` hides it. Because the guard lives on the database, it holds no matter which view the user deleted from — the reason to put it here rather than on any single [`NotesUIView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIVIEW_CLASS.html).

## Getting the object and crossing to the back end

Two ways in, mirroring `NotesUIView`. Outside an event you ask the [`NotesUIWorkspace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html): `Set uidb = ws.CurrentDatabase`. Inside a database event, the `Source` parameter is the object.

The bridge to the back end is the `Database` property — "read-only, the back-end database that corresponds to the currently open database." From there you're in normal back-end territory: `Source.Database.Parent` is the `NotesSession`, so `EffectiveUserName`, ACL checks, and everything else you'd do server-side is one hop away. As with the view class, the pattern is to cross the front-to-back boundary once and do the work on the back end.

## The rest of the events

`QueryDocumentDelete` is the headline, but the surface is broader and it's all delete / lifecycle guarding:

- `PostDocumentDelete` fires after the delete command but before the note is actually removed — a place to log what just got marked.
- `QueryDocumentUndelete` fires before deletion marks are removed, so you can guard un-delete too.
- `QueryDropToArchive` / `PostDropToArchive` bracket archival, and `QueryDragDrop` / `PostDragDrop` bracket drag-and-drop between databases.
- `PostOpen` runs after the view-level opens (after `NotesUIView`'s `QueryOpen` and `PostOpen`), and `QueryClose` fires just before the database closes.

The `Query*` / `Post*` split is the same contract as everywhere in the front-end classes: `Query*` runs before and can veto with `Continue = False`; `Post*` runs after and only observes.

## The companion, and the boundary

`NotesUIDatabase` and `NotesUIView` are two scopes of the same idea. The [view class](/domino-news/en/posts/notes-ui-view) owns the selection and per-view interaction — "what did the user highlight, what are they opening." The database class owns database-wide lifecycle — "is anything being deleted, archived, or dropped, anywhere in here." When a guard has to hold regardless of which view is on screen — deletion is the textbook case — it belongs on the database. When it's about the rows in front of the user right now, it belongs on the view.

Both share the same hard edge: they need a running Notes client. There is no current database in a web request or an agent, so neither class exists there, and a delete guard built this way protects the client only. If the same records are reachable over the web, that path needs its own guard — a back-end check in the web agent or XPages logic — because `QueryDocumentDelete` never fires for it.

## What about Java and SSJS?

Same as `NotesUIView`: no counterpart, for the same structural reason. The Domino Java API is a back-end API with nothing for the client UI; SSJS lives in XPages with its own component and event model rather than a `NotesUIDatabase`. So "intercept a delete" as a goal carries across — every stack has its own place to catch one — but this *class* doesn't. To do the same soft-delete on the web you put a back-end check in the web agent or XPages logic, not a port of `NotesUIDatabase`.
