---
title: "NotesNoteCollection: the Swiss-army tool for NSF design elements"
description: "NotesNoteCollection is not a NotesDocumentCollection variant — it represents every kind of 'note' in an NSF, including data documents AND design elements (forms, views, agents, ACL, code libraries). This post catalogues the 32 properties, 14 methods, the True/False initialisation parameter on CreateNoteCollection, and its most common real-world use: feeding NotesDXLExporter."
pubDate: "2026-04-29T10:50:36+08:00"
lang: "en"
slug: "notes-note-collection"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
  - "DevOps"
sources:
  - title: "NotesNoteCollection (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESNOTECOLLECTION_CLASS.html"
  - title: "NotesDatabase CreateNoteCollection method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATENOTECOLLECTION_METHOD.html"
  - title: "NotesDXLExporter (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html"
cover: "/covers/notes-note-collection.png"
---

## Why this is not a `NotesDocumentCollection` variant

`NotesDocumentCollection` is for data documents — a Memo, a Customer record. `NotesNoteCollection` is for **every kind of note in the NSF**:

- Data documents (the same things `NotesDocumentCollection` covers)
- Design elements: forms, views, folders, agents, pages, subforms, shared fields
- Code: script libraries, Java resources, action bars, the database script
- Resources: image resources, style sheets
- Security: ACL, profile documents
- Misc: replication formulas, design indices, format elements

A "note" is the NSF's internal storage concept — anything that gets a Note ID. So the sweet spot for `NotesNoteCollection` is:

> **"I need to batch-process a database's design elements — every agent, every view, the entire design plus data for a DXL export."**

`NotesDocumentCollection` cannot do that. It only sees data documents.

## Construction: `CreateNoteCollection(Boolean)`

Obtained from `NotesDatabase`:

```lotusscript
Set nc = db.CreateNoteCollection(False)
```

That boolean controls **the initial state of every `Select*` property**:

