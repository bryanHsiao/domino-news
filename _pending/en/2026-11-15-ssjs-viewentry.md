---
title: "ViewEntry in XPages: Read the View with getColumnValues, Without Opening Each Document"
description: "In XPages you need to list a batch of data — a typeahead list, a chunk of JSON, a custom repeat. The columns you want to show are already laid out in some view. The reflex is to walk the view, getDocument on each row, and read the fields — but that opens every document, and a big view is slow. NotesViewEntry lets you read the index-level column values directly: getColumnValues returns each column's value for that row, and the whole walk can open zero documents. This covers getting a ViewEntry in XPages, reading column values, one confusing point (the collection from getAllEntries holds only document rows — category rows need a ViewNavigator), and that XPages, unlike Java, doesn't make you recycle."
pubDate: 2026-11-15T07:30:00+08:00
lang: en
slug: ssjs-viewentry
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesViewEntry (JavaScript) (ColumnValues, document/category/total entry types, Document/IsCategory) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewEntry.html"
  - title: "NotesViewEntryCollection (JavaScript) (getAllEntries; document rows only; Count/getFirstEntry) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewEntryCollection.html"
  - title: "NotesView (JavaScript) (getAllEntries / getEntryByKey and the other entry-getting methods) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_View.html"
relatedJava: []
relatedSsjs: []
coversClass: "ViewEntry"
apiLang: "ssjs"
---

In XPages you need to list a batch of data — a typeahead list, a chunk of JSON to return to the front end, a custom-styled repeat. The columns you want to show are already laid out in some view. The reflex is to walk that view, `getDocument()` each row, and `getItemValueString(...)`.

The trouble is that opens every document. A picklist of a few thousand rows means a few thousand document opens — a big view gets noticeably slow. And those values are already in the view's index; there's no need to open the documents at all.

The thing that reads index-level column values is [`NotesViewEntry`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewEntry.html). The docs define it as "A view entry describes a row in a view." — it represents one row, and `getColumnValues` hands you each column's value for that row. This covers getting a ViewEntry in XPages, reading column values, one confusing collection distinction, and recycling.

---

## Getting an entry and reading columns

On the XPages back end, the usual way is to get a whole collection from the view with [`getAllEntries`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_View.html) and walk it row by row:

```javascript
var view = database.getView("byCustomer");
var col = view.getAllEntries();           // NotesViewEntryCollection
var entry = col.getFirstEntry();
var out = [];
while (entry != null) {
    var vals = entry.getColumnValues();   // each column's value for this row (index-level, no open)
    out.push({ name: vals[0], total: vals[2] });
    var next = col.getNextEntry(entry);
    entry = next;
}
```

`getColumnValues` returns what the docs call "The value of each column in the view entry." — an array in view-column order, `vals[0]` the first column, `vals[2]` the third. If everything you need to show is in the view columns, the whole walk opens zero documents. Only when you genuinely need the backing document (to read a field the view doesn't carry) do you call `entry.getDocument()` and pay the open cost.

## A confusing point: the collection holds document rows only

Here's a detail that has bitten plenty of people. The [`NotesViewEntryCollection`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_ViewEntryCollection.html) that `getAllEntries` returns is defined as "Represents a collection of view entries **of type document** sorted in view order." — **it holds document rows only.**

But a view's rows come in three types: document, category, total. If your view is categorized and you want to handle the category rows (the category headings) too, `getAllEntries` can't give them to you — it filters category and total out. To reach category rows, use a `ViewNavigator`, which gives you all three; then test each row with `isCategory()` / `isDocument()`. The walking and performance of ViewNavigator are in [the Java ViewNavigator piece](/domino-news/posts/java-viewnavigator/) (SSJS's `NotesViewNavigator` is created and walked the same way).

One-line rule: **for a list of document rows use `getAllEntries`; to handle category headings too, use a ViewNavigator.**

## XPages doesn't make you recycle

If you've read the Java version of this walk, you'll remember every `ViewEntry` needs `recycle()` when done, or the C-layer handles blow up. **In XPages SSJS you don't** — these objects' lifecycle is managed by the XPages request and collected when it ends. Just get the walk right.

One thing still holds, though: walking a big view is an expensive operation — don't hang it on the path that reruns on every partial refresh. Put it in an explicit event or cache the result, like any expensive back-end operation.

## What about LotusScript and Java?

The same `ViewEntry`:

- **LotusScript**: `NotesViewEntry`, with `ColumnValues`, `GetDocument`, `IsCategory` — same behavior.
- **Java**: `ViewEntry`, same API, but each entry needs a manual `recycle()` when done; the performance of walking a big view (`goto` vs `get`, CacheSize) is in [the Java ViewNavigator piece](/domino-news/posts/java-viewnavigator/).
- **What's SSJS-specific** isn't the API (the methods are shared) — it's **how you use it in XPages**: reading `getColumnValues` straight into a typeahead / JSON without opening documents, a request-managed lifecycle with no recycle, and keeping a big-view walk off the partial-refresh path.
