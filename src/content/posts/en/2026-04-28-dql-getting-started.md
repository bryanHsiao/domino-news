---
title: "DQL in Practice: SQL-Looking Syntax, Notes-Specific Traps Everywhere"
description: "Domino Query Language (DQL)'s syntax looks SQL-like on the surface, but the engine underneath is Notes — and it comes with a full set of traps: when the Design Catalog is required, view selection silently scoping results, the `'view'.column` referring to the column's programmatic name (not a doc field), the two parser contexts of `@formula` vs DQL-native, whitespace and backslash escapes, string-stored date fields, and more. This guide walks the path from trap to working query, with LotusScript / Java / REST API examples."
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
  - title: "Formula Language in DQL — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html"
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

### The hard truth: DQL's "familiar syntax" is only skin deep

Developers picking up DQL often get misled by the "near-SQL syntax" pitch and assume it'll be a smooth ride coming from SQL or the traditional Notes API. **It isn't.** This article catalogs at least eight traps:

- **The Design Catalog doesn't auto-update** — adding a view requires a sync trigger or your queries fail
- **The `column` in `'view'.column` means the column's programmatic name**, not a document field name — and that programmatic name is often an auto-generated `$55`
- **When the view's selection isn't `Select @All`, results are silently scoped to the view** (no error)
- **Comparison operators require whitespace on both sides** (`Form='X'` errors out, `Form = 'X'` works)
- **Backslashes in view names need escaping** (`(personal\\pendingSignDoc)`); the resulting error message points you at the catalog instead
- **Inside `@formula(...)` you're in a separate Formula Language parser** — DQL-native `@dt` placed there fails to compile
- **String-stored date fields need `@TextToTime`** to convert; native `@dt` comparison won't help
- **Columns must be collated** to be usable as a view-index entry; otherwise DQL errors out

Every trap below comes with a real test case, an HCL doc cross-reference, and a working fix. This isn't a SQL crash course — it's **a "trap-to-shippable" field guide**.

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

## Enable DQL: build the Design Catalog — required when your query names a view

Let's clarify when the Design Catalog is strictly required before getting into how to build it.

**Bottom line up front**:

| Your query shape | Design Catalog needed? |
|---|---|
| `Form = 'Customer'` (bare-field query) | ❌ No. DQL falls back to a full NSF scan — slow but works |
| `'Customers'.Country = 'Taiwan'` (view name + column) | ✅ Required, otherwise errors out |
| `in ('Customers') and Country = 'Taiwan'` (scoped by view) | ✅ Required, otherwise errors out |

**As soon as your query mentions a view name** (the single-quoted form), you need the Design Catalog — because that catalog is DQL's **only** way to know what view names exist and what columns each view exposes. Without it, DQL can't tell what `'Customers'` even refers to.

If your query never references a view name and just uses bare-field conditions like `Form = 'X' and Total > 100`, DQL runs without the catalog — it just falls back to a full NSF scan. Slow, but no error.

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
| Embed Formula Language | `@formula('@Year(orderDate) = 2026')` |

¹ When the view's selection isn't `Select @All`, DQL scopes the result to whatever docs the view's selection has filtered in — see the section below.

## Using a view as the base: view selection scopes the result

The HCL [View column requirements](https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_view_column.html) doc states that the `'view'.column` syntax requires the view to use `Select @All`.

What actually happens if the view's selection isn't `Select @All`? We tested it on Domino 12.

A view called `Vtest` with this selection (very common Notes pattern, **not** `Select @All`):

```text
SELECT Form="Ftest" & deleteFlag !="1"
```

Three documents in the NSF:

| Doc | Fields | In the view? |
|---|---|---|
| A | `Form="Ftest"`, `deleteFlag=""` | ✅ |
| B | `Form="Ftest"`, `deleteFlag="1"` | ❌ |
| C | `Form="Other"` | ❌ |

Two queries:

| Query | DB-wide expected | Actual count |
|---|---|---|
| `'Vtest'.Form = 'Ftest'` | A + B = 2 | **1** (only A) |
| `'Vtest'.Form = 'Other'` | C = 1 | **0** |

