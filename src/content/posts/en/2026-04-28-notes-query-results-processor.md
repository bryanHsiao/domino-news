---
title: "Getting Started with NotesQueryResultsProcessor: Life After DQL"
description: "NQRP is a LotusScript class added in Domino V12 that lets you re-sort, categorise, project, and serialise the results of a DQL query (or any NotesDocumentCollection) — straight to JSON or to a temporary view. Walks through the create flow, every method signature, the official examples, and the safety knobs."
pubDate: 2026-04-28T17:25:00+08:00
lang: en
slug: notes-query-results-processor
tags:
  - "Tutorial"
  - "LotusScript"
  - "DQL"
  - "Performance"
sources:
  - title: "NotesQueryResultsProcessor (LotusScript) — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESQUERYRESULTSPROCESSOR_CLASS.html"
  - title: "AddColumn method — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_ADDCOLUMN_METHOD.html"
  - title: "ExecuteToView method — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXECUTETOVIEW_METHOD.html"
  - title: "ExecuteToJSON method — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_EXECUTETOJSON_METHOD.html"
  - title: "NotesJSONNavigator class — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "QueryResultsProcessor (Java) — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html"
cover: "/covers/notes-query-results-processor.png"
---

## Why NQRP exists

[DQL](/domino-news/en/posts/dql-getting-started) gives you a SQL-like syntax to find documents, but it returns a plain `NotesDocumentCollection` — there is no built-in way to **sort, categorise, project columns, or serialise to JSON**. If you also want to:

- Sort the results on a field (DQL itself does not guarantee order)
- Group results into categories
- Apply `@Formula` to compute or normalise field values
- Stream the results out as JSON for a frontend or REST endpoint
- Materialise the results as a temporary view that users can browse

…you traditionally had to write the loop yourself or build a dedicated view. **`NotesQueryResultsProcessor` (NQRP)**, introduced in Domino V12, packages all of those post-processing steps into a single fluent API.

## Create an NQRP instance

NQRP comes from `NotesDatabase.CreateQueryResultsProcessor()`:

```vb
Dim s As New NotesSession
Dim db As NotesDatabase
Set db = s.GetDatabase("myserver", "mydb.nsf")

Dim qrp As NotesQueryResultsProcessor
Set qrp = db.CreateQueryResultsProcessor()
```

The pattern from there on is always **add inputs → define columns → execute**.

## Add inputs: three sources

### 1. `AddCollection` — an existing document collection

```vb
Dim view As NotesView
Set view = db.GetView("Customers")
Dim col As NotesDocumentCollection
Set col = db.UnprocessedDocuments  ' or view.GetAllDocumentsByKey(...) etc.
Call qrp.AddCollection(col)
```

Accepts either `NotesDocumentCollection` or `NotesViewEntryCollection`.

### 2. `AddDominoQuery` — feed DQL straight in

```vb
Dim dq As NotesDominoQuery
Set dq = db.CreateDominoQuery()
Call qrp.AddDominoQuery(dq, "Form = 'Order' and Total > 10000", "")
```

NQRP runs the DQL internally and adds the resulting documents to its input set.

### 3. `AddFormula` — override input field values

When the source documents need a computed or normalised field:

```vb
Call qrp.AddFormula("@LowerCase(CustomerName)", "CustomerName", "*")
```

The third parameter `"*"` applies the formula to all input collections; passing a specific collection name limits it to that one.

## Define output columns: `AddColumn`

```vb
Call qrp.AddColumn(String Name, _
                   Optional String Title, _
                   Optional String Formula, _
                   Optional Integer SortOrder, _
                   Optional Boolean Hidden, _
                   Optional Boolean Categorized)
```

| Parameter | Purpose |
|---|---|
| `Name` | Programmatic name of the column (must be unique) |
| `Title` | Display header when materialised as a view |
| `Formula` | Default `@Formula` for the value (omit to read the field of the same name) |
| `SortOrder` | `SORT_UNORDERED` / `SORT_ASCENDING` / `SORT_DESCENDING` |
| `Hidden` | true = sort by this column but do not return it |
| `Categorized` | true = collapse rows with the same value into one entry |

Official example:

```vb
Set qrp = db.CreateQueryResultsProcessor()
Call qrp.AddColumn("sales_person", "", "", SORT_ASCENDING, False, True)
Call qrp.AddColumn("ordno",        "", "", SORT_DESCENDING, False, False)
Call qrp.AddColumn("order_origin", "", "", SORT_UNORDERED, False, False)
Call qrp.AddColumn("partno")
```

That defines four columns: categorise by `sales_person` ascending → within each category sort by `ordno` descending → display `order_origin` and `partno`.

## Execute: two output formats

### A. `ExecuteToJSON` — for APIs and front-ends

```vb
Dim json As NotesJSONNavigator
Set json = qrp.ExecuteToJSON()
```

Returns a `NotesJSONNavigator`. The output conforms to RFC 8259 and lives under `StreamResults`:

```json
{
  "StreamResults": [
    {
      "@nid": "NT0000A572",
      "@DbPath": "dev\\ordwrkqrp.nsf",
      "sales_person": "Alice",
      "ordno": "PO-1042",
      "order_origin": "Web",
      "partno": "X-99"
    }
  ]
}
```

Special keys:

- `@nid` — document NoteID
- `@DbPath` — source database path
- `documents` — child rows under a categorised entry
- Multi-value fields are emitted as JSON arrays
- Aggregate functions (`@@sum()`, `@@avg()`, `@@count()`) appear as dedicated keys

### B. `ExecuteToView` — materialise as a browsable temp view

