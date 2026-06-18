---
title: "NotesNewsletter: Turning a Pile of Documents into One Doclink Digest Email"
description: "You want a 'daily digest' or 'search-results notification' — take a set of documents matching some criteria, roll them into one email, and let each entry link back to its source document. That's exactly NotesNewsletter's job: it takes a NotesDocumentCollection and produces a doclink digest with FormatMsgWithDoclinks, or renders documents one by one with FormatDocument. This article covers creating it, the DoScore / DoSubject / SubjectItemName properties, the difference between the two Format methods, and the classic FTSearch-to-email example."
pubDate: 2026-06-18T07:30:00+08:00
lang: en
slug: notes-newsletter
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesNewsletter class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html"
  - title: "FormatMsgWithDoclinks method (NotesNewsletter) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FORMATMSGWITHDOCLINKS_METHOD.html"
  - title: "NotesNewsletter class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESNEWSLETTER_CLASS.html"
relatedJava: ["Newsletter"]
relatedSsjs: ["Newsletter"]
cover: "/covers/notes-newsletter.webp"
coverStyle: "risograph"
---

It's a common requirement: every day, roll up the documents that "arrived yesterday and match some criteria" into one email to the relevant people; or a user selects a few rows in a view and clicks a button to "send these to me." Ideally each entry in the email links straight back to its source document.

You could assemble the HTML and stuff in the doclinks yourself — but Domino has a class built for exactly this: [`NotesNewsletter`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESNEWSLETTER_CLASS.html). The docs define it as "a document or set of documents that contain information from, or links to, several other documents" — in plain terms, it turns **a collection of documents** into **a digest that points back to them**.

---

## TL;DR

- Create from a `NotesDocumentCollection`: `session.CreateNewsletter(collection)` (or `New NotesNewsletter(collection)`, not supported under COM)
- **Two output methods**: `FormatMsgWithDoclinks(db)` produces **one** message with a doclink to each document; `FormatDocument(db, n)` renders the nth document in the collection into a document
- **Three properties** (read-write): `DoScore` (include each document's relevance score), `DoSubject` (include a subject string for each), `SubjectItemName` (which item to use as the subject source)
- After creation it does just two things: `FormatMsgWithDoclinks` or `FormatDocument`
- Classic combo: `FTSearch` / `UnprocessedDocuments` to get a collection → make a newsletter → `Send`

---

## Creating it: feed it a collection

`NotesNewsletter`'s input is a [`NotesDocumentCollection`](/domino-news/posts/notes-document-collection/) — however you assemble that collection is up to you (FTSearch, view selection, UnprocessedDocuments…):

```lotusscript
Dim newsletter As NotesNewsletter
Set newsletter = New NotesNewsletter(collection)
```

After creation, its role is simple: "format" that collection into a message or document. The docs are explicit that the only operations supported post-creation are `FormatMsgWithDoclinks` and `FormatDocument`.

## FormatMsgWithDoclinks: one message, a link per entry

This is the most-used one. It creates **one** document in the given database containing **a doclink to every document in the collection**. The canonical case is a "search-results digest email" — here's the [official example](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESNEWSLETTER_CLASS.html), verbatim:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim collection As NotesDocumentCollection
Dim newsletter As NotesNewsletter
Dim doc As NotesDocument
Set db = session.CurrentDatabase
Set collection = db.FTSearch( "arachnid", 15 )
If ( collection.Count > 0 ) Then
  Set newsletter = New NotesNewsletter( collection )
  Set doc = newsletter.FormatMsgWithDoclinks( db )
  doc.Form = "Memo"
  doc.Subject = "The Arachnid Report"
  Call doc.Send( False, "Sharron Karasic" )
End If
```

The flow is clear: [`FTSearch`](/domino-news/posts/lotusscript-ftsearch/) gets the matching collection → [`FormatMsgWithDoclinks`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FORMATMSGWITHDOCLINKS_METHOD.html) produces a document with doclinks → set it to the `Memo` form, give it a subject → `Send`. The recipient clicks a link in the email and jumps back to the source document.

## FormatDocument: render one at a time

`FormatDocument(db, n)` is different — it renders (pictures) the **nth** document in the collection into a new document in the database. For one-by-one processing, loop:

```lotusscript
Set collection = db.UnprocessedDocuments
Set newsletter = New NotesNewsletter( collection )
For j = 1 To collection.Count
    Set doc = newsletter.FormatDocument( mailDb, j )
    Call doc.Save( True, True )
Next
```

Quick rule: **"one message, many links" → `FormatMsgWithDoclinks`; "each entry as its own document" → `FormatDocument`.**

## Three properties to tune the content

Set these three (read-write) before formatting to adjust the digest's content:

| Property | Effect |
|---|---|
| `DoScore` | whether to include each entry's relevance score (a natural fit with FTSearch's ranking score) |
| `DoSubject` | whether to include a string describing each entry's subject |
| `SubjectItemName` | which item on the documents to use as the subject source |

For an FTSearch digest, for instance, `DoScore = True` lists the search relevance alongside each entry so the recipient sees which are most relevant.

## What about Java and SSJS?

| Language | Counterpart | Created via |
|---|---|---|
| Java (`lotus.domino.*`) | `Newsletter` | `session.createNewsletter(collection)` |
| SSJS / XPages | `Newsletter` | `session.createNewsletter(collection)` |

Consistent across all three: take a document collection, the `formatMsgWithDoclinks` / `formatDocument` methods, the same `DoScore` / `DoSubject` toggles. To build a scheduled digest email in a Java agent, the flow here carries straight over.
