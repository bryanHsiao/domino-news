---
title: "Managing the Full-Text Index from Code: CreateFTIndex, UpdateFTIndex, and the Local-vs-Server Split"
description: "FTSearch needs a full-text index to be fast — and to support wildcards and relevance ranking — and NotesDatabase can create, update, and remove one from LotusScript. The catch is a split almost nobody expects: CreateFTIndex / UpdateFTIndex / RemoveFTIndex work on LOCAL databases only, while FTIndexFrequency is server-only, and server indexes are actually managed by the Updall task (updall -X rebuilds, it doesn't create). This article covers the options bitmask, the create-vs-update distinction, and that split."
pubDate: 2026-07-17T07:30:00+08:00
lang: en
slug: notes-database-ft-index
tags:
  - "LotusScript"
  - "Admin"
  - "Tutorial"
sources:
  - title: "NotesDatabase.CreateFTIndex method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEFTINDEX_METHOD_DB.html"
  - title: "NotesDatabase.UpdateFTIndex method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_UPDATEFTINDEX_METHOD.html"
  - title: "NotesDatabase.IsFTIndexed property — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISFTINDEXED_PROPERTY.html"
relatedJava: ["Database"]
relatedSsjs: ["database"]
cover: "/covers/notes-database-ft-index.webp"
coverStyle: "low-poly-3d"
---

A full-text index is what makes [`FTSearch`](/domino-news/en/posts/lotusscript-ftsearch) both fast and capable — beyond speed, it's what enables wildcards, the `AND`/`OR`/`NEAR` operators, and relevance-ranked sorting (`FTSearchScore`) that a plain formula scan can't do. Without one, `FTSearch` does **not** silently become `db.Search` (a different method that selects with a formula, evaluated document by document): on a local database it still runs, but degrades to a slow on-the-fly scan and loses relevance ranking; on a server database an un-indexed full-text query typically throws a "database is not full-text indexed" error (the message you'll see from an XPages view search with no index) unless a Notes.ini like `TEMP_INDEX_MAX_DOC` is set. So it's natural to want to build and maintain that index from code. `NotesDatabase` lets you: `CreateFTIndex`, `UpdateFTIndex`, `RemoveFTIndex`, `IsFTIndexed`. What trips people up isn't the API — it's a local-versus-server split that isn't obvious until your code silently does nothing (or errors) against a server database.

---

## TL;DR

- Gate work on [`db.IsFTIndexed`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISFTINDEXED_PROPERTY.html) — "indicates whether or not a database has a full-text index" (the database must be open).
- [`db.CreateFTIndex(options&, recreate)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEFTINDEX_METHOD_DB.html) builds an index. `recreate=True` deletes and rebuilds; `recreate=False` does nothing if one already exists. **Local databases only.**
- [`db.UpdateFTIndex(createFlag)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_UPDATEFTINDEX_METHOD.html) incrementally refreshes an existing index; `createFlag=True` creates one if missing (needs at least one document). Also **local only**.
- **The split:** those management methods are **local-only**, but `FTIndexFrequency` (the auto-update cadence) is **server-only**. Server-database indexes are built/rebuilt by the **Updall** task, not by these methods.
- `options&` is a bitmask: `FTINDEX_ATTACHED_FILES` (1), `FTINDEX_ENCRYPTED_FIELDS` (2), `FTINDEX_ALL_BREAKS` (4), `FTINDEX_CASE_SENSITIVE` (8), `FTINDEX_ATTACHED_BIN_FILES` (16). Combine by addition.

## Checking, creating, updating

The canonical pattern branches on `IsFTIndexed`, then either creates (recreate) or updates:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase

  ' Management methods work on LOCAL databases only.
  Dim options As Long
  options = FTINDEX_ALL_BREAKS + FTINDEX_ATTACHED_FILES   ' index breaks + attachment text

  If db.IsFTIndexed Then
    Call db.UpdateFTIndex(False)          ' refresh the existing index incrementally
    Print "Existing FT index updated"
  Else
    Call db.CreateFTIndex(options, False) ' create with the chosen options
    Print "New FT index created"
  End If
End Sub
```

The `options` bitmask controls what gets indexed: attachment text (`FTINDEX_ATTACHED_FILES`) and binary attachment content (`FTINDEX_ATTACHED_BIN_FILES`) inflate the index most; `FTINDEX_ALL_BREAKS` records sentence/paragraph breaks so the `PARAGRAPH`/`SENTENCE` query operators work; `FTINDEX_CASE_SENSITIVE` enables `EXACTCASE`. `recreate` and `createFlag` are the pair to keep straight:

- `CreateFTIndex(options, True)` — **deletes and fully rebuilds** with those options. Don't run this on a schedule; it throws away the index every time.
- `CreateFTIndex(options, False)` — "if this parameter is False and an index exists, no action is taken."
- `UpdateFTIndex(True)` — **create-if-missing, else refresh**. This is the "ensure it exists and is current" call. (An empty database won't get an index even with `True` — it needs at least one document.)
- `UpdateFTIndex(False)` — refresh only; no-op if there's no index.

`RemoveFTIndex` deletes the index (local only, and it's a no-op — no error — if there isn't one).

## The split nobody expects

Here's the part the docs state plainly but developers keep missing. The management methods say, verbatim: "This method works only for local databases." `UpdateFTIndex` puts it as "Notes returns an error if you attempt to create a full-text index on a database that is not local." So against a database on a server, `CreateFTIndex` / `UpdateFTIndex` / `RemoveFTIndex` don't quietly work — they error.

And the one property that *is* server-scoped is the mirror image: `FTIndexFrequency` (the auto-update cadence — `FTINDEX_DAILY`, `FTINDEX_SCHEDULED`, `FTINDEX_HOURLY`, `FTINDEX_IMMEDIATE`) "applies only to databases on servers." So you set *how often* a server index refreshes from code, but you can't *build* that server index from code.

**Who builds server indexes, then?** The **Updall** server task. An admin runs `load updall <database>` to update view and full-text indexes, and `load updall <database> -X` — note the uppercase `-X` — to **rebuild** corrupted full-text indexes. Be precise here: `-X` *rebuilds*, it does not *create* an initial index. Initial full-text indexing of a server database is set up through the Domino Administrator (database properties / Full Text) or by enabling indexing and letting Update/Updall build it. The LotusScript methods simply can't reach across to a server database.

## Practical guidance

- **Local scratch/temp databases** an agent builds and searches: use `CreateFTIndex` / `UpdateFTIndex` freely — that's exactly their scope.
- **Server production databases:** don't try to index them from LotusScript; that's admin/Updall territory. From code you can read `IsFTIndexed` to *check* and set `FTIndexFrequency` to tune the cadence, but the build itself is server-side.
- Always gate `FTSearch` on `IsFTIndexed`. When there's no index, have *your* code decide the path — build/refresh the index first, or fall back to a formula-based `db.Search` (an O(N) scan) as an explicit alternative — rather than assuming `FTSearch` degrades on its own. On a server database especially, an un-indexed full-text query errors outright instead of quietly running slow.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `db.CreateFTIndex(opts, recreate)` | `db.createFTIndex(opts, recreate)` | `database.createFTIndex(...)` |
| `db.UpdateFTIndex(create)` | `db.updateFTIndex(create)` | `database.updateFTIndex(...)` |
| `db.IsFTIndexed` / `FTIndexFrequency` | `db.isFTIndexed()` / `getFTIndexFrequency()` | `database.isFTIndexed()` / … |

The Java and SSJS `Database` classes mirror these method-for-method, and the same local-only / server-only split applies in every language — it's a property of where the index physically lives, not of the API surface you call it from.
