---
title: "NotesDocument Deep Dive — The Core LotusScript Class, Its CRUD Surface, and Five Pitfalls"
description: "NotesDocument is the core class LotusScript uses for any Domino document operation — but the details trip people up: GetItemValue always returns an array (even single values), Save's createResponse parameter is widely misread (it's not how you create response documents), Remove's force flag isn't a soft-delete switch (that's a database-level setting; use RemovePermanently to bypass it), the subtle difference between direct property syntax and ReplaceItemValue, and forgetting .Save is the most common silent bug. This guide covers every way to obtain a NotesDocument, the Item vs Field distinction, CRUD examples, the five must-know pitfalls, sibling methods, and the Java/SSJS counterparts."
pubDate: 2026-05-13T07:30:00+08:00
lang: en
slug: notes-document
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDocument class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "NotesDocument.Save method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html"
  - title: "NotesDocument.GetItemValue method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD.html"
  - title: "NotesDocument.Remove method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REMOVE_METHOD_DOC.html"
relatedJava: ["Document"]
relatedSsjs: ["document"]
cover: "/covers/notes-document.webp"
coverStyle: "paper-craft"
---

## TL;DR

[`NotesDocument`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) is the class LotusScript reaches for whenever you do anything with a Domino document — create, read, modify, delete, set readers/authors, manage attachments, post responses, run ComputeWithForm. It's everywhere. But `NotesDocument` has details that bite even experienced developers:

1. **`GetItemValue` always returns an array** — even for single-value items, you need `(0)`
2. **`Save(force, createResponse, markRead)`'s `createResponse` doesn't "create a response document"** — it controls conflict handling (creating a conflict doc as a response to the original). Widely misread
3. **`Remove(force)`'s `force` isn't a permanent-delete switch** — soft delete is a database-level setting; use `RemovePermanently` to bypass it

This piece walks every way to obtain a `NotesDocument`, the Item-vs-Field distinction, CRUD examples, the five pitfalls in detail, sibling methods, and the Java/SSJS counterparts.

## Ways to obtain a NotesDocument

Per the official class doc, you can get a `NotesDocument` through any of these paths:

| Path | Example |
|---|---|
| **Create new** | `Set doc = New NotesDocument(db)` or `Set doc = db.CreateDocument()` |
| **By UNID / NoteID** | `db.GetDocumentByUNID(...)` / `db.GetDocumentByID(...)` |
| **By view position** | `view.GetFirstDocument()`, `view.GetNthDocument(n)`, `view.GetDocumentByKey(...)` |
| **Collection search** | `db.AllDocuments`, `db.Search(formula, ...)`, `db.FTSearch(query, ...)` |
| **Agent context** | `session.CurrentAgent.SelectedDocuments`, `UnprocessedDocuments` |
| **Response chain** | Parent doc's `Responses` collection; child doc's `ParentDocumentUNID` + `GetDocumentByUNID` |

**About 80% of real-world code** uses `CurrentDatabase` + `GetDocumentByUNID` or iterates a view collection. The other paths show up in batch processing, agents, and response-design contexts.

## Item vs Field — the concept

The most common LS-newbie confusion: "Item" and "Field" **are not the same thing**.

- **Item** = the actual backend storage unit on a document (name + value + flags + data type)
- **Field** = a UI element in a form design (label + input + computed formula + validation)

When you put a `Subject` field on a form and the user types "test" and saves, what gets stored on the document is the **item** named `Subject`. The item and the field share a name by form-designer convention — that **isn't a physical binding**. Which means:

- From LS you can add an item to a document that has no corresponding field on the form (via `ReplaceItemValue`), and it'll be stored on the document but invisible in the UI
- From LS you can modify an item value without the form's computed fields, input translations, or validations running (the [Save doc](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html) puts it directly: "Direct item access bypasses form validations, input translations, and computed fields"). To trigger the form logic, call `doc.ComputeWithForm()`

This distinction matters for understanding the five pitfalls below.

## CRUD examples

### Create + save

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.CreateDocument()

doc.Form = "MainForm"
doc.Subject = "New document"
doc.CreatedBy = session.UserName  ' adds an item; doesn't depend on a form field

