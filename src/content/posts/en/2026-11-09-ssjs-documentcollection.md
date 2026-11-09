---
title: "DocumentCollection in SSJS: stampAll Updates Them All, removeAll Deletes Them All"
description: "In SSJS a search, an FTSearch, or a view lookup by key hands you a NotesDocumentCollection. To do something to that pile of documents, the reflex is a getFirstDocument / getNextDocument loop; but the collection has batch operations of its own: stampAll sets one field to the same value across every document, and removeAll permanently deletes the whole batch — one line, no loop. Powerful, and removeAll especially will do exactly what you tell it, permanently. This covers getting and walking a collection in SSJS (including the Count-is-a-property-not-getCount gotcha), the stampAll / removeAll batch moves and their risks, combining collections with FTSearch and intersect/merge/subtract, and whose rights these run under."
pubDate: 2026-11-09T07:30:00+08:00
lang: en
slug: ssjs-documentcollection
tags:
  - "XPages"
  - "SSJS"
sources:
  - title: "NotesDocumentCollection (JavaScript) (walking, Count, stampAll / removeAll / FTSearch / intersect) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_DocumentCollection.html"
  - title: "NotesDatabase (JavaScript) (search / FTSearch return a NotesDocumentCollection) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Database.html"
  - title: "Global objects and functions (JavaScript) (the database global) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html"
relatedJava: []
relatedSsjs: []
coversClass: "DocumentCollection"
apiLang: "ssjs"
cover: "/covers/ssjs-documentcollection.webp"
coverStyle: "art-deco"
---

In SSJS you run `database.search("Form = 'Order' & Status = 'Pending'")`, get a pile of pending orders, and now you want to mark them all "Processed." The reflex: `getFirstDocument` / `getNextDocument`, `replaceItemValue` and `save` on each one.

That works, but [`NotesDocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_DocumentCollection.html) has a batch move of its own — **`stampAll` sets one field to the same value across the whole batch, one line, no loop, no per-document save**:

```javascript
col.stampAll("Status", "Processed");   // every doc's Status becomes Processed
```

And it has a fiercer sibling: **`removeAll` permanently deletes the whole batch at once.** Powerful — and `removeAll` especially needs care, because it deletes exactly the collection you hand it, and it's permanent. This piece covers getting and walking a collection, those two batch moves and their risks, combining collections, and whose rights they run under.

---

## Getting and walking it: Count is a property, not getCount

In SSJS, the [`database`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_wpdr_globals_r.html) global's [`search(formula)` / `FTSearch(query)`](https://help.hcl-software.com/dom_designer/14.5.1/reference/r_domino_Database.html), or `view.getAllDocumentsByKey(key)`, all return a `NotesDocumentCollection` — defined as "Represents a collection of documents from a database." Walking it is the usual shape:

```javascript
var col = database.search("Form = 'Order'");
var doc = col.getFirstDocument();
while (doc != null) {
    // process doc…
    doc = col.getNextDocument(doc);
}
```

One small trap: **for the count it's `col.Count` (a property), not `getCount()`.** The docs list `Count` as a read-only property, with no `getCount` method — writing `col.getCount()` in SSJS will fail. To jump to a position, use `getNthDocument(n)`.

## The two batch moves: stampAll and removeAll

This is where a collection earns its keep over "loop it yourself" — **no pulling each document out, no per-document save**:

- **`stampAll(itemName, value)`**: the docs say "Replaces an item's value in every document in the collection." One field across the whole collection set to one value. Marking a batch of orders processed, or stamping a timestamp — one line.
- **`removeAll`**: "Permanently deletes the collection's documents from the database." The whole batch, **gone for good**.

The risk with `removeAll` is concrete: it deletes **the collection you're holding** — and if your search formula was too broad, or the collection isn't the batch you think it is, it will quietly take the extras too, with no undo. Before you call `removeAll`, confirm the collection really is what you mean to delete with `Count` and a spot-check of a few.

## Combining collections: FTSearch to narrow, set operations

Once you have a collection, you can refine it:

- **`FTSearch(query)`**: runs a full-text search against the **existing** collection and narrows it to the matches (given a full-text index).
- **`intersect` / `merge` / `subtract`**: set operations — keep only documents also in another set (intersect), add another set in (merge), remove another set (subtract). For a "results of query A, minus query B" condition, that's cleaner than one complicated formula.

## Whose rights? stampAll and removeAll both answer to the ACL

These batch operations run in SSJS under the **current user's** credentials — `stampAll` can change, and `removeAll` can delete, only to the extent that user has the rights (author / editor / delete access) on those documents. A regular user can't `removeAll` documents they have no rights to, which is correct. Conversely, if you need higher rights for batch maintenance (clearing a batch of audit records, say), get the database from `sessionAsSigner.getDatabase(...)` and search off that — the SSJS rights model is in [whose rights open the database in XPages](/domino-news/posts/ssjs-database/).

Also, in XPages, don't run a large collection (especially a per-document loop) on the partial-refresh path — like any expensive back-end operation, put it in an event and cache where it helps. The collection's lifecycle is managed by the XPages request, so you don't recycle it by hand the way you would in standalone Java.

## What about LotusScript and Java?

The same `NotesDocumentCollection`:

- **LotusScript**: `NotesDocumentCollection`, with `StampAll` / `RemoveAll` / `Intersect`; the full LotusScript usage is in [the NotesDocumentCollection piece](/domino-news/posts/notes-document-collection/).
- **Java**: `DocumentCollection`, same method names — plus one chore: `recycle()` the collection and each document when done.
- **What's SSJS-specific** isn't the API (the methods are shared) — it's **how you use it in XPages**: batch operations run as the user, elevate via `sessionAsSigner`, keep large collections off the render path, and no manual recycle.
