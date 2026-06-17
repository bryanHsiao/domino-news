---
title: "NotesForm: Reading a Database's Forms, Fields, and Who Can Use Them in Code"
description: "You inherit an undocumented NSF and want to figure out which forms it has, what fields each defines, and who's allowed to create documents — without opening Designer. NotesForm reads that design information from code. This article covers getting forms from db.Forms / db.GetForm, the Name / Aliases / Fields / FormUsers / Readers properties, GetFieldType and Remove, and how ProtectReaders / ProtectUsers relate to replication."
pubDate: 2026-06-17T07:30:00+08:00
lang: en
slug: notes-form
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesForm class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFORM_CLASS.html"
  - title: "NotesDatabase class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
  - title: "NotesForm class examples — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESFORM_CLASS.html"
relatedJava: ["Form"]
relatedSsjs: ["Form"]
cover: "/covers/notes-form.webp"
coverStyle: "oil-chiaroscuro"
---

You inherit an NSF nobody documented, and you want to figure out what forms it actually has, what each one looks like, and who's allowed to create documents with it. Clicking through Designer one by one works — but what if you're writing an audit agent that sweeps dozens of databases for an inventory?

That's the job of [`NotesForm`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFORM_CLASS.html). The definition is plain — "Represents a form in a database" — but the point is that it lets you **read a form's design information from code**, no Designer required. Beyond "working with documents", on the rarely-touched "reading the design" side, `NotesForm` is one of the main entry points.

---

## TL;DR

- Get it from [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html): `db.Forms` (all, returns an array) or `db.GetForm("name")` (a specific one)
- **Read the design**: `Name`, `Aliases`, `Fields` (all field names, an array)
- **Read access control**: `FormUsers` (who can create documents with this form — the `$FormUsers` field), `Readers` (`$Readers`)
- `IsSubForm` tells you whether it's a subform; `GetFieldType(name)` gets a field's data type
- **Replication protection**: `ProtectReaders` / `ProtectUsers` (read-write `Boolean`) stop `$Readers` / `$FormUsers` being overwritten by replication
- `Remove()` permanently deletes a form; most properties are read-only, with FormUsers / Readers / Protect* read-write

---

## Getting forms: db.Forms and db.GetForm

Forms belong to a database, so you get them from `NotesDatabase`. To list them all, use `db.Forms` (returns an array) — the [official example](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESFORM_CLASS.html) does exactly this:

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase
  Forall form In db.Forms
    Messagebox form.Name
  End Forall
End Sub
```

For a specific one, use `db.GetForm("Memo")`. One official caveat: **"You can't get access to private forms belonging to other people."** — you only get shared forms and your own.

## Reading the design: Name / Aliases / Fields

Once you have `form`, these three read-only properties do the most work for "inventory":

| Property | Holds |
|---|---|
| `Name` | the form name |
| `Aliases` | the form's aliases (an array) — forms often have "display name \| alias", and code usually references the alias |
| `Fields` | an array of **every field name** on the form |

`Fields` is especially handy — one line lists what fields a form defines, without opening the form design in Designer:

```lotusscript
Dim form As NotesForm
Set form = db.GetForm("Order")
Forall fld In form.Fields
    Print fld & " : " & form.GetFieldType(fld)   ' field name + type
End Forall
```

`GetFieldType(name)` returns that field's data type, which paired with `Fields` gives you a "form's fields + types" listing.

## Reading access: FormUsers and Readers

`NotesForm` also lets you read (and change) form-level access control:

- **`FormUsers`** (read-write) — per the docs, when you create a form and specify who can create documents with it, those names are stored in the `$FormUsers` field, and this property reads it.
- **`Readers`** (read-write) — reads the `$Readers` field's contents.

Paired with these are two replication-protection switches: **`ProtectReaders`** and **`ProtectUsers`** (read-write `Boolean`). They "protect `$Readers` / `$FormUsers` items from being overwritten by replication." If you change a form's reader/user settings in code in a multi-server environment, these flags decide whether your change survives replication.

## Also worth knowing

- `IsSubForm` (read-only `Boolean`) — whether this is a subform.
- `Remove()` — permanently deletes the form (use with care).
- `HttpURL` / `NotesURL` — the form's Domino URL under HTTP / Notes protocols.
- `Lock()` / `LockProvisional()` / `UnLock()` — design-element locking, for when multiple people edit design.

## What about Java and SSJS?

| Language | Counterpart | Obtained via |
|---|---|---|
| Java (`lotus.domino.*`) | `Form` | `db.getForm(name)` / `db.getForms()` |
| SSJS / XPages | `Form` | `database.getForm(name)` |

Consistent across all three: obtained from the database, all read `Name` / `Fields` / `FormUsers` and so on. Note that in Java/SSJS `Fields` and `Aliases` are `getFields()` / `getAliases()` returning string arrays. When you write a Java audit tool scanning design, the property mapping here carries straight over.