Call doc.Save(True, False)
```

The two creation forms — `db.CreateDocument()` and `New NotesDocument(db)` — **behave identically**. The former is more common and reads more cleanly.

### Read

```lotusscript
Dim doc As NotesDocument
Set doc = db.GetDocumentByUNID("UNID_STRING_HERE")

If doc Is Nothing Then
    Print "Document not found"
    Exit Sub
End If

Dim subjects As Variant
subjects = doc.GetItemValue("Subject")  ' always an array
Print subjects(0)                         ' single-value item — index 0
```

Or with the direct-property syntax:

```lotusscript
Print doc.Subject(0)  ' equivalent to GetItemValue, also an array
```

### Modify + save

```lotusscript
Set doc = db.GetDocumentByUNID("UNID")
If Not doc Is Nothing Then
    Call doc.ReplaceItemValue("Subject", "Updated subject")
    Call doc.ReplaceItemValue("UpdatedAt", Now())
    Call doc.Save(True, False)
End If
```

`ReplaceItemValue` **creates the item if it doesn't exist** — you don't have to `HasItem`-check first.

### Delete

```lotusscript
Set doc = db.GetDocumentByUNID("UNID")
If Not doc Is Nothing Then
    Call doc.Remove(True)  ' DB setting decides: soft or hard delete
