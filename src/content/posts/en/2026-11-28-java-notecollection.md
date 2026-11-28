---
title: "NoteCollection in Java: Set the Criteria, Then buildCollection — and It Selects Design Notes, Not Just Documents"
description: "DocumentCollection only selects documents. But to inventory a database's design elements, export a batch of forms/views/agents together with data as DXL, or select notes by creation time, you need NoteCollection — it selects design notes too. It's a two-step model: set the Select* flags, SelectionFormula, and SinceTime first, then call buildCollection() to compile — until you build, the collection is empty and unusable. And there's an iteration trap: getNextNoteID isn't parameterless; you pass it the current note id. This covers how NoteCollection differs from DocumentCollection, the two-step model, how to select, how to walk it, and turning a note id back into a document."
pubDate: 2026-11-28T07:30:00+08:00
lang: en
slug: java-notecollection
tags:
  - "Java"
sources:
  - title: "NoteCollection class (Java) (design + data elements, two-step, Select* / SelectionFormula / SinceTime) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS_JAVA.html"
  - title: "buildCollection (NoteCollection - Java) (unusable until you build) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_BUILDCOLLECTION_METHOD_NC_JAVA.html"
  - title: "getFirstNoteID / getNextNoteID (NoteCollection - Java) (getNextNoteID takes the current id) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTNOTEID_METHOD_NC_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "NoteCollection"
apiLang: "java"
cover: "/covers/java-notecollection.webp"
coverStyle: "photoreal-3d"
---

`DocumentCollection` only selects documents. But sometimes you want more than documents: inventory which design elements a database has, export a batch of forms / views / agents **together with** data as DXL, or grab "only notes created after this date." That calls for [`NoteCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNOTECOLLECTION_CLASS_JAVA.html) — in the docs, "Represents a collection of Domino design and data elements in a database." It selects **design notes too**.

It works in two steps: set the criteria, then `buildCollection()` to compile. Until you build, the collection is empty and unusable. And walking it has a trap: `getNextNoteID` isn't parameterless — you pass it the current note id.

This covers how it differs from `DocumentCollection`, the two-step model, selecting, walking it, and turning a note id back into a document.

---

## NoteCollection vs DocumentCollection: it selects design, too

Both are "a set of notes"; the difference is **what they can select**:

- `DocumentCollection` — "a collection of documents", data only.
- `NoteCollection` — "design and data elements": **documents plus design elements** (forms, views, agents, folders, image resources…).

So "design inventory", "selective DXL export (take specific design along with its data)", "filter notes by creation time" — only `NoteCollection` can do those. It's new as of Release 6.5, and it's built from `Database`.

## Two steps: set criteria, then buildCollection

This is the core rhythm. `Database.createNoteCollection(selectallflag)` makes an empty shell; the parameter, per the docs, "Sets all the "Select" note collection properties true or false." — `false` means "select nothing yet" (opt in afterward); `true` means "select everything."

```java
NoteCollection nc = db.createNoteCollection(false);  // nothing selected yet
nc.setSelectForms(true);        // want forms
nc.setSelectViews(true);        // want views
nc.setSelectDocuments(true);    // want data documents too
nc.buildCollection();           // ← compile; without this the collection is unusable
```

[`buildCollection()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_BUILDCOLLECTION_METHOD_NC_JAVA.html) is blunt: "You must build the collection before it is usable." and "The built collection contains the database notes determined by the current values of SelectionFormula, SinceTime, and the Select properties." — the moment you build is when the criteria are **resolved into actual notes**. Forget `buildCollection()` and the symptom is "the collection is always empty." To change criteria and re-select, use `clearCollection()` (docs: "Clears (invalidates) a note collection build.") then reset and rebuild.

## Selecting: Select flags, selectAllDesignElements, SelectionFormula, SinceTime

- **Individual Select flags** — `setSelectDocuments` / `setSelectForms` / `setSelectViews` / `setSelectAgents` … flip them one at a time. Of these, `SelectDocuments` (data documents) and `SelectProfiles` (profile documents) are flagged "Not in a selectAll group" — the data flags you set individually.
- **Whole groups** — `selectAllDesignElements(true)` turns on a big block of design flags (forms / views / agents / folders / images / pages…) in one call, instead of one-by-one.
- **SelectionFormula** — a formula string filter; docs: "Formula that selects notes for inclusion in the collection." and it "must be a valid Domino formula that evaluates to True (includes the note) or False (excludes the note)." The key line: "It intersects the other selection criteria." — it's **ANDed with** the rest, not a standalone selection. It starts as an empty string = select all.
- **SinceTime** — note that it's **creation time**, not modified time. Docs: "Indicates the earliest note creation time in the collection." and "excluding notes created prior to this time." It's inert until you set a date. Reach for it for "notes created after day X" — don't assume it filters "changed" notes.

## The trap: getNextNoteID takes the current id

The walk isn't shaped like `getNextDocument()`. `getFirstNoteID()` is parameterless and returns the first note id string; but [`getNextNoteID(noteid)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTNOTEID_METHOD_NC_JAVA.html) **wants you to pass in the current id** to get the next:

```java
String id = nc.getFirstNoteID();
while (id.length() > 0) {                 // when there's no next, it returns a zero-length string
  Document doc = db.getDocumentByID(id);  // note id → document
  System.out.println(id + "  " + doc.getItemValueString("Form"));
  id = nc.getNextNoteID(id);              // ← pass the current id back in
}
```

Two documented details: "If no next note exists, this method returns a string of length 0." (test length 0, not null) and "This method throws an exception if the parameter is an invalid note ID." (a bad id throws). Write it parameterless out of `getNextDocument()` habit and it won't even compile — this one bites most when you're adapting an existing loop.

## Note id → document, and feeding DXL

What you get is a note id string; turn it back into a `Document` with `database.getDocumentByID(id)` (docs: "Finds a document in a database, given the document note ID.").

A common downstream: `NoteCollection` is a natural input to a **selective DXL export** — you pick exactly "these design elements plus this data", then hand it to DxlExporter to write out as one DXL file. The round-trip wrinkles of DXL itself are in [the DXL exporter / importer piece](/domino-news/posts/java-dxl-exporter-importer/).

## What about LotusScript and SSJS?

The same `NoteCollection`:

- **LotusScript**: `NotesNoteCollection`, with `CreateNoteCollection`, `BuildCollection`, `GetFirstNoteID` / `GetNextNoteID`, `SelectionFormula`, `SinceTime` — same two-step, same "GetNextNoteID takes the current id", no recycle.
- **SSJS / XPages**: the same `database.createNoteCollection()`, used when an XPages tool inventories or exports design.
- **The Java-specific part** isn't the API (the methods are shared) — it's the setting: a back-end / scheduled Java agent doing design inventory, selective DXL export, or creation-time batch processing. `NoteCollection` is the wider blade than `DocumentCollection`; just remember "set criteria, then build" and "getNextNoteID takes the current id."
