---
title: "Document Locking in LotusScript: Lock, LockProvisional, and the Prerequisites Everyone Forgets"
description: "Domino can lock a document so two users don't edit it at once — Lock, LockProvisional, UnLock, and LockHolders on NotesDocument. But the methods raise an error unless locking is enabled on the database (IsDocumentLockingEnabled) and a master lock server is configured, persistent vs provisional locks depend on that server being reachable, and locks don't work in web apps at all. This article covers the API and every prerequisite."
pubDate: 2026-07-16T07:30:00+08:00
lang: en
slug: notes-document-locking
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesDocument.Lock method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCK_METHOD_DOC.html"
  - title: "NotesDatabase.IsDocumentLockingEnabled property — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISDOCUMENTLOCKINGENABLED_PROPERTY_DB.html"
  - title: "Locking documents and design elements — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCKING_DOCUMENTS_AND_DESIGN_ELEMENTS.html"
relatedJava: ["Document", "Database"]
relatedSsjs: ["document", "database"]
---

Two users open the same document, both edit, both save — and now you have a replication or save conflict and someone's work is gone. Domino's answer is document locking: claim a document, edit it, release it, and while you hold the lock nobody else can save over you. The API is four members on `NotesDocument` plus one switch on `NotesDatabase`. The catch is that all of it raises an error unless a couple of prerequisites are in place — and those prerequisites are what people forget.

---

## TL;DR

- **Enable locking on the database first.** [`db.IsDocumentLockingEnabled`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISDOCUMENTLOCKINGENABLED_PROPERTY_DB.html) must be `True`, or every lock method raises an error. The database also needs an **administration (master lock) server** configured by an admin.
- [`flag = doc.Lock([name][, provisionalOK])`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCK_METHOD_DOC.html) places a lock. Returns `True` if you got it (or already hold it), `False` if someone else holds it.
- **Persistent vs provisional:** a persistent lock is registered on the master lock server; a provisional lock is a local best-effort lock used when that server is unreachable. `Lock(name, True)` degrades to provisional if the server is down; `Lock(name, False)` raises an error instead; `LockProvisional` is always provisional.
- `doc.UnLock` releases it — but "raises an error if the current user is not one of the lock holders and does not have lock breaking authority."
- `doc.LockHolders` is a read-only string array of who holds the lock; **when unlocked it's a one-element array with an empty string** (`("")`), so test `holders(0) = ""`.
- **Locks are not supported in web applications** — this is a Notes-client / agent feature.

## The prerequisites

Before any of the lock methods will work, two things must be true:

1. **Locking is enabled on the database.** `IsDocumentLockingEnabled` is a read/write Boolean; "True indicates that document locking is enabled." Every `Lock` / `LockProvisional` / `UnLock` / `LockHolders` call "raises an error" if it's `False`. You can set it from code (`db.IsDocumentLockingEnabled = True`), but that's a manager-level design change to the database.
2. **A master lock server exists.** Per the [overview](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_LOCKING_DOCUMENTS_AND_DESIGN_ELEMENTS.html), "the database must have an administration (master lock) server." That's an admin setting — the LotusScript API places and reads locks but doesn't designate the server.

Miss either and your first `Lock` call throws rather than returning `False`.

## Persistent and provisional locks

The distinction turns entirely on whether the master lock server is reachable:

- A **persistent lock** is placed "when the administration server is available" and is registered there, so it's authoritative and visible across replicas.
- A **provisional lock** is placed "when the administration server is unavailable" — a local, best-effort claim that isn't persisted the same way.

`Lock`'s optional second argument controls what happens when the server is down: `Lock(name, True)` says "a provisional lock is acceptable if you can't place a persistent one," so it degrades gracefully; `Lock(name, False)` (the default) raises an error instead of settling for provisional. `LockProvisional(name)` skips straight to a provisional lock. Use `Lock(..., True)` when "some lock is better than none," and the strict form when only an authoritative lock will do.

## Lock, UnLock, and checking holders

```lotusscript
%INCLUDE "lsxbeerr.lss"

Sub Click(Source As Button)
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase

  If Not db.IsDocumentLockingEnabled Then
    Print "Document locking not enabled"
    Exit Sub
  End If

  Dim dc As NotesDocumentCollection
  Dim doc As NotesDocument
  Set dc = db.UnprocessedDocuments
  Set doc = dc.GetFirstDocument

  On Error GoTo errh
  ' Persistent lock for "Guys"; fall back to provisional if the server is down
  If doc.Lock("Guys", True) Then
    doc.Subject = "Edited under lock"
    Call doc.Save(True, False)     ' hold the lock across the read-edit-save
    Call doc.UnLock                ' release when done
    Print "Locked, edited, unlocked"
  Else
    Print "Document is locked by someone else"
  End If
  Exit Sub
errh:
  If Err() = lsERR_NOTES_LOCKED Then
    Print "Document NOT locked"
  Else
    MessageBox "Error " & Err() & ": " & Error(),, "Error"
  End If
End Sub
```

The scaffold (the `IsDocumentLockingEnabled` guard, `lsERR_NOTES_LOCKED` trapping, the `UnprocessedDocuments` selection) is the official example pattern; the edit-and-unlock steps are the adaptation. Two behaviours to note: `Lock` returns `False` when the document is *already* locked by another user, but *raises* an error (`lsERR_NOTES_LOCKED`, brought in by `%INCLUDE "lsxbeerr.lss"`) if another user modified it before your lock could be placed — so handle both. And the lock does not auto-save: you hold it across the whole read-edit-`Save`, then `UnLock`.

To see who holds a lock, read `LockHolders` — but remember the empty-state idiom:

```lotusscript
Dim holders As Variant
holders = doc.LockHolders
If holders(0) = "" Then
  Print "Not locked"
Else
  Forall h In holders
    Print "Held by: " & h
  End Forall
End If
```

`UnLock` has its own guard: it "raises an error if the current user is not one of the lock holders and does not have lock breaking authority." A manager (or someone with lock-breaking rights) can break another user's lock; an ordinary user can only release their own.

## What about Java and SSJS?

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `doc.Lock` / `LockProvisional` / `UnLock` | `doc.lock(...)` / `lockProvisional(...)` / `unlock()` | `document.lock(...)` / … |
| `doc.LockHolders` | `doc.getLockHolders()` | `document.getLockHolders()` |
| `db.IsDocumentLockingEnabled` | `db.isDocumentLockingEnabled()` / `setDocumentLockingEnabled()` | `database.isDocumentLockingEnabled()` |

Java and SSJS mirror the same members (Java uses an explicit getter/setter for the database flag). Every prerequisite carries over: locking must be enabled, a master lock server is required for persistent locks, and the whole mechanism is unavailable to web applications regardless of the calling language.
