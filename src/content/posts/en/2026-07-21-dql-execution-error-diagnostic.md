---
title: "When DQL Says \"Domino Query execution error\": A Diagnostic Ladder"
description: "A DQL query fails and you get \"Domino Query execution error:\" followed by a wall of text. A field report on reading that message: the number 4854 you'll find in Err is useless for diagnosis (every DQL failure returns it), and the answer is always in the detailed-reason line. Covers the four-segment message structure, a three-rung ladder (catalog / view-never-built / partial TIMEDATE), the design-catalog corruption that makes queries work intermittently, and the 0-docs-no-error checklist."
pubDate: 2026-07-21T07:30:00+08:00
lang: en
slug: dql-execution-error-diagnostic
tags:
  - "DQL"
  - "Tutorial"
sources:
  - title: "DQL design catalog — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_design_catalog.html"
  - title: "DQL view column lookups — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_view_column.html"
  - title: "Field report: DQL execution-error diagnostic ladder (domino-dev-kb)"
    url: "https://bryanhsiao.github.io/domino-dev-kb/cases/2026-07-16-dql-4854-diagnostic-ladder/"
relatedJava: ["DominoQuery"]
relatedSsjs: ["DominoQuery"]
---

Your DQL query fails and the screen shows `Domino Query 執行時錯誤:` — "Domino Query execution error:" — trailed by several lines of text. It's tempting to grab the error number and search for it. Don't: the `4854` you'll find in LotusScript's `Err` is the *least* useful thing here. This is a field report on reading that message the way it actually wants to be read — and the short version is that the whole diagnosis lives in one specific line, not in the error code. (Environment: Domino 12.0.2, a 412-document test database; the reproduction assets — 5 views and 4 agents — are in the [knowledge-base case](https://bryanhsiao.github.io/domino-dev-kb/cases/2026-07-16-dql-4854-diagnostic-ladder/).)

---

## TL;DR

- **The number is a dead end.** *Every* DQL execution failure returns `Err = 4854` (`lsERR_NOTES_DQUERY_EXECUTION`) — syntax errors, empty queries, missing views, all of it. The constants `4852`/`4853`/`4855`/`4856` exist but aren't used in practice. **Diagnose from the message text (`Error$`), never the number.**
- The message has **four segments**: the `Domino Query execution error:` prefix, ① an engine-classification line, ② a detailed-reason line (this is the one that matters), ③ an echo of your query, ④ a Call hint.
- **A three-rung ladder** on line ②: `...needs to be cataloged via updall -e` (missing catalog *or* a typo in a view/column name — check spelling first) → `View never built [x]` (the view's index was never created; DQL won't build it) → `Partial TIMEDATEs NOT supported...` (a date-only `@dt`).
- **Intermittent behaviour ("works sometimes")** is often a half-corrupt design catalog — after a view design change, `updall -d` can fail and leave the catalog inconsistent, so some views error while others silently return 0. Rebuild with `updall -e`.
- Your error handler **must print `Error$` in full** — the number tells you nothing.

## Read the message, not the number

The single most important reproduction finding: in LotusScript, a DQL failure *always* surfaces as `Err = 4854`. We threw everything at it — a syntax error (`... and and ...`), an empty query string, a nonexistent view — and every one came back `4854`. The constant is `lsERR_NOTES_DQUERY_EXECUTION`, defined in `lsxbeerr.lss`; its siblings `4852`/`4853`/`4855`/`4856` are defined too, but in practice you never see them. So the number classifies *nothing*. Whatever went wrong, the description is in the text:

```lotusscript
On Error GoTo errh
' ... run the DQL query ...
Exit Sub
errh:
  Print "DQL failed: " & Error$      ' the WHOLE text — this is your diagnosis
  Print "  (Err = " & Err & ")"      ' always 4854; ignore it
End Sub
```

Miss the `Error$` and you've thrown away the only useful information.

## The four segments

The message is structured. Reading it in order tells you where to look:

1. **Prefix** — `Domino Query 執行時錯誤:` / "Domino Query execution error:". Just the wrapper.
2. **① Engine classification** — a broad category, e.g. `Query is not understandable` (syntax) or `Error validating view column name`.
3. **② Detailed reason** — *the diagnostic key.* This is the line you act on.
4. **③ Query echo** — your query text played back. For syntax errors it's followed by a caret-pointer line, `.....^.....`, marking the exact offending character.
5. **④ Call hint** — the internal API point where it failed.

For a syntax error, ① plus the ③ caret line pinpoint the character. For everything else, ② is the whole story.

## The three-rung ladder (line ②)

Match the detailed-reason line against these, top to bottom:

| Line ② says | Cause | Fix |
|---|---|---|
| `invalid view name or database needs to be cataloged via updall -e` | Missing design catalog **or** a typo in a view/column name | **Check the spelling first**, then `load updall <db> -e` |
| `View never built [viewName] - query term will fail, aborting` | The view's index was never created (designed but never opened); DQL does **not** build view indexes | Open the view once, or `load updall <db> -t <view>` |
| `Partial TIMEDATEs NOT supported with view column lookup, specify a full TIMEDATE` | A date-only `@dt()` in a view-column term | Pass a complete timestamp, e.g. `@dt('2024-01-01T00:00:00+08:00')` (see the [date-column piece](/domino-news/en/posts/dql-view-date-column)) |

The first rung's dual meaning is the trap: the *same message* appears whether the catalog is genuinely missing or you simply mistyped a [view or column name](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_view_column.html). Check the name before you run `updall`. On the [design catalog](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_design_catalog.html) itself, the docs are clear about why it exists — "for high speed access to internal information about views and view columns, DQL processing uses a design catalog that contains design data extracted from view notes" — and what happens without one: "all other syntax will function but there will be no view access and all terms will be satisfied utilizing NSF scanning." You create it with `load updall <db> -e` and update it after design changes with `load updall <db> -d`.

## When it "works sometimes": a half-corrupt catalog

The intermittent version is the most confusing, and the field report pinned the usual culprit. The design catalog is **persistent state stored inside the NSF** (the mechanics are covered in the [DQL production notes](/domino-news/en/posts/dql-production)). After you sync view design changes, a `updall -d` refresh can *fail* — in the test it threw `DesignCatalog::LoadColumnData ... Named Object corrupt` — and leave the catalog in a half-corrupt state. The symptom of that half state is exactly "works sometimes": **some views error, others silently return 0 documents**, with no consistency. The recovery is a full `updall -e` rebuild (the corruption persists across server restarts, so restarting doesn't help).

In code, prefer the refresh/rebuild pattern over a manual runbook — the same approach the production notes use:

```lotusscript
' Cheap when the catalog is current:
query.RefreshDesignCatalog = True
' ... run the query ...
' If it fails with "needs to be cataloged via updall -e", retry harder:
query.RebuildDesignCatalog = True
' ... re-run ...
```

One limit: `RefreshDesignCatalog` can't bootstrap a catalog that doesn't exist yet in a fresh NSF — that first build needs `RebuildDesignCatalog` (or `updall -e`).

## "Zero documents, no error": a five-step checklist

The failure mode with *no* message is its own problem — the query runs clean and returns nothing. Walk these in order:

1. **Does the data even exist?** Run a non-view comparison query (or a plain search) that doesn't touch the view, to confirm matching documents are actually there.
2. **Is the view index fresh?** Set `RefreshViews = True` on the query so a stale index isn't hiding new documents.
3. **Is the catalog stale or half-corrupt?** See the section above — this is the "works sometimes" cause.
4. **Is the selection formula filtering them out?** If the view's selection isn't `@All`, excluded documents aren't in the view to find (the [@All pitfalls piece](/domino-news/en/posts/dql-pitfalls) covers this).
5. **Is it a type or time-zone mismatch?** A wrong query-term type or a `@dt` missing its `+08:00` returns 0 (or the wrong rows) silently — the whole subject of the [date-column piece](/domino-news/en/posts/dql-view-date-column).

## Reading Explain output

When you need to know *why* a query is slow or which node matched what, `Explain` (or `RunQuery` with explain) prints a plan. The fields worth knowing:

- **`ScannedDocs`** — `0` means the query ran purely on the index (no full-database scan); a high number is your performance red flag.
- **`Entries` / `FoundDocs`** — index entries examined at a node, and documents that matched there.
- **`estimated cost`** — the optimiser's cost estimate that drives execution order; it's an *estimate*, not a measured time (the `Prep`/`Exec` msecs are the real wall-clock).
- A `@dt('...+08:00')` term shows up in the plan normalised to UTC (e.g. `2023-12-31T16:00:00Z`) — that's expected, not a bug.

## What about Java and SSJS?

| Language | DQL entry point |
|---|---|
| LotusScript | `NotesDominoQuery` (`Err = 4854` on failure) |
| Java | `lotus.domino.DominoQuery` (failure throws a `NotesException`) |
| SSJS / XPages | `DominoQuery` via the Java back-end |

The engine and its messages are identical across languages — the four-segment text, the three-rung ladder, and the catalog behaviour are all engine-level. The only difference is packaging: LotusScript flattens every failure to `Err = 4854` (so you read `Error$`), while Java surfaces a `NotesException` whose message carries the same detailed-reason line. In every case, the diagnosis is in the text.
