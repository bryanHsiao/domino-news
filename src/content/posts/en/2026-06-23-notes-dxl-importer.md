---
title: "NotesDXLImporter: Pushing DXL Back into Domino — Separate Strategies for Design, Documents, and ACL"
description: "After you export design or documents to DXL (Domino XML) with NotesDXLExporter, how do you push it back into a database? NotesDXLImporter is the reverse half. This article covers creating it, the three key import strategies (DesignImportOption / DocumentImportOption / ACLImportOption and their create / ignore / replace / update choices), the Import method and retrieving imported notes, and how it pairs with DXLExporter into a full DXL round-trip."
pubDate: 2026-06-23T07:30:00+08:00
lang: en
slug: notes-dxl-importer
tags:
  - "LotusScript"
  - "Tutorial"
  - "DevOps"
sources:
  - title: "NotesDXLImporter class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html"
  - title: "NotesDXLExporter class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html"
  - title: "Import method (NotesDXLImporter) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IMPORT_METHOD_DXLIMPORTER.html"
relatedJava: ["DxlImporter"]
relatedSsjs: ["DxlImporter"]
cover: "/covers/notes-dxl-importer.webp"
coverStyle: "art-deco"
---

The earlier [`NotesXMLProcessor`](/domino-news/posts/notes-xml-processor/) piece introduced `NotesDXLExporter` — turning Domino design elements or documents into **DXL (Domino XML)**. The natural reverse question: given a piece of DXL, how do you push it **back** into a database?

That's the job of [`NotesDXLImporter`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html). The official definition: "Represents the conversion of DXL (Domino XML) to Domino data." It turns DXL back into Domino data — design elements, documents, ACL. Common uses: **programmatically deploying design** (pushing a few forms / views to several databases), **restoring documents from backup DXL**, or moving data between systems.

---

## TL;DR

- Create with `session.CreateDXLImporter()`; the input is DXL (string / file / stream), and the output target database is set with `SetOutput()`.
- **Three key import strategies**, each controlling one kind of content:
  - `DesignImportOption` — design elements: create / ignore / replace
  - `DocumentImportOption` — documents: create / ignore / replace / update
  - `ACLImportOption` — ACL entries: ignore / replace / update
- `Import(dxl, db)` runs the import; `ImportedNoteCount` returns how many notes came in; `GetFirstImportedNoteID` / `GetNextImportedNoteID` walk the results.
- Other controls: `ReplaceDbProperties`, `ReplicaRequiredForReplaceOrUpdate`, `InputValidationOption` (validate against a DTD), `ExitOnFirstFatalError`, `Log` / `LogComment`.
- Pairs with `NotesDXLExporter` — one exports, one imports, forming a full DXL round-trip.

## Creating it and the basic flow

```lotusscript
Dim session As New NotesSession
Dim importer As NotesDXLImporter
Set importer = session.CreateDXLImporter()

' set the import strategy (see below)
importer.DocumentImportOption = DXLIMPORTOPTION_CREATE

' run it: import dxl into targetDb
Call importer.Import(dxlString, targetDb)
Print "Imported " & importer.ImportedNoteCount & " notes"
```

The `dxl` source can be a string, file, or stream; `targetDb` is the [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html) to import into.

## The three keys: Design / Document / ACL ImportOption

The thing to think through before importing is "what happens when it meets something that already exists." A piece of DXL can contain design, documents, and ACL all at once, and each has its own strategy property:

| Property | Controls | Choices (per the docs) |
|---|---|---|
| `DesignImportOption` | design elements | "create, ignore, or replace" |
| `DocumentImportOption` | documents | "create, ignore, replace, or update" |
| `ACLImportOption` | ACL entries | "ignore, replace, or update" |

Some practical calls:

- **Deploying design**: usually `DesignImportOption = replace` (overwrite the old design), documents mostly `ignore` (don't touch user data), ACL often `ignore` (don't overwrite the target database's permissions).
- **Restoring / importing documents**: `DocumentImportOption = create` (all new) or `update` (update existing documents by UNID). The difference between `update` and `replace` is that update matches existing documents — and there `ReplicaRequiredForReplaceOrUpdate` decides "whether a matching replica ID is required" before updating, which matters when importing across non-replica databases.

The classic disaster from a wrong strategy is "I only meant to update documents, but it also overwrote the target database's design or ACL." **Before importing, be clear about what's in the DXL and what each of the three options is set to.**

## Retrieving results and debugging

- `ImportedNoteCount` — how many notes were imported.
- `GetFirstImportedNoteID()` / `GetNextImportedNoteID(noteid)` — walk the note IDs of what was just imported, for follow-up processing or verification.
- `InputValidationOption` — if the XML declares a DTD, validate the input format against it.
- `ExitOnFirstFatalError` — stop on the first fatal error, or keep going.
- `Log` / `LogComment` — record the import process, which you'll want for batch deployments.

## Paired with DXLExporter: a full round-trip

`NotesDXLImporter` and [`NotesDXLExporter`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html) are a mirror pair:

```text
Domino data  --(DXLExporter)-->  DXL (XML)  --(DXLImporter)-->  Domino data
```

That round-trip underpins many "manage Domino design / data as text files" approaches — export design to DXL into source control, then import it back to deploy when needed. It's also the underlying mechanism for source-control-for-Domino and automated-deployment DevOps pipelines.

## What about Java and SSJS?

| Language | Counterpart | Created via |
|---|---|---|
| Java (`lotus.domino.*`) | `DxlImporter` | `session.createDxlImporter()` |
| SSJS / XPages | `DxlImporter` | `session.createDxlImporter()` |

Consistent across all three: the same three import options, `importDxl()` / `setDocumentImportOption()` and so on. To build a Domino automated-deployment tool, the Java `DxlImporter` plus the strategy judgment in this article transfers directly.
