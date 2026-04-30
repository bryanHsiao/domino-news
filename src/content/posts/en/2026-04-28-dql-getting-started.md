---
title: "Getting Started with DQL: Query Notes Documents with Familiar Syntax"
description: "Domino Query Language (DQL) lets you query Notes documents with a near-SQL syntax — no need to design a view or write @Formula. This intro covers DQL syntax, how to run it, and performance tips, with LotusScript / Java / REST API examples."
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
cover: "/covers/dql-getting-started.png"
---

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

## Enable DQL: build the Design Catalog — skip this and DQL blows up

This section is the #1 DQL gotcha, so the punchline first: **DQL relies entirely on the per-NSF Design Catalog to resolve view names and column names (the `'viewname'.column` and `in ('view1', 'view2')` syntaxes). Without the catalog, DQL has no way to know which views exist in this NSF, what they're called, or what columns they expose.**

The classic trap: a developer adds a view called `Vtest` and tries to scope a query to it using the documented syntax:

```sql
in ('Vtest') and Form = 'Ftest'
```

You get this error:

```text
Domino Query execution error: Unexpected internal error - validation error
Error opening view name or named document set - [Vtest] does not exist or open failed
(Call hint: NSFCalls::NSFDbGetNamedObjectID, Core call #0)
```

The message reads as "the view doesn't exist", but the view is right there in Designer and opens fine. The real cause is that **this NSF's Design Catalog hasn't been built yet, or hasn't been refreshed since the design change.**

### The two server-console commands to remember

| When | Command |
|---|---|
| First-time DQL enablement (build the Design Catalog for this NSF) | `load updall <db-path> -e` |
| After any design change (added/modified/removed view, renamed columns, etc.) | `load updall <db-path> -d` |

`<db-path>` is relative to `Domino\Data`, e.g. `apps\crm.nsf`.

### The big warning: the Design Catalog does NOT auto-update

This is the part that bites everyone. The scenario:

1. You ran `load updall apps\crm.nsf -e` once and DQL works fine
2. A developer adds a new view named `Vtest` in Designer
3. You run `in ('Vtest')` → boom, `does not exist or open failed`
4. You spend an hour debugging before remembering: you never ran `load updall apps\crm.nsf -d`

For production, consider scheduling `-d` as part of a nightly maintenance job. For development, build the muscle memory of running it manually after every design change.

### Version note: where the catalog lives

- **Domino 10.x**: the Design Catalog is a standalone file `GQFdsgn.cat`, sitting next to the NSF in the data directory
- **Domino 11+**: the Design Catalog moved inside the NSF as hidden design elements (not visible in Designer by default). No `.cat` files appear at the filesystem level anymore, but the `load updall -e` / `-d` workflow is identical

After upgrading an older NSF to 11+, you still need to run `load updall <db-path> -e` once to populate the catalog inside the NSF.

### Advanced: explicitly mark fields as DQL-usable

If you have specific fields you want DQL to use as query conditions through a view index, add this to the view's selection formula:

```text
SELECT @IsAvailable($DQLField)
```

That view then becomes a candidate index source for DQL — the query planner will prefer it over a full NSF scan.

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
| View as base | `'Customers'.Country = 'Taiwan'` (view name in single quotes) |

## Performance tips

1. **Use a view as the base** — `'ViewName'.Field = ...` is faster than a bare field
2. **Avoid leading wildcards** — `like '%abc'` cannot use an index
3. **Turn on `Explain`** — `dq.Explain = True` shows the actual execution path
4. **First-hits mode** — when you only need a few results, use `Execute(query, "", 0, 10)` to cap the count
5. **Parallelize big scans** — set `QUERY_MAX_NUMBER_THREADS=4` in `notes.ini` to parallelize NSF scans

## Common errors

- **"No design catalog found"** — run `load updall -e` to build the catalog
- **"Field is not selectable in any view"** — DQL has no matching view and falls back to a full scan; add a view or mark the field with `$DQLField`
- **Case sensitivity** — DQL is case-sensitive by default; normalize to lower-case at write time if you need case-insensitive matching

## Going further

DQL also supports substitution variables, joins via view links, and aggregate functions. Pair this intro with the official syntax reference for the full grammar.
