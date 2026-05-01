---
title: "DQL Pitfalls: 6 Query-Writing Details the Official Docs Don't Spell Out"
description: "Domino Query Language (DQL)'s syntax looks SQL-like, but writing real queries surfaces a whole set of Notes-specific traps — view selection silently scopes results, the `'view'.column` references the view column's programmatic name (not a doc field), comparison operators need whitespace on both sides, backslashes in view names need escaping, `@formula` is a separate Formula Language parser, and string-stored date fields need `@TextToTime`. Each trap below comes with the verbatim error message and a working fix."
pubDate: 2026-05-01T08:30:00+08:00
lang: en
slug: dql-pitfalls
tags:
  - "DQL"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "View column requirements — HCL Domino 12.0.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_view_column.html"
  - title: "DQL syntax reference — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_syntax.html"
  - title: "Formula Language in DQL — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html"
---

> 📚 **The "DQL Trilogy" series**
> - **Part 1**: [DQL in Practice: SQL-Looking Syntax, Notes-Specific Traps Everywhere](/domino-news/en/posts/dql-getting-started)
> - **Part 2**: DQL Pitfalls (you are here)
> - **Part 3**: [DQL Production-Ready: Catalog Maintenance, Permissions, and sessionAsSigner](/domino-news/en/posts/dql-production)

After writing a few DQL queries, you'll find that the "near-SQL syntax" pitch is genuinely surface-only — under the hood is the Notes engine, with its own set of **details the docs don't spell out and SQL intuition won't save you from**.

This article catalogs 6 traps from real-world testing, each with the **verbatim error message** and a working fix. Skim it before writing DQL — it'll save you hours of debugging.

If you haven't seen the basics or how to call DQL from LotusScript / Java / REST API, start with [Part 1 DQL Getting Started](/domino-news/en/posts/dql-getting-started); if you're shipping DQL to production and need to handle the catalog and permissions, head to [Part 3 Production-Ready](/domino-news/en/posts/dql-production).

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

## Comparison operators require whitespace on both sides

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

## Backslash (`\`) in view names needs escaping

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

### Why the double backslash?

**The DQL parser itself treats `\\` as a single `\`** (`\` is an escape character in DQL string literals). So if you want a literal `\` in the view name, the query string DQL receives must contain `\\`.

But how many `\` you write in source gets multiplied or chewed by your language's string handling:

| Source language / format | Write in source | String value | DQL receives | DQL parses to |
|---|---|---|---|---|
| LotusScript (no `\` escape) | `"\\"` | `\\` | `\\` | `\` ✅ |
| Java / Node.js / JSON (`\` is an escape char) | `"\\\\"` | `\\` | `\\` | `\` ✅ |

LotusScript string literals don't escape `\` (the way to embed a quote is `""` doubled), so two slashes in source = two slashes in the value. Java / Node.js / JSON string literals collapse `\\` to a single `\`, so you need four backslashes in source to end up with two in the string value.

Real-world report: an engineer hit this in Node.js / JSON and wrote a single `\` in source. JSON parsing ate it, DQL never saw any `\`, and the view name turned into `(personalpendingSignDoc)` instead of the real `(personal\pendingSignDoc)`.

## DQL is case-insensitive (and accent-insensitive) — this one is good news

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

## `@formula(...)` is a separate Formula Language parser

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

### Important: DQL-native `@` and Formula Language `@Function` are two different worlds

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

## Trap-error message lookup

A quick reference for matching error messages to root causes:

| Error fragment | Real cause | Fix |
|---|---|---|
| `必須有至少一個運算子` / `must have at least one operator` | Comparison operator without surrounding whitespace | Add a space on each side of `=` etc. |
| `incorrect column name or no valid sorted column` | The referenced column's programmatic name doesn't exist | Check Designer's "Programmatic use → Name" panel and fix the query, or switch to `in()` syntax |
| `invalid view name or database needs to be cataloged via updall -e` | (A) Catalog truly missing → (B) backslash in view name not escaped | Check the view name first — if it contains `\`, escape it as `\\`. If it's not a backslash issue, see [Part 3 catalog maintenance](/domino-news/en/posts/dql-production) |
| `Formula Error - error during planning and tree generation` / `Error filling node` | A DQL-native `@` function (`@dt` etc.) used inside `@formula` | Use the Formula Language equivalent (`@TextToTime` etc.), or pull out of `@formula` and use DQL native syntax |
| Result count is unexpectedly low (no error) | The view's selection isn't `Select @All`, silently scoping the result | Change view to `Select @All`, switch to `in()` syntax, or build a dedicated DQL view |

---

> 📚 **Next: [DQL Production-Ready: Catalog Maintenance, Permissions, and sessionAsSigner](/domino-news/en/posts/dql-production)**
>
> Once you can write queries that work, the next hurdle is **shipping to production**: how the catalog is auto-maintained, how design changes propagate, and why regular users hit permission errors. Part 3 walks the full real-world pattern.
>
> For basic syntax and how to call DQL from LotusScript / Java / REST API, head back to [Part 1 DQL Getting Started](/domino-news/en/posts/dql-getting-started).
