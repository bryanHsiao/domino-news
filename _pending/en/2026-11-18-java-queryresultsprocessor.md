---
title: "QueryResultsProcessor in Java: Merge and Sort Results Across Databases into a View or JSON"
description: "You have document collections from three different databases, and you need them merged into one, sorted by the same field, a subtotal computed, and finally a chunk of JSON for the front end or a view to save. The hand-rolled way is to pull all three into memory, merge, and sort yourself — across databases, with any real volume, that doesn't hold up. QueryResultsProcessor (since R12) does it server-side: the docs put it as \"Aggregates, computes, sorts, and formats collections of documents across any set of Domino databases.\" You feed in multiple sources with addCollection / addDominoQuery (each under a unique name), define the output columns and sorting with addColumn, then executeToView to materialize a results view that auto-expires, or executeToJSON to get JSON directly. This covers that many-in, one-out shape, the two output modes and their traps, and the create-method name (the one the docs get wrong)."
pubDate: 2026-11-18T07:30:00+08:00
lang: en
slug: java-queryresultsprocessor
tags:
  - "Java"
sources:
  - title: "QueryResultsProcessor class (Java) (cross-database merge/sort, addColumn/executeToView, Release 12) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html"
  - title: "addCollection (QueryResultsProcessor - Java) (add a DocumentCollection/ViewEntryCollection + a unique referencename) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADDCOLLECTION_METHOD_JAVA.html"
  - title: "executeToJSON (QueryResultsProcessor - Java) (JSON output, @nid / @DbPath special keys) — HCL Domino 14.5 Designer Help (official)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXECUTETOJSON_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "QueryResultsProcessor"
apiLang: "java"
---

You have three batches of documents from three different databases — this year's orders, last year's archived orders, a department's orders on another server. You need them merged into one list, sorted by amount, a total computed, and finally a chunk of JSON for the front end, or a view people can click into.

The hand-rolled way is to `getAllDocuments()` all three into memory, merge them into one list, and write a comparator to sort. Across three databases, with any real volume, that doesn't hold up — in memory or in time.

[`QueryResultsProcessor`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html) (since R12, QRP for short) moves this to the server. The docs state its value in one line: "Aggregates, computes, sorts, and formats collections of documents across any set of Domino databases." This covers its many-in, one-out shape, the two output modes, and a create-method name that even the docs get wrong.

---

## The many-in, one-out shape

QRP works in three moves: create a processor, feed in multiple sources, define the output columns, execute.

First, the **create-method name**: the class page's Creation section says `createQueryProcessor`, but that's a doc typo — the example code and the method that actually exists is `db.createQueryResultsProcessor()`, and it's on **Database**, not session:

```java
QueryResultsProcessor qrp = db.createQueryResultsProcessor();
```

Then feed in the sources. [`addCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADDCOLLECTION_METHOD_JAVA.html) is, in the docs, "Adds a pre-created DocumentCollection or ViewEntryCollection of documents" — any collection you built by any means (FTSearch, getAllDocuments, a view's entries), each given a referencename **unique within this processor**:

```java
qrp.addCollection(thisYearOrders, "cur");
qrp.addCollection(archivedOrders, "arc");   // can come from another db
qrp.addDominoQuery(dq, "Status = 'Open'", "dql");   // or feed a DQL query directly
```

That referencename isn't just a label — it identifies which source each result row came from, and it's how `addFormula` targets a formula at one source. Then `addColumn` defines which columns come back and how they sort and categorize (the docs: "Creates a single column of values to be returned when QueryResultsProcessor is executed.").

## Two outputs: executeToView and executeToJSON

With sources and columns defined, execution goes two ways:

- **`executeToView`** — the docs: "Saves QueryResultsProcesser results to a "results view" in a database." It **materializes the merged, sorted results into a view** people can click into and other code can read. Note it's temporary: the results view **expires in 24 hours by default** (you can set a lifetime) — don't treat it as a permanent view.
- **[`executeToJSON`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXECUTETOJSON_METHOD_JAVA.html)** — returns a JSON string (`public String executeToJSON()`). Good for feeding a front end or a REST response. Results sit under the top-level key `StreamedResults`, and each row carries two special keys: `@nid` (NoteID) and `@DbPath` — with those, the front end can act back on a given row's document (which might live in another db).

## A few things that bite

- **referencename must be unique**: two sources under the same name in one processor, and later references won't line up.
- **the results view expires**: executeToView's output vanishes after 24h by default; set a lifetime if you need it around, or recompute each time.
- **cap it**: a cross-database merge over big databases can be heavy — use `setMaxEntries` / `setTimeoutSec` so a runaway query doesn't drag the server down.
- QRP, the collections you feed it, and the DominoQuery are back-end handles — `recycle()` them when done; the discipline is in [the Java recycle blow-up piece](/domino-news/posts/java-recycle-memory/).

## What about LotusScript and SSJS?

The same `QueryResultsProcessor`:

- **LotusScript**: `NotesQueryResultsProcessor`, with `AddCollection` / `AddColumn` / `ExecuteToView` / `ExecuteToJSON` — same behavior; the full usage is in [the NotesQueryResultsProcessor piece](/domino-news/posts/notes-query-results-processor/).
- **SSJS / XPages**: there is **no** direct QueryResultsProcessor — like DQL, XPages has to run QRP through a Java bean (the DQL-in-XPages approach is in [DQL in production](/domino-news/posts/dql-production/)).
- **The Java-specific part**, beyond the API, is that this server-side cross-database merge is a natural fit to wrap as a reusable Java service — many collections in, JSON out to a front end — a useful piece when Domino is the data back end.
