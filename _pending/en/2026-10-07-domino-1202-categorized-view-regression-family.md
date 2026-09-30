---
title: "The 12.0.2 'Documents Vanish Under a Sub-Category' Regression Family — Four KBs, Two notes.ini Parameters, Matched to Your Interface"
description: "After upgrading to 12.0.2, a multi-level categorized view shows only the topmost layer — the documents under the sub-category are gone. You search the symptom, find a KB, add its notes.ini parameter, and it 'did not work' — because this isn't one bug, it's a whole family: four official KBs, two different parameters. The client-side @PickList and embedded views use EnableExtendedFindByKey=0 (fixed in FP1); XPages uses DISABLE_REFIND_IN_READENTRIES=1 (fixed in FP3/14.0). This piece maps all four KBs into one table so you match your interface first, then set the right parameter."
pubDate: 2026-10-07T07:30:00+08:00
lang: en
slug: domino-1202-categorized-view-regression-family
tags:
  - "Notes Client"
  - "XPages"
  - "Admin"
sources:
  - title: "XPages: Unable to get document when filtering a multi-column category and the next column is a category (KB0102504) — HCL Customer Support (official)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504"
  - title: "When using Picklist dialog in a view with categories and subcategories, topmost layer are only showing (KB0102042) — HCL Customer Support (official)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042"
  - title: "When using Show single category in Embedded view along with subcategory, topmost layer are only showing (KB0102043) — HCL Customer Support (official)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102043"
  - title: "Embedded views only show first category (KB0101979) — HCL Customer Support (official)"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0101979"
relatedJava: []
relatedSsjs: []
---

After you upgrade to 12.0.2, one of your multi-level categorized views starts losing rows: the category and sub-category headers are all there, but **under one level only the top document survives — the rest are gone**. The same design worked on 12.0.1.

You search the symptom, find an HCL KB, add the parameter it names to `notes.ini`, restart — and nothing changes. So you start second-guessing whether you typed it right.

You didn't. The problem is that **the KB you found may not match your interface**. This 12.0.2 "documents vanish under a sub-category" isn't a single bug — it's a **whole family**: four official KBs across four different interfaces, and they split into **two groups, two different parameters, fixed in two different fixpacks**. This piece maps all four into one table. The whole point is one sentence: **work out which group you're in first, then set the matching parameter.**

---

## TL;DR

