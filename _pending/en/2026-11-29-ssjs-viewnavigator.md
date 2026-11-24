---
title: "Navigating Categorized Views in XPages: Turn Off the Parent View's IsAutoUpdate, or the Navigator Breaks"
description: "XPages needs to walk a categorized view: build a category tree, pull the documents under one category, or quickly count a category. You use ViewNavigator. But there's a trap that makes it fail with 'Entry not found in index': if the parent view's IsAutoUpdate is true, the navigator's cache is turned off and child objects can be invalidated — the docs tell you to set it false explicitly. And get vs goto are different: goto only moves the pointer and builds no ViewEntry, so navigation-only / counting is much faster with goto. This covers creating one (all entries vs from a category), get vs goto, the IsAutoUpdate trap, walking categories, and the real CacheSize/MaxLevel limits."
pubDate: 2026-11-29T07:30:00+08:00
lang: en
slug: ssjs-viewnavigator
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesViewNavigator (JavaScript) (get vs goto, IsAutoUpdate effect, CacheSize/MaxLevel) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewNavigator.html"
  - title: "createViewNavFromCategory (NotesView - JavaScript) (navigator for one category, category row excluded) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_View_createViewNavFromCategory.html"
  - title: "getNext (NotesViewNavigator - JavaScript) (get builds a ViewEntry; compare gotoNext returning boolean) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewNavigator_getNext.html"
relatedJava: []
relatedSsjs: []
coversClass: "ViewNavigator"
apiLang: "ssjs"
---

XPages needs to walk a **categorized view**: build a tree the user can expand, pull the documents under one category, or quickly count a category. You reach for [`ViewNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewNavigator.html) — in the docs, it "provides access to all or a subset of the entries in a view."

But there's a trap that makes it fail outright with "Entry not found in index", and it isn't in the navigator — it's in the **parent view**: if `IsAutoUpdate` is true, the navigator's cache is turned off and its entry objects can be invalidated. The docs tell you to set it false. And `get` vs `goto` are different — navigation-only / counting is much faster with `goto`.

This covers creating one (all entries vs from a category), `get` vs `goto`, the `IsAutoUpdate` trap, walking categories, and the real `CacheSize` / `MaxLevel` limits.

---

## Creating one: all entries vs from a category

A navigator is built from a `NotesView`. The common ones:

- `view.createViewNav()` — docs: "Creates a view navigator for all entries in a view." Every entry. An empty view gives an empty navigator where "All navigation methods return null."
- [`view.createViewNavFromCategory(categoryName)`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_View_createViewNavFromCategory.html) — only the entries under one category. Two details: "The category entry itself is excluded." and nested categories use a backslash, e.g. `"Asia\\Korea"`.
- `createViewNavFromChildren(entry)` / `createViewNavFromDescendants(entry)` — anchored to an entry: immediate children, or all descendants.
- `createViewNavMaxLevel(level)` — down to a given level only.

For "the list under this category" or "an expandable tree" in XPages, `createViewNavFromCategory` is usually the cheapest door — you don't drag the whole view in.

## get vs goto: use goto when you're only navigating

This is the performance lever. The class page, verbatim: "A `goto` method is favored over a `get` method for navigation-only purposes because a `goto` method does not create a NotesViewEntry object."

- [`getNext()`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewNavigator_getNext.html) returns a `NotesViewEntry` (null if none) and moves the pointer — use it when you need to read an entry's columns.
- `gotoNext()` returns a `boolean` (true/false), moves the pointer, and **builds no ViewEntry object**.

```javascript
// just counting / positioning to the Nth → use goto, don't pay for entries
var nav:NotesViewNavigator = view.createViewNav();
nav.gotoFirst();
var n = 0;
while (nav.gotoNext()) { n++; }        // moves the pointer only, no ViewEntry

// need the column values → use get
var e:NotesViewEntry = nav.getFirst();
while (e != null) {
  print(e.getColumnValues().get(0));
  e = nav.getNext();                   // get builds a ViewEntry
}
```

A navigator keeps a "current pointer" (docs: "the most recent entry you get or go to"); both `get` and `goto` move it. For pure counting or jumping, `goto` saves the cost of building all those ViewEntry objects.

## The trap: turn off the parent view's IsAutoUpdate

This is the one that bites hardest, and the symptom is alarming. The class page:

- "A refresh of the parent view affects the view navigator." — the navigator is bound to its parent view.
- "The cache is turned off if IsAutoUpdate is true for the parent view; caching is resumed if IsAutoUpdate is set to false." — with the parent view's `IsAutoUpdate` true, the navigator's cache is **disabled**.
- "Automatic updates degrade performance and may invalidate entries in child objects ("Entry not found in index")." — auto-update isn't just slow; it can **invalidate** the entries underneath, throwing the infamous `Entry not found in index`.

So the docs' advice is blunt: "Avoid automatically updating the view by explicitly setting IsAutoUpdate to false especially if the view is a base for navigators or entry collections." — before using a view as a navigator's base, `view.setAutoUpdate(false)`. In XPages, where views are often live, this bites easily: data updates mid-walk, the entry the pointer is on disappears, and you get `Entry not found in index`.

## Walking a categorized view

The structure: docs, "In a categorized view, documents are children of categories." The walk:

- `getFirst()` starts at the top (the first level is usually category rows); `getChild(entry)` descends into an entry's children ("Returns the first child", null if none); `getNextSibling(entry)` moves to the next at the same level.
- Tell what kind of row you're on: `entry.isCategory()` / `entry.isDocument()` / `entry.isTotal()`. Docs: "A child of a category entry can be a category or document entry." (a category can nest).
- Want documents only, skipping categories: `getFirstDocument()` — "skipping any category entries."
- With totals: "the grand total is considered a category entry, and getLast returns that entry.", and subtotals are "available in the columnValues of category entries."

The typical tree-build logic: try `getChild`, if no child try `getNextSibling`, if no sibling go up a level and try a sibling there.

## CacheSize / MaxLevel: the real limits

- `CacheSize` — "The size of the navigator cache in view entries.", **0 (no cache) to 128 (the default maximum)**. Note the docs: `createViewNav`'s cacheSize argument "Applies only to remote (IIOP) operations." — the cache mostly matters for **remote (IIOP)**; on a local / server-side agent it does little.
- `MaxLevel` — "The navigator's maximum level of navigation.", **0 (top level) to 30 (default)**. But "The maximum cannot be less than the minimum implied by the navigator type" — a navigator built from children / descendants can't have a MaxLevel below the level it already implies.
- One more cache detail: "Methods that navigate using the current pointer take advantage of the cache while methods that navigate relative to a specified entry do not." — walking by the current pointer (`getNext()`) uses the cache; walking with an explicit entry (`getNext(entry)`) doesn't.

## What about LotusScript and Java?

The same `ViewNavigator`:

- **LotusScript**: `NotesViewNavigator`, with `CreateViewNav` / `CreateViewNavFromCategory`, `GetNext` / `GotoNext`, `CacheSize` / `MaxLevel` — same "goto builds no entry", same "turn off the parent view's AutoUpdate."
- **Java**: `ViewNavigator`, the same API plus recycle (recycle each entry when done); the full treatment is in [the Java ViewNavigator piece](/domino-news/posts/java-viewnavigator/).
- **What's SSJS-specific** isn't the API (the methods are shared) — it's the setting: in XPages, views default to live, so `setAutoUpdate(false)` on a navigator's base is close to mandatory; and XPages doesn't need you to recycle each entry. "Turn off IsAutoUpdate" and "use goto for navigation-only" are what keep an XPages navigator from breaking and from crawling.