**Result**: the runtime doesn't reject queries against views that aren't `Select @All` — no error, no warning. But **DQL scopes the result to the docs the view's selection has filtered in**, so docs the selection excludes don't show up.

### Why

DQL reuses the **Notes view's existing column index** directly, and that column index only contains docs satisfying the view's selection formula. So "results are scoped to the view's selection" is just the natural consequence of the underlying Notes architecture — HCL gets the speed of the existing Notes engine for free, in exchange for inheriting the scope of the view selection.

The official "require Select @All" reads more like a strong recommendation: it's the way to ensure the view spans the whole DB, so the column index has clean DB-wide semantics.

### Practical guidance

- **View design under your control**: change the selection to `Select @All` to match the official recommendation
- **View design not under your control** (e.g. someone else's view, can't change it): use `in ('viewname') and field = value` instead — that form isn't scoped by view selection (the cost is the planner may fall back to an NSF scan)
- **Don't want to deal with views at all**: bare-field `field = value`, let DQL find a view with a collated column for you

For a cleaner long-term solution: build **dedicated DQL index views** (use a `dql` prefix or a hidden `($DQL)` category), `Select @All` selection, separate from the views your UI uses. `'dqlVtest'.Form = 'Ftest'` then runs fast and has clean semantics.

### Sidebar: column collation is a separate rule

Beyond the selection consideration, the referenced column must be **collated** (either condition counts):
- View's leftmost column has "Sort order: Ascending" checked
- The column itself has "Click on column header to sort: Ascending" checked

This rule IS enforced — DQL errors out if the column isn't collated, unlike the selection rule which silently scopes the result.

## The `column` in `'view'.column` is the column's programmatic name, not the field name

This is a high-frequency conceptual trap. `'vwMyJob'.wdocAuthor` reads like "look up the `wdocAuthor` field in view `vwMyJob`" — but DQL **doesn't** look up document fields here. It looks up the **view column's "Name for programmatic use"** in Designer's column properties.

The two often **happen to match**, which is why people assume they're the same thing — but any of these break that assumption and produce an immediate error:

1. **The column has an auto-generated name** (`$55`, `$3` etc.) — Designer assigns these when you create a column without explicitly setting a name
2. **The column is a formula, not a single field**, e.g. `WDocAuthor:WDocAuthorAgent` (concatenating two fields)
3. **The column's programmatic name was intentionally set to something different from the field**

Actual error message (column `Approver` has programmatic name `$55` in Designer, formula `WDocAuthor:WDocAuthorAgent`; queried as `'vwMyJob'.wdocAuthor`):

```text
Domino Query execution error:
Entry not found in index -  validation error

Error validating view column name - ['vwMyJob'.wdocAuthor]
 ..  incorrect column name or no valid sorted column (bad position, collation or categorized)

'vwMyJob'.wdocAuthor = 'CN=user01/O=TheNet'

(Call hint: NSFCalls::NSFItemInfo, Core call #0)
```

"Incorrect column name" is DQL saying "there's no column named `wdocAuthor` in `vwMyJob`" — because the column's programmatic name is `$55`, not `wdocAuthor`.

### Where to find the programmatic name

In Designer, open the view → click the column → right-side properties panel → switch to the **"Programmatic use"** (程式設計時使用) tab → **"Name"** is what DQL knows the column by.

If you see `$N` auto-numbering there, rename it to something meaningful (e.g. `wdocAuthor`) so DQL can resolve it.

### Two fixes

1. **Rename the column's programmatic name** in Designer's "Programmatic use → Name", save, then refresh the catalog
2. **Switch to `in()` syntax**:

   ```sql
   in ('vwMyJob') and wdocAuthor = 'CN=user01/O=TheNet'
   ```

   `in()` **doesn't depend on column programmatic names** — DQL evaluates `wdocAuthor` directly against the document fields, regardless of how the columns inside the view are named.

## Two more syntax gotchas (the kind you only find by hitting them)

### 1. Comparison operators require whitespace on both sides

The DQL parser is stricter about token whitespace than SQL parsers ——

| Form | Result |
|---|---|
| `wdocAuthor='CN=user01/O=TheNet'` | ❌ Parser error |
| `wdocAuthor = 'CN=user01/O=TheNet'` | ✅ Works |