```vb
Set myview = qrp.ExecuteToView(ByVal Name As String, _
                               Optional ByVal ExpireHours As Long, _
                               Optional Readers As Variant, _
                               Optional DesignSrcDB As NotesDatabase, _
                               Optional ByVal DesignSrcViewName As String) As NotesView
```

| Parameter | Purpose |
|---|---|
| `Name` | Name of the results view to create |
| `ExpireHours` | Hours before the view auto-expires (default 24) |
| `Readers` | Single name or array of names (canonical) controlling who can read it |
| `DesignSrcDB` / `DesignSrcViewName` | Use an existing view as the design template |

Official example, verbatim:

```vb
Dim theReaders(1 To 4) As String
theReaders(1) = "CN=User1 UserLN1/O=MYORG"
theReaders(2) = "CN=User2 UserLN2/O=MYORG"
theReaders(3) = "PrivilegedGroup"
theReaders(4) = "CN=User3 UserLN3/O=MYORG"

Dim s As New NotesSession
Dim db As NotesDatabase
Dim qrp As NotesQueryResultsProcessor
Dim myview As NotesView
Set db = s.GetDatabase("myserver", "mydb.nsf")
Set qrp = db.CreateQueryResultsProcessor()
Set myview = qrp.ExecuteToView("MyNewResultsView", 2, theReaders)
```

The view is auto-cleaned up by the server, so the NSF design does not bloat over time.

## Safety knobs: don't let a query run forever

```vb
qrp.MaxEntries = 50000      ' max input documents; throws if exceeded
qrp.TimeOutSec = 30         ' max execution seconds; throws if exceeded
```

Public-facing endpoints should always set both, otherwise a malicious or accidental query can exhaust the server.

## The Java side

The Java class is `lotus.domino.QueryResultsProcessor`. Naming maps 1:1 from LotusScript: drop the `Notes` prefix, switch to camelCase, and keep `JSON` upper-case in method names:

| LotusScript | Java |
|---|---|
| `db.CreateQueryResultsProcessor()` | `db.createQueryResultsProcessor()` |
| `qrp.AddCollection(col)` | `qrp.addCollection(col)` |
| `qrp.AddDominoQuery(dq, q, "")` | `qrp.addDominoQuery(dq, q, "")` |
| `qrp.AddColumn(...)` | `qrp.addColumn(...)` |
| `qrp.ExecuteToJSON()` | `qrp.executeToJSON()` |
| `qrp.ExecuteToView(name, ...)` | `qrp.executeToView(name, ...)` |
| `qrp.MaxEntries = 50000` | `qrp.setMaxEntries(50000)` |
| `qrp.TimeOutSec = 30` | `qrp.setTimeoutSec(30)` |

The Java end-to-end equivalent:

```java
import lotus.domino.*;

Session session = NotesFactory.createSession();
Database db = session.getDatabase("", "orders.nsf");

QueryResultsProcessor qrp = db.createQueryResultsProcessor();
qrp.setMaxEntries(10000);
qrp.setTimeoutSec(20);

DominoQuery dq = db.createDominoQuery();
qrp.addDominoQuery(dq,
    "Form = 'Order' and OrderDate >= @dt('2026-01-01')", "");

qrp.addColumn("region",  "",          "", QueryResultsProcessor.SORT_ASCENDING,  false, true);
qrp.addColumn("total",   "Total NTD", "", QueryResultsProcessor.SORT_DESCENDING, false, false);
qrp.addColumn("orderNo", "Order No",  "", QueryResultsProcessor.SORT_UNORDERED,  false, false);

JSONNavigator json = qrp.executeToJSON();
// walk the JSONNavigator API ...

qrp.recycle();   // like every lotus.domino.Base, recycle when done
```

`recycle()` is the standard `lotus.domino.Base` discipline: native handles need to be released explicitly so the JVM doesn't hold onto them longer than necessary.

## End-to-end: DQL + sort + JSON (LotusScript)

```vb
Sub TopOrdersToJSON
  Dim s As New NotesSession
  Dim db As NotesDatabase
  Set db = s.GetDatabase("", "orders.nsf")

  Dim qrp As NotesQueryResultsProcessor
  Set qrp = db.CreateQueryResultsProcessor()
  qrp.MaxEntries = 10000
  qrp.TimeOutSec = 20

  Dim dq As NotesDominoQuery
  Set dq = db.CreateDominoQuery()
  Call qrp.AddDominoQuery(dq, _
    "Form = 'Order' and OrderDate >= @dt('2026-01-01')", "")

  Call qrp.AddColumn("region",  "",          "", SORT_ASCENDING,  False, True)
  Call qrp.AddColumn("total",   "Total NTD", "", SORT_DESCENDING, False, False)
  Call qrp.AddColumn("orderNo", "Order No",  "", SORT_UNORDERED,  False, False)

  Dim json As NotesJSONNavigator
  Set json = qrp.ExecuteToJSON()
  ' walk the tree with the NotesJSONNavigator API
End Sub
```

## When to reach for NQRP — and when not

| Need | Pick |
|---|---|
| Single document by key | `view.GetDocumentByKey()` |
| Full-text keyword search | `db.FTSearch()` |
| Structured condition query | DQL (`NotesDominoQuery`) |
| DQL results that also need sort / category / projection / JSON | **NQRP** |
| REST endpoint with categorised output | **NQRP + ExecuteToJSON** |
| Temporary browsable result table for users | **NQRP + ExecuteToView** |

NQRP has been stable since V12 and is a key building block for "Domino-as-API" backends, REST API services, and reporting batch jobs.
