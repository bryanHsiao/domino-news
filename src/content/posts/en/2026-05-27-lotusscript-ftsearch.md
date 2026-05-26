---
title: "FTSearch: Domino's Three-Tier Full-Text Search API (NotesDatabase / NotesView / NotesDocumentCollection)"
description: "FTSearch is a method on three different Domino classes — and each tier returns something different. This article walks through NotesDatabase.FTSearch (returns a new collection), NotesView.FTSearch (filters the view object in place, returns a Long count), and NotesDocumentCollection.FTSearch (in-place reduction, void), the sortopt and options constants, a query-operator cheat sheet, the five CreateFTIndex options-bitmask flags and their relationship to `load updall -x`, the silent gotcha that FTSearch on a non-indexed database still runs (just slowly), the default 5000-document cap, the wildcard `*`-only-at-end constraint, and the must-be-uppercase rule for AND / OR / NOT. First in a three-part series — db.Search comes next, then a decision article tying everything together with the DQL trilogy."
pubDate: 2026-05-27T07:30:00+08:00
lang: en
slug: lotusscript-ftsearch
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "FTSearch method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html"
  - title: "FTSearch method (NotesView) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_VIEW.html"
  - title: "FTSearch method (NotesDocumentCollection) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html"
  - title: "CreateFTIndex method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEFTINDEX_METHOD_DB.html"
  - title: "Refining a search query using operators — HCL Domino"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/othr_refiningasearchqueryusingoperators_r.html"
relatedJava: ["Database", "View", "DocumentCollection"]
relatedSsjs: ["database", "view", "documentCollection"]
cover: "/covers/lotusscript-ftsearch.png"
coverStyle: "oil-chiaroscuro"
---

## TL;DR

- **FTSearch lives on three classes and means three different things**: [`NotesDatabase.FTSearch`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html) returns a fresh `NotesDocumentCollection`; [`NotesView.FTSearch`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_VIEW.html) **filters the view object in place** and returns a `Long`; [`NotesDocumentCollection.FTSearch`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html) **reduces the collection in place** and returns nothing.
- **Missing FT index is not an error** — the method still runs. The official docs literally say "works, but less efficiently"; in production that means a lot slower.
- **`max=0` doesn't mean "no limit"** — it means "default cap", which is **5,000 documents**. Going beyond requires a notes.ini override.
- **Query operators must be uppercase** (AND / OR / NOT). Lowercase variants are treated as literal search terms — silent failure mode.
- **The `*` wildcard only works at the end of a term**, never at the start or in the middle.
- **`CreateFTIndex` only works on local databases** — server-side indexes go through admin via `load updall -x`.
- The three tiers map to three workflow shapes: DB-level for "search the whole database", View-level for "filter what the user sees in the UI", Collection-level for "structured criteria first, then text filter".

---

## Why three tiers?

Domino's search API has three entry points not because it's over-designed but because there are three different things you might already be holding:

| What you have | Method to call | What it does |
|---|---|---|
| A `NotesDatabase` and want to search the whole thing | `db.FTSearch(...)` | Sweeps the database, returns a new collection |
| A `NotesView` and want to filter what the user sees | `view.FTSearch(...)` | View itself becomes filtered; subsequent `GetFirstDocument` only sees matches |
| A `NotesDocumentCollection` from a prior step | `collection.FTSearch(...)` | Trims the collection in place, keeping only matches |

All three share the same underlying full-text index (if the database has one) and the same query syntax. The only thing that varies is **what goes in and what comes out**.

---

## NotesDatabase.FTSearch — search the whole database

Full signature:

```lotusscript
Set ndc = db.FTSearch(query$, maxdocs%, [sortoptions%], [otheroptions%])
```

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `query$` | String | ✅ | Full-text query string, may include operators / wildcards |
| `maxdocs%` | Integer | ✅ | Max results to return. `0` = default cap (5,000) |
| `sortoptions%` | Integer | optional | Sort order, constants below |
| `otheroptions%` | Integer | optional | Extra flags, additively combined |

