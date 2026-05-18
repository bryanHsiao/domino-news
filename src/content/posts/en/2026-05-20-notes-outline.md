---
title: "NotesOutline + NotesOutlineEntry Deep Dive — Programmatic UI Navigation in Domino, 4 Entry Types, 24 Properties"
description: "NotesOutline is the Domino design element behind the navigation menu in a Notes application, made up of NotesOutlineEntry items in a tree. From LotusScript you can dynamically build, modify, and walk an outline — typical use cases are multilingual menus (updating Label per user locale), role-conditional menus (hiding entries by ACL role), and personalized navigation. This guide covers the NotesOutline ↔ NotesOutlineEntry relationship, 8 tree-walking methods, 6 manipulation methods, all 24 entry properties, the 4 Set* methods, the 4 entry type constants and 9 EntryClass constants, a complete CRUD example, five pitfalls, and Java/SSJS counterparts."
pubDate: 2026-05-20T07:30:00+08:00
lang: en
slug: notes-outline
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesOutline class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html"
  - title: "NotesOutlineEntry class (LotusScript) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html"
  - title: "Examples: NotesOutline class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESOUTLINE_CLASS_EX.html"
  - title: "Examples: Outline class properties and methods (Java reference) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_OUTLINE_CLASS_JAVA.html"
relatedJava: ["Outline", "OutlineEntry"]
relatedSsjs: ["Outline", "OutlineEntry"]
cover: "/covers/notes-outline.png"
coverStyle: "collage"
---

## TL;DR

