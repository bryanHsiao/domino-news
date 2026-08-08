---
title: "Running DQL from Java: DominoQuery and QueryResultsProcessor"
description: "The site's DQL trilogy teaches the query language, but it runs DQL from LotusScript or the console. In Java, DQL goes through two classes: DominoQuery compiles, tunes, and runs; QueryResultsProcessor sorts, aggregates, joins across databases, and outputs JSON. And a common first-time trip-up: you get both from the Database, not the Session. A field report on how DQL actually runs from Java."
pubDate: 2026-08-09T07:30:00+08:00
lang: en
slug: java-dql-dominoquery
tags:
  - "Java"
  - "DQL"
sources:
  - title: "DominoQuery class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOMINOQUERY_CLASS_JAVA.html"
  - title: "QueryResultsProcessor class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html"
  - title: "recycle (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/java-dql-dominoquery.webp"
coverStyle: "oil-chiaroscuro"
---

The site's [DQL trilogy](/domino-news/en/posts/dql-getting-started) covers the query language in depth — the syntax, the pitfalls, the production tuning. But all three run DQL from LotusScript or the `domino` console. Move to Java and the entry point looks different, and it hides a detail a lot of people look for in the wrong place the first time.

In Java, DQL isn't one method — it's **two classes** dividing the work. `DominoQuery` compiles, tunes, and runs a query; `QueryResultsProcessor` takes its results and does the sorting, aggregation, cross-database joins, and JSON output. The query string itself is exactly what you learned in the trilogy; what changes is how you run it from Java and how you collect the results.

This piece is about that Java side.

---

## TL;DR

- **DQL in Java goes through two classes:** `DominoQuery` (compile / tune / run) and `QueryResultsProcessor` (sort / aggregate / join / output).
- **You get both from the `Database`, not the `Session`** — `db.createDominoQuery()`, `db.createQueryResultsProcessor()`. This is the most common first-time wrong turn.
- **`DominoQuery`:** the docs call it "a Java class to compile, tune, and run Domino Query Language (DQL) queries." `parse()` validates syntax; `execute()` runs it and returns a `DocumentCollection`.
- **Tuning is via properties:** `MaxScanDocs` (default 500,000), `MaxScanEntries` (200,000), `TimeoutSecs` (300s), `NoViews`… these are the [production trilogy piece's](/domino-news/en/posts/dql-production) "don't let one query scan the server to death," as Java knobs.
- **`execute()` returns a `DocumentCollection`,** so you're back to the [recycle() piece's](/domino-news/en/posts/java-recycle-memory) loop discipline: process one, recycle one.
- **`QueryResultsProcessor`** is what gives you the SQL-style "sort + aggregate + join + output" — `DominoQuery` only answers "which documents match."

---

## DominoQuery: get it from the Database

The first step to running DQL in Java is asking for a [`DominoQuery`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOMINOQUERY_CLASS_JAVA.html) instance — the docs sum up its job in one line:

> A Java class to compile, tune, and run Domino Query Language (DQL) queries.

The key detail: you get it from the **`Database`**, not the `Session`. `db.createDominoQuery()`. People coming from other APIs instinctively go looking on `session` and don't find it, because DQL runs against a specific database, so the entry point naturally hangs off `Database`.

Once you have it, two main moves:

- **`parse()`** validates the DQL syntax. A syntax error stops here, before any data is scanned.
- **`execute()`** actually runs it and returns a `DocumentCollection` of the matching documents.

## Tuning: don't let one query scan the server to death

The refrain from the [production trilogy piece](/domino-news/en/posts/dql-production) — one un-tuned DQL query can scan a server to its knees — is a set of `DominoQuery` properties in Java, each with a default:

| Property | Default | What it does |
|---|---|---|
| `MaxScanDocs` | 500,000 | cap on documents scanned; abort past it |
| `MaxScanEntries` | 200,000 | cap on view entries scanned |
| `TimeoutSecs` | 300 | query timeout in seconds |
| `NoViews` | false | forbid DQL from using view indexes (force a document scan) |

For batch DQL in production these are your safety net — better to have a runaway query hit a ceiling and abort than to have it drag the whole server down with it.

## execute() returns a DocumentCollection — back to recycle discipline

`execute()` hands you a [`DocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html), and from there it's the standard Java loop — the two-variable pattern from the [recycle() piece](/domino-news/en/posts/java-recycle-memory): hold the next, process the current, recycle the current, advance. A DQL query often returns tens of thousands of documents; skip the recycle here and you get exactly the back-end handle leak that piece describes.

```java
Database db = session.getDatabase(null, "sales.nsf");
DominoQuery dq = db.createDominoQuery();
dq.setMaxScanDocs(100000);                    // tuning: set a sane ceiling
DocumentCollection col = dq.execute(
    "Form = 'Order' and OrderDate >= @dt('2026-01-01')");

Document doc = col.getFirstDocument();
Document next = null;
while (doc != null) {
    next = col.getNextDocument(doc);
    // ...process the current doc...
    doc.recycle();                            // recycle each; don't let the result set fill memory
    doc = next;
}
dq.recycle();
```

## QueryResultsProcessor: sort, aggregate, join across databases

`DominoQuery` answers one thing: which documents match. It doesn't sort, aggregate, or reach across databases. That's the job of [`QueryResultsProcessor`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html) (often QRP) — the docs define it as:

> Aggregates, computes, sorts, and formats collections of documents across any set of Domino databases.

You get it from the **`Database`** too (`db.createQueryResultsProcessor()`), then:

- `addDominoQuery()` / `addCollection()`: feed in one or more `DominoQuery` objects or `DocumentCollection`s — this is how you **join across databases and result sets**.
- `addColumn()`: choose which fields to return and how to sort.
- `addFormula()`: use a formula to normalize fields from different databases and designs into one output column.
- `executeToJSON()`: output JSON (handy for a front end or API); `executeToView()`: materialize the results as a view.

So `DominoQuery` is the *filter* and `QueryResultsProcessor` is the *sort + combine + emit*. To "merge orders from three databases, sort by amount, output JSON," it's `addDominoQuery` three times + `addColumn` + `executeToJSON`. It has its own `setTimeoutSec()` / `setMaxEntries()` guards against running away, too.

## What about LotusScript and SSJS?

The DQL language itself is identical across languages — the syntax you learn in the [trilogy](/domino-news/en/posts/dql-getting-started) is the same string in Java, LotusScript, or SSJS. Only "how you run it" differs:

| Language | How you run DQL |
|---|---|
| **LotusScript** | `NotesDominoQuery` + [`NotesQueryResultsProcessor`](/domino-news/en/posts/notes-query-results-processor); the runtime cleans up objects for you |
| **SSJS / XPages** | the same classes, container-managed memory; in practice DQL more often runs from Java or LS |
| **Java (`lotus.domino`)** | `DominoQuery` + `QueryResultsProcessor`, both from the `Database`, and you recycle the result `DocumentCollection` yourself |

Coming from LotusScript, the DQL logic in Java is the same, with two extra things to remember: the entry point is on `Database` (not `Session`), and recycling the result set is your job. For how these classes connect, see the [class map](/domino-news/en/map).