Returns: a [`NotesDocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html), described verbatim in the docs as "A collection of documents that match the full-text query, sorted by the selected option".

### sortoptions constants

| Constant | Value | Behavior |
|---|---:|---|
| `FT_SCORES` | 8 | Default, sorts by relevance score |
| `FT_DATE_ASC` | 64 | Sorts by document date ascending |
| `FT_DATE_DES` | 32 | Sorts by document date descending |
| `FT_DATECREATED_ASC` | 1543 | Sorts by creation date ascending |
| `FT_DATECREATED_DES` | 1542 | Sorts by creation date descending |

### otheroptions constants (combine by addition)

| Constant | Value | Behavior |
|---|---:|---|
| `FT_FUZZY` | 16384 | Fuzzy match, fault-tolerant |
| `FT_STEMS` | 512 | Stem search (`running` matches `run` / `ran`) |
| `FT_THESAURUS` | 1024 | Expand to synonyms |
| `FT_DATABASE` | 8192 | Include Domino databases |
| `FT_FILESYSTEM` | 4096 | Include non-database files |

Example — find documents containing "invoice", sort by score, cap at 50, with stem search:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

Dim docs As NotesDocumentCollection
Set docs = db.FTSearch("invoice", 50, FT_SCORES, FT_STEMS)

Print "Found " & docs.Count & " documents"

Dim doc As NotesDocument
Set doc = docs.GetFirstDocument()
Do Until doc Is Nothing
    Print doc.GetItemValue("Subject")(0) & _
          "  (score: " & doc.FTSearchScore & ")"
    Set doc = docs.GetNextDocument(doc)
Loop
```

Note `doc.FTSearchScore` — every document object carries this property after an FTSearch, integer 0–100, higher means more relevant.

---

## NotesView.FTSearch — filter the view in place

```lotusscript
numDocs& = view.FTSearch(query$, maxDocs%)
```

Two big differences from the DB-level version:

1. **Returns `Long`, not a collection** — you get a count of "how many entries match"
2. **The view object itself is mutated** — subsequent `GetFirstDocument` / `GetNextDocument` calls on that view only see the matching documents

To restore the full view, call [`view.Clear()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_VIEW.html):

```lotusscript
Dim view As NotesView
Set view = db.GetView("(AllByCustomer)")

Dim n As Long
n = view.FTSearch("Acme AND status=open", 0)
Print "Matched " & n & " entries in view"

' Walk filtered results
Dim doc As NotesDocument
Set doc = view.GetFirstDocument()
Do Until doc Is Nothing
    Print "  " & doc.GetItemValue("CustomerName")(0)
    Set doc = view.GetNextDocument(doc)
Loop

' Restore the view
Call view.Clear()
```

**When the database has an FT index**: results are sorted by relevance, descending. **Without an index**: matching documents keep the view's original sort order; only the filtering happens.

This tier fits UI scenarios — a user types a keyword into a view's filter box and the view live-updates — because the mutation target is the view object itself, no extra collection bookkeeping.

---

## NotesDocumentCollection.FTSearch — chain a text filter on existing matches

```lotusscript
Call collection.FTSearch(query$, maxDocs%)
```

Returns void; the collection is **reduced in place**. The docs say "reduces the collection to those documents that match".

Useful for chaining — first narrow by structured criteria with `db.Search()` (formula-based), then text-filter the survivors:

```lotusscript
' Step 1: find all Type="Order" docs with Total > 1000
Dim orders As NotesDocumentCollection
Set orders = db.Search( _
    "Type = ""Order"" & Total > 1000", _
    Nothing, 0)

' Step 2: within those orders, find ones containing "rush"
Call orders.FTSearch("rush", 0)

Print "Large rush orders: " & orders.Count
```

After filtering, the collection is sorted by relevance descending, and `FTSearchScore` is available on each document.

⚠️ The collection-level FTSearch has **no sortopt / options parameters** — only the default behavior. For custom sort, fall back to DB-level or sort the result yourself.

---

## Query syntax cheat sheet

From the [Domino full-text query operators reference](https://help.hcl-software.com/domino/11.0.1/admin/othr_refiningasearchqueryusingoperators_r.html), the operators you'll actually use:

### Logical operators (**must be uppercase**)

| Operator | Usage | Meaning |
|---|---|---|
| `AND` | `invoice AND paid` | Both terms must be present |
| `OR` | `invoice OR receipt` | Either term |
| `NOT` | `invoice NOT cancelled` | Exclude |

Lowercase `and` / `or` get treated as literal search terms — silent failure. Always `UCase()` your operators before they hit the query string.

### Field-scoped searches

```
[FieldName] CONTAINS value
[FieldName] = value
[FieldName] IS PRESENT      ' field is non-blank
[FieldName] > 100            ' numeric / date comparison
[Status] = "Open" AND [Total] > 500
```

`[_CreationDate]` and `[_RevisionDate]` are built-in metadata pseudo-fields.

### Wildcards

| Syntax | Meaning | Constraint |
|---|---|---|
| `bench*` | benchmark / benchmarks / benchmarking | `*` **only at end of term**, never start or middle |
| `b?nch` | bench / banch / ... | `?` matches a single character |

### Proximity operators

```
documents PARAGRAPH revenue   ' both words in same paragraph
documents SENTENCE revenue    ' both words in same sentence
```

### Exact phrase + case

```
"exact phrase here"        ' double quotes for literal phrase
EXACTCASE Hello            ' case-sensitive matching
TERMWEIGHT 2 important     ' weighted term (affects score)
```

---

## Managing the FT index

### Check whether the database is indexed

```lotusscript
If Not db.IsFTIndexed Then
    Print "Warning: no FT index, search will be slow"
End If
```

[`IsFTIndexed`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISFTINDEXED_PROPERTY.html) is a read-only Boolean; the database must be open first.

### Building an index programmatically (local only)

[`CreateFTIndex`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEFTINDEX_METHOD_DB.html) takes an options bitmask, additively combined:

| Flag | Value | Meaning |
|---|---:|---|
| `FTINDEX_ATTACHED_FILES` | 1 | Index attachment text content |
| `FTINDEX_ENCRYPTED_FIELDS` | 2 | Index encrypted fields |
| `FTINDEX_ALL_BREAKS` | 4 | Index sentence / paragraph breaks (for PARAGRAPH / SENTENCE operators) |
| `FTINDEX_CASE_SENSITIVE` | 8 | Case-sensitive index (for EXACTCASE) |
| `FTINDEX_ATTACHED_BIN_FILES` | 16 | Index attachment binary (PDF / Office) |

```lotusscript
' Build an index that captures paragraph breaks + case sensitivity
' If one already exists, drop and recreate
Call db.CreateFTIndex( _
    FTINDEX_ALL_BREAKS + FTINDEX_CASE_SENSITIVE, _
    True)
```

⚠️ **This only works on local databases.** Server-side databases must be indexed by admin via `load updall -x <dbname>` or the database property dialog.

### Update / remove

```lotusscript
' Incremental update
Call db.UpdateFTIndex(False)

' Create if missing (local only)
Call db.UpdateFTIndex(True)

' Drop the index
Call db.RemoveFTIndex()
```

Difference between `UpdateFTIndex(True)` and `CreateFTIndex`: the former **updates an existing index, creates only if missing**; the latter forces a fresh build. Use the former for incremental scenarios.

### Auto-update frequency

The `db.FTIndexFrequency` property controls how often the server auto-updates the index, with constants matching the DB property dialog (Immediate / Hourly / Daily / Scheduled).

---

## Three common traps

### 1. Missing index doesn't complain

The most insidious one — write FTSearch, it "works" in dev, then crushes production. The [official docs](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html) literally say: "If the database is not full-text indexed, this method works, but less efficiently".

Defense: production code should always check:

```lotusscript
If Not db.IsFTIndexed Then
    ' Two options:
    ' (a) try to build one (local only, usually not applicable in prod)
    ' (b) raise an error so admin can react — don't silently degrade
    Error 1001, "DB " & db.FilePath & " has no FT index — performance will degrade"
End If
```

### 2. `max=0` is not "unlimited"

Many developers assume `db.FTSearch(query, 0)` means "give me everything" — what they actually get is the **first 5,000 results**. The default cap is 5,000; raising it requires the `FT_MAX_SEARCH_RESULTS` notes.ini setting.

Defense: for large result sets in production, paginate (sort by a field + cursor through), or switch to DQL — which has no such cap, covered in the follow-up.

### 3. View.FTSearch leaves the view filtered

```lotusscript
' ❌ Wrong: view object never cleared, next caller inherits filter state
Call view.FTSearch("urgent", 0)
' ...process results...
' Done, view object falls out of scope

' ✅ Right: explicitly clear when finished
Call view.FTSearch("urgent", 0)
' ...process results...
Call view.Clear()
```

Server-side agents usually get away with this (view object is GC'd at scope end), but XPages or classic web apps that reuse view objects across requests will show users stale filter state from the previous search.

---

## Connecting to the other search mechanisms

FTSearch isn't Domino's only search path — it's the **text-indexed** path. The follow-up [`db.Search`](/domino-news/en/posts/lotusscript-db-search) covers formula-based search (no index needed, brute-force scan), and the third article compares FTSearch / db.Search / DQL side-by-side as a decision guide, cross-linked with the [DQL trilogy](/domino-news/en/posts/dql-getting-started).

Domino 14 also integrated `@FTSearch()` as a term inside DQL queries — you can now embed a full-text predicate directly inside DQL. That relationship is detailed in the third article.

---

## What about Java and SSJS?

| Language | Counterpart |
|---|---|
| LotusScript | `NotesDatabase.FTSearch` / `NotesView.FTSearch` / `NotesDocumentCollection.FTSearch` |
| Java | `lotus.domino.Database.FTSearch()` / `View.FTSearch()` / `DocumentCollection.FTSearch()` (drop the `Notes` prefix; remember to `.recycle()`) |
| SSJS | `database.FTSearch(...)` / `view.FTSearch(...)` / `documentCollection.FTSearch(...)` (directly callable inside XPages, returns wrapper objects) |

The API surface is consistent across languages — query syntax, sortopt, and options constants all share the same values (in Java they're qualified as `Database.FT_SCORES` etc.).
