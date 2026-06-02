---
title: "NotesDocumentCollection: Complete Guide to Document Collections in LotusScript"
description: "Almost every Domino agent ends up holding a NotesDocumentCollection — but most code only uses GetFirstDocument and GetNextDocument then stops. This article covers the full picture: seven ways to obtain a collection, five navigation methods, the three in-place set operations (Intersect / Merge / Subtract), StampAll batch-write semantics and the walk-and-mutate trap, RemoveAll's force-parameter concurrency semantics, and the FTSearch + set-operations chaining pattern."
pubDate: 2026-06-02T07:30:00+08:00
lang: en
slug: notes-document-collection
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDocumentCollection class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html"
  - title: "StampAll method (NotesDocumentCollection) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_STAMPALL_METHOD.html"
  - title: "RemoveAll method (NotesDocumentCollection) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REMOVEALL_METHOD.html"
  - title: "FTSearch method (NotesDocumentCollection) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html"
relatedJava: ["DocumentCollection"]
relatedSsjs: ["documentCollection"]
cover: "/covers/notes-document-collection.webp"
coverStyle: "pencil-sketch"
---

Almost every Domino scheduled agent ends with the same shape: `Set docs = db.FTSearch(...)` or `Set docs = db.Search(...)`, then a `Do Until doc Is Nothing` loop, save, done.

The object carrying all those documents is [`NotesDocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html). Virtually every "fetch a set of documents" operation in Domino returns one — but most code only uses the most basic traversal pattern and leaves the rest of the API untouched.

This article covers the full class: seven ways to obtain a collection, five navigation methods, the three set operations, batch operations (StampAll / RemoveAll), and a few traps that tend to cost half a day's debugging.

---

## TL;DR

- [`NotesDocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html) is a **snapshot** — a list of documents matching some criteria at the moment of creation, not a live query
- Seven creation entry points: `db.AllDocuments`, `db.Search`, `db.FTSearch`, `db.GetModifiedDocuments`, `db.GetAllReadDocuments`, `db.GetAllUnreadDocuments`, `db.GetProfileDocCollection`
- Five navigation methods: `GetFirstDocument`, `GetNextDocument`, `GetPrevDocument`, `GetLastDocument`, `GetNthDocument(n)`
- **All three set operations mutate the original collection in place**: `Intersect` (keep intersection), `Merge` (add union), `Subtract` (remove difference) — none of them return a new collection
- [`StampAll`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_STAMPALL_METHOD.html) batch-writes a field value to every document in the collection — much faster than a manual loop
- [`RemoveAll`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REMOVEALL_METHOD.html)'s `force` parameter controls concurrency: `True` deletes even if another user modified the document; `False` skips those
- **Use a NoteID array when you need to modify documents while iterating** — same trap as [db.Search](/domino-news/en/posts/lotusscript-db-search)

---

## Seven ways to get a collection

| Entry point | Description |
|---|---|
| `db.AllDocuments` | Every document in the database (read-only property) |
| `db.Search(formula, date, max)` | @Formula predicate filter (no FT index needed) |
| `db.FTSearch(query, max, sort, opts)` | Full-text indexed search |
| `db.GetModifiedDocuments(since, noteClass)` | Documents modified after a given date |
| `db.GetAllReadDocuments(user)` | Documents a specific user has read |
| `db.GetAllUnreadDocuments(user)` | Documents a specific user has not read |
| `db.GetProfileDocCollection(name)` | Profile documents matching a given name |

All return the same `NotesDocumentCollection` type; the API is identical regardless of how you obtained the collection.

---

## Five navigation methods

`GetFirstDocument` + `GetNextDocument` is the most common pattern, but the others have their uses:

