---
title: "在 DQL 中使用 Notes Formula 語言"
description: "本文介紹如何在 Domino 查詢語言（DQL）中整合 Notes Formula 語言，以增強查詢功能，並提供實際範例說明其應用。"
pubDate: "2026-05-14T07:30:30+08:00"
lang: "zh-TW"
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

## 在 DQL 中使用 Notes Formula 語言

HCL Domino 的 Domino 查詢語言（DQL）提供了一種強大的方式來查詢資料庫中的文件。從 Domino 12 開始，DQL 支援整合 Notes Formula 語言，允許開發者在查詢中使用複雜的公式語法，以實現更靈活的查詢條件。

### 什麼是 Notes Formula 語言？

Notes Formula 語言是一種專為 HCL Notes 和 Domino 設計的腳本語言，主要用於資料處理和邏輯運算。它提供了大量的 `@` 函數，可用於計算、資料轉換和邏輯判斷等操作。

### 在 DQL 中整合 Formula 語言

在 DQL 中，可以使用 `@FL` 或 `@FORMULA` 關鍵字來嵌入 Formula 語言的語法。這使得開發者能夠在查詢中使用 Formula 語言的強大功能。

**範例 1：**

```dql
in ('f14') and @formula('@doclength < 2500') and @formula('@length(title) > 15')
```

此查詢選擇位於視圖 'f14' 中，且文件長度小於 2500 字節，並且標題長度大於 15 的文件。

**範例 2：**

```dql
@fl('@Select(@Month(dob); "January"; "February"; "March";  "April"; "May"; "June"; "July"; "August";  "September"; "October"; "November"; "December")') = 'September'
```

此查詢選擇出生月份為九月的文件。

**範例 3：**

```dql
@formula('@Matches(customer_responses;"reaction *": "belong *")') OR company_name contains ('Acme', 'Consolidated', 'Tool*')
```

此查詢選擇 `customer_responses` 欄位中包含 "reaction *" 或 "belong *" 的文件，或者公司名稱包含 'Acme'、'Consolidated' 或以 'Tool' 開頭的名稱的文件。

### 注意事項

- **公式長度限制：** Formula 語言的文本最大允許長度為 256 字節。
- **錯誤處理：** DQL 不會在執行前測試錯誤狀態，也不會驗證找到的文件。開發者需要自行驗證公式語法和語意。
- **支援的函數：** 由於某些 Formula 語言的結構高度依賴於上下文，因此並非所有的 Formula 語法都支援在 DQL 中使用。

透過在 DQL 中整合 Notes Formula 語言，開發者可以利用其強大的函數庫和靈活的語法，實現更複雜和精確的查詢條件，從而提升應用程式的功能和性能。

**參考資料：**

- [Formula Language in Domino Query Language](https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_formulalanguage.html)
- [Formula Language Syntax](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_SYNTAX.html)
- [Evaluating Formulas - HCL Domino C API Documentation](https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Evaluating_Formulas/)
