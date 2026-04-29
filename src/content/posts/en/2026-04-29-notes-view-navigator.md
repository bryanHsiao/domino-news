---
title: "NotesViewNavigator: navigate views the proper way, not GetFirstDocument loops"
description: "NotesViewNavigator is the LotusScript tool for non-trivial view traversal: it returns ViewEntry objects (which carry view metadata GetFirstDocument doesn't), it can be built over a subset of the view (a single category, all unread, descendants of an entry, a max level), and it's faster than the naive document loop — provided you remember to switch AutoUpdate off first. This post catalogues the 4 properties, ~36 methods, 7 CreateViewNav* variants, and the caveats worth knowing."
pubDate: "2026-04-29T01:35:08+08:00"
lang: "en"
slug: "notes-view-navigator"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
  - "Performance"
sources:
  - title: "NotesViewNavigator (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "NotesViewNavigator properties — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_PROPERTIES.html"
  - title: "NotesViewNavigator methods — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_METHODS.html"
  - title: "NotesView CreateViewNav method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATEVIEWNAV_METHOD_VIEW.html"
cover: "/covers/notes-view-navigator.png"
---

## Why not just use GetFirstDocument?

The entry-level way to walk a view in LotusScript:

```lotusscript
Set doc = view.GetFirstDocument()
Do Until doc Is Nothing
    ' work
    Set doc = view.GetNextDocument(doc)
Loop
```

Short, readable, fine for most cases. But [`NotesViewNavigator`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html) (around since Release 5) is the right tool when you hit any of these:

- You want a `ViewEntry` (with view-level metadata: position, SiblingCount, IsCategory/IsTotal, ColumnValues), not just the underlying `Document`
- You want to walk **a subset of the view** — a single category, all unread, the descendants of one entry, only down to a max level
- You want to walk **category headers or totals**, not just documents
- You want a **tree-shaped** traversal — child / parent / siblings — instead of flat next/prev

Navigators are produced by [`NotesView`'s `CreateViewNav*` family](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATEVIEWNAV_METHOD_VIEW.html).

## Properties (just four)

The only documented properties — there is no `Navigator` or `Entry` property despite what AI completions like to suggest:

| Property | Access | Purpose |
|---|---|---|
| `CacheSize` | Read-write | Navigator cache size in view entries |
| `Count` | Read-only | Total entries this navigator covers |
| `MaxLevel` | Read-write | Maximum hierarchy level the navigator descends to |
| `ParentView` | Read-only | The `NotesView` this navigator was built from |

## Seven `CreateViewNav*` factories

How you ask `NotesView` for a navigator — pick the one that already constrains the subset you want:

| Method | Coverage |
|---|---|
| `CreateViewNav` | Every entry in the view |
| `CreateViewNavFrom(entry)` | From a given entry to the end |
| `CreateViewNavFromAllUnread` | All unread entries |
| `CreateViewNavFromCategory(category)` | Everything under a named category |
| `CreateViewNavFromChildren(entry)` | The immediate children of an entry (no grandchildren) |
| `CreateViewNavFromDescendants(entry)` | Every descendant of an entry |
| `CreateViewNavMaxLevel(maxLevel)` | Every entry down to a given level |

Picking the right factory matters more than picking the right walk method. `CreateViewNavFromCategory` is dramatically faster than building a full nav and then filtering with `GotoChild`.

## Methods in three families

### Get* — return an entry, leave the cursor alone

The bread and butter:

- `GetFirst` / `GetLast` / `GetNext` / `GetPrev`
- `GetFirstDocument` / `GetLastDocument` / `GetNextDocument` / `GetPrevDocument` — skip category and total rows, return only documents
- `GetNextCategory` / `GetPrevCategory` — only category rows
- `GetChild` — first child entry
- `GetParent`
- `GetNextSibling` / `GetPrevSibling`
- `GetNth(n)` — the n-th top-level entry
- `GetPos(position)` — the entry at a view position string (e.g. `"3.2"`)
- `GetEntry(obj)` — the navigator entry corresponding to a `NotesDocument` or `ViewEntry`
- `GetCurrent` — whatever the internal cursor is on right now

### Goto* — move the internal cursor, return Boolean

Almost every `Get*` has a `Goto*` twin: `GotoFirst`, `GotoNext`, `GotoChild`, `GotoParent`, `GotoNextSibling`, `GotoFirstDocument`, `GotoNextCategory`, `GotoPos`, `GotoEntry`, … the lot. They return `True` / `False` to signal whether the move succeeded.

### Mark* — read state for everything in the navigator

- `MarkAllRead` — mark every document the navigator covers as read
- `MarkAllUnread` — the inverse

Combine with `CreateViewNavFromAllUnread` for "mark this user's entire inbox as read" in one shot.

## Performance: turn off AutoUpdate first

The documentation is explicit:

> "Avoid automatically updating the parent view by explicitly setting AutoUpdate to False. Automatic updates degrade performance and may invalidate entries in the navigator (`Entry not found in index`)."

So before you start navigating:

```lotusscript
Set view = db.GetView("My View")
view.AutoUpdate = False    ' do this first
Set nav = view.CreateViewNav()
```

If you skip it, anyone modifying a document mid-traversal will trigger a view auto-refresh, the navigator's cached entry indices go stale, and your next `GetNext` raises `Entry not found in index`.

When you do need fresh data, call `view.Refresh()` explicitly.

## A practical example: list every doc under a category

```lotusscript
Sub ListByCategory(db As NotesDatabase, viewName As String, cat As String)
    Dim view As NotesView
    Dim nav As NotesViewNavigator
    Dim entry As NotesViewEntry

    Set view = db.GetView(viewName)
    view.AutoUpdate = False

    Set nav = view.CreateViewNavFromCategory(cat)
    Set entry = nav.GetFirstDocument()    ' skips the category header
    Do Until entry Is Nothing
        Print entry.Document.UniversalID & " | " & _
              CStr(entry.ColumnValues(0))    ' first view column
        Set entry = nav.GetNextDocument(entry)
    Loop
End Sub
```

The four things this snippet gets right:

1. `AutoUpdate = False` on the very first line working with the view
2. `CreateViewNavFromCategory` — pre-filtered at construction, instead of building a full nav and walking past unwanted entries
3. `GetFirstDocument` / `GetNextDocument` — skips the category header and any totals row
4. `entry.ColumnValues(0)` — read the view column directly without opening the underlying document. This is the real performance win over a `GetFirstDocument` document loop

## A caveat worth remembering: duplicate entries

When a document is categorized under multiple categories, it appears multiple times in the view. The documentation flags two consequences for navigators:

- `GetEntry(doc)` always returns **the first** ViewEntry instance for that document, not all of them
- A navigator built from an object that "did not come from the current view" also returns only the first instance

If a report total looks short because the same document was supposed to be counted in two categories, this is the place to look.

## When *not* to use NotesViewNavigator

- Plain document iteration over an uncategorized view, no perf concerns → a `GetFirstDocument` loop is fine
- Heavy filter / sort work → `NotesViewEntryCollection` or DQL (with [`NotesQueryResultsProcessor`](https://bryanhsiao.github.io/domino-news/en/posts/notes-query-results-processor) since V12)
- Concurrent / parallel querying → Domino REST API

The sweet spot for `NotesViewNavigator` is **"I want a subset of the view *and* I want the view-level metadata that comes with view entries."** That's where it's the right wrench in the toolbox.
