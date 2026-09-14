---
title: "NoteID, UNID, @DocumentUniqueID: What Actually Separates Domino's Three Document IDs"
description: "To point at a Domino document you might grab its NoteID, its UniversalID (UNID), or use @DocumentUniqueID in Formula — three that look alike and behave nothing alike. A NoteID only means something inside one database file and changes across replicas; the UNID is a 32-character identity that's identical across every replica; @DocumentUniqueID returns that UNID (but without @Text it's a doclink, not text). This piece pins down each one's scope, stability, and when to use it — including the 'change the UNID and it becomes a new document' and 'save a duplicate UNID and get error 4000' traps, and where that /0/UNID in web URLs comes from."
pubDate: 2026-09-14T07:30:00+08:00
lang: en
slug: notes-document-ids
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Formula"
sources:
  - title: "UniversalID property (NotesDocument) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_UNIVERSALID_PROPERTY_DOC.html"
  - title: "NoteID property (NotesDocument) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTEID_PROPERTY.html"
  - title: "@DocumentUniqueID (Formula Language) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_DOCUMENTUNIQUEID.html"
  - title: "GetDocumentByUNID (NotesDatabase) — HCL Domino Designer (official)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_GETDOCUMENTBYUNID_METHOD.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
---

When you need to "point at a particular document" in code or a link, Domino hands you several IDs: `NoteID`, `UniversalID`, and in Formula there's `@DocumentUniqueID`. They're all hex strings and look alike, so it's tempting to grab whichever — and then, on some replica or after a copy-paste, you suddenly reach the wrong document, or none. The differences are big. Here they are.

## TL;DR

- **NoteID**: 8 characters, unique only **within one database file**, representing the document's location in that file. **It usually differs on another replica**, and after a delete the number can be reused — good only for temporary access within one session, one database.
- **UniversalID (UNID)**: 32 hex characters, **identical across every replica**, the document's real identity. Store it, doclink it, put it in a web URL — use this.
- **`@DocumentUniqueID`**: how you get the UNID in Formula; it returns the UNID — but **without `@Text` it comes back as a doclink, not readable text**.
- **The `/0/UNID` in web URLs**: that `0` means "find the document straight by UNID, no view" — which is why attachment/doclink URLs look the way they do.

## NoteID: only meaningful inside "this file"

The [official definition](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTEID_PROPERTY.html): a NoteID is an 8-character combination of letters and numbers that uniquely identifies a document **within a particular database**; it represents "the location of a document within a specific database file," so documents that are replicas of one another **generally have different note IDs**.

That word "location" is the crux. The NoteID is fast — in LotusScript `db.GetDocumentByID(noteid)` gets you there instantly — and it's fine for "I want to jump back to this document right now, in this database, this session." But it has two fatal traits:

- **It changes across replicas**: take a document's NoteID from server A, run `GetDocumentByID` against the replica on server B, and you'll most likely land on a **different document** (or none).
- **It can be reused**: after a document is deleted, that slot's number may be handed to a later new document.

So **never store a NoteID, and never use it across databases**. It's a throwaway local handle, not an identity card.

## UniversalID (UNID): the identity that survives replicas

The [official definition](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_UNIVERSALID_PROPERTY_DOC.html): "The universal ID, which uniquely identifies a document across all replicas of a database." — 32 hex characters, **the same across every replica of that database**. The docs even note: two documents in different replicas are replicas of each other precisely **when their UNID matches**.

This is what you store when you want to "remember a document": it's recognized across servers and replicas, so doclinks, web URLs, and references from external systems should all use the UNID. LotusScript gets it back with [`db.GetDocumentByUNID(unid)`](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_GETDOCUMENTBYUNID_METHOD.html).

**Two traps** (both on the official UniversalID page): `UniversalID` is **read-write**, but —

- **Change an existing document's UNID and you turn it into a new document** ("Modifying the UNID of an existing document transforms it into a new document").
- **Try to save a document with the same UNID as an existing one and you get `lsERR_NOTES_ERROR` (4000)**.

In other words, writable doesn't mean you should touch it. Unless you're deliberately building a replica relationship, leave it alone. One more: **copy-pasting** a document in the Notes client produces a **new UNID** (not the same document) — which is why people who assume "it's still the same document after copying" find their references don't line up.

## `@DocumentUniqueID`: the UNID in Formula (remember `@Text`)

In Formula — computed fields, view columns, agents — you get the UNID with `@DocumentUniqueID`. The [docs](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_DOCUMENTUNIQUEID.html) flag a trap many people hit:

> "To display the UNID, you must convert the result of this function to text, that is, you must specify `@Text(@DocumentUniqueID)`."

Without `@Text`, `@DocumentUniqueID` returns a **doclink to the document**, not that 32-character string — so when you go to splice the UNID into a URL or show it, forgetting `@Text` hands you something odd. By contrast, Formula's `@NoteID` returns the NoteID as `"NT"` followed by hex (again, only meaningful in this database).

## Where the `/0/UNID` in web URLs comes from

You've surely seen Domino document/attachment URLs like `…/db.nsf/0/<32-char-UNID>?OpenDocument`, or an attachment's `…/db.nsf/0/<UNID>/$FILE/name?OpenElement`. That **`0`** isn't a typo — the standard web URL form is `/db.nsf/<view>/<document>`, and `0` is a special placeholder meaning "**find the document straight by the UNID that follows, no view involved**." Because the UNID is unique across replicas, it's the sturdiest way to address a document on the web — which is exactly why, in the [attachments series](/domino-news/en/posts/domino-web-attachment-ui), the hand-built download links splice `@Text(@DocumentUniqueID)` into `/0/…/$FILE/…`.

## One table

| | NoteID | UniversalID (UNID) |
|---|---|---|
| Length | 8 chars | 32 chars (hex) |
| Scope | one database file | across all replicas |
| Across a replica | **changes** | stays the same |
| After delete | may be reused | — |
| Store / pass it? | **no** | yes, store this |
| LotusScript getter | `GetDocumentByID` | `GetDocumentByUNID` |
| Formula | `@NoteID` (`"NT…"`) | `@Text(@DocumentUniqueID)` |

(Don't confuse either with the **Replica ID** — that's a **database-level** ID marking "these files are replicas of the same database," a different thing from these two document-level IDs.)

## Wrap-up

One line to keep: **the NoteID is a throwaway local handle — fast, but void on another database or after a while; the UNID is the document's identity card — use it to store, to link, to put in a URL** (and in Formula, remember `@Text(@DocumentUniqueID)`). Get these two straight and you stop hitting "wrong document on the other replica" and "references don't match after a copy." For UNID in a real web URL, see [the classic-web attachment UI](/domino-news/en/posts/domino-web-attachment-ui).