```lotusscript
Dim docs As NotesDocumentCollection
Set docs = db.Search("Type = ""Order""", Nothing, 0)

' Forward traversal (most common)
Dim doc As NotesDocument
Set doc = docs.GetFirstDocument()
Do Until doc Is Nothing
    Print doc.GetItemValue("Subject")(0)
    Set doc = docs.GetNextDocument(doc)
Loop

' Reverse traversal
Set doc = docs.GetLastDocument()
Do Until doc Is Nothing
    Print doc.GetItemValue("Subject")(0)
    Set doc = docs.GetPrevDocument(doc)
Loop

' Random access (1-based index)
Set doc = docs.GetNthDocument(1)              ' first document
Set doc = docs.GetNthDocument(docs.Count)     ' last document
```

`GetNthDocument` is O(N) for large collections — only use it on small sets or for one-off position lookups. For heavy random access, freeze the NoteIDs into an array first.

---

## Two key properties

```lotusscript
Print "Document count: " & docs.Count     ' Integer, read-only
Print "Sorted: " & docs.IsSorted          ' Boolean, read-only
Print "Source query: " & docs.Query       ' String, read-only
```

`IsSorted` is `True` only for collections from `FTSearch` (sorted by relevance or date). Collections from `db.Search` are **unsorted** — traversal order is not guaranteed.

---

## The three set operations

All three mutate the **original collection in place** — they don't return a new one:

```lotusscript
Dim pending As NotesDocumentCollection
Set pending = db.Search("Status = ""Pending""", Nothing, 0)

Dim urgent As NotesDocumentCollection
Set urgent = db.Search("Priority = ""High""", Nothing, 0)

' Intersect: keep only documents in both collections (AND)
pending.Intersect(urgent)
' pending now contains only documents that are both Pending AND Urgent

' Merge: add documents from urgent that aren't already in pending
pending.Merge(urgent)
' equivalent to union

' Subtract: remove from pending any documents in urgent
pending.Subtract(urgent)
' equivalent to set difference
```

All three accept `NotesDocumentCollection`, `NotesDocument`, `NotesViewEntry`, or `NotesViewEntryCollection` as input, but **both collections must be from the same database** — cross-database operations throw an error.

### In practice: FTSearch + set operations chained

```lotusscript
' Start with structured criteria
Dim orders As NotesDocumentCollection
Set orders = db.Search("Type = ""Order"" & Status = ""Open""", Nothing, 0)

' Narrow further with a text search inside the first results
Call orders.FTSearch("urgent", 0)

' Remove already-flagged documents
Dim flagged As NotesDocumentCollection
Set flagged = db.Search("Flagged = ""1""", Nothing, 0)
orders.Subtract(flagged)

Print "Final urgent orders: " & orders.Count
```

For more on the FTSearch layer see the [FTSearch three-tier API article](/domino-news/en/posts/lotusscript-ftsearch). Note that [`collection.FTSearch`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html) only takes two parameters (query and maxDocs) — no sortopt or options flags.

---

## StampAll — batch-write a field value

[`StampAll`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_STAMPALL_METHOD.html) writes the same value to a named item on every document in the collection — much cleaner than a manual loop:

```lotusscript
' ❌ Verbose, slow
Dim doc As NotesDocument
Set doc = docs.GetFirstDocument()
Do Until doc Is Nothing
    doc.Status = "Processed"
    Call doc.Save(True, False)
    Set doc = docs.GetNextDocument(doc)
Loop

' ✅ One line
Call docs.StampAll("Status", "Processed")
```

`StampAll(itemName, value)` **auto-saves every document** — no separate `doc.Save()` needed.

For multiple fields at once, use `StampAllMulti(itemNames(), values())`:

```lotusscript
Dim fields(1) As String
Dim vals(1) As String
fields(0) = "Status"
fields(1) = "ProcessedBy"
vals(0) = "Processed"
vals(1) = "agent/ACME"
Call docs.StampAllMulti(fields, vals)
```

### StampAll trap: collection is a snapshot

After `StampAll` completes, the collection's `Count` is unchanged and `GetFirstDocument` returns documents with the new stamped values — but the **original filter condition no longer holds**:

```lotusscript
Set docs = db.Search("Status = ""Pending""", Nothing, 0)
Print docs.Count        ' say, 50 documents

Call docs.StampAll("Status", "Processed")

' Re-search to see how many are still Pending
Dim newDocs As NotesDocumentCollection
Set newDocs = db.Search("Status = ""Pending""", Nothing, 0)
Print newDocs.Count     ' 0 (we just stamped them all)
Print docs.Count        ' still 50 (snapshot unchanged)
```

See the snapshot trap section in the [db.Search article](/domino-news/en/posts/lotusscript-db-search) for more on this.

---

## RemoveAll — bulk delete documents from disk

[`RemoveAll(force)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REMOVEALL_METHOD.html) **permanently deletes** every document in the collection from the database — this is not just removing them from the collection object:

| `force` value | Behavior |
|---|---|
| `True` | Delete even if another user modified the document after it was retrieved |
| `False` | Skip any document that was modified by someone else during the operation |

```lotusscript
Dim toDelete As NotesDocumentCollection
Set toDelete = db.Search("Status = ""Expired"" & @Created < [01/01/2020]", Nothing, 0)

Print "About to delete: " & toDelete.Count & " documents"

' Use force=False in production: safer under concurrent access
Call toDelete.RemoveAll(False)
```

⚠️ This is irreversible (without a backup or DAOS). Production code should log the count before deletion and ideally log NoteIDs.

---

## Other useful methods

| Method | Description |
|---|---|
| `AddDocument(doc)` | Add a document to the collection (disk unchanged) |
| `DeleteDocument(doc)` | Remove a document from the collection (**not** from disk) |
| `Clone()` | Copy the collection to a new object (also a snapshot) |
| `Contains(doc)` | Check if a document is in this collection |
| `PutAllInFolder(name)` | Add every document to a folder (creates folder if missing) |
| `RemoveAllFromFolder(name)` | Remove every document from a folder |
| `MarkAllRead()` | Mark all documents as read |
| `MarkAllUnread()` | Mark all documents as unread |
| `UpdateAll()` | Mark all documents as processed by an agent |

---

## Safe iteration when modifying documents

Same principle as [db.Search](/domino-news/en/posts/lotusscript-db-search) — walking the collection while modifying documents can cause skipped or double-processed entries. Freeze NoteIDs first:

```lotusscript
' Freeze NoteID list
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
    If Not (doc Is Nothing) Then
        doc.ReplaceItemValue "Status", "Processed"
        Call doc.Save(True, False)
    End If
Next
```

---

## Deletion stubs

After you obtain a collection, if a document gets deleted or you lose read access to it before you finish iterating, the traversal still returns a **deletion stub** object. Check for it:

```lotusscript
Set doc = docs.GetFirstDocument()
Do Until doc Is Nothing
    If doc.IsDeleted Then
        ' Skip deletion stub
    Else
        Print doc.GetItemValue("Subject")(0)
    End If
    Set doc = docs.GetNextDocument(doc)
Loop
```

Long-running agents processing large collections are most likely to encounter this — other users may delete documents while the agent is still running.

---

## NotesDocumentCollection vs NotesNoteCollection

Two collection classes that often get confused:

| | `NotesDocumentCollection` | `NotesNoteCollection` |
|---|---|---|
| Member type | NotesDocument only | Any note type (documents, design elements, config) |
| How obtained | `db.Search`, `db.FTSearch`, etc. | `db.CreateNoteCollection` |
| Primary use | Business document processing | DXL export, design element management |
| Navigation | `GetFirstDocument`, etc. | `GetFirstNoteID`, etc. |

Day-to-day business logic almost always uses `NotesDocumentCollection`. `NotesNoteCollection` comes up when automating maintenance tasks (see the [NotesNoteCollection article](/domino-news/en/posts/notes-note-collection)).

---

## What about Java and SSJS?

| Language | Counterpart |
|---|---|
| LotusScript | `NotesDocumentCollection` |
| Java | `lotus.domino.DocumentCollection` (drop the `Notes` prefix; remember `.recycle()`) |
| SSJS | `documentCollection` (directly callable in XPages; same API surface) |
