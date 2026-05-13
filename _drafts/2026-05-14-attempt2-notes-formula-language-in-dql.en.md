---
title: "Integrating Notes Formula Language in DQL"
description: "This article explores how to integrate Notes Formula Language into Domino Query Language (DQL) to enhance query capabilities, providing practical examples of its application."
pubDate: "2026-05-14T07:30:30+08:00"
lang: "en"
slug: "notes-formula-language-in-dql"
tags:
  - "Tutorial"
  - "DQL"
  - "Formula"
sources:
  - title: "Formula Language in Domino Query Language"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_formulalanguage.html"
  - title: "Formula Language Syntax"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_SYNTAX.html"
  - title: "Evaluating Formulas - HCL Domino C API Documentation"
    url: "https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Evaluating_Formulas/"
draft: true
---
<!--
REJECTED DRAFT — topic overlap with **dql-pitfalls** + 2 critical fact issue(s)
attempt: 2
slug: notes-formula-language-in-dql
topicOverlap: true (overlapWith=dql-pitfalls)
issues:
  [critical] In DQL, the `@FL` or `@FORMULA` keyword can be used
      problem: The article presents `@FL` and `@FORMULA` as two equivalent keyword aliases. Per HCL documentation, the correct DQL keyword is `@formula` (case-insensitive). `@FL` is also accepted as a shorthand, but calling them interchangeable 'keywords' without clarifying that `@FL` is simply an abbreviation of `@formula` is imprecise. More critically, the article never mentions the actual DQL syntax requirement: the formula string must be passed as a single-quoted string argument — e.g. `@formula('...')` — and the entire construct is a DQL term, not a Formula Language call. The article's framing makes it sound like these are two separate keywords with equal standing, which could confuse readers into thinking `@FORMULA(...)` and `@FL(...)` are different functions.
      fix:     Clarify that `@formula` is the canonical DQL keyword and `@fl` is its accepted abbreviation/shorthand. Both take a single-quoted Formula Language string as their sole argument. Remove the implication they are two distinct or interchangeable keywords.
  [critical] Starting with Domino 12, DQL supports the integration of Notes Formula Language
      problem: This version attribution is incorrect. DQL's `@formula` integration was introduced in Domino 11 (specifically 11.0), not Domino 12. Domino 12 added other DQL enhancements, but the `@formula` keyword predates it.
      fix:     Correct the version to Domino 11 (released 2020). Verify against HCL release notes before publishing.
  [major] Example 2: `@fl('@Select(@Month(dob); ...')` = 'September'
      problem: The example compares the result of `@Select` — which returns a text string from a list — to 'September', and that logic is plausible. However, `@Month` returns a number (1–12), not a month name, and `@Select` here is being used to map that number to a month name. While the pattern is technically valid Formula Language, the article presents it without explaining the `@Select` offset mechanic (index 1 = first element). More importantly, the DQL `@formula` term must evaluate to a boolean (TRUE/FALSE) or a value that DQL can interpret as a match condition. The `= 'September'` part sits *outside* the quoted formula string in the example, which means DQL would be comparing the result of the `@fl(...)` term to a string literal — but DQL does not support that comparison syntax for `@formula` terms. The `@formula` term must be self-contained and return a boolean internally. The comparison should be *inside* the formula string.
      fix:     Rewrite Example 2 so the comparison is inside the formula string: `@formula('@Select(@Month(dob); "January"; ...; "December") = "September"')`. Alternatively, use `@formula('@Month(dob) = 9')` which is simpler and correct.
  [major] Formula Length Limit: The maximum allowed length for a Formula Language text term is 256 bytes.
      problem: The HCL documentation for DQL `@formula` integration states the formula string limit is 512 characters (not 256 bytes). Stating 256 bytes is a potentially harmful inaccuracy — developers may artificially truncate formulas that would actually be valid.
      fix:     Verify the exact limit against the cited HCL docs page. If the limit is 512 characters, correct it accordingly. Also prefer 'characters' over 'bytes' since Formula Language strings are character-oriented.
  [major] Error Handling: DQL does not test for error states prior to execution and does not validate documents found.
      problem: This statement is vague to the point of being misleading. The real documented behavior is that if a `@formula` term throws an error during evaluation against a document, DQL silently excludes that document from results rather than aborting the query. This is a critical operational gotcha (documents can be silently dropped) that the article glosses over with an imprecise sentence.
      fix:     Rewrite to explicitly state: if the embedded formula generates an error on a given document (e.g. field doesn't exist, type mismatch), that document is silently excluded from results — not an exception or query failure. Developers must account for this silent-exclusion behavior.
  [major] Missing important context: article does not mention @formula performance implications
      problem: A significant omission: `@formula` terms in DQL cannot use the Design Catalog index — they force a document-by-document scan for the formula portion of the query. When combined with indexed DQL terms (field/view predicates), DQL first narrows via the index and then applies the formula scan to the candidate set. This performance characteristic is critical for production use and is entirely absent from the article.
      fix:     Add a 'Performance' section explaining that `@formula` terms bypass the Design Catalog and trigger per-document formula evaluation. Best practice is to pair `@formula` with indexed DQL predicates to minimize the candidate set before formula evaluation runs.
  [major] Third cited URL: https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Evaluating_Formulas/
      problem: This reference is to the HCL Domino C API documentation about evaluating formulas via the C API (NSFFormulaCompile, NSFFormulaEvaluate, etc.). It is not relevant to DQL `@formula` integration from a LotusScript or DQL developer's perspective. Including it as a reference implies a connection between the C API formula evaluation path and DQL's `@formula` keyword that does not exist at the level this article addresses. It may confuse readers.
      fix:     Remove the C API reference or, if kept, clearly explain it is background material on the underlying formula engine, not guidance for DQL users.
  [minor] Notes Formula Language is a scripting language designed specifically for HCL Notes and Domino
      problem: Formula Language is more accurately described as a functional/declarative expression language, not a general-purpose scripting language. Calling it a 'scripting language' sets a wrong mental model — it has no loops (only list processing), no subroutines, and executes as a single expression. This distinction matters because readers may try to do things in embedded formulas that Formula Language structurally cannot do.
      fix:     Describe it as 'a functional expression language' or 'a formula-based expression language' rather than 'a scripting language'.
  [minor] This query selects documents in view 'f14' with a document length less than 2500 bytes
      problem: `@DocLength` returns the size of the document in bytes as stored in the NSF, which is the on-disk representation size — not a 'document length' in any user-meaningful sense. The description 'document length' is ambiguous.
      fix:     Clarify as 'documents whose on-disk storage size is less than 2500 bytes'.
-->

## Integrating Notes Formula Language in DQL

HCL Domino's Domino Query Language (DQL) offers a powerful means to query documents within databases. Starting with Domino 12, DQL supports the integration of Notes Formula Language, allowing developers to utilize complex formula syntax within queries for more flexible conditions.

### What is Notes Formula Language?

Notes Formula Language is a scripting language designed specifically for HCL Notes and Domino, primarily used for data processing and logical operations. It provides a vast array of `@` functions for calculations, data transformations, and logical evaluations.

### Integrating Formula Language in DQL

In DQL, the `@FL` or `@FORMULA` keyword can be used to embed Formula Language syntax. This enables developers to leverage the robust capabilities of Formula Language within their queries.

**Example 1:**

```dql
in ('f14') and @formula('@doclength < 2500') and @formula('@length(title) > 15')
```

This query selects documents in view 'f14' with a document length less than 2500 bytes and a title length greater than 15.

**Example 2:**

```dql
@fl('@Select(@Month(dob); "January"; "February"; "March";  "April"; "May"; "June"; "July"; "August";  "September"; "October"; "November"; "December")') = 'September'
```

This query selects documents where the month of the `dob` (date of birth) field is September.

**Example 3:**

```dql
@formula('@Matches(customer_responses;"reaction *": "belong *")') OR company_name contains ('Acme', 'Consolidated', 'Tool*')
```

This query selects documents where the `customer_responses` field contains "reaction *" or "belong *", or where the `company_name` field contains 'Acme', 'Consolidated', or names starting with 'Tool'.

### Considerations

- **Formula Length Limit:** The maximum allowed length for a Formula Language text term is 256 bytes.
- **Error Handling:** DQL does not test for error states prior to execution and does not validate documents found. Developers must validate the syntax and semantics of their Formula Language terms.
- **Supported Functions:** Not all Formula Language syntax is supported in DQL due to context dependencies.

By integrating Notes Formula Language into DQL, developers can utilize its extensive function library and flexible syntax to create more complex and precise query conditions, thereby enhancing the functionality and performance of their applications.

**References:**

- [Formula Language in Domino Query Language](https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_formulalanguage.html)
- [Formula Language Syntax](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_SYNTAX.html)
- [Evaluating Formulas - HCL Domino C API Documentation](https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Evaluating_Formulas/)
