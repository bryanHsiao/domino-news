---
title: "XPages Has Two Documents — Don't Edit the Wrong One"
description: "When you write document1 in XPages SSJS, you're holding the data-source wrapper (NotesXspDocument). But document1.getDocument() hands you a different object — the back-end NotesDocument. Both point at the same note, but they're two APIs: the wrapper uses getValue / setValue, the back end uses getItemValue / replaceItemValue, and each has its own save. This piece is about the back-end one: how to get it in SSJS, what it does (replaceItemValue / computeWithForm / save / remove / universalID), where the line between it and the wrapper sits, and why saving on both sides spawns a save-conflict document."
pubDate: 2026-11-04T07:30:00+08:00
lang: en
slug: ssjs-backend-document
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesXspDocument (the XPages document data source — getDocument, getValue / setValue / replaceItemValue / save) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_r.html"
  - title: "getDocument (NotesXspDocument - JavaScript) (returns the back-end NotesDocument; the applyChanges parameter) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html"
  - title: "NotesDocument class (the back-end document class — same API across SSJS / Java / LotusScript) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
relatedJava: []
relatedSsjs: []
coversClass: "Document"
apiLang: "ssjs"
---

When you write `document1` in XPages SSJS, you think "this document." But strictly, `document1` isn't the document — it's the XPages **document data source**, a [`NotesXspDocument`](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_r.html) object, the wrapper that sits between the screen and the data.

The actual back-end document only comes out via `document1.getDocument()`, and it's a **`NotesDocument`** — the same back-end document class you know from agents and script libraries. The two objects point at the **same note** but expose **two different APIs**: the wrapper uses `getValue` / `setValue`, the back end uses `getItemValue` / `replaceItemValue`, and **each has its own `save`**. Not knowing which one you're holding — or saving on both — is exactly where XPages save oddities come from.

This piece is about the back-end `NotesDocument` only: how to get it in SSJS, what it does, and where the line between it and the wrapper sits.

---

## TL;DR

- **`document1` is the wrapper, not the back-end document.** It's a `NotesXspDocument` (the data source); HCL's own page says to use `NotesDocument` for "direct work with the data store."
- **Get the back-end document with `document1.getDocument()`** — or skip the data source entirely and go `database.getDocumentByUNID(...)` / `view.getDocumentByKey(...)` / `database.createDocument()`.
- **Don't mix the two APIs**: the data source uses `getValue` / `setValue` (the control-binding layer); the back-end `NotesDocument` uses `getItemValue` / `replaceItemValue`, `computeWithForm`, `save`, `remove`, `universalID` — identical to LotusScript's NotesDocument.
- **Save boundary**: saving the whole data source plus screen input → `document1.save()`; saving the back-end document you pulled → `doc.save()`. **Don't call both.**
- **The classic trap**: calling both `doc.save()` (back end) and `document1.save()` (data source) on the same note leaves the version stamps out of sync, and Domino spawns a `$Conflict` save-conflict document. See below and the [save-conflicts piece](/domino-news/en/posts/xpages-save-conflicts/).

## Two documents: wrapper vs back end

Pin the names down first, so the rest stays clear.

- **`NotesXspDocument`** — the XPages document data source. HCL's definition: "Represents a document associated with the XPage context in which the server script is running." When an XPage binds a Domino document as its data source, you get a global variable of this type named `document1`, `document2`, …; `currentDocument` is the closest one. Its job is **binding between the screen's controls and the document**, so its `getValue` / `setValue` work against "the data source's current state."
- **`NotesDocument`** — the back-end document. The Document from `lotus.domino`; it's the **same API** in SSJS, Java, and LotusScript. It maps straight to the note in the database, with no screen binding involved.

HCL is blunt about it on the `NotesXspDocument` page: for "direct work with the Domino database," use `NotesDocument`. The data source is the convenience layer for wiring up the screen; to touch the real document, reach down to the back-end one.

## Getting the back-end NotesDocument in SSJS

Two routes, depending on whether you go through the data source.

**(1) From the current data source** — the common case, you're inside an event on some XPage:

```javascript
var doc:NotesDocument = document1.getDocument();
```

[`getDocument()`](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html) is officially "Gets the document as a NotesDocument object." There's also a parameterised form, `getDocument(applyChanges)`: `true` first applies "any changes made to the data store" before returning; `false` (the default) doesn't. That parameter matters when you've changed values in code and need the back-end document to reflect them right away — but it's a topic of its own. What it actually applies, and when you must pass it, is in [what the `true` in `getDocument(true)` really does](/domino-news/en/posts/xpages-getdocument-applychanges/); no need to repeat it here.