- `True` → every `Select*` starts as `True` (start with everything, then turn off what you don't want)
- `False` → every `Select*` starts as `False` (start with nothing, then turn on what you want)

`False` is more common in practice — you usually know which class of element you need, so you start empty and switch on the relevant flags.

## 32 properties — pick what you want

The full list documented in the source:

### Lifecycle / general

| Property | Purpose |
|---|---|
| `Count` | Number of notes the collection covers |
| `Parent` | The owning `NotesDatabase` |
| `LastBuildTime` | When `BuildCollection` last completed |
| `SinceTime` | Restrict to notes modified after this timestamp |
| `SelectionFormula` | Extra `@Formula` filter on top of the `Select*` flags |

### 27 `Select*` flags (one per note class)

| Bucket | Properties |
|---|---|
| **Data / flow** | `SelectDocuments`, `SelectFolders`, `SelectViews` |
| **Form family** | `SelectForms`, `SelectSubforms`, `SelectSharedFields`, `SelectFrameSets`, `SelectPages` |
| **Code** | `SelectAgents`, `SelectScriptLibraries`, `SelectActions`, `SelectDatabaseScript` |
| **Resources** | `SelectImageResources`, `SelectJavaResources`, `SelectStyleSheetResources`, `SelectIcon` |
| **Outline / nav** | `SelectOutlines`, `SelectNavigators` |
| **Security / config** | `SelectACL`, `SelectProfiles`, `SelectReplicationFormulas`, `SelectDataConnections` |
| **Help** | `SelectHelpAbout`, `SelectHelpUsing`, `SelectHelpIndex` |
| **Misc** | `SelectMiscCodeElements`, `SelectMiscFormatElements`, `SelectMiscIndexElements` |

Each is a Boolean. To grab every agent and every view:

```lotusscript
Set nc = db.CreateNoteCollection(False)
nc.SelectAgents = True
nc.SelectViews = True
Call nc.BuildCollection()
```

## 14 methods — three groups

### Lifecycle

| Method | Purpose |
|---|---|
| `BuildCollection` | Walk the database with the `Select*` flags + `SelectionFormula` and harvest the matching notes. Mandatory — without it `Count = 0` |
| `ClearCollection` | Empty the collection (without resetting the `Select*` flags) |

### Set operations

| Method | Purpose |
|---|---|
| `Add(noteOrCollection)` | Add a single note or another collection |
| `Remove(noteOrCollection)` | Remove from the collection |
| `Intersect(otherCollection)` | Keep only notes that are in both |

### Bulk presets

| Method | Purpose |
|---|---|
| `SelectAllNotes(Boolean)` | Set all 27 `Select*` flags to True or False at once |
| `SelectAllDataNotes(Boolean)` | Set just the data-related flags (`SelectDocuments`, etc.) |
| `SelectAllDesignElements(Boolean)` | Set just the design-element flags |
| `SelectAllAdminNotes(Boolean)` | Set just the admin flags (ACL, profiles, etc.) |
| `SelectAllCodeElements(Boolean)` | Set just the code flags |
| `SelectAllFormatElements(Boolean)` | Set just the format flags |
| `SelectAllIndexElements(Boolean)` | Set just the index flags |

### Iteration

| Method | Purpose |
|---|---|
| `GetFirstNoteID` | Returns the first Note ID (string form, e.g. `"NT00001ABC"`) |
| `GetNextNoteID(currentID)` | Returns the next Note ID |

> Note: the documentation does **not** define `GetLastNoteID`, `GetPrevNoteID`, `Merge`, `Subtract`, or `GetUNID`. AI-generated articles about this class often hallucinate those methods — they don't exist. Trust the docs.

## A practical example: audit every agent in a database

```lotusscript
Sub AuditAgents(db As NotesDatabase)
    Dim nc As NotesNoteCollection
    Dim noteID As String
    Dim doc As NotesDocument

    Set nc = db.CreateNoteCollection(False)
    nc.SelectAgents = True
    Call nc.BuildCollection()

    Print "Found " & nc.Count & " agent(s)"

    noteID = nc.GetFirstNoteID()
    Do Until noteID = ""
        Set doc = db.GetDocumentByID(noteID)
        Print doc.GetItemValue("$TITLE")(0) & _
              " | LastModified: " & doc.LastModified
        noteID = nc.GetNextNoteID(noteID)
    Loop
End Sub
```

Four things this snippet gets right:

1. `CreateNoteCollection(False)` — start empty, turn on only what you need
2. `nc.SelectAgents = True` — agents only
3. `BuildCollection()` — mandatory; the collection is empty without it
4. `GetFirstNoteID` / `GetNextNoteID` return **Note ID strings**, not `NotesDocument` objects — you fetch the document yourself with `db.GetDocumentByID()`

## The most common real use: DXL export

In practice, the dominant use case for `NotesNoteCollection` is feeding [`NotesDXLExporter`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLEXPORTER_CLASS.html):

```lotusscript
Sub ExportAllDesignToDXL(db As NotesDatabase, outputPath As String)
    Dim nc As NotesNoteCollection
    Dim exporter As NotesDXLExporter
    Dim s As New NotesSession
    Dim stream As NotesStream

    ' 1. Collect every design element (no data documents)
    Set nc = db.CreateNoteCollection(False)
    Call nc.SelectAllDesignElements(True)
    Call nc.BuildCollection()

    ' 2. Open the output file
    Set stream = s.CreateStream()
    Call stream.Open(outputPath, "UTF-8")

    ' 3. Run the DXL exporter on the entire collection
    Set exporter = s.CreateDXLExporter()
    Call exporter.SetInput(nc)
    Call exporter.SetOutput(stream)
    Call exporter.Process()

    Call stream.Close()
    Print "Export complete: " & outputPath
End Sub
```

This is the "templating tool" pattern — exporting an entire template database's design as XML for version control, cross-environment deployment, or backup. `NotesNoteCollection` + `NotesDXLExporter` is the canonical path.

## Side-by-side with `NotesDocumentCollection`

| | `NotesDocumentCollection` | `NotesNoteCollection` |
|---|---|---|
| Scope | Data documents only | Every note (design + data) |
| Element type | Always `NotesDocument` | Note ID strings (look the document up yourself) |
| Construction | `db.AllDocuments`, `view.AllEntries.GetAllDocuments`, etc. | Only `db.CreateNoteCollection(Boolean)` |
| Filtering | Done at the source (view, folder, query) | `Select*` flags + `SelectionFormula` |
| Set operations | `Add` doesn't surface the original doc you added | `Add` / `Remove` / `Intersect` are first-class |
| Best for | Walking data, searching, batch updates | Design audits, DXL export, deployment tooling |

## When *not* to use NotesNoteCollection

- Plain batch ops on data documents → `NotesDocumentCollection` or DQL (`NotesDominoQuery`)
- Walking a view with entry-level metadata → [`NotesViewNavigator`](/domino-news/en/posts/notes-view-navigator)
- Just need a list of design elements → `NotesDatabase.GetView()` / `GetForm()` / `GetAgent()` are simpler

The sweet spot is **"I need to batch-process notes at the design level"**. For that scenario, there's no better tool.
