---
title: "ViewNavigator in Java: for Big Views, Turn Off autoupdate and Set CacheSize"
description: "A view with a few hundred thousand entries, and in Java you need to walk every row and do something. getAllDocuments pulls the whole batch into memory first and blows the heap on a big view. ViewNavigator is different — it walks the view's index one row at a time, handing you ViewEntry objects (index-level row data) without opening each Document. But to make it actually fast there are three knobs to turn yourself: set IsAutoUpdate to false (background auto-update degrades performance and can invalidate the navigator's entries), set CacheSize for remote operations to cut server round-trips, and use the goto methods instead of the get methods when you only need to move the pointer or count (the docs state plainly that a goto method does not create a ViewEntry object). This covers building the right navigation scope, those three performance knobs, and recycling each entry as you go."
pubDate: 2026-11-14T07:30:00+08:00
lang: en
slug: java-viewnavigator
tags:
  - "Java"
sources:
  - title: "ViewNavigator class (Java) (createViewNav* family, CacheSize, goto vs get, IsAutoUpdate) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html"
  - title: "ViewEntry class (Java) (ColumnValues; document/category/total entry types) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html"
  - title: "View class (Java) (createViewNav and the other navigator-creating methods) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "ViewNavigator"
apiLang: "java"
cover: "/covers/java-viewnavigator.webp"
coverStyle: "photoreal-3d"
---

A view with a few hundred thousand entries, and in Java you need to walk every row and do something. The reflex is `view.getAllDocuments()` — and then a big view blows your heap, because it pulls the whole batch of documents into memory first.

[`ViewNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html) takes a different path. The docs define it as "Represents a view navigator. A view navigator provides access to all or a subset of the entries in a view." It walks the view's index one row at a time; each row is a `ViewEntry` holding index-level row data, with no need to open each Document. For a big view, that's the read that actually finishes.

But "using ViewNavigator" doesn't equal "fast." To make it fast there are three knobs to turn yourself. This covers building the right scope, those three knobs, and the memory discipline while walking.

---

## Build the right scope first

A ViewNavigator comes from [`view`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS_JAVA.html), and you can fence off just the slice you want rather than the whole view every time:

- `createViewNav()` — the whole view.
- `createViewNavFromCategory("2026/Q4")` — under one category.
- `createViewNavFromChildren(entry)` / `createViewNavFromDescendants(entry)` — the immediate children / all descendants of a row (for hierarchical views).
- `createViewNavMaxLevel(n)` — only down to level n, flattening deep hierarchy.
- `createViewNavFromAllUnread()` — all unread.

The smaller the scope, the fewer entries to walk. Don't reach for `createViewNav()` over the whole view and then filter it yourself.

## The three performance knobs

This is the heart of it — the defaults aren't kind to a big view, and three places need a hand:

**1. Set `IsAutoUpdate` to false.** The docs say auto-update will "degrade performance and may invalidate entries in the navigator." Meaning: if you're walking while someone else edits the view, the default auto-update not only slows you down, it can invalidate the entries you're holding. Turn it off before you walk, and call refresh yourself when you actually want fresh data. This is the same lesson as `setAutoUpdate(false)` in [the Java View piece](/domino-news/posts/java-view/).

**2. Set `CacheSize` for remote operations.** The docs say "ViewNavigator caches entries" and "You can set the cache size and should set it to try to minimize server access." When your Java reaches the server remotely (IIOP), the navigator caches entries; a larger CacheSize fetches more rows per trip and cuts the network round-trips. On a local agent running on the server this matters little; on a remote client it matters a lot.

**3. Use `goto` when you're only navigating, not `get`.** Many people don't know this: the docs state that "a goto method does not create a ViewEntry object." `getNext()` builds a `ViewEntry` object for you (it has a cost, and you then have to recycle it); but if you're only moving the pointer, counting, or seeking a position, `gotoNext()` / `gotoFirst()` just move the pointer without creating an object. Reach for `get` only when you actually need to read column values.

## Reading columns, and the three entry types

The `ViewEntry` you get has [`ColumnValues`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html), which the docs define as "The value of each column in the view entry." — the value of each column of this row in the view, read from the index, with no need to open the backing Document. That's exactly where ViewNavigator earns its keep: if everything you need to display is in the view columns, the whole walk opens zero documents.

One thing to watch: the rows in a view aren't only documents. The docs say an entry is one of three types — document, category, total. Walk a categorized view and you'll hit category rows and total rows; test with `isDocument()` / `isCategory()`, and don't try to read a category row's UNID as if it were a document.

## Recycle every entry

The place a ViewNavigator most easily blows memory is exactly the `ViewEntry` objects you pulled with `get`. Walk a big view and, if every entry from `getNext()` goes un-recycled, the C-layer handles pile up until they exhaust. The standard move is to recycle the previous entry inside the loop:

```java
ViewNavigator nav = view.createViewNav();
nav.setCacheSize(400);
view.setAutoUpdate(false);
ViewEntry entry = nav.getFirst();
while (entry != null) {
    if (entry.isDocument()) {
        java.util.Vector<?> cols = entry.getColumnValues();   // index-level columns, no open
        // …use cols…
    }
    ViewEntry next = nav.getNext(entry);   // grab the next first
    entry.recycle();                       // then recycle this one
    entry = next;
}
nav.recycle();
```

The full recycle discipline (why you grab next before recycling current) is in [the Java recycle blow-up piece](/domino-news/posts/java-recycle-memory/).

## What about LotusScript and SSJS?

The same `ViewNavigator`:

- **LotusScript**: `NotesViewNavigator`, with the `CreateViewNav` family, `GetFirst` / `GetNext`, `CacheSize`, `AutoUpdate` — same behavior, no recycle; the full usage is in [the NotesViewNavigator piece](/domino-news/posts/notes-view-navigator/).
- **SSJS / XPages**: `NotesViewNavigator`, same creation and walking; in XPages it's often used to control the expansion of hierarchical data yourself, with the request managing the lifecycle.
- **The Java-specific part** isn't the API (the methods are shared) — it's that the `goto`-doesn't-create-a-`ViewEntry` distinction bites hardest in strongly-typed, hand-recycled Java: on a big view, reaching for `get` where `goto` would do means building a pile of objects you then have to recycle for nothing.