**(2) Skipping the data source entirely** — when what you're processing in SSJS isn't the current note at all, but other documents (lookups, batches, cross-database):

```javascript
var db:NotesDatabase = database;                 // the global `database`
var doc:NotesDocument = db.getDocumentByUNID(unid);
// or via a view:
var view:NotesView = db.getView("vwUsers");
var doc2:NotesDocument = view.getDocumentByKey("USER_001");
// or a brand-new document:
var newDoc:NotesDocument = db.createDocument();
```

This route gives you a pure back-end document, unrelated to `document1`, and it never touches the screen data source.

## What the back-end document does

Once you hold a `NotesDocument`, its methods are the back-end API you already know (identical to LotusScript): read with `getItemValue` / `getItemValueString`, write with [`replaceItemValue`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html), run the form's formulas and validation with `computeWithForm`, persist with `save`, delete with `remove`, get identity with `getUniversalID` / `getNoteID`, test state with `isNewNote` / `isResponse`.

A complete "get document → change fields → save":

```javascript
try {
    var view:NotesView = database.getView("vwUsers");
    var doc:NotesDocument = view.getDocumentByKey("USER_001");
    if (doc != null) {
        doc.replaceItemValue("Status", "Active");
        doc.replaceItemValue("LastUpdated", session.createDateTime("Today"));

        // computeWithForm(dodatatypes, raiseError): run the form's defaults + validation
        if (doc.computeWithForm(true, false)) {
            doc.save(true, false);   // save(force, makeResponse)
            print("Updated, UNID=" + doc.getUniversalID());
        } else {
            print("computeWithForm validation failed");
        }
    }
} catch (e) {
    print("Processing failed: " + e.toString());
}
```

Two parameters worth noting: `save(force, makeResponse)` — `force` controls whether to save anyway when someone else edited the same note concurrently; `computeWithForm(dodatatypes, raiseError)` — the second argument decides whether a failed validation throws or returns `false`. The code above passes `false`, so it checks the return value itself.

## Where the line sits: which one, when

This is the part that bites, and the part to remember. One note, two objects, two ways to save:

| What you're doing | Which one |
|---|---|
| Read/write the **bound-control** layer | data source `document1.getValue` / `setValue` |
| Read/write the **document's fields** | back-end `doc.getItemValue` / `replaceItemValue` |
| Save "the whole data source + screen input" | `document1.save()` |
| Save just the back-end document you hold | `doc.save()` |
| `computeWithForm`, `remove`, get the UNID | back-end `doc` (the data source has none of these) |

In one line: **leave the screen binding to the data source, leave the document itself to the back-end `NotesDocument`.** When you need to cross over, `getDocument()` is the bridge.

## The classic trap: saving on both sides

Miss that line and the typical result is a **save conflict**. Here's the shape of it: when the page loads, the data source `document1` records the note's current version stamp (sequence number). In SSJS you do `var doc = document1.getDocument()`, pull the back-end document, and call `doc.save()` — the copy on disk is now newer. Then the XPages lifecycle fires `document1.save()`, but the data source is still holding the **old** stamp when it writes. Domino compares, sees the disk copy is newer than what the data source remembers, calls it a conflict, and spawns a `$Conflict` document.

The fix is to hold the line: **one note, save from one side only.** Going through the screen → `document1.setValue(...)` plus `document1.save()` throughout, never `doc.save()`; working the back end directly → `doc.save()`, and then don't let the data source `save()` too. The full reproduction, re-run on Domino 12.0.2 and 14.5.1, is in [the XPages save-conflicts piece](/domino-news/en/posts/xpages-save-conflicts/).

## What about Java and LotusScript?

The back-end `NotesDocument` class is nearly the same across languages — because it *is* the same `lotus.domino.Document`:

- **LotusScript**: `NotesDocument`, `db.GetDocumentByUNID`, `doc.ReplaceItemValue`, `doc.Save` — same method names, differing only in casing convention and syntax.
- **Java**: `lotus.domino.Document`, `db.getDocumentByUNID(...)`, `doc.replaceItemValue(...)`, `doc.save()`; Java has one extra chore — `recycle()` the handle when done to release memory, which SSJS / LS don't need. That story is in [Java's NotesDocument and item handling](/domino-news/en/posts/java-document-items/).
- **The SSJS-specific part** isn't `NotesDocument` itself, it's the layer wrapped **over** it — `NotesXspDocument`, the data source. That layer is XPages-only, and telling it apart from the back-end document is the whole point of this piece.
