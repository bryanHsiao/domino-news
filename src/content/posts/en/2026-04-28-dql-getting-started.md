---
title: "Getting Started with DQL: Query Notes Documents with SQL-Style Syntax"
description: "Domino Query Language (DQL) gives you a near-SQL syntax for querying Notes documents directly, without designing a new view for every query shape. This is Part 1 of the 'DQL Trilogy': DQL's design rationale, writing your first query, calling DQL from LotusScript / Java / REST API, and a syntax cheat sheet. Query-writing pitfalls are in Part 2; shipping to production (catalog maintenance and permissions) is in Part 3."
pubDate: 2026-04-28T08:30:00+08:00
lang: en
slug: dql-getting-started
tags:
  - "Tutorial"
  - "DQL"
  - "LotusScript"
  - "Domino REST API"
sources:
  - title: "Domino Query Language overview — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_overview.html"
  - title: "DQL syntax reference — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_syntax.html"
  - title: "Examples of simple DQL queries — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_simple_examples.html"
  - title: "DQL Explorer — OpenNTF community project"
    url: "https://www.openntf.org/main.nsf/project.xsp?r=project/DQL+Explorer"
---

> 📚 **The "DQL Trilogy" series**
> - **Part 1**: DQL Getting Started (you are here)
> - **Part 2**: [DQL Pitfalls: 6 Query-Writing Details the Official Docs Don't Spell Out](/domino-news/en/posts/dql-pitfalls)
> - **Part 3**: [DQL Production-Ready: Catalog Maintenance, Permissions, and sessionAsSigner](/domino-news/en/posts/dql-production)

## Why DQL exists

Notes developers traditionally rely on three ways to retrieve documents:

1. **View lookups** (`NotesView.GetDocumentByKey`, `GetAllDocumentsByKey`,
   `GetAllEntriesByKey`) — fastest and most intuitive: design a view with a
   sorted key column, then look up by key. The cost is design bloat — almost
   every query shape needs its own view.
2. **`NotesDatabase.Search`** — selects documents with an `@Formula`
   expression scanned across the whole NSF. No view required, but every call
   walks every document; fine for one-off admin tasks, painful for hot paths.
3. **`NotesDatabase.FTSearch`** — uses the full-text index, supports word
   stems and boolean keywords. Great for "find documents that mention these
   words", but it needs an FT index, and structured-field queries (numeric
   ranges, complex boolean) are weaker than view-based lookups.

**Domino Query Language (DQL)**, introduced in V10 and stabilized through V12,
is the **fourth option**: a near-SQL syntax that queries documents directly
while **automatically using the design catalog and existing view indexes**,
falling back to a full scan when no index can answer the query. The advantage
is that you don't need a dedicated view per query shape, conditions compose
naturally, and the same query string runs from LotusScript, Java, and the
Domino REST API.

### The hard truth: DQL's "familiar syntax" is only skin deep

Developers picking up DQL often get misled by the "near-SQL syntax" pitch and assume it'll be a smooth ride coming from SQL or the traditional Notes API. **It isn't.** DQL looks like SQL on the surface, but under the hood is the Notes engine with its own set of details to watch for:

- **Query-writing traps**: view selection silently scoping results, `'view'.column` referring to the column's programmatic name (not a doc field), whitespace required around operators, backslash escaping in view names, `@formula` being a separate parser, string-stored dates needing `@TextToTime` — all covered in [Part 2 Pitfalls](/domino-news/en/posts/dql-pitfalls)
- **Production traps**: how the Design Catalog is maintained, why regular users hit permission errors, the `sessionAsSigner` pattern — all covered in [Part 3 Production-Ready](/domino-news/en/posts/dql-production)

This Part 1 covers the basics: what DQL is, how to write a first query, how to call it from each language, and a syntax cheat sheet. After this article you can start using DQL; before shipping to production, **make sure to read Parts 2 and 3 as well**.

## A first DQL query

The simplest DQL expression looks like this:

```sql
Form = 'Customer' and Country = 'Taiwan'
```

Three things to notice:
- Field names are **unquoted**
- String values use **single quotes**
- Operators include `=`, `<`, `<=`, `>`, `>=`, `in`, `contains`, `like`

More examples:

```sql
Form = 'Order' and OrderDate >= @dt('2026-01-01') and Total > 10000
```

```sql
Form in ('Invoice', 'CreditNote') and Status = 'Open'
```

```sql
Subject contains 'Domino' and Author like 'Bryan%'
```

> 💡 **Queries that reference a view name require a Design Catalog first.** How to maintain the catalog automatically and handle permissions is covered in [Part 3 Production-Ready](/domino-news/en/posts/dql-production). Bare-field queries (no view reference) don't need the catalog.

## Calling DQL from LotusScript

In LotusScript, DQL is exposed via the `NotesDominoQuery` object:

