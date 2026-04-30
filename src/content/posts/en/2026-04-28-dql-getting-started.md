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
  - title: "NotesDominoQuery class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOMINOQUERY_CLASS.html"
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

### The pragmatic fix: refresh the catalog from code (recommended)

In real deployments, **leaning on an admin to remember `load updall -d` is rarely workable**: there are too many NSFs, deploys are frequent, and the developer pushing the design change usually doesn't have server-console access. Pushing catalog sync onto the admin team is just burying the landmine in the handoff.

`NotesDominoQuery` exposes a property that lets the app side trigger catalog sync itself:

```vb
Private gDqlBootstrapped As Boolean    ' module-level

Function RunDql(db As NotesDatabase, query As String) As NotesDocumentCollection
    Dim dq As NotesDominoQuery
    Set dq = db.CreateDominoQuery()

    ' First DQL call in this process: sync the catalog once
    ' (auto-creates the catalog if missing; incremental refresh otherwise)
    If Not gDqlBootstrapped Then
        dq.RefreshDesignCatalog = True
        gDqlBootstrapped = True
    End If

    Set RunDql = dq.Execute(query)
End Function
```

The line that does the work is `dq.RefreshDesignCatalog = True` — set it to `True` and the next `Execute` or `Explain` syncs the catalog first (equivalent to `load updall -d`). **For an NSF that has never been catalogued, the first call auto-bootstraps the catalog**, so this single code path covers both "brand-new NSF" and "design just changed" — no try-catch fallback needed.

> ⚠️ **Don't leave the property on for every query.** Every `True` adds a catalog-sync round-trip before the next `Execute`, which eats the DQL speed advantage. The module-level flag ensures each process pays the cost exactly once.
>
> Extra insurance: if you have a CI/CD pipeline, fire one warmup query with `RefreshDesignCatalog = True` right after deploying a design change. The sync cost moves into the deploy step and live requests pay nothing.

#### `RebuildDesignCatalog` vs `RefreshDesignCatalog`

`NotesDominoQuery` also has a `RebuildDesignCatalog` property that maps to `load updall -e` — a **full teardown and rebuild**, much more expensive than Refresh. App code almost never needs it. Keep it for these maintenance scenarios:

- Suspected catalog corruption (weird query results, inconsistencies)
- After upgrading from 10.x to 11+, to migrate the catalog from file to in-NSF storage
- Scheduled maintenance (e.g. weekly full rebuild as a defensive habit)

Default to Refresh; reach for Rebuild only when you deliberately want a clean slate.

#### Sibling properties

Two more "sync before next query" properties live on the same object: `RefreshFullText` (refreshes the FT index before the query) and `RefreshViews` (refreshes any view the query will touch). Same `True` → next-`Execute`-syncs pattern.

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
| View as base — read column directly¹ | `'Customers'.Country = 'Taiwan'` |
| View as base — scope query | `in ('Customers') and Country = 'Taiwan'` |

¹ **Important pitfall**: `'view'.column` has a silent-filter risk — **read the next section in full before using this syntax**.

## Pitfall: the silent filter in `'view'.column` (must read)

`'view'.column = value` looks like "use the view's column index to find docs", but Domino 12 testing confirms — **the view's selection formula is silently merged in as an additional filter on the result. No error is raised, but documents quietly disappear from the result.**

This is a silent data-loss bug: the developer gets no error, the count looks plausible, the problem stays buried until a customer reports "we're missing data."

### What we tested

A view called `Vtest` with this selection (very common Notes-style, **not** `Select @All`):

```text
SELECT Form="Ftest" & deleteFlag !="1"
```

Three documents in the NSF:

| Doc | Fields | In the view? |
|---|---|---|
| A | `Form="Ftest"`, `deleteFlag=""` | ✅ in view |
| B | `Form="Ftest"`, `deleteFlag="1"` | ❌ excluded by selection |
| C | `Form="Other"` | ❌ excluded by selection |

Two queries:

| Query | What it should return | Actual count | Lost doc |
|---|---|---|---|
| `'Vtest'.Form = 'Ftest'` | A + B = **2** | **1** | Doc B silently dropped |
| `'Vtest'.Form = 'Other'` | C = **1** | **0** | Doc C silently dropped |

**No error, no warning.** Docs B and C are sitting in the NSF perfectly fine; DQL just pretends not to see them.

### Why this happens

Internally `'view'.column` means "**filter to docs that satisfy the view's selection, then look up `value` in the column index within that scope**". So the view's selection becomes part of the query — on top of whatever conditions you wrote, the view's selection sneaks in as an extra filter.

The HCL [View column requirements](https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_view_column.html) doc requires `Select @All` for exactly this reason: **only `Select @All` guarantees the view spans the whole DB, which is the only way the column index has clean semantics.**

### Three defenses, ranked

1. **Switch to `in('viewname')` syntax** (recommended, zero design changes)

   ```sql
   in ('Vtest') and Form = 'Ftest'
   ```

   This form **isn't affected by view selection** — the `Form` condition is evaluated by DQL on each candidate doc. The cost is the planner may fall back to an NSF scan, but the result is always correct.

2. **Build dedicated DQL index views** (one-time engineering, ideal long term)

   Create **separate index views for DQL** (naming convention: `dql` prefix or a hidden `($DQL)` category), distinct from the views your UI uses:
   - selection: `Select @All`
   - put the columns you query on
   - sort order configured

   `'dqlVtest'.Form = 'Ftest'` is then both fast and semantically correct.

3. **Bare-field query** (let DQL pick an index)

   ```sql
   Form = 'Ftest'
   ```

   The planner will look for a view with a collated `Form` column; failing that, it scans the NSF. No silent-filter risk; perf sits between options 1 and 2.

### Sidebar: column collation is a separate rule

Beyond the `Select @All` requirement, the referenced column must be **collated** (either condition counts):
- View's leftmost column has "Sort order: Ascending" checked
- The column itself has "Click on column header to sort: Ascending" checked

Unlike `Select @All`, this rule IS enforced — DQL errors out if the column isn't collated, no silent filter.

## Performance tips

1. **Use a view as the base** — `'ViewName'.Field = ...` is faster than a bare field, **provided the view uses `Select @All` and the column is collated**, otherwise you're exposed to the silent-filter pitfall (see above). If the view design doesn't satisfy that, fall back to `in ('ViewName') and Field = ...` to at least scope the scan
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
