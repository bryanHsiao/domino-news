---
title: "Looping a DocumentCollection in Java: Get the Next One First, Then recycle This One"
description: "In LotusScript you loop a DocumentCollection with Set doc = coll.GetNextDocument(doc) and never think about memory. In Java the same loop over tens of thousands of documents exhausts the agent's memory — unless you recycle each one inside the loop, in an order you can't get wrong: fetch the next document using the current one, then recycle the current one. This piece covers the correct Java iteration idiom: DocumentCollection's getFirstDocument/getNextDocument, the isValid deletion-stub check, when to switch to the leaner ViewNavigator, and the recycle ordering LotusScript never makes you think about."
pubDate: 2026-08-16T07:30:00+08:00
lang: en
slug: java-collection-iteration
tags:
  - "Java"
sources:
  - title: "DocumentCollection class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS_JAVA.html"
  - title: "ViewNavigator class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html"
  - title: "Base.recycle (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/java-collection-iteration.webp"
coverStyle: "low-poly-3d"
---

Looping a document collection in LotusScript probably looks like this: `Set doc = coll.GetFirstDocument()`, then `Set doc = coll.GetNextDocument(doc)` to the end, without a single thought about memory. The same logic in the Java `lotus.domino` API looks almost identical — but if the collection holds tens of thousands of documents, that loop exhausts the agent's memory.

The difference is that in Java every `Document` is a back-end object you have to collect by hand. For the loop to run steady, you [`recycle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html) each one inside it — and **the order matters**. This piece covers the correct Java iteration idiom, and when to switch to the leaner `ViewNavigator`.

---

## TL;DR

- **Loop a [`DocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS_JAVA.html) with `getFirstDocument` + `getNextDocument`:** `getNextDocument(doc)` takes the current document and returns the next; the collection maintains a current pointer.
- **Order is the crux:** before you `recycle` the current document, use it to fetch the next. Recycle first, then call `getNextDocument(doc)`, and you're asking a dead object for the next one.
- **Filter deletion stubs:** use `isValid` to tell a real document (true) from a deletion stub (false).
- **For big, read-only, view-based work, switch to `ViewNavigator`:** the docs say a "goto" method is favored over a "get" method because goto doesn't create a `ViewEntry` object; on remote calls you can set the cache size to hit the server less.
- **LotusScript handles none of this:** its memory is automatic, so this recycle ordering is a pure-Java burden.

---

## DocumentCollection: the correct loop

Java's `DocumentCollection` gives you `getFirstDocument()` (the first, no parameters) and `getNextDocument`. `getNextDocument` comes in two forms: the no-arg `getNextDocument()` walks forward using the collection's internal current pointer, and `getNextDocument(Document doc)` returns "the one after the document you name."

In a loop that needs to recycle, the parameterized form is the safe one, because the correct shape is this:

```java
Document doc = coll.getFirstDocument();
while (doc != null) {
    Document next = coll.getNextDocument(doc);  // use the current one to get the next
    // ... process doc ...
    doc.recycle();                              // then recycle the current one
    doc = next;
}
```

The crux is **fetch the next one before you recycle the current one**. Reverse the order — `doc.recycle()` then `coll.getNextDocument(doc)` — and you're handing an already-recycled object, its handle dead, back to ask for the next: at best a wrong result, at worst an exception. This ordering is the trap a LotusScript developer most easily misses: in LS you reuse one `doc` variable and memory collects itself, so there's no "order" to get wrong.

What happens if you don't recycle? Every `Document` in the collection is a back-end object with a handle behind it (exactly the trap the site's [recycle() piece](/domino-news/en/posts/java-recycle-memory) describes). Loop ten thousand, leave ten thousand uncollected, and memory climbs until it falls over.

## Deletion stubs: isValid

There's one more detail worth raising here, one LotusScript shares: a collection can hold **deletion stubs** — documents already deleted, leaving only a husk. The docs suggest filtering them with `isValid`: a real document returns true, a deletion stub returns false. An `if (doc.isValid())` before you process avoids doing pointless work on a husk.

## When to switch to ViewNavigator

If what you're iterating is a **view**, and you only need to read (not the full `Document` for each row), a [`ViewNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html) is usually far leaner than pulling documents one by one. It "provides access to all or a subset of the entries in a view," reaching categories, totals, and view-specific facts (like how many siblings an entry has) without materializing every document.

Two lines from the docs are worth remembering:

> A goto method is favored over a get method for navigation-only purposes because a goto method does not create a ViewEntry object.

So if you only need to move position and not the entry itself, a `goto`-style method beats `getNext` — because goto won't mint a `ViewEntry` for you (one more back-end object to collect). And for remote (DIIOP) work:

> You can set the cache size and should set it to try to minimize server access.

`ViewNavigator` caches entries, and sizing that cache well saves round trips to the server. The docs also advise setting `IsAutoUpdate` to false — keeping the view from auto-refreshing mid-iteration — to avoid degraded performance and invalidated entries.

Of course, the `ViewEntry` objects a `ViewNavigator` yields are back-end objects too, collected inside the loop with the same ordering logic as the `Document` loop above.

## A complete example

Loop a collection, filter deletion stubs, process and collect each:

```java
Document doc = coll.getFirstDocument();
while (doc != null) {
    Document next = coll.getNextDocument(doc);   // get the next first
    if (doc.isValid()) {                         // skip deletion stubs
        // ... process the document ...
    }
    doc.recycle();                               // then collect the current one
    doc = next;
}
```

That `next` temporary isn't optional — it's what lets you safely "fetch first, collect after."

## What about LotusScript and SSJS?

- **LotusScript:** `coll.GetFirstDocument` / `coll.GetNextDocument(doc)` loops almost identically, but you reuse one `doc` variable and memory collects itself — no recycle, and none of the "fetch before collect" ordering. This is where LS is easier than Java for batch work.
- **SSJS / XPages:** the same `lotus.domino` underneath, so the loop shape and recycle burden match Java exactly; in XPages, iterating a big collection especially needs collecting, since the memory you're spending is the server's. For working with data structures directly on the Java side, see the site's [java.util.Vector in XPages](/domino-news/en/posts/ssjs-vector-multivalue) piece.