```vb
Sub QueryCustomers
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.GetDatabase("", "crm.nsf")

  Dim dq As NotesDominoQuery
  Set dq = db.CreateDominoQuery()
  dq.UseViewRefreshing = False  ' fast, but may miss just-saved docs

  Dim result As NotesDocumentCollection
  Set result = dq.Execute("Form = 'Customer' and Country = 'Taiwan'")

  Print "Found " & result.Count & " documents"

  Dim doc As NotesDocument
  Set doc = result.GetFirstDocument()
  Do While Not doc Is Nothing
    Print doc.GetItemValue("CustomerName")(0)
    Set doc = result.GetNextDocument(doc)
  Loop
End Sub
```

To inspect which index DQL chose and how long each step took, enable `Explain`:

```vb
dq.Explain = True
Print dq.ExplainResult  ' prints the query plan and timings
```

## Calling DQL from Java

The Java API has the same shape:

```java
import lotus.domino.*;

Session session = NotesFactory.createSession();
Database db = session.getDatabase("", "crm.nsf");

DominoQuery dq = db.createDominoQuery();
dq.setExplain(true);

DocumentCollection result = dq.execute(
    "Form = 'Order' and OrderDate >= @dt('2026-01-01')"
);

System.out.println("Hits: " + result.getCount());
System.out.println(dq.getExplainResult());

Document doc = result.getFirstDocument();
while (doc != null) {
    System.out.println(doc.getItemValueString("OrderNo"));
    Document next = result.getNextDocument(doc);
    doc.recycle();
    doc = next;
}
```

## Calling DQL from the Domino REST API

The Domino REST API (DRAPI, formerly Project Keep) exposes a `/query` endpoint:

```http
POST /api/v1/lists/dql HTTP/1.1
Host: domino.example.com
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "query": "Form = 'Customer' and Country = 'Taiwan'",
  "max": 50
}
```

Response:

```json
{
  "items": [
    {
      "@unid": "ABCD1234...",
      "CustomerName": "Acme Co.",
      "Country": "Taiwan"
    }
  ],
  "count": 1
}
```

## Quick syntax reference

| Use case | DQL |
|---|---|
| Equality | `Form = 'Customer'` |
| Range | `Total >= 1000 and Total < 5000` |
| Multi-value | `Status in ('Open', 'Pending')` |
| Substring | `Subject contains 'urgent'` |
| Wildcard | `Author like 'B%'` |
| Date | `Created >= @dt('2026-01-01')` |
| View as base — read column directly | `'Customers'.Country = 'Taiwan'` ([details and traps in Part 2](/domino-news/en/posts/dql-pitfalls)) |
| View as base — scope query | `in ('Customers') and Country = 'Taiwan'` |
| Embed Formula Language | `@formula('@Year(orderDate) = 2026')` ([syntax and parser context in Part 2](/domino-news/en/posts/dql-pitfalls)) |

## Performance tips

1. **Use a view as the base** — `'ViewName'.Field = ...` is faster than a bare field ([watch for view-selection scoping](/domino-news/en/posts/dql-pitfalls))
2. **Avoid leading wildcards** — `like '%abc'` cannot use an index
3. **Turn on `Explain`** — `dq.Explain = True` shows the actual execution path
4. **First-hits mode** — when you only need a few results, use `Execute(query, "", 0, 10)` to cap the count
5. **Parallelize big scans** — set `QUERY_MAX_NUMBER_THREADS=4` in `notes.ini` to parallelize NSF scans

## Common errors

- **"No design catalog found"** — run `load updall -e` or trigger `setRebuildDesignCatalog(true)` ([details in Part 3](/domino-news/en/posts/dql-production))
- **"needs to be cataloged via updall -e"** — NSF never catalogued ([Refresh vs Rebuild in Part 3](/domino-news/en/posts/dql-production))
- **"You don't have permission"** — catalog ops require Designer ACL ([sessionAsSigner solution in Part 3](/domino-news/en/posts/dql-production))
- **"must have at least one operator"** — missing whitespace around comparison operator ([details in Part 2](/domino-news/en/posts/dql-pitfalls))
- **"incorrect column name"** — wrong column programmatic name ([details in Part 2](/domino-news/en/posts/dql-pitfalls))

---

> 📚 **Next up**
>
> **[Part 2: DQL Pitfalls — 6 Query-Writing Details the Official Docs Don't Spell Out](/domino-news/en/posts/dql-pitfalls)**
>
> After writing your first query, you'll quickly run into "unexpected results" or "mystery errors." Part 2 walks through each trap with the verbatim error message and a working fix.
>
> **[Part 3: DQL Production-Ready — Catalog Maintenance, Permissions, and sessionAsSigner](/domino-news/en/posts/dql-production)**
>
> The last mile before shipping: automatic Design Catalog maintenance, the sessionAsSigner permission pattern, and a production-ready Java helper class.
