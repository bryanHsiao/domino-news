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

The documentation does **not** define `GetLastNoteID`, `GetPrevNoteID`, `Merge`, `Subtract`, or `GetUNID` — verify against the official docs when writing code.

## Worked example 1: audit every agent in a database

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

## Worked example 2: list every view name (two ways compared)

A common real-world need: "**get me a list of every view name in this database**". `NotesNoteCollection` can do it, but there's a much shorter path:

```lotusscript
' Method A: NotesNoteCollection
Set nc = db.CreateNoteCollection(False)
nc.SelectViews = True
Call nc.BuildCollection()

noteID = nc.GetFirstNoteID()
Do Until noteID = ""
    Set doc = db.GetDocumentByID(noteID)
    Print doc.GetItemValue("$TITLE")(0)   ' $TITLE is "Name|Alias|Alias"
    noteID = nc.GetNextNoteID(noteID)
Loop
```

```lotusscript
' Method B: db.Views
ForAll v In db.Views
    Print v.Name      ' v.Name is the resolved primary name
    ' v.Aliases is the alias array
End ForAll
```

Trade-offs:

| | Method A (`NotesNoteCollection`) | Method B (`db.Views`) |
|---|---|---|
| Just want view names | Overkill | ✅ The standard idiom |
| Pick up views + folders + agents in one pass | ✅ Add `SelectFolders=True`, `SelectAgents=True` | ❌ Three separate calls (`db.Views` / `db.Folders` / `db.Agents`) |
| Filter with `SelectionFormula` or `SinceTime` (e.g. "views modified in the last 7 days") | ✅ Built in | ❌ Pull all, filter yourself |
| Feed `NotesDXLExporter` | ✅ Direct input | ❌ Build the collection yourself |
| What you actually get back | Note ID strings (call `GetDocumentByID` separately) | `NotesView` objects ready to use (`view.AllEntries`, etc.) |

**Picking the right one:**

- "**Just give me the view names**" → `db.Views`. Three lines, done.
- "**Mixed types**, **time/condition filtering**, or **DXL export pipeline**" → `NotesNoteCollection`.

One subtle point: `db.Views` **includes folders** (a folder is a specialised view). To strictly exclude folders, filter with `view.IsFolder`, or use Method A with `SelectViews=True` only — folders have their own `SelectFolders` flag.

## Worked example 3: pulling data documents (you can, but you usually shouldn't)

`NotesNoteCollection` **can** harvest data documents — just turn on `SelectDocuments`:

```lotusscript
Set nc = db.CreateNoteCollection(False)
nc.SelectDocuments = True       ' data documents only
Call nc.BuildCollection()

noteID = nc.GetFirstNoteID()
Do Until noteID = ""
    Set doc = db.GetDocumentByID(noteID)
    Print doc.UniversalID & " | Form=" & doc.Form(0)
    noteID = nc.GetNextNoteID(noteID)
Loop
```

Or use the bulk preset `nc.SelectAllDataNotes(True)` to flip every data-related flag at once.

But — **this isn't usually how you reach for data**. Each standard idiom has a shorter path:

| Need | Standard idiom | Why it beats `NotesNoteCollection` |
|---|---|---|
| All data documents | `db.AllDocuments` | One line; returns `NotesDocumentCollection` directly, no `GetDocumentByID` round-trip |
| Conditional query | DQL (`NotesDominoQuery`), then [NQRP](/domino-news/en/posts/notes-query-results-processor) for post-processing | SQL-like syntax; the engine uses indexes automatically |
| Formula selection | `db.Search(formula, ...)` | Native `@Formula` input |
| Walking a view's entries | [`NotesViewNavigator`](/domino-news/en/posts/notes-view-navigator) or `view.AllEntries` | Gives you the view's own column metadata |

### Where NotesNoteCollection actually beats them for data

There are three situations where it wins:

1. **Mixed harvest: data + design in one pass** — e.g. "every note modified in the last 7 days, including views and agents" for an audit or backup
   ```lotusscript
   Call nc.SelectAllNotes(True)
   nc.SinceTime = New NotesDateTime(Now - 7)
   Call nc.BuildCollection()
   ```
2. **Feeding `NotesDXLExporter`** — when you want data plus design exported together for version control
3. **Note IDs instead of `NotesDocument` objects** — writing tooling or audit logs that just need the IDs

### One subtlety

`SelectDocuments = True` does **not** include:

- Deletion stubs
- Conflict documents are handled slightly differently from `NotesDocumentCollection`

If you're doing a "complete database audit" you'll need to handle those edge cases separately.

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
