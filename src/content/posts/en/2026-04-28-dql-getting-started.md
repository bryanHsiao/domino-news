---
title: "Getting Started with DQL: Query Notes Documents with Familiar Syntax"
description: "Domino Query Language (DQL) lets you query Notes documents with a near-SQL syntax — no need to design a view or write @Formula. This intro covers DQL syntax, how to run it, and performance tips, with LotusScript / Java / REST API examples."
pubDate: 2026-04-28
lang: en
slug: dql-getting-started
tags:
  - "Domino"
  - "REST API"
  - "Java"
  - "LotusScript"
  - "Tutorial"
sources:
cover: "/covers/dql-getting-started.png"
  - title: "HCL Domino Query Language (DQL) — official documentation"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/conf_dql.html"
  - title: "Domino Query Language Syntax Reference"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/conf_dql_syntax.html"
  - title: "OpenNTF: DQL examples and patterns"
    url: "https://www.openntf.org/main.nsf/project.xsp?r=project/Domino%20Query%20Language%20Examples"
---

## Why DQL exists

Long-time Notes developers know two ways to retrieve documents:

1. **View + `getEntryByKey` / `getAllEntriesByKey`** — fast, but you must design the view first
2. **`@Formula` full-database search** — no view needed, but slow and awkward to combine conditions

**Domino Query Language (DQL)**, introduced in Domino V10 and stabilized through V12, is a third option: a SQL-like syntax that queries documents directly while **automatically using the design catalog and view indexes** under the hood.

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

## Enable DQL: build the design catalog

DQL works without any index (it will scan the entire NSF), but performance is poor. To let DQL use indexes, build the **design catalog** (`GQFDsgn.cat`):

```text
load updall -e
```

Or, on the server console:

```text
load design
```

After that, every view you add becomes a candidate index for DQL. To expose a specific field, add this to the view's selection formula:

```text
SELECT @IsAvailable($DQLField)
```

The view then becomes a usable index source for DQL.

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
