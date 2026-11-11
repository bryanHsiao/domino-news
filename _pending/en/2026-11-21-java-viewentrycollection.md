---
title: "ViewEntryCollection in Java: stampAll to Bulk-Edit, FTSearch to Narrow, Set Ops to Combine"
description: "You get a batch of view-ordered document entries with view.getAllEntries() or getAllEntriesByKey(key), and now you need to do something to them: set one field to the same value across all of them, narrow the range with a full-text search, or subtract 'query B's results' from 'query A's'. The reflex is a loop — getDocument and save on each. But ViewEntryCollection has batch and set operations of its own: stampAll sets one field across the whole batch at once, FTSearch narrows the collection in place to the matches, and intersect/merge/subtract do set operations. This covers those three, getNthEntry by position, and the two edges of walking: turn the view's autoupdate off (or you hit 'Entry not found in index') and recycle each entry."
pubDate: 2026-11-21T07:30:00+08:00
lang: en
slug: java-viewentrycollection
tags:
  - "Java"
sources:
  - title: "ViewEntryCollection class (Java) (stampAll/FTSearch/intersect/merge/subtract, Count, getNthEntry) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRYCOLLECTION_CLASS_JAVA.html"
  - title: "View class (Java) (getAllEntries / getAllEntriesByKey return the collection) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS_JAVA.html"
  - title: "ViewEntry class (Java) (the column values and type of each entry in the collection) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "ViewEntryCollection"
apiLang: "java"
---

You get a batch of view-ordered document entries with `view.getAllEntries()` or `getAllEntriesByKey(key)`, and now you need to do something to them: set one field to the same value across all of them, narrow the range with a full-text search, or subtract "query B's results" from "query A's".

The reflex is a loop — `getDocument()`, `replaceItemValue`, `save` on each. That works, but [`ViewEntryCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRYCOLLECTION_CLASS_JAVA.html) has batch and set operations of its own, and in many cases one line is enough. The docs define it as "Represents a collection of view entries of type document sorted in view order." — note "of type document": it holds document rows only, no category or total rows.

This covers stampAll, FTSearch, and the set operations, plus the two edges of walking.

---

## stampAll: set one field across the whole batch

To set one field on all the documents behind a batch of entries to the same value, no loop-and-save needed — `stampAll` is one line. The docs: "Replaces the value of a specified item in the documents of all the entries in a view entry collection.":

```java
view.setAutoUpdate(false);
ViewEntryCollection vec = view.getAllEntriesByKey("Pending");
vec.stampAll("Status", "Processed");   // every doc's Status set to Processed
```

It's the same move as `NotesDocumentCollection`'s stampAll, just sourced from a view's entries. To restamp a batch selected by key with a new status or a processed-timestamp, this is far cleaner than a loop.

## FTSearch: narrow the collection in place

Once you have a collection, you can shrink it with a full-text search. `FTSearch` is, in the docs, "Conducts a full-text search on all entries in a view entry collection and filters the collection." — it's **in place**: after the search, the collection holds only the entries matching the query (given a full-text index). The query string stays in the `Query` property.

```java
ViewEntryCollection vec = view.getAllEntries();
vec.FTSearch("urgent");     // vec now holds only entries whose text contains urgent
```

## Set operations: combine two queries

This is where ViewEntryCollection is handier than DocumentCollection — `intersect` / `merge` / `subtract` let you combine two result sets:

- `intersect` — keep only entries also in the other set.
- `merge` — add the other set in.
- `subtract` — remove the other set.

For a "this year's orders, minus the already-archived" condition, select the two sets, then `a.subtract(b)` — cleaner than one complex key or formula. To take the entry at a position, use `getNthEntry(n)` (in view order); for the size, `Count` (a property, not a method). How to read each entry's column values (without opening the document) is in [ViewEntry](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_JAVA.html).

## Two edges: autoupdate and recycle

Before walking or batch-operating a collection, **set the [`view`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS_JAVA.html)'s `setAutoUpdate(false)`**. The docs warn that auto-update degrades performance and can invalidate the entries you're holding, raising "Entry not found in index" — which you hit when you're processing while someone else edits the view. Call `refresh` yourself when you want fresh data.

And in Java, every `ViewEntry` you walk out of the collection needs `recycle()` when done, or a big collection piles up C-layer handles until they exhaust; the discipline is in [the Java recycle blow-up piece](/domino-news/posts/java-recycle-memory/). To lazily walk a huge view (with category rows, needing performance knobs), that's `ViewNavigator`'s job — see [the Java ViewNavigator piece](/domino-news/posts/java-viewnavigator/).

## What about LotusScript and SSJS?

The same `ViewEntryCollection`:

- **LotusScript**: `NotesViewEntryCollection`, with `StampAll` / `FTSearch` / `Intersect` / `GetNthEntry` — same behavior, no recycle; see [the NotesViewEntry piece](/domino-news/posts/notes-view-entry/).
- **SSJS / XPages**: `NotesViewEntryCollection`, the same stampAll / set operations; request-managed lifecycle, no recycle. The DocumentCollection version of these batch ops is in [the SSJS DocumentCollection piece](/domino-news/posts/ssjs-documentcollection/).
- **The Java-specific part** isn't the API (the methods are shared) — it's the memory discipline: `stampAll` and the set operations are one line, but switch to a per-entry loop and each entry needs its own recycle — strong typing won't remind you of that.
