---
title: "Readers and Authors Fields in Code: Document-Level Security You Set with a NotesItem Flag"
description: "Domino's document-level access control isn't a special API — it's an ordinary item with a flag. This article covers creating Readers and Authors fields in LotusScript via ReplaceItemValue plus NotesItem.IsReaders / IsAuthors, the security model (no Readers item = everyone; an item with Readers = only those listed), and the lock-out traps: leave yourself and your agents out of the list and you can hide a document from everyone, including the code that made it."
pubDate: 2026-07-10T07:30:00+08:00
lang: en
slug: readers-authors-fields
tags:
  - "LotusScript"
  - "Security"
  - "Tutorial"
sources:
  - title: "IsReaders property (NotesItem) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISREADERS_PROPERTY.html"
  - title: "IsAuthors property (NotesItem) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISAUTHORS_PROPERTY.html"
  - title: "NotesItem class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESITEM_CLASS.html"
relatedJava: ["Item", "Document"]
relatedSsjs: ["item", "document"]
cover: "/covers/readers-authors-fields.webp"
coverStyle: "low-poly-3d"
---

You build an HR application where each record should be visible only to the employee and their manager. The database ACL gives everyone Reader access — that's too coarse. What you want is *per-document* control, and in Domino that lives one level below the ACL, in the document itself: a **Readers field**. The surprise for people coming from other platforms is that it's not a special security API at all — it's a normal item with a flag set on it.

That flag is [`NotesItem.IsReaders`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISREADERS_PROPERTY.html) (and its sibling `IsAuthors`). Get the flag right and you have document-level security; get it wrong and you can lock a document away from everyone — including the agent that created it.

---

## TL;DR

- A **Readers item** "contains a list of Notes user names, indicating people who have Reader access to a particular document." An **Authors item** does the same for Author-level edit access.
- **The model:** a document with **no** Readers item is readable by everyone with DB read access. Add a Readers item and the document becomes visible to **only** the names, groups, and roles listed in it. This is a restriction, applied on top of the ACL — it never *grants* more than the ACL allows.
- **Create in code** with the two-step pattern: `ReplaceItemValue` to write the names, then set the returned item's `.IsReaders = True` (or `.IsAuthors = True`). Setting the flag auto-sets `IsSummary = True`.
- **Lock-out trap:** an empty (but present) Readers item hides the document from *everyone*. Always include your own name, and the servers/agents/groups that need access.
- **Agents:** for a scheduled or web agent to read a Readers-protected document, the agent's **signer must be in the Readers list** (directly or via a group/role).
- Authors fields only grant edit to users who already have **Author** access in the ACL — they don't upgrade Reader-level users.

## The security model

Two rules are the whole thing:

1. **No Readers item → visible to everyone** (subject to the ACL). This is why a document you never gave a Readers field to is readable by all users with database access.
2. **A Readers item present → visible to exactly who's listed** — plus, implicitly, no one else. An *empty* Readers item therefore hides the document from everyone, which is the classic self-inflicted wound.

Authors fields are the parallel for editing: a user needs at least Author access in the ACL *and* to be named in an Authors field (or the document has no Authors field) to edit. An Authors field never elevates a Reader-access user to editor — it only matters among users who already have Author access.

## Creating the fields in code

There's no dedicated "make a Readers field" call — you write an ordinary item and flag it. `ReplaceItemValue` returns the [`NotesItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESITEM_CLASS.html) it created, and you set the type flag on that:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Dim doc As NotesDocument
  Dim readItem As NotesItem
  Dim authItem As NotesItem
  Set db = session.CurrentDatabase
  Set doc = db.CreateDocument
  Call doc.ReplaceItemValue("Form", "Record")
  Call doc.ReplaceItemValue("Subject", "Confidential HR record")

  ' Readers field: restrict visibility.
  ' Include yourself + the servers/agents that must still read it.
  Set readItem = doc.ReplaceItemValue("DocReaders", _
      Array(session.UserName, "Jane Doe/Acme", "[HRAdmin]", "LocalDomainServers"))
  readItem.IsNames = True        ' treat as a Names field
  readItem.IsReaders = True      ' becomes a Readers field; auto-sets IsSummary

  ' Authors field: who (with Author ACL access) may edit.
  Set authItem = doc.ReplaceItemValue("DocAuthors", _
      Array(session.UserName, "Jane Doe/Acme"))
  authItem.IsNames = True
  authItem.IsAuthors = True

  Call doc.Save(True, False)
End Sub
```

*(Adapted from the documented `ReplaceItemValue` → set-flag pattern and the official IsReaders example.)*

Setting `IsReaders` "automatically sets IsSummary to True, so you don't need to explicitly configure the summary flag separately" — the same is true for [`IsAuthors`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISAUTHORS_PROPERTY.html) and `IsNames`. Adding `IsNames = True` marks the field as a Names field so name formatting behaves consistently; internally all three are stored as text.

## The traps that bite

- **Empty list = invisible to all.** The single most common mistake: flag an item `IsReaders = True` but leave the names empty (or filter them all out), and the document vanishes for everyone — you included. Always populate the list.
- **Leave your servers/agents out and they can't process it.** A nightly agent that computes on these documents must have its signer in the Readers field, or it simply won't see them. Add `LocalDomainServers` or the specific signer/group.
- **Names must be in proper form.** Use canonical (`CN=Jane Doe/O=Acme`) or abbreviated (`Jane Doe/Acme`) Notes names; a display-only string won't resolve.
- **Roles and groups are your friend.** A Readers item can hold group names and ACL role names (like `[HRAdmin]`) alongside individuals — far more maintainable than listing every user, and the way to combine per-document restriction with role-based access.
- **Text lists cap at 64K.** Appending names to a very large Readers field can hit the limit — "if appending a new value to an existing text list would result in a text list greater than 64K, the new value will not be appended."

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesItem.IsReaders` | `Item.isReaders()` / `setReaders()` | `item.isReaders()` |
| `NotesItem.IsAuthors` | `Item.isAuthors()` / `setAuthors()` | `item.isAuthors()` |

Java's `lotus.domino.Item` exposes `isReaders()`/`setReaders()`, `isAuthors()`/`setAuthors()`, and `isNames()`/`setNames()`; XPages SSJS reaches the same backend `Item` class. The security model is a property of the Domino data, not the language — the empty-Readers-means-everyone rule and the signer-must-be-listed rule for agents hold identically whichever language sets the flag.
