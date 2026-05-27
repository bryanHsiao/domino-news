---
title: "db.Search: Brute-Force Document Search with @Formula — The No-Index Path"
description: "NotesDatabase.Search is LotusScript's second search mechanism — no full-text index needed, just @Formula evaluated against every document. This article breaks down the three parameters (formula / dateTime / maxDocs) and how their semantics differ from FTSearch, why the result is unsorted, how the dateTime parameter doubles as a cursor for incremental processing, the truly-unlimited maxDocs=0 (unlike FTSearch's 5000 default cap), the @function subset that doesn't work in this context (UI / lookup / write-back), the snapshot-not-live-view gotcha that catches developers after StampAll, and a production-ready incremental scheduled agent example. Part 2 of a three-part series — the follow-up compares FTSearch / db.Search / DQL side by side."
pubDate: 2026-05-28T07:30:00+08:00
lang: en
slug: lotusscript-db-search
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Search method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SEARCH_METHOD.html"
  - title: "NotesDatabase class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
  - title: "Collecting documents by searching — HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COLLECTING_DOCUMENTS_BY_SEARCHING.html"
  - title: "FTSearch method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html"
relatedJava: ["Database"]
relatedSsjs: ["database"]
cover: "/covers/lotusscript-db-search.png"
coverStyle: "watercolor"
---

