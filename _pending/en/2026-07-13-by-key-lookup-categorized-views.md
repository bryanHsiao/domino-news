---
title: "GetAllDocumentsByKey in Multi-Level Categorized Views: Why Your Count Is Silently Wrong"
description: "In a single-level categorized view, GetAllDocumentsByKey('Belgien', True) correctly returns the 2 documents under that category. But add a second level of categorization — Form then Country — and GetAllDocumentsByKey('Customer', True) returns 3, not all the documents. It stops at the first sub-category. This article documents the empirically verified trap and the workarounds."
pubDate: 2026-07-13T07:30:00+08:00
lang: en
slug: by-key-lookup-categorized-views
tags:
  - "LotusScript"
  - "Domino Designer"
  - "Tutorial"
sources:
  - title: "NotesView.GetAllDocumentsByKey method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETALLDOCUMENTSBYKEY_METHOD.html"
  - title: "NotesView.GetDocumentByKey method — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDOCUMENTBYKEY_METHOD.html"
  - title: "Domino Back to Basics Part 5: Finding data — NotesSensei (Stephan Wissel)"
    url: "https://www.wissel.net/blog/2014/01/domino-development-back-to-basics-part-5-finding-data-collections-and-search.html"
relatedJava: ["View"]
relatedSsjs: ["View"]
---

In a view categorized by Country, `GetAllDocumentsByKey("Belgien", True)` returns 2 — Maison Dewey and Suprêmes délices. That's correct. Single-level categorization and by-key lookups work exactly as you'd expect.

Now add a second level of categorization. A view "cc" categorized first by Form, then by Country:

```
▼ Customer              ← first-level category (Form)
  ▼ Argentinien         ← second-level category (Country)
      Cactus Comidas para llevar (CACTU)
      Océano Atlántico Ltda. (OCEAN)
      Rancho grande (RANCH)
  ▼ Belgien
      Maison Dewey (MAISD)
      Suprêmes délices (SUPRD)
  ▼ Brasilien
      Comércio Mineiro (COMMI)
      ...9 more documents
  ▼ Dänemark
      Simons bistro (SIMOB)
      ...
```

Call `GetAllDocumentsByKey("Customer", True)`. You expect every document under the "Customer" category — all countries, all documents. The answer comes back: **3**. Not the full count. Just the three documents under Argentinien, the first sub-category.

No error. No warning. A plausible-looking number. You ship it.

---

## TL;DR

- **Single-level categorized view + by-key = works correctly.** Pass the category value, get all documents in that category.
- **Multi-level categorized view + single key = silently truncated.** The lookup stops at the first sub-category boundary. You get a partial result that *looks* right (it's a valid count, not zero, not an error) but is missing everything below the remaining sub-categories.
- The `GetAllDocumentsByKey` docs say keys match "sorted columns left to right" — but they don't warn that a single key in a multi-category view returns only the first sub-category's documents.
- **Workarounds:** use a flat (non-categorized) lookup view; or use [`db.Search`](/domino-news/en/posts/lotusscript-db-search) / [DQL](/domino-news/en/posts/dql-getting-started) which don't depend on the view's category structure; or iterate sub-categories explicitly with `GetAllEntriesByKey`.

## What single-level categorization gets right

To be clear about the baseline: a view with one categorized column works as expected. The [five-pitfalls guide](/domino-news/en/posts/getalldocumentsbykey) covers the normal by-key mechanics — keys match sorted columns left to right, `exactMatch` defaults to False, etc. In a Customers view categorized by Country alone, `GetAllDocumentsByKey("Belgien", True)` correctly returns the 2 documents under Belgien. Nothing surprising.

The trap only appears when the view has **category-within-category**.

## The empirical proof

View "cc" — two categorized columns:

| Column | Role | Sorted | Categorized |
|---|---|---|---|
| Form | First-level category | Yes | Yes |
| Country | Second-level category (nested under Form) | Yes | Yes |
| Subject | Display | — | No |

Code:
```lotusscript
Sub Initialize
  On Error GoTo errH
  Dim ss As New NotesSession
  Dim db As NotesDatabase
  Set db = ss.CurrentDatabase
  Dim v As NotesView
  Set v = db.GetView("cc")
  Dim dc As NotesDocumentCollection
  Set dc = v.GetAllDocumentsByKey("Customer", True)
  MsgBox dc.Count
  Exit Sub
errH:
  MsgBox "get error: " + Error + " on line: " + CStr(Erl)
End Sub
```

Result: **3** — only the documents under Argentinien (the first sub-category). Not the 20+ documents across all countries under "Customer".

The lookup found the first-level category "Customer", descended into its first sub-category "Argentinien", returned those 3 documents, and stopped. Belgien's 2, Brasilien's 9, Dänemark's 2, and every other country's documents are silently absent.

## Why this is a landmine

Three reasons this bites harder than most API quirks:

1. **The result is plausible, not zero.** You get a count of 3 — a real number, from real documents. If the real answer were 0 you'd investigate immediately. But 3 looks like it could be right, especially if you don't know the exact expected total.

2. **No error, no warning.** The method doesn't throw, doesn't return `Nothing`, doesn't set a flag. It returns a valid `NotesDocumentCollection` containing valid documents — just not all of them.

3. **The [official docs](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETALLDOCUMENTSBYKEY_METHOD.html) don't describe this behaviour.** They say "the first element in the array is compared to the first sorted column" and warn about the `\\` backslash subcategory bug, but they don't mention that a single key in a multi-category view truncates at the first sub-category. You can read the method page front to back and still not anticipate this.

## Workarounds

**Option 1: Use a flat lookup view.** Build a dedicated view with the columns you need sorted but **not categorized** (or only single-level). A "lookup" view with Form sorted (ascending, no categorize) returns the full result set with a single key.

**Option 2: Use `db.Search` or DQL.** These don't walk the view index at all, so the category structure can't interfere:

```lotusscript
Set dc = db.Search({Form = "Customer"}, Nothing, 0)
Print dc.Count   ' all documents with Form = "Customer"
```

**Option 3: Iterate sub-categories with `GetAllEntriesByKey`.** If you must use the categorized view, use `GetAllEntriesByKey` with the top-level key. The view-entry collection includes the category entries themselves, letting you walk the full tree. But at that point a flat lookup view is usually simpler.

The cleanest answer — and the one that avoids the trap entirely — is a lookup view with no multi-level categorization. As [Stephan Wissel's back-to-basics guide](https://www.wissel.net/blog/2014/01/domino-development-back-to-basics-part-5-finding-data-collections-and-search.html) emphasises, category-within-category is a UI feature for human readers expanding/collapsing groups; it's not a reliable structure for programmatic lookups.

## What about Java and SSJS?

| Language | Equivalent |
|---|---|
| LotusScript | `view.GetAllDocumentsByKey(...)` / `view.GetDocumentByKey(...)` |
| Java | [`View.getAllDocumentsByKey(...)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDOCUMENTBYKEY_METHOD.html) |
| SSJS (XPages) | same as Java |

The behaviour is a property of the view index, not the language — so the same truncation happens in Java and SSJS. The same workarounds apply: flat lookup view, or `db.search` / DQL.