End If
```

To **guarantee** a permanent deletion (even when the DB has soft-delete enabled):

```lotusscript
Call doc.RemovePermanently(True)
```

## Five pitfalls

### 1. `GetItemValue` always returns an array — missing `(0)` triggers type mismatch

The [GetItemValue doc](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETITEMVALUE_METHOD.html) puts it directly: "For text, number, and time-date items, GetItemValue always returns an array, even when there is only a single value in the item."

In practice:

```lotusscript
Dim s As String
s = doc.GetItemValue("Subject")  ' WRONG — type mismatch; s is String, return is Variant array
```

Correct:

```lotusscript
Dim s As String
s = doc.GetItemValue("Subject")(0)  ' index into the array
```

Or use the convenience sibling `GetItemValueString` (when you **know** it's a single-value text item):

```lotusscript
s = doc.GetItemValueString("Subject")
```

When a new dev's agent throws a type-mismatch error, the missing `(0)` is the cause more often than not.

### 2. `Save(force, createResponse, markRead)`'s `createResponse` isn't "create a response document"

The three parameters of the [Save method](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_DOC.html) often get misread, especially `createResponse`:

| Parameter | What it actually means |
|---|---|
| `force` (Boolean) | Conflict handling — `True` overwrites; `False` defers to `createResponse` |
| `createResponse` (Boolean) | **Not** "create a response document" — it means "on conflict, save the current changes as a conflict document attached as a response to the original" |
| `markRead` (Boolean, optional) | `True` marks the document as read for the current user |

The common misreading: "If I set `createResponse=True`, does it make this doc a response to another doc?" **No.** To create a response, use `MakeResponse(parent)`, which is a separate method.

The 90% real-world call: `Save(True, False)` — overwrite on conflict, no conflict doc.

### 3. `Remove(force)`'s `force` isn't a "permanent delete" switch

Per the [Remove doc](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REMOVE_METHOD_DOC.html):

- **`force` parameter**: `True` means "delete even if someone else's script has the doc open," `False` means "skip the delete if there's a conflict"
- **Soft vs hard delete**: determined by the **database-level setting** "Allow soft deletions." With it off, `Remove(True)` is a permanent delete. With it on, `Remove(True)` puts the doc in the soft-delete area (where it can be restored)

To bypass the DB's soft-delete setting and force permanent deletion unconditionally, use [`RemovePermanently`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html):

```lotusscript
Call doc.RemovePermanently(True)
```

A lot of older blog posts call `Remove(True)` "permanent delete" — that's imprecise. The accurate statement is "delete on conflict, soft-or-hard depending on DB setting."

### 4. Direct property syntax vs `ReplaceItemValue` — the subtle difference

The two forms look interchangeable:

```lotusscript
doc.Subject = "X"              ' direct property
Call doc.ReplaceItemValue("Subject", "X")  ' explicit method
```

For 99% of cases they **are** interchangeable. Two edge cases matter:

- **Type coercion**: `ReplaceItemValue` accepts `NotesDateTime`, arrays, and lets you control type explicitly. Direct syntax handles strings and numbers cleanly but datetime values can produce subtle coercion traps
- **Reserved-word collisions**: an item named `Form` works via direct syntax (the class has a `Form` property), but if you have an item named `Stop` or another LS reserved word, you must use `ReplaceItemValue`

A safe habit for newer code: **default to `ReplaceItemValue`** — it has essentially no edge cases and is easier to debug.

### 5. Forgetting `.Save` — the most common silent bug

The [HCL NotesDocument doc](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html) puts the warning right in the class description: "After you create, modify, or delete a document, you must save the changes by calling the Save method... If you don't call Save before the script finishes, all of your changes to a NotesDocument are lost."

In practice: an agent modifies thirty fields, but **the whole agent never calls `doc.Save`**. The agent finishes, Domino releases the in-memory document, and **none of the changes get written**. No error, no warning.

```lotusscript
Set doc = db.GetDocumentByUNID(unid)
Call doc.ReplaceItemValue("Status", "Approved")
Call doc.ReplaceItemValue("ApprovedBy", session.UserName)
Call doc.ReplaceItemValue("ApprovedAt", Now())
' ❌ Missing Call doc.Save(True, False)
End Sub
```

Common triggers:

- Modifying a field, popping a `MsgBox doc.Subject` to verify, and then never adding the Save line back
- A `For Each doc In dc` loop where Save was omitted from the loop body
- Refactoring from "manual save → form save," ending up with an in-memory mutation but no doc.Save

A code-review habit that catches this: **for every `ReplaceItemValue`, grep the surrounding scope for a matching `.Save`**.

## Sibling methods worth knowing

| Method / Property | Purpose |
|---|---|
| `HasItem(name)` | Check whether an item exists (no error if missing) |
| `Items` | Array of `NotesItem` — iterate every item on the doc |
| `GetItemValueString(name)` | Convenience for single-value text items — returns String directly |
| `GetFirstItem(name)` | Returns a `NotesItem` object (gives you control over type / flags) |
| `MakeResponse(parent)` | Make the current doc a response to another |
| `ParentDocumentUNID` | The parent UNID for response docs |
| `Responses` | NotesDocumentCollection — direct responses to this doc |
| `ComputeWithForm()` | Run the form's computed fields / validations / input translations once |
| `RemovePermanently(True)` | Permanent delete, bypasses DB soft-delete setting |
| `Sign()` / `Encrypt()` | Sign / encrypt the document |
| `CopyAllItems(srcDoc, replace)` | Copy every item from another doc |

The `Items` collection is especially handy for "**dump every item on a doc to figure out what's actually there**" debugging.

## What about Java and SSJS?

`NotesDocument` maps cleanly across the three languages:

| Language | Equivalent class |
|---|---|
| LotusScript | `NotesDocument` |
| Java | `lotus.domino.Document` — camelCase methods (`getItemValue`, `save`, `remove`, `replaceItemValue`, `hasItem`, `makeResponse`, `computeWithForm`, `removePermanently`) |
| SSJS (XPages) | Same as Java, accessed via `lotus.domino.*` imports |

Cross-language differences come down to case (Pascal → camel) and syntax packaging (LS `Set doc = ...` vs Java `Document doc = ...`) — the semantics are identical. One important Java/SSJS-only concern: **Java objects need `recycle()`** (`doc.recycle()`) to free C++-side memory; LS auto-recycles, so this isn't an LS concern.

## Closing

`NotesDocument` is the class every Domino LS developer uses constantly — but its API surface is large and its defaults aren't beginner-friendly (`GetItemValue` returns an array, `Save` and `Remove`'s parameter semantics don't match intuition). The top three production-bug sources stem from:

1. **Forgetting `.Save`** — changes made in memory, never written
2. **Missing `(0)` on `GetItemValue`** — type mismatch or grabbing a Variant array object instead of a string
3. **Treating `Remove(True)` as permanent delete** — and the DB has soft-delete enabled, so the doc lingers in the trash area

Internalize those three, and 80% of the gotchas in `NotesDocument` code go away.