- **Four official KBs, one affected layer**: to handle view updates better, this 12.0.2 wave touched the lookup behavior in NIF (Notes' view-index layer), introducing regressions on several of the paths that "reach down under a sub-category to fetch documents."
- **But they're two groups, not one bug** — two different parameters, a distinct SPR on the Group B side, and fixes landing separately in FP1 and FP3/14.0 all point to two independent changes in that layer:

| Interface | Symptom | Parameter (scope) | Fixed in | KB |
|---|---|---|---|---|
| `@PickList` / `PicklistCollection` dialog | only the topmost sub-category layer shows | `EnableExtendedFindByKey=0` (**client**) | 12.0.2 FP1 | [KB0102042](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042) |
| Embedded view "Show single category" + sub-category | only the topmost layer shows | `EnableExtendedFindByKey=0` (**client**) | 12.0.2 FP1 | [KB0102043](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102043) |
| Embedded view | only the first category's documents show | `EnableExtendedFindByKey=0` (**client**) | 12.0.2 FP1 | [KB0101979](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0101979) |
| XPages multi-column category, next column also a category | shows the category but not the document | `DISABLE_REFIND_IN_READENTRIES=1` (**server**) | 12.0.2 FP3 / 14.0 | [KB0102504](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504) |

- **The shortcut**: is the problem on a **Notes client screen** (picklist, embedded view)? → the first three rows, client-side `EnableExtendedFindByKey=0`. Is it in **XPages** (the server reading view entries)? → the last row, server-side `DISABLE_REFIND_IN_READENTRIES=1`.
- **The real fix is always the fixpack**: the parameter is a stopgap; remove it once you upgrade to the matching version.

## One symptom, four interfaces

All four KBs describe the same visible symptom: **in a multi-level categorized view, reaching down under a sub-category to fetch documents returns only the topmost one (or batch) — the rest never appear**. All four have "Applies to" 12.0.2.

Three of them (Group A, next section) quote the same official cause —

> A new functionality was added in Notes 12.0.2 that was to do an advanced form of NIF lookup by default that can better handle updating of views.

In plain terms: to keep views up to date after documents change, 12.0.2 touched the NIF lookup. NIF is the layer under Notes/Domino responsible for view indexing — `FindByKey`, `ReadEntries`, all the view-entry reads go through it. The fourth KB (Group B, the XPages one) names a different cause: when 12.0.2 fixed another issue (SPR# PJONB7GRUL), `ReadEntries` gained a refind step.

Both point at the same NIF layer, the same 12.0.2 "better view updating" wave, and the same symptom — documents unreachable under a sub-category — so they read like one family. But they're two different changes in that layer (which is exactly why the parameter isn't universal), split out in the next section.

## Group A: the client-side extended FindByKey (`EnableExtendedFindByKey=0`, fixed in FP1)

Three KBs hit screens **the Notes client draws itself**, and they share one client-side parameter:

- **[KB0102042](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042)** — using `@PickList` (formula) or `NotesUIWorkspace.PicklistCollection` (LotusScript) to pick documents from a view with categories and sub-categories, the dialog **lists only the topmost documents in a sub-category**; the rest don't appear.
- **[KB0102043](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102043)** — an embedded view with "Show single category" plus a sub-category **shows only the topmost layer** the same way.
- **[KB0101979](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0101979)** — an embedded view **shows only the first category's documents**; the rest are invisible.

The workaround for all three is identical: in the **client** `notes.ini`, add

```
EnableExtendedFindByKey=0
```

then restart the Notes client. The KBs' cause text only says "advanced form of NIF lookup," not "find-by-key" — but the parameter name `EnableExtendedFindByKey` itself points to that path. HCL is clear about what the parameter does: it makes the picklist dialog / embedded-view **display** fall back to the pre-12.0.2 processing, with no impact on other parts of an application. KB0102043 adds one important sentence:

> Adding this INI will change the functionality on how the view works by not using the latest indexer changes but it will only effect the HCL Notes clients with that INI and not the HCL Domino Server indexing.

In other words, this is a **client-only** switch — it affects only the Notes client that carries the line, and **does not touch Domino Server indexing**. You don't need to, and shouldn't, add it on the server to fix this group. All three carry a Resolved version of **12.0.2 FP1**.

## Group B: the server-side ReadEntries refind (`DISABLE_REFIND_IN_READENTRIES=1`, fixed in FP3 / 14.0)

The fourth KB is a **different group** — [KB0102504](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504): an XPages view categorized on multiple columns, where filtering lands on a level whose "next column is still a category," **shows the category but not the document**. It belongs to the same broad theme as Group A ("12.0.2 changed view lookup"), but the differences are concrete:

- **Different interface**: this one is **XPages reading view entries** (the server-side `ReadEntries`), not a Notes-client screen.
- **Different parameter**: the workaround is the **server-side** `DISABLE_REFIND_IN_READENTRIES=1`, not the client-side `EnableExtendedFindByKey=0`.
- **A different SPR as cause**: HCL's wording is "a regression caused by another issue (SPR# PJONB7GRUL) that was fixed in 12.0.2"; and reading from the parameter name `DISABLE_REFIND_IN_READENTRIES`, that fix evidently gave `ReadEntries` a "refind" (re-position) step, which drops the document when reaching down through nested categories (the regression itself is SPR# MNIACMGKUV).
- **A later fix version**: Resolved in **12.0.2 FP3 and 14.0**, not Group A's FP1.

I have a full walk-through of this one — including a trap many people hit *by accident*, where a single `\` in a categorized column formula quietly turns the view into nested categories: see [XPages: documents don't show when a multi-column category's next column is also a category](/domino-news/en/posts/xpages-multi-column-category-document/). Here it just takes its place on the family map: **Group B, server-side, FP3/14.0.**

## Working out which one you have

You don't need to memorize KB numbers — follow the interface:

1. **Who draws the screen?**
   - A **Notes client** picklist dialog, or an embedded view → **Group A**: add `EnableExtendedFindByKey=0` to the client `notes.ini`, upgrade to **FP1**.
   - **XPages** (an XPages view running in a browser / Nomad Web) → **Group B**: add `DISABLE_REFIND_IN_READENTRIES=1` to the server `notes.ini`, upgrade to **FP3 / 14.0**.
2. **Added the parameter and nothing changed?** Check you targeted the right side first — Group A's parameter does nothing on the server, and Group B's does nothing on the client. Getting the scope (client vs server) backwards is the most common "did not work."
3. **Still wrong?** It may be a neighbor outside this family (next section), or not this batch of regressions at all — go back and confirm the symptom really is "documents vanish under a sub-category," and the version really is 12.0.2.

## A neighbor: by-key lookup in multi-level categories (a different problem, same ground)

There's a close look-alike that **does not belong to this 12.0.2 family** but is worth knowing alongside it: in a multi-level categorized view, using `GetAllDocumentsByKey` to reach down returns a silently wrong count — it stops at the first sub-category and doesn't go deeper. That's a **semantics** issue with the `GetAllDocumentsByKey` API under multi-level categories, not a 12.0.2 regression, and neither parameter above touches it. I wrote that one up in [GetAllDocumentsByKey in a multi-level categorized view](/domino-news/en/posts/by-key-lookup-categorized-views/).

It sits here because the ground overlaps so neatly: both happen on "multi-level categories + positioning down by key," and Group A's client parameter is literally named `EnableExtendedFindByKey` — **FindByKey**. When you hit "something's wrong under a sub-category," sorting out whether you've struck the 12.0.2 display regression (this piece) or the `GetAllDocumentsByKey` by-key semantics (that piece) saves a lot of dead-end chasing.

## The real fix is always the fixpack

Both parameters are **stopgaps**, not destinations:

- Group A (picklist / embedded view): **12.0.2 FP1** fixes it; afterwards, remove `EnableExtendedFindByKey=0` from the client `notes.ini`.
- Group B (XPages): **12.0.2 FP3 or 14.0**; afterwards, remove `DISABLE_REFIND_IN_READENTRIES=1` from the server `notes.ini`.

Both are "turn off one of 12.0.2's internal changes" settings — leaving them in `notes.ini` long-term means permanently opting out of what that change was meant to bring (better view updating). Schedule the fixpack when you can, and clear the setting once you're on it.

## Wrap-up

The 12.0.2 "documents vanish under a sub-category" is **a family, not a single bug**: four official KBs (KB0102042 / KB0102043 / KB0101979 / KB0102504) share the same NIF layer, the same 12.0.2 wave, and the same class of symptom — but they're two independent changes, a clean split into two groups — **client-side picklist / embedded view via `EnableExtendedFindByKey=0`, fixed in FP1**; **XPages via `DISABLE_REFIND_IN_READENTRIES=1`, fixed in FP3/14.0**. The parameter isn't universal, so the order is always match the interface first, then set the parameter; and whichever group you're in, the real fix is upgrading to the matching fixpack and removing the stopgap.