You want to find every order in the database where `Type = "Order"` and `Total > 1000`. The predicate is structured — it has nothing to do with text content. Could you use [Part 1's FTSearch](/domino-news/en/posts/lotusscript-ftsearch)? Technically yes, but writing the condition as an FT query is awkward and still requires the admin to have built an FT index.

LotusScript's second path is `NotesDatabase.Search` — write the predicate as an `@Formula`, Domino evaluates it once per document, returns the matches. No index dependency, no 5,000-document cap, and the syntax is the same one you already use in view selection formulas. The cost is an O(N) full scan — fine for small-to-medium databases, but worth re-evaluating once you're past hundreds of thousands of documents.

This is Part 2 of the search trilogy — the actual semantics of the three parameters (especially the ones that look like FTSearch's but mean something entirely different), which @function categories don't work in this context, the snapshot-not-live-view gotcha that catches developers after `StampAll`, and a production-ready incremental scheduled agent pattern.

---

## TL;DR

- [**`db.Search(formula$, dateTime, maxDocs%)`**](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SEARCH_METHOD.html) is LotusScript's brute-force search — evaluates an @Formula predicate against every document. **No full-text index required.**
- The docs say it directly: "the search query is a formula" — entirely different language from [FTSearch](/domino-news/en/posts/lotusscript-ftsearch)'s text query.
- **`maxDocs=0` truly means "all"** — unlike FTSearch where 0 caps at the default 5,000.
- **Returns an unsorted `NotesDocumentCollection`** — no sortopt / options parameter. Sort it yourself if you need order.
- **`dateTime` is "only documents modified after this point"** — a natural cursor for incremental processing. Pass `Nothing` to scan everything.
- **The formula is a subset of @Formula language** — UI-interactive (`@Prompt`, `@Picklist`), lookup (`@DbColumn`, `@DbLookup`), and write-back (`@SetField`, `@Command`) functions don't work; field comparisons, string ops, and date arithmetic do.
- **The returned collection is a snapshot, not a live view** — after `StampAll`, the documents change but the collection still holds the original NoteIDs.
- **Performance is O(N) in document count** — fine for highly selective predicates over small-to-medium databases; switch to [DQL](/domino-news/en/posts/dql-getting-started) for large tables or frequent queries.

---

## Why bother with db.Search after FTSearch?

[Part 1 FTSearch](/domino-news/en/posts/lotusscript-ftsearch) covered the indexed text path. But FTSearch has two preconditions:

1. **A full-text index has to exist** — admin coordination on servers, disk space cost
2. **The query is text-oriented** — structured conditions like "Status = 'Open' AND Total > 1000" are awkward in FT operator syntax

db.Search takes a different road: write your conditions in [`@Formula` language](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COLLECTING_DOCUMENTS_BY_SEARCHING.html), Domino evaluates the formula once per document, keeps the ones returning `True`.

The cost — **a full scan of every document in the database**, performance proportional to total count. But for:

- One-off / low-frequency ad-hoc queries
- Predicates dominated by structured fields, with little or no text matching
- Cases where no FT index is available (local dev, admin won't cooperate)
- Small-to-medium databases (thousands to tens of thousands of documents)

— db.Search is the most direct tool.

---

## Signature breakdown

[`db.Search`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SEARCH_METHOD.html) has three parameters that look like FTSearch's at a glance but mean very different things:

```lotusscript
Set ndc = db.Search(formula$, notesDateTime, maxDocs%)
```

| Parameter | Type | Required | Difference vs FTSearch |
|---|---|---|---|
| `formula$` | String | ✅ | FTSearch wants an FT query; here it's **@Formula** |
| `notesDateTime` | NotesDateTime | ✅ | FTSearch has no such parameter; here it's a "modified-after" cursor |
| `maxDocs%` | Integer | ✅ | FTSearch 0 = default cap of 5,000; **Search 0 = truly unlimited** |

Returns: an **unsorted [`NotesDocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html)**. Note the missing sortopt — sort it yourself by walking the collection into an array, or stage through a view.

### The `notesDateTime` parameter

It's not what most developers assume — this filters by **document last-modified time**, not document pubDate or any custom field:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

' Scenario A: whole database
Set docs = db.Search("Type = ""Order""", Nothing, 0)

' Scenario B: only modified/added in the past 24 hours
Dim midnight As New NotesDateTime("")
Call midnight.SetNow()
Call midnight.AdjustHour(-24)
Set newDocs = db.Search("Type = ""Order""", midnight, 0)
```

`Nothing` = no time filter.

**This cursor is the key to production incremental processing** — a scheduled agent remembers its last run time, next time only looks at documents modified after that. Orders of magnitude faster than scanning the full database every run.

### What `maxDocs%` really means

```lotusscript
' Truly get everything
Set all = db.Search("Type = ""Order""", Nothing, 0)

' First 100 only
Set top100 = db.Search("Type = ""Order""", Nothing, 100)
```

This is the inverse of FTSearch's behavior — FTSearch `maxDocs=0` means "default cap 5000", Search `maxDocs=0` means "unlimited". Easy to get backwards; production code should comment which it expects.

---

## What the formula can and can't do

The `formula$` is a subset of [@Formula language](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COLLECTING_DOCUMENTS_BY_SEARCHING.html), not the full surface — the last expression's value decides whether the document is included.

**Supported**:

```lotusscript
' Field value comparison
db.Search("Status = ""Open""", Nothing, 0)
db.Search("Total > 1000 & Total < 5000", Nothing, 0)
db.Search("Form = ""Invoice"" | Form = ""Receipt""", Nothing, 0)

' Document metadata
db.Search("@IsAvailable(Approver)", Nothing, 0)        ' field exists
db.Search("@Modified > [05/01/2026]", Nothing, 0)      ' modified after
db.Search("@Created < [01/01/2025]", Nothing, 0)       ' created before

' String operations
db.Search("@Contains(Subject; ""urgent"")", Nothing, 0)
db.Search("@Begins(CustomerName; ""ACM"")", Nothing, 0)
db.Search("@LowerCase(Status) = ""open""", Nothing, 0)

' Date arithmetic
db.Search("@Adjust(Created; 0; 0; 30; 0; 0; 0) < @Now", Nothing, 0)  ' older than 30 days

' Boolean logic
db.Search("Type = ""Order"" & (Status = ""Open"" | Priority = ""High"")", _
          Nothing, 0)
```

**Not supported** — any @function that needs UI or external lookup:

| Category | Examples | Why it can't work |
|---|---|---|
| UI interaction | `@Prompt`, `@Picklist`, `@DialogBox` | Search runs in server / agent context, no UI |
| Lookup | `@DbLookup`, `@DbColumn`, `@GetDocField` | Side-effects; Search's evaluation context doesn't support them |
| Environment | `@SetEnvironment`, `@Environment` | Per-document evaluation order isn't guaranteed |
| Write-back | `@SetField`, `@Command` | Search is read-only context |

In practice: combinations of `@Modified` / `@Created` / field comparisons / `@Contains` usually suffice. When lookup is needed, narrow with Search first, then walk the result in LotusScript and do lookups per document.

---

## The collection is a snapshot, not a live view

The most common trap: get a collection, `StampAll` to update them all, then expect to walk the collection again and see updated values:

```lotusscript
' ❌ Wrong: expecting the collection to reflect new values
Set docs = db.Search("Status = ""Pending""", Nothing, 0)
Call docs.StampAll("Status", "Processed")

' All those documents now have Status = "Processed"
' But the collection still has the same Count
' And GetItemValue does return the new (stamped) value

' However, if you re-search:
Set newDocs = db.Search("Status = ""Pending""", Nothing, 0)
Print newDocs.Count  ' = 0 (we just stamped them all)
```

Key insight: the collection is a **snapshot of NoteIDs at search time**, not a live conditional query. After `StampAll`, the documents change, but the collection still holds the same NoteIDs — they just no longer satisfy the original predicate. Re-running the search is the only way to get "what currently matches".

Related trap — modifying documents while walking:

```lotusscript
' ❌ Risky: walk-and-mutate may skip or repeat documents
Dim doc As NotesDocument
Set doc = docs.GetFirstDocument()
Do Until doc Is Nothing
    doc.Status = "Processed"
    Call doc.Save(True, False)
    Set doc = docs.GetNextDocument(doc)  ' next pointer may be stale
Loop
```

This pattern often works in practice but isn't guaranteed by the docs. The safe shape is to freeze the NoteIDs into an array first, then iterate the array:

```lotusscript
' ✅ Safe: snapshot NoteIDs first
Dim noteIds() As String
ReDim noteIds(docs.Count - 1)
Dim doc As NotesDocument
Set doc = docs.GetFirstDocument()
Dim i As Integer
i = 0
Do Until doc Is Nothing
    noteIds(i) = doc.NoteID
    i = i + 1
    Set doc = docs.GetNextDocument(doc)
Loop

' Iterate the array, not the collection
For i = 0 To UBound(noteIds)
    Set doc = db.GetDocumentByID(noteIds(i))
    doc.Status = "Processed"
    Call doc.Save(True, False)
Next
```

---

## In practice: an incremental scheduled agent

Combine the `dateTime` cursor with a profile document so each run only sees new documents:

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Set db = session.CurrentDatabase

    ' 1. Read the last-run timestamp from a profile document
    Dim profile As NotesDocument
    Set profile = db.GetProfileDocument("IncrementalCursor")

    Dim cursor As NotesDateTime
    If profile.HasItem("LastRun") Then
        Set cursor = profile.GetFirstItem("LastRun").DateTimeValue
    Else
        ' First run: look at the past 7 days
        Set cursor = session.CreateDateTime("")
        Call cursor.SetNow()
        Call cursor.AdjustDay(-7)
    End If

    Print "Looking for new Orders since " & cursor.LocalTime

    ' 2. Freeze "now" before searching — this becomes the next cursor
    '    so we don't miss docs added during this run
    Dim runStart As New NotesDateTime("")
    Call runStart.SetNow()

    ' 3. Incremental search
    Dim docs As NotesDocumentCollection
    Set docs = db.Search("Type = ""Order"" & Status = ""New""", cursor, 0)

    Print "Found " & docs.Count & " new orders to process"

    ' 4. Process (NoteID-array pattern to dodge walk-and-mutate risk)
    Dim noteIds() As String
    If docs.Count > 0 Then
        ReDim noteIds(docs.Count - 1)
        Dim doc As NotesDocument
        Set doc = docs.GetFirstDocument()
        Dim i As Integer
        i = 0
        Do Until doc Is Nothing
            noteIds(i) = doc.NoteID
            i = i + 1
            Set doc = docs.GetNextDocument(doc)
        Loop

        For i = 0 To UBound(noteIds)
            Set doc = db.GetDocumentByID(noteIds(i))
            ' ...actual processing...
            doc.ReplaceItemValue "Status", "Processed"
            Call doc.Save(True, False)
        Next
    End If

    ' 5. Persist this run's timestamp as the next cursor
    Call profile.ReplaceItemValue("LastRun", runStart)
    Call profile.Save(True, False)
End Sub
```

The critical design choice — freeze the cursor value **before** the search, not with `@Now`. Otherwise documents added during the search itself might fall after the cursor and either get double-processed next run or get skipped, depending on race timing.

---

## Relationship to FTSearch and DQL

`db.Search` and the previous article's [`FTSearch`](/domino-news/en/posts/lotusscript-ftsearch) aren't mutually exclusive — they often chain:

```lotusscript
' Narrow with Search first, then text-filter with FTSearch
Set docs = db.Search("Type = ""Order"" & Total > 1000", Nothing, 0)
Call docs.FTSearch("urgent", 0)  ' Within those orders, find ones containing "urgent"
```

This chain exploits:

- `db.Search` doesn't need an FT index — can filter on unindexed fields precisely
- `collection.FTSearch` reduces in place — the second-stage text filter doesn't re-scan the whole database

**Starting with Domino 14** there's also [DQL](/domino-news/en/posts/dql-getting-started) — a third path for structured queries, faster than Search, with SQL-like syntax. Domino 14 also integrated FTSearch into DQL — you can embed a [`@FTSearch()` term](https://help.hcl-software.com/dom_designer/14.5.0/basic/dql_fulltextsearch.html) inside a DQL query to mix text and structured conditions. The next article picks apart when to use which.

---

## What about Java and SSJS?

| Language | Counterpart |
|---|---|
| LotusScript | `NotesDatabase.Search(formula$, dateTime, max%)` |
| Java | `lotus.domino.Database.search(formula, since, max)` (lowercase name; remember to `.recycle()`) |
| SSJS | `database.search(formula, since, max)` (directly callable inside XPages) |

Semantics are identical across the three — same @Formula, same unsorted collection. The Java side adds `search(formula)` and `search(formula, since)` overloads where omitted parameters mean "unrestricted".
