---
title: "NotesACLEntry Deep Dive — Programmatic ACL Management in Domino: 7 Access Levels, 20 Properties, Roles"
description: "NotesACLEntry represents a single entry (person, group, or server) in a Domino database's Access Control List. This guide covers the NotesACL ↔ NotesACLEntry containment relationship, three ways to obtain an entry, the seven access-level constants from NOACCESS to MANAGER, the UserType property versus the legacy IsPerson/IsGroup/IsServer flags, all twenty NotesACLEntry properties for fine-grained permissions, the Roles mechanism, the mandatory acl.Save behavior, five common pitfalls, and complete CRUD examples — closing the Domino security loop alongside the 14.5 NRPC encryption and trust-store articles."
pubDate: 2026-05-15T07:30:00+08:00
lang: en
slug: notes-acl-entry
tags:
  - "Tutorial"
  - "LotusScript"
  - "Security"
sources:
  - title: "NotesACLEntry class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html"
  - title: "NotesACL class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html"
  - title: "NotesACL.CreateACLEntry method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEACLENTRY_METHOD.html"
  - title: "NotesACL.Save method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_NOTESACL.html"
relatedJava: ["ACL", "ACLEntry"]
relatedSsjs: ["ACL", "ACLEntry"]
cover: "/covers/notes-acl-entry.png"
coverStyle: "collage"
---

## TL;DR

A Domino database's ACL (Access Control List) is the core security mechanism for "who can touch this database and what can they do." From LotusScript:

- [`NotesACL`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) — HCL: "Represents the access control list (ACL) of a database." The container for the whole list.
- [`NotesACLEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html) — HCL: "Represents a single entry in an access control list. An entry may be for a person, a group, or a server." Each individual entry.

Key things to internalize:

1. **Always call `acl.Save`** — HCL's direct warning: "If you don't call Save before closing a database, the changes you made to its ACL will be lost"
2. **Seven access-level constants** — `ACLLEVEL_NOACCESS` (0) through `ACLLEVEL_MANAGER` (6), strictly increasing power
3. **NotesACLEntry has 20 properties** — beyond access level, seven fine-grained permission flags like `CanCreateDocuments`, `CanDeleteDocuments`
4. **Don't mix** `db.QueryAccess/GrantAccess/RevokeAccess` with `NotesACL` objects — HCL warns this "may produce inconsistent results"

## NotesACL vs NotesACLEntry — Container / Entry Relationship

Per the official class definitions, these two classes are related by **containment**:

- [`NotesACL`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACL_CLASS.html) — "Contains: NotesACLEntry"
- [`NotesACLEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESACLENTRY_CLASS.html) — "Contained by: NotesACL"

In practice: get the ACL object first, then walk / create / modify / remove entries through it.

## Obtaining the ACL and entries

### Get the NotesACL

HCL: "Every NotesDatabase contains a NotesACL object representing that database access control list. To get it, use the ACL property in NotesDatabase."

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim acl As NotesACL

Set db = session.CurrentDatabase
Set acl = db.ACL
```

### Get a NotesACLEntry

"NotesACL provides three ways to access an existing NotesACLEntry":

| Method | Purpose |
|---|---|
| `acl.GetEntry(name)` | Known name — direct lookup |
| `acl.GetFirstEntry()` | Iteration — first entry |
| `acl.GetNextEntry(entry)` | Iteration — next entry |
| [`acl.CreateACLEntry(name, level)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEACLENTRY_METHOD.html) | **Create** a new entry (not retrieve) |

## Seven access levels