The actual error message when you skip the spaces (heads up: it's misleading):

```text
Domino Query execution error:
Query is not understandable -  syntax error   - must have at least one operator

'(personal\pendingSignDoc)'.wdocAuthor='CN=user01/O=TheNet'

(Call hint: OSCalls::OSLocalAllc, Core call #0)
```

"Must have at least one operator" is wildly misleading — `=` is right there. The DQL tokenizer splits tokens on whitespace, so without spaces the whole `wdocAuthor='CN=user01/O=TheNet'` becomes one mystery token with no recognized operator inside. **The error doesn't sound like it's about whitespace, but the fix is to add whitespace.**

Treat **`=`, `<`, `>`, `<=`, `>=`, `!=`** as always needing a space on each side.

This trips up anyone coming from SQL — `Form='Customer'` and `Form = 'Customer'` are interchangeable in SQL parsers, but not in DQL.

### 2. Backslash (`\`) in view names needs escaping

Notes view names can contain backslashes for hierarchical categorization, e.g. the **hidden view** `(personal\pendingSignDoc)` (parens = hidden, backslash = nested category). Writing the backslash raw in DQL gets it eaten somewhere along the way, and **the resulting error message looks identical to "Design Catalog isn't built"**:

```text
Domino Query execution error:
Entry not found in index -  syntax error

Error validating view column name - ['(personalpendingSignDoc)'.wdocAuthor]
 ..  invalid view name or database needs to be cataloged via updall -e

'(personalpendingSignDoc)'.wdocAuthor = 'CN=user01/O=TheNet'

(Call hint: NSFCalls::NSFDbGetNamedObjectID, Core call #0)
```

Notice the view name in the error is `(personalpendingSignDoc)` — **the backslash is gone.** The "please run `updall -e`" hint sends you down the wrong rabbit hole; the real issue is escaping, not the catalog.

Side-by-side:

| Form | View name DQL receives | Result |
|---|---|---|
| `'(personal\pendingSignDoc)'.wdocAuthor` | `(personalpendingSignDoc)` (`\` eaten) | ❌ view not found |
| `'(personal\\pendingSignDoc)'.wdocAuthor` | `(personal\pendingSignDoc)` (correct) | ✅ Works |

Same for `in()` syntax:

```sql
in ('(personal\\pendingSignDoc)') and wdocAuthor = 'CN=user01/O=TheNet'
```

#### Why the double backslash?

**The DQL parser itself treats `\\` as a single `\`** (`\` is an escape character in DQL string literals). So if you want a literal `\` in the view name, the query string DQL receives must contain `\\`.

But how many `\` you write in source gets multiplied or chewed by your language's string handling:

| Source language / format | Write in source | String value | DQL receives | DQL parses to |
|---|---|---|---|---|
| LotusScript (no `\` escape) | `"\\"` | `\\` | `\\` | `\` ✅ |
| Java / Node.js / JSON (`\` is an escape char) | `"\\\\"` | `\\` | `\\` | `\` ✅ |

LotusScript string literals don't escape `\` (the way to embed a quote is `""` doubled), so two slashes in source = two slashes in the value. Java / Node.js / JSON string literals collapse `\\` to a single `\`, so you need four backslashes in source to end up with two in the string value.

Real-world report: an engineer hit this in Node.js / JSON and wrote a single `\` in source. JSON parsing ate it, DQL never saw any `\`, and the view name turned into `(personalpendingSignDoc)` instead of the real `(personal\pendingSignDoc)`.

## DQL is case-insensitive (and accent-insensitive)

The HCL [DQL syntax](https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_syntax.html) doc states explicitly:

> "Text string evaluation is **case insensitive** and **accent insensitive**."

Real-world behavior:

| Element | Behavior | Source |
|---|---|---|
| String value comparisons (also accent-insensitive) | Case-insensitive | Official docs |
| View name in `'view'.column` | Case-insensitive | Verified by testing |
| Column programmatic name in `'view'.column` | Case-insensitive | Verified by testing |
| Keywords (`and` / `or` / `in` / `contains` / `like`) | Case-insensitive | Notes/SQL convention |

All three of these are equivalent:

```sql
'vwMyJob'.wdocAuthor = 'CN=user01/O=TheNet'
'VWMYJOB'.WDOCAUTHOR = 'cn=USER01/o=thenet'
'vwmyjob'.WdocAuthor = 'cn=user01/o=thenet'
```

The view name, the column programmatic name, and the value comparison — all three are case-insensitive.

Accent-insensitivity is a bonus — `'café'` matches `'cafe'` and vice versa, useful for European-language data.

⚠️ **If you actually need a case-sensitive comparison**, DQL's `=` doesn't have a case-sensitive variant — you'll need to filter the results in app code (LotusScript `StrCompare`, Java string compare, etc.) after fetching.

## Advanced: embedding Formula Language in DQL (`@formula` clause)

One of the most common questions from Notes developers: "Can DQL use the `@Functions` I already know?" — yes. DQL provides `@formula(...)` (also writable as `@fl()` or `@FORMULA()`, case-insensitive) to **embed a Formula Language expression** into a query.

### Case study: find documents whose `docno` starts with `056`

Say `docno` looks like `"056123456789"` and you want all documents whose first three characters are `056`.

Two ways:

```sql
-- Option A: embed @Left via @formula
@formula('@Left(docno;3) = "056"')

-- Option B: native DQL like + wildcard (recommended)
docno like '056%'
```

Same result, **very different performance**:

| Form | Can use a view index? | Speed |
|---|---|---|
| `docno like '056%'` | ✅ Yes (if there's a collated `docno` column) | Fast |
| `@formula('@Left(docno;3) = "056"')` | ❌ Always falls back to NSF summary scan | Slow |

**`@formula` conditions don't get optimized by the view index.** Use native `like` / `contains` / `=` / `in` / `between` whenever they can express the predicate. Reach for `@formula` only when native syntax can't.

### `@formula` syntax notes

```sql
@formula('@Left(docno;3) = "056"')
```

Three details that catch people out:

1. The whole formula is wrapped in **single quotes**
2. Strings inside the formula use **double quotes** (avoiding the outer single-quote conflict)
3. Function arguments are separated by **`;`** (Formula Language convention, not commas)

### Important: inside `@formula` you're in a separate Formula Language parser

DQL actually has **two parser contexts** that don't recognize each other's `@` functions:

| Parser context | Where you write it | Recognizes |
|---|---|---|
| **DQL native** | the query body | `@dt`, `@all`, `@formula` / `@fl` / `@FORMULA`, `@ftsearch` / `@fts`, `@Created`, `@DocumentUniqueID`, `@ModifiedInThisFile` |
| **Formula Language** | inside the `@formula('...')` quotes | the supported Formula Language `@Function` subset (`@Year`, `@Left`, `@Contains`, `@Length`, `@Matches`, `@Modulo`, `@Lowercase`, …) |

**Inside `@formula`, DQL-native `@dt` / `@all` / `@ftsearch` are not recognized**, and vice versa — DQL-native syntax doesn't recognize Formula Language `@Year` / `@Left` outside `@formula`. The two parsers are isolated.

#### Real-world trap: `@dt` written inside `@formula`

```sql
'vwMyJob'.wdocAuthor = 'CN=USER05/O=thenet'
  and @formula('@Year(@dt(ApplyDate)) = "2021"')
```

DQL hands the contents of `@formula('...')` to the Formula compiler, which sees `@dt` and doesn't recognize it:

```text
Formula Error -  error during planning and tree generation
Error filling node for @Year(@dt(ApplyDate)) = "2021"

(Call hint: NSFCalls::NSFFormulaCompile, Core call #0)
```

The right rewrite depends on two things: **the intent** (extract the year vs range comparison) and **what `ApplyDate` actually is** (a real date field or a string).

**Intent A: check whether `ApplyDate`'s year is 2021** — use Formula Language

If `ApplyDate` is a true date field:

```sql
@formula('@Year(ApplyDate) = 2021')
```

If `ApplyDate` **is stored as a string** (very common in older Notes apps), you have to convert it with Formula's `@TextToTime` first:

```sql
@formula('@Year(@TextToTime(ApplyDate)) = 2021')
```

> 💡 **Field-tested (reader-reported)**: lots of real-world Notes apps store `ApplyDate` as a string. `@Year(ApplyDate)` directly fails on a string — `@TextToTime` is the missing step. The string format has to be one Notes recognises (e.g. `"2021/05/15"` or `"2021-05-15"`) for `@TextToTime` to parse.

In both cases the comparison value is the **number `2021`**, not the string `"2021"` (`@Year` returns a number; comparing it to a string fails).

**Intent B: do a date range comparison and let view indexes help** — use DQL native, drop `@formula` entirely

```sql
ApplyDate >= @dt('2021-01-01') and ApplyDate < @dt('2022-01-01')
```

This is **faster than the `@formula` version** because native DQL conditions can use view indexes — **but only if `ApplyDate` is actually a date field**. If it's a string, native DQL does a string comparison rather than a date comparison, and the result may be wrong unless your strings happen to be in a sortable format like ISO 8601 (where string ordering equals date ordering).

"If native syntax can express it, prefer native" is the general rule (echoing the optimization pattern below) — but for string-stored dates, you may be stuck with `@formula('@Year(@TextToTime(...)) = 2021')`. **To get the native-optimization path, the field type also has to be clean.**

#### DQL-native `@` function reference

| Function | Purpose |
|---|---|
| `@dt('YYYY-MM-DD[Thh:mm:ss]')` | Date/time literal (ISO 8601) |
| `@all` | All documents |
| `@formula(...)` / `@fl(...)` | Embed Formula Language |
| `@ftsearch(...)` / `@fts(...)` | Full-text search (Domino 14+) |
| `@Created` | Document creation timestamp (special field) |
| `@DocumentUniqueID` | Document UNID |
| `@ModifiedInThisFile` | Last modified-in-this-file timestamp |

These work **only in the DQL body** — putting them inside `@formula(...)` triggers a Formula compile error.

### When you actually need `@formula`

Conditions that native DQL syntax can't express:

```sql
@formula('@Year(orderDate) = 2026')              -- date functions
@formula('@Length(content) > 1000')              -- string length
@formula('@Modulo(amount; 100) = 0')             -- numeric arithmetic
@formula('@Matches(title; "[A-Z]??-2026-*")')    -- pattern matching
```

### Optimization pattern: native pre-filter + `@formula` fine-filter

`@formula` and native DQL conditions compose with `and` / `or`. The recommended pattern: **let native conditions do the coarse filter and `@formula` do the fine filter**.

```sql
Form = 'Order' and @formula('@Year(orderDate) = 2026')
```

The DQL planner uses `Form = 'Order'` first (with view-index optimization if available) to narrow the candidate set, then applies the `@formula` predicate on what's left. Much faster than throwing a single `@formula` at the whole NSF.

### Restrictions (HCL [Formula Language in DQL](https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html))

- Each `@formula` text term is capped at **256 bytes**
- Not every `@Function` is supported — HCL lists a 130+ supported subset (`@Left`, `@Year`, `@Contains`, `@Matches`, `@Length`, `@Modulo`, `@Lowercase`, etc. — most common ones are in)
- DQL doesn't validate Formula syntax before executing — errors surface only at runtime
- Substitution variables (`?varname`) don't work *inside* `@formula`, but they do work *outside* the clause: `@fl('@doclength') > ?doclengthval`

## Performance tips

1. **Use a view as the base** — `'ViewName'.Field = ...` is faster than a bare field, but note that when the view isn't `Select @All`, results are scoped to whatever the view selection filters in (see the dedicated section above). If the view design isn't yours to change, fall back to `in ('ViewName') and Field = ...`
2. **Avoid leading wildcards** — `like '%abc'` cannot use an index
3. **Turn on `Explain`** — `dq.Explain = True` shows the actual execution path
4. **First-hits mode** — when you only need a few results, use `Execute(query, "", 0, 10)` to cap the count
5. **Parallelize big scans** — set `QUERY_MAX_NUMBER_THREADS=4` in `notes.ini` to parallelize NSF scans

## Common errors

- **"No design catalog found"** — run `load updall -e` to build the catalog
- **"Field is not selectable in any view"** — DQL has no matching view and falls back to a full scan; add a view or mark the field with `$DQLField`

## Going further

DQL also supports substitution variables, joins via view links, and aggregate functions. Pair this intro with the official syntax reference for the full grammar.
