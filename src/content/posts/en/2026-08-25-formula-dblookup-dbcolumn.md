---
title: "Reading Values Across Views and Databases in Formula: @DbColumn and @DbLookup"
description: "To read another view or another database from formula, two functions do ninety percent of the work: @DbColumn grabs a whole column (keyword lists, dropdowns), @DbLookup finds a value by key (resolve a code to a label, pull a related field). This piece covers both signatures, the cache keyword (\"\"/NoCache/ReCache), and the rules you must know — the first column must be sorted, equality-only matching, the 64KB cap, and where they can't be used. Part one of the Formula @function series."
pubDate: 2026-08-25T07:30:00+08:00
lang: en
slug: formula-dblookup-dbcolumn
tags:
  - "Formula"
  - "Tutorial"
sources:
  - title: "@DbColumn (Notes databases) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBCOLUMN_NOTES_DATABASES.html"
  - title: "@DbLookup (Notes databases) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_NOTES_DATABASES.html"
  - title: "About formulas that look for values in columns and views — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ABOUT_FORMULAS_THAT_LOOK_FOR_VALUES_IN_COLUMNS_AND_VIEWS.html"
cover: "/covers/formula-dblookup-dbcolumn.webp"
coverStyle: "minimalist-mono"
---

In formula you constantly need to read data from "somewhere else" — a column of another view, a value in another database. For that, two functions do ninety percent of the work:

- **[`@DbColumn`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBCOLUMN_NOTES_DATABASES.html):** grabs a whole column of values (the go-to for keyword lists and dropdowns).
- **[`@DbLookup`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_NOTES_DATABASES.html):** finds by a key and returns the matching value (resolve a code to a label, pull a related field).

This is part one of the Formula @function series; let's get these two workhorses straight.

---

## TL;DR

- **`@DbColumn` grabs a whole column:** `@DbColumn(class:cache; server:database; view; columnNumber)` — returns all of that column's values as a list.
- **`@DbLookup` finds by key:** `@DbLookup(class:cache; server:database; view; key; fieldName-or-columnNumber; keywords)`.
- **The cache keyword:** `""` (cache, reused within a session), `"NoCache"` (always fresh), `"ReCache"` (refresh the cache).
- **Hard rules:** the key matches the view's **first sorted column** (not necessarily column 1, but that column must be sorted), matching is **equality-only** (no greater/less-than), case-insensitive but spacing/punctuation precise, and the return is capped at **64KB**.
- **Some places forbid them:** the docs say plainly "This function does not work in column or selection formulas, or in mail agents."

---

## @DbColumn: grab a whole column

The classic use is "feed a keyword field's choices from a column of another view." The syntax:

```
@DbColumn(""; ""; "Customers"; 1)
```

Piece by piece:

- **`class:cache`** — the first pair. `class` is `""` or `"Notes"` (for Domino databases); `cache` is `""` (cache), `"NoCache"`, or `"ReCache"`. Both empty above means "Notes database, use the cache."
- **`server:database`** — the target. `""` is the current database; `"":"NAMES.NSF"` is a local database; `"SERVER":"DB.NSF"` is one on a server; you can also give a **replica ID** (`"85255CEB:0032AC04"`) to reach any replica.
- **`view`** — the view name (matching the name in View properties; synonyms are fine).
- **`columnNumber`** — which column, counting only non-constant, non-special-function columns.

Back comes all of that column's values as a list. The docs define the return plainly: "The values found in the view column that you indicated."

## @DbLookup: find by key

Where `@DbColumn` dumps a whole column, `@DbLookup` takes a key, matches it, and returns only the matching values. The syntax adds a `key` and "what to return":

```
@DbLookup(""; ""; "ProductsByCode"; ProductCode; "ProductName")
```

- **`key`** — matched against the view's **first sorted column**. Above, the document's `ProductCode` field is looked up in the `ProductsByCode` view.
- **`fieldName` or `columnNumber`** — what to return once matched: a **field name** returns that document's **stored field value**; a **column number** returns the **displayed column value**.

Three common keywords, too:

- **`[FAILSILENT]`:** returns `""` instead of an error when nothing matches.
- **`[PARTIALMATCH]`:** matches on leading characters, not a full equality.
- **`[RETURNDOCUMENTUNIQUEID]`:** returns the matching document's UNID instead of a field/column value.

## cache: three modes

That `cache` parameter matters in practice:

- **`""` (cache):** the docs say it "caches the results of the lookup…reuses that data until you specify 'ReCache'" — repeat the same lookup within a session and it serves the cache, not the database. Fast, but if the source data changed elsewhere, this won't reflect it immediately.
- **`"ReCache"`:** forces a refresh with the latest data. Use it when the source changes and you want it current.
- **`"NoCache"`:** goes to the database every time; the docs say "no cache is used." Most current, slowest.

## The rules you must know

`@DbLookup` / `@DbColumn` are handy, but a set of [hard limits](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ABOUT_FORMULAS_THAT_LOOK_FOR_VALUES_IN_COLUMNS_AND_VIEWS.html) will confuse you if you trip them:

- **The looked-up column must be sorted:** `@DbLookup` matches the key against the view's **first sorted column** — no sort, no lookup.
- **Equality only:** no `>`, `<`, or `like` as in SQL; case is ignored, but spacing and punctuation must match exactly.
- **A miss throws an error:** no match returns the error "Entry not found in index" — catch it with `@IsError` or `@IfError` (or add `[FAILSILENT]`). The last part of this series covers error handling.
- **64KB return cap:** both functions are bounded. The docs pin `@DbColumn` down: "@DbColumn can return no more than 64K bytes of data." Enough data and it truncates or errors. The site's [64K cache limit on @DbLookup/@DbColumn](/domino-news/en/posts/dblookup-cache-64k) piece goes deep on this trap, so it's not repeated here.
- **Some places forbid them:** the docs say plainly "This function does not work in column or selection formulas, or in mail agents." Don't reach for them in a view column formula, a selection formula, or a mail agent.
- **No rich text:** `@DbLookup` can't return a rich text field.

## Choosing between the two

- **You want a whole column** (keyword list, dropdown, list every value of a column) → `@DbColumn`.
- **You want the value for a key** (code to label, pull one field of a related document) → `@DbLookup`.

One line to remember: `@DbColumn` dumps a whole column, `@DbLookup` matches one key. Both need a sorted column in the view, both hit the 64KB cap, and both make you decide whether the cache should be current. Keep these two workhorses in hand and most of formula's read-across-views/databases needs are solved.

The next part reaches formula's surprisingly powerful side: **treating it as a functional list language** — how `@Transform`, `@Explode` / `@Implode`, `@Unique`, and `@Sort` process a whole list in one line.