The `level%` parameter of [`CreateACLEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEACLENTRY_METHOD.html) accepts these seven constants, ordered weakest to strongest:

| Constant | Value | Intuitive meaning |
|---|---|---|
| `ACLLEVEL_NOACCESS` | 0 | No access — can't even open the database |
| `ACLLEVEL_DEPOSITOR` | 1 | Drop-only — write but can't read (anonymous suggestion box) |
| `ACLLEVEL_READER` | 2 | Read only |
| `ACLLEVEL_AUTHOR` | 3 | Read + write **own** docs (must have an Author item set) |
| `ACLLEVEL_EDITOR` | 4 | Read + write any doc |
| `ACLLEVEL_DESIGNER` | 5 | Editor + modify the database's design (forms, views) |
| `ACLLEVEL_MANAGER` | 6 | Full — modify the ACL itself, delete the database |

In practice, 4-5 of them get most use: Reader / Author / Editor for users, Designer / Manager for developers and admins. Depositor for anonymous submission. NoAccess for explicit blocks.

## UserType vs IsPerson / IsGroup / IsServer

`NotesACLEntry` exposes two parallel ways to label an entry's type:

- **`UserType` property** — HCL: "Read-write. Indicates the type of user for a particular entry." Newer, more expressive.
- **`IsPerson` / `IsGroup` / `IsServer`** — three separate Booleans, older convenience flags.

The two **stay in sync** — set `IsPerson = True` and `UserType` updates accordingly. But for entries like mixed groups (groups containing both persons and servers), the convenience flags can't capture the nuance — you need `UserType`.

Practical guidance:

- New code: prefer `UserType`
- Reading existing code: `If entry.IsPerson Then ...` is fine
- Working with advanced group scenarios: must check `UserType`

## 20 properties for fine-grained permissions

`NotesACLEntry` goes beyond access level — there are 20 properties controlling specific permissions:

| Property | Description (verbatim from HCL where shown) |
|---|---|
| `Level` | ACL access level (one of the seven constants above) |
| `Name` | The entry's name (person, group, or server name) |
| `NameObject` | Advanced `NotesName` object (parse out CN / OU / O) |
| `Parent` | Back-reference to the NotesACL |
| `Roles` | "The roles that are enabled for an entry" |
| `UserType` | "Indicates the type of user for a particular entry" |
| `IsPerson` | Whether it's a person entry |
| `IsGroup` | Whether it's a group entry |
| `IsServer` | Whether it's a server entry |
| `IsAdminReaderAuthor` | Whether the entry is an admin reader / author |
| `IsAdminServer` | Whether the entry is the administration server |
| `IsPublicReader` | "Can read public documents" |
| `IsPublicWriter` | "Can write public documents" |
| `CanCreateDocuments` | "For an entry with Author access to a database, indicates whether the entry is allowed to create new documents" |
| `CanDeleteDocuments` | "For an entry with Author access or higher to a database, indicates whether an entry can delete documents" |
| `CanCreatePersonalAgent` | "Indicates whether an entry can create private agents in a database" |
| `CanCreatePersonalFolder` | "Indicates whether an entry can create personal folders in a database" |
| `CanCreateSharedFolder` | "For an entry with Editor access to the database, indicates whether the entry can create shared folders" |
| `CanCreateLSOrJavaAgent` | "For an entry with Reader access, indicates whether the entry is allowed to create LotusScript or Java agents" |
| `CanReplicateOrCopyDocuments` | "For an entry with Reader access or higher to a database, indicates whether an entry can replicate or copy documents" |

Note the "**access level prerequisite**" pattern: `CanCreateDocuments` only matters for Author-or-higher entries; setting it on a NoAccess entry has no effect.

## Roles — custom role mechanism

Beyond access level, the ACL supports **custom Roles** (names in square brackets like `[Manager]`, `[Approver]`). Forms, views, agents, and Reader/Author fields can use these role names for finer-grained access control.

- `acl.Roles` — "All the roles defined in an access control list" — the role catalog for the database
- `entry.Roles` — "The roles that are enabled for an entry" — which roles this specific entry has
- `entry.EnableRole(name)` — "Given the name of a role, enables the role for an entry"
- `entry.DisableRole(name)` — "Given a role, disables the role for an entry"
- `entry.IsRoleEnabled(name)` — "Given a role, indicates whether the role is enabled for an entry"

Common pattern: define an `[Approver]` role, use `@UserRoles` on a form's Reader field to gate visibility — only users whose entry has the role enabled can see or modify the document.

## Complete CRUD examples

### 1. Iterate every entry

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim acl As NotesACL
    Dim entry As NotesACLEntry

    Set db = session.CurrentDatabase
    Set acl = db.ACL

    Set entry = acl.GetFirstEntry()
    Do Until entry Is Nothing
        Print entry.Name & " — Level: " & entry.Level _
            & " — Roles: " & Join(entry.Roles, ", ")
        Set entry = acl.GetNextEntry(entry)
    Loop
End Sub
```

### 2. Create an entry

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.CreateACLEntry("Bryan Inc./ACME", ACLLEVEL_EDITOR)
entry.IsPerson = False
entry.IsGroup = True              ' Mark as group
entry.CanCreateDocuments = True
entry.CanDeleteDocuments = False  ' Editor can delete by default; explicitly turn off

Call entry.EnableRole("Approver") ' Enable the [Approver] role

Call acl.Save                     ' Required!
```

### 3. Modify an entry

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("Bryan Inc./ACME")

If entry Is Nothing Then
    Print "Entry not found"
    Exit Sub
End If

entry.Level = ACLLEVEL_DESIGNER  ' Bump to Designer
Call entry.DisableRole("Approver")

Call acl.Save
```

### 4. Remove an entry

```lotusscript
Dim entry As NotesACLEntry
Set entry = acl.GetEntry("Bryan Inc./ACME")

If Not entry Is Nothing Then
    Call entry.Remove()    ' Remove called on the entry object, not the ACL
    Call acl.Save
End If
```

Note `Remove` lives on `NotesACLEntry`, not on `NotesACL` — you get the entry first, then remove.

## Five pitfalls

### 1. Forgetting [`acl.Save`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SAVE_METHOD_NOTESACL.html) — changes silently lost

HCL's direct warning: "If you don't call Save before closing a database, the changes you made to its ACL will be lost."

Agent modifies the ACL but never calls `acl.Save`, the agent finishes, all changes are **in memory**, and the database close discards them. **The most common silent bug.** Code-review habit: for every ACL modification, grep for a corresponding `.Save`.

### 2. `GetEntry` returns `Nothing` when not found — not an error

```lotusscript
Set entry = acl.GetEntry("Someone Not In ACL")
entry.Level = ACLLEVEL_EDITOR     ' WRONG — Object variable not set
```

Correct:

```lotusscript
If entry Is Nothing Then
    Print "Entry not found"
    Exit Sub
End If
```

### 3. Don't mix `db.QueryAccess` / `GrantAccess` / `RevokeAccess` with NotesACL objects

HCL's warning: "The Database class has three methods that you can use to access and modify an ACL without getting an ACL object: QueryAccess, GrantAccess, and RevokeAccess. However, using these methods at the same time that an ACL object is in use may produce inconsistent results."

Practical rule: **pick one path per agent** — go through `NotesACL` objects, or use NotesDatabase's convenience methods, not both.

### 4. To modify the ACL, the caller needs Manager access

Modifying the ACL itself **requires Manager-level access**. If the agent's signer is only an Editor, `acl.Save` will fail (possibly silently — LotusScript may not throw a loud error, looking like a no-op).

- Server-side execution: the signer needs Manager in that database's ACL
- Client-side execution: the current user needs Manager

### 5. Effective access vs entry-level access — overlapping groups

A user can appear in multiple ACL entries simultaneously (e.g., directly as Editor and also a member of `[ALL_USERS]` group which is Reader). **Effective access isn't the minimum or the average — it's the maximum**: whichever applicable entry grants the highest level wins.

For audit-style "what can this user actually do?" queries, use `db.QueryAccess(name)` — that returns the effective level, not any specific entry's level.

## How this ties into the 14.5 security mini-series

This piece covers **db-level ACL** (who can access this NSF and what they can do). The recent 14.5 security articles cut at different layers:

| Article | Scope |
|---|---|
| [5/10 NotesHTTPRequest trust-store change](/domino-news/en/posts/notes-httprequest-14-5-trust-store) | TLS trust store for LS outbound HTTPS |
| [5/11 Mandated Port Encryption concepts](/domino-news/en/posts/mandated-port-encryption) | NRPC (server↔server / client↔server) encryption enforcement |
| [5/12 Mandated Port Encryption hands-on](/domino-news/en/posts/mandated-port-encryption-enabling) | Same, enablement steps |
| **5/15 (this post) NotesACLEntry** | **Database-level ACL** — once connected, what can be done with the db / docs |

Complete Domino security picture: **transport encryption** (5/11/12) + **outbound trust** (5/10) + **database-level permissions** (this post). Three layers, all required.

## What about Java and SSJS?

| Language | Equivalent classes |
|---|---|
| LotusScript | `NotesACL` / `NotesACLEntry` |
| Java | `lotus.domino.ACL` / `lotus.domino.ACLEntry` — camelCase methods (`getEntry`, `createACLEntry`, `save`, `enableRole`) |
| SSJS (XPages) | Same as Java, accessed via `database.getACL()` |

Cross-language behavior is identical — Java requires explicit `acl.recycle()` / `entry.recycle()` to free C++-side memory. LotusScript auto-recycles, so this isn't an LS concern.

## Closing

Domino developers spend most of their time on documents and views — ACLs typically get configured once and forgotten. But for **dynamic permission adjustment** (auto-grouping by org structure, role flips by workflow stage), `NotesACL` and `NotesACLEntry` are unavoidable.

The three pitfalls most likely to bite:

1. **Forgetting `acl.Save`** — agent ran, ACL unchanged, no error
2. **`GetEntry` returns `Nothing`** — always `Is Nothing` first
3. **Don't mix db methods with ACL objects** — one path per agent

Plus the precondition "to modify ACL, you need Manager yourself" — and you have the foundation for writing real ACL automation in production.