- [`NotesOutline`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINE_CLASS.html) — HCL: "Represents an outline in a database. An outline supports a hierarchy of OutlineEntries and the NotesOutline class provides methods for navigation and manipulation of the individual OutlineEntries"
- [`NotesOutlineEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html) — HCL: "Represents an entry within an outline"
- **Containment**: `NotesOutline` Contains `NotesOutlineEntry`; Contained by `NotesDatabase`
- **4 entry target types**: `OUTLINE_TYPE_NOTELINK` (link to a document/db/view), `OUTLINE_TYPE_NAMEDELEMENT` (link to a view/form/folder by name), `OUTLINE_TYPE_URL` (URL link), `OUTLINE_TYPE_ACTION` (run @Formula)
- ⚠️ **Outline is a legacy design element** — XPages and modern Notes UI largely displaced it as the client navigation surface. But **programmatic outline construction** is still the right tool for multilingual menus, role-conditional navigation, and personalized link lists

## What an outline is

An outline is the Domino application's **navigation design element** — when you open a Notes app, the menu strip on the left is the outline. Each entry can link to a view, a document, a URL, or run a formula action.

Outlines are usually authored in Designer and exist statically. The cases where **programmatic outline construction or modification** comes up:

- **Multilingual switching** — update each entry's `Label` based on user locale
- **Role-conditional menus** — dynamically hide / show entries based on ACL roles
- **Personalized navigation** — add user-specific links (bookmarks, recently opened docs)
- **DXL export / import** — outline structures for version control or cross-db replication

## NotesOutline ↔ NotesOutlineEntry — containment

Per the official class definitions:

- `NotesOutline` — Contained by `NotesDatabase`, Contains `NotesOutlineEntry`
- `NotesOutlineEntry` — Contained by `NotesOutline`

In other words: get the outline first, then walk / create / modify / remove entries through it. Outline itself doesn't expose a "list of entries" property; you traverse with `GetFirst` + `GetNext` etc.

## Obtaining the outline and walking entries

### Getting the outline

Two `NotesDatabase` methods:

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim outline As NotesOutline

Set db = session.CurrentDatabase

' Existing outline
Set outline = db.GetOutline("MainOutline")

' Or create new
Set outline = db.CreateOutline("MyNewOutline")
```

`GetOutline` returns `Nothing` if the outline doesn't exist (no error thrown). `CreateOutline` builds an outline in memory — you **must call `outline.Save`** to actually persist it.

### 8 tree-walking methods

Per the official docs, `NotesOutline` exposes these 8 navigation methods:

| Method | Purpose |
|---|---|
| `GetFirst()` | "Gets the first entry of an outline" |
| `GetLast()` | "Gets the last entry of an outline" |
| `GetNext(entry)` | "Given an entry in an outline, returns the entry immediately following it" |
| `GetPrev(entry)` | "Given an entry in an outline, returns the entry immediately preceding it" |
| `GetParent(entry)` | "Given a response entry in an outline, returns its parent entry" |
| `GetChild(entry)` | "Returns the child of the specified entry" |
| `GetNextSibling(entry)` | "Given an entry in an outline, returns the entry immediately following it at the same level" |
| `GetPrevSibling(entry)` | "Given an entry in an outline, returns the entry immediately preceding it at the same level" |

The standard pattern for walking the entire outline:

```lotusscript
Dim entry As NotesOutlineEntry
Set entry = outline.GetFirst()
Do Until entry Is Nothing
    Print entry.Label & " (Level " & entry.Level & ")"
    Set entry = outline.GetNext(entry)
Loop
```

`GetNext` traverses depth-first — into children, then siblings. Use `GetNextSibling` to stay at one level.

### 6 manipulation methods

| Method | Purpose |
|---|---|
| `Save()` | "Saves any changes you have made to the outline" — **mandatory**, or changes are lost |
| `CreateEntry(label, parent, type, after)` | "Creates a new entry and adds it to the outline" |
| `CreateEntryFrom(existing, parent, after)` | "Creates a copy of an existing outline entry" |
| `AddEntry(entry, parent, after)` | "Adds a new entry to the outline" (used with free-standing entries) |
| `MoveEntry(entry, parent, after)` | "Moves an outline entry and subentries from one location to another" |
| `RemoveEntry(entry)` | "Deletes an entry and its subentries from an outline" |

## NotesOutlineEntry — 24 properties

### Read-write (modifiable)

| Property | Purpose |
|---|---|
| `Label` | Display text — what gets changed for multilingual switching |
| `Alias` | Programmatic internal name |
| `HideFormula` | @Formula determining visibility |
| `UseHideFormula` | Whether the hide formula is actually evaluated |
| `IsHidden` | Hide in all contexts |
| `IsHiddenFromNotes` | Hide in Notes client |
| `IsHiddenFromWeb` | Hide on the web |
| `FrameText` | Which frame to display in |
| `ImagesText` | Entry icon image filename |
| `KeepSelectionFocus` | Selection-focus behavior |

### Read-only

| Property | Purpose |
|---|---|
| `Parent` | Back-reference to NotesOutline |
| `Type` | Entry target type (one of 4 constants — see below) |
| `EntryClass` | Linked design element class (one of 9 constants) |
| `Level` | Hierarchical depth |
| `HasChildren` | Whether this entry has children |
| `IsInThisDb` | Whether the target is in the same db |
| `IsPrivate` | User-specific entry |
| `Formula` | The formula for action-type entries |
| `URL` | URL string for URL-type entries |
| `NamedElement` | Element name for named-element entries |
| `View` | The view object for view entries |
| `Database` | The db object for db entries |
| `Document` | The doc object for document entries |

## 4 Set* methods — setting an entry's target

[`NotesOutlineEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESOUTLINEENTRY_CLASS.html) provides 4 methods to set the target (one per Type):

| Method | What it sets | Resulting Type |
|---|---|---|
| `SetNoteLink(notelinkable)` | Link to a doc / db / view (pass a NotesDocument / NotesDatabase / NotesView) | `OUTLINE_TYPE_NOTELINK` |
| `SetNamedElement(db, name, class)` | Link to a named design element in a db (specify EntryClass: VIEW / FORM / FOLDER / etc.) | `OUTLINE_TYPE_NAMEDELEMENT` |
| `SetURL(url)` | Link to a URL | `OUTLINE_TYPE_URL` |
| `SetAction(formula)` | Run an @Formula | `OUTLINE_TYPE_ACTION` |

⚠️ **There is no `SetView` method** — many examples online (and AI-generated code) write `entry.SetView(db, "ViewName")`, but that's **wrong, not documented by HCL**. To link to a view, use `SetNamedElement(db, "ViewName", OUTLINE_CLASS_VIEW)`.

## 4 Type constants (target type)

```
OUTLINE_TYPE_NOTELINK         ' Link to doc / db / view (via SetNoteLink)
OUTLINE_TYPE_NAMEDELEMENT     ' Link to a named design element (via SetNamedElement)
OUTLINE_TYPE_URL              ' Link to a URL (via SetURL)
OUTLINE_TYPE_ACTION           ' Run a formula (via SetAction)
```

Plus three system-type constants you may encounter when reading outlines (rarely set explicitly):

```
OUTLINE_OTHER_FOLDERS_TYPE    ' The "Other Folders" system entry
OUTLINE_OTHER_VIEWS_TYPE      ' The "Other Views" system entry
OUTLINE_OTHER_UNKNOWN_TYPE    ' Unknown type
```

## 9 EntryClass constants (which design element it links to)

When an entry's `Type` is `OUTLINE_TYPE_NAMEDELEMENT`, the `EntryClass` tells you which kind of design element:

```
OUTLINE_CLASS_DATABASE        ' Whole db
OUTLINE_CLASS_VIEW            ' A view
OUTLINE_CLASS_FOLDER          ' A folder
OUTLINE_CLASS_FORM            ' A form
OUTLINE_CLASS_DOCUMENT        ' A document
OUTLINE_CLASS_FRAMESET        ' A frameset
OUTLINE_CLASS_NAVIGATOR       ' A navigator
OUTLINE_CLASS_PAGE            ' A page design element
OUTLINE_CLASS_UNKNOWN         ' Unknown
```

## A complete example — create outline, add varied entries, walk, save

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim outline As NotesOutline
    Dim entryView As NotesOutlineEntry
    Dim entryUrl As NotesOutlineEntry
    Dim entryAction As NotesOutlineEntry
    Dim entryHeader As NotesOutlineEntry

    Set db = session.CurrentDatabase
    Set outline = db.CreateOutline("DynamicNav")

    ' (1) Header — a group title (no target, just labeling)
    Set entryHeader = outline.CreateEntry("Quick Links", Nothing, "", Nothing)
    entryHeader.Label = "Quick Links"  ' Multilingual: change the Label

    ' (2) View link — use SetNamedElement + OUTLINE_CLASS_VIEW
    Set entryView = outline.CreateEntry("AllOrders", entryHeader, "", Nothing)
    entryView.Label = "All Orders"
    Call entryView.SetNamedElement(db, "(AllOrders)", OUTLINE_CLASS_VIEW)

    ' (3) URL link
    Set entryUrl = outline.CreateEntry("HCLDocs", entryHeader, "", Nothing)
    entryUrl.Label = "HCL Docs"
    Call entryUrl.SetURL("https://help.hcl-software.com/")

    ' (4) Action entry — runs a formula
    Set entryAction = outline.CreateEntry("RefreshAll", entryHeader, "", Nothing)
    entryAction.Label = "Refresh"
    Call entryAction.SetAction({@Command([RefreshHideFormulas])})

    ' (5) Save is mandatory
    Call outline.Save()

    ' Walk and verify
    Dim entry As NotesOutlineEntry
    Set entry = outline.GetFirst()
    Do Until entry Is Nothing
        Print String(entry.Level * 2, " "); entry.Label _
            & " [type=" & entry.Type & ", class=" & entry.EntryClass & "]"
        Set entry = outline.GetNext(entry)
    Loop
End Sub
```

Things to notice:

- **`CreateEntry(label, parent, type, after)` — `parent` of `Nothing`** adds to root level; pass an existing entry to make this its child
- **`String(entry.Level * 2, " ")` for indented display** — Level 0 is root, Level 1 is root's child
- **For multilingual cases: assign `entry.Label = ...` dynamically, then Save**
- **`outline.Save` is mandatory** — same shape of silent bug as the other `*.Save`-required classes

## Five pitfalls

### 1. Forgetting `outline.Save` — silent data loss

Same shape of silent bug as [NotesACLEntry](/domino-news/en/posts/notes-acl-entry). Modify `entry.Label`, `SetURL`, etc., forget `Call outline.Save`, and nothing gets written. **Code-review habit: for every outline modification, grep for a `.Save` after it**.

### 2. `SetView` doesn't exist — use `SetNamedElement` + `OUTLINE_CLASS_VIEW`

A lot of legacy LS and AI-generated examples write:

```lotusscript
Call entry.SetView(db, "ViewName")    ' WRONG — not a documented method
```

Correct:

```lotusscript
Call entry.SetNamedElement(db, "ViewName", OUTLINE_CLASS_VIEW)
```

NotesOutlineEntry has exactly **4 Set methods**: `SetAction`, `SetNamedElement`, `SetNoteLink`, `SetURL`. Everything else is property-assignment.

### 3. `HideFormula` doesn't apply automatically — need `UseHideFormula = True`

Set a hide formula but the entry still shows? Check `UseHideFormula`:

```lotusscript
entry.HideFormula = {@IsMember("[Admin]"; @UserRoles) = False}
entry.UseHideFormula = True   ' Must be set
```

`UseHideFormula` is the on/off switch for the formula — without it set, the formula doesn't fire.

### 4. `GetNext` is depth-first, not sibling-only

```lotusscript
Set entry = outline.GetFirst()
Do Until entry Is Nothing
    ' This loop visits ALL entries (including children) — not just root level
    Set entry = outline.GetNext(entry)
Loop
```

To walk **only one level**, use `GetNextSibling`:

```lotusscript
Set entry = outline.GetFirst()  ' First root entry
Do Until entry Is Nothing
    ' Stay at root level
    Set entry = outline.GetNextSibling(entry)
Loop
```

Mixing the two patterns produces unexpected traversal orders.

### 5. Outline is a legacy element — for new design, consider XPages / Modern UI

Outline was introduced in Notes 6 as the Notes client's left navigation menu. **XPages and onwards displaced it in client UI for new design**, with the ApplicationLayout custom control taking over the role.

Practical cases still using outline:

- **Maintaining legacy Notes client apps** — dynamically modifying an existing outline
- **DXL export for version control / cross-db sync of outline structures**
- **Multilingual Notes apps** — programmatic outline beats designing a multilingual outline by hand in Designer

For new Domino apps built around XPages or the REST API, outline is usually skipped. Confirm **this app actually uses outline** before writing outline code.

## What about Java and SSJS?

| Language | Equivalent class |
|---|---|
| LotusScript | `NotesOutline` / `NotesOutlineEntry` |
| Java | `lotus.domino.Outline` / `lotus.domino.OutlineEntry` — camelCase methods (`getFirst`, `createEntry`, `setNamedElement`, `save`); constants share names (`OutlineEntry.OUTLINE_TYPE_NOTELINK` etc.) |
| SSJS (XPages) | Same as Java; XPages apps typically use ApplicationLayout custom controls in place of outline, so direct outline manipulation is rare in practice |

Cross-language behavior is identical — Java requires explicit `outline.recycle()` / `entry.recycle()` for C++-side memory. LotusScript auto-recycles.

## Closing

NotesOutline / NotesOutlineEntry are LotusScript's programmatic tools for building Domino UI navigation. Three things to remember:

1. **`outline.Save` is mandatory** — same silent-bug shape as other `Set*` operations
2. **There is no SetView method** — use `SetNamedElement` + `OUTLINE_CLASS_VIEW` for view links
3. **Outline is a legacy element** — for new design, evaluate XPages / Modern UI first

But for maintaining dynamic menus in legacy Notes client apps, multilingual switching, and role-conditional display, outline remains the most direct tool available.
