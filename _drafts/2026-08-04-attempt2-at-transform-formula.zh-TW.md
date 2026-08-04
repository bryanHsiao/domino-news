---
title: "深入理解 @Transform 函數：HCL Domino 中的清單處理"
description: "探索 HCL Domino 中的 @Transform 函數，學習如何對清單中的每個元素應用公式，並返回結果清單。"
pubDate: "2026-08-04T08:11:41+08:00"
lang: "zh-TW"
slug: "at-transform-formula"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "@Transform (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language"
  - title: "Working with @functions"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html"
  - title: "@Nothing"
    url: "https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=functions-nothing"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 2
slug: at-transform-formula
topicOverlap: false
issues:
  [critical] Reference: https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language
      problem: Primary citation points to IBM documentation for Domino Designer 10.0.1. HCL acquired Domino from IBM and maintains its own documentation portal. The authoritative current source is help.hcl-software.com, not ibm.com. Publishing an IBM docs link as the main reference for an HCL Domino article is factually misleading about who owns and maintains the product.
      fix:     Replace with the equivalent HCL documentation URL, e.g. https://help.hcl-software.com/dom_designer/14.0.0/basic/H_TRANSFORM_FORMULA_LANGUAGE.html (verify liveness). Drop the IBM link entirely.
  [critical] Reference: https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=functions-nothing
      problem: The @Nothing reference points to IBM Domino Designer 8.5.3 documentation — a version that is many years out of support. This is both a branding problem (IBM, not HCL) and a version-accuracy problem. Citing an 8.5.3 doc page for a concept being presented as current best practice is not acceptable for publication.
      fix:     Replace with the HCL documentation equivalent for a supported release (12.x or 14.x). Verify the correct URL on help.hcl-software.com.
  [major] Example 3: Filter Specific Elements from a List / @Nothing behaviour
      problem: The article states that @Nothing 'indicates that the element will not be included in the result list' as if this is straightforward. In practice @Nothing inside @Transform removes the element from the output list, but @Nothing's behaviour is context-sensitive: outside of list-building contexts it collapses to an empty string or can cause unexpected results. The article presents filtering via @Nothing as a simple general technique without any caveat about its context-dependence or that the output list will be shorter than the input list (which can break index-parallel list assumptions).
      fix:     Add a note that when @Nothing is returned for one or more elements, the output list will be shorter than the input list. Warn readers that downstream formulas relying on positional correspondence between the original list and the transformed list will break. Also note that @Nothing behaviour is context-sensitive.
  [major] The first returned value determines the data type of the list; subsequent values must be of the same type.
      problem: This is an oversimplification. The behaviour when subsequent iterations return a different type from the first is not simply 'must be the same type' — Domino formula language will attempt coercion in some cases and produce an error in others. Stating it as a hard rule without explaining the coercion/error behaviour could mislead developers into thinking mixed-type results always error, or that coercion is always safe.
      fix:     Clarify that mixed types will cause a type-mismatch error; coercion does not reliably occur across all type combinations. Recommend ensuring the formula always returns a consistent type, and consider adding a note about what happens when @Nothing is the only result (empty list).
  [major] combines the results into a new list … particularly useful for batch processing
      problem: The article frames @Transform purely as a list-transformation tool and does not mention the important alternative of @For/@While loops in formula language for iterative processing, nor does it compare @Transform with the @Explode/@Implode pattern or with computed subforms/column formulas where @Transform is especially common. Readers unfamiliar with formula language may not realise when @Transform is the right tool versus alternatives.
      fix:     Add a brief 'When to use @Transform vs alternatives' section noting @For/@While for stateful iteration, and @Explode/@Implode for string-splitting scenarios. This would make the article genuinely educational rather than just a syntax summary.
  [minor] variableName: The name of a variable representing the list element in the formula.
      problem: The article does not mention that variableName must be passed as a string literal (quoted), not as an actual variable reference. The examples show this correctly, but the parameter description does not make it explicit. A beginner could write @Transform(list; myVar; ...) without quotes and be confused by the error.
      fix:     Add '(must be supplied as a quoted string literal, e.g. "name")' to the variableName parameter description.
  [minor] Article title: Mastering the @Transform Function
      problem: The article is a shallow introduction covering syntax and three basic examples. The word 'Mastering' overpromises significantly. There is no coverage of nested @Transform calls, interaction with multi-value field storage separators, performance considerations on large lists, or use inside column formulas vs. agent formulas.
      fix:     Retitle to something like 'A Practical Introduction to @Transform: List Processing in HCL Domino' or substantially expand the content to justify 'Mastering'.
-->

## 什麼是 @Transform 函數？

在 HCL Domino 的公式語言中，`@Transform` 函數允許您對清單（list）中的每個元素應用特定的公式，並將結果組合成新的清單。這對於需要對清單元素進行批次處理的情境非常有用。

**語法：**

```plaintext
@Transform( list ; variableName ; formula )
```

- `list`：要處理的文字、數字或時間日期清單。
- `variableName`：在公式中代表清單元素的變數名稱。
- `formula`：應用於每個清單元素的公式，必須返回一個值。

**返回值：**

返回應用公式後的清單。第一個返回值決定清單的資料類型，後續的返回值必須與之相同。

## 使用範例

### 範例 1：將清單中的每個元素轉換為大寫

假設有一個包含多個名稱的清單，您希望將每個名稱轉換為大寫。

```plaintext
@Transform(NamesList; "name"; @UpperCase(name))
```

在此範例中，`@UpperCase` 函數被應用於 `NamesList` 中的每個元素，結果是一個所有名稱都轉為大寫的新清單。

### 範例 2：對數字清單中的每個元素加倍

如果有一個數字清單，您希望將每個數字加倍。

```plaintext
@Transform(NumbersList; "num"; num * 2)
```

這將返回一個新的清單，其中每個數字都是原始清單中對應數字的兩倍。

### 範例 3：過濾清單中的特定元素

您可以使用 `@Transform` 結合 `@If` 來過濾清單。例如，從清單中移除所有值為 "N/A" 的元素。

```plaintext
@Transform(DataList; "item"; @If(item = "N/A"; @Nothing; item))
```

在此範例中，`@If` 函數檢查每個元素是否為 "N/A"。如果是，則返回 `@Nothing`，這表示該元素不會包含在結果清單中。否則，該元素將被保留。

## 注意事項

- 如果公式的某次迭代返回錯誤，`@Transform` 會返回錯誤。
- 如果公式的某次迭代返回 `@Nothing`，則該元素不會被添加到返回的清單中。

透過熟練使用 `@Transform` 函數，您可以在 HCL Domino 中有效地處理和轉換清單資料，提升應用程式的靈活性和功能性。

**參考資料：**

- [@Transform (Formula Language)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language)
- [Working with @functions](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html)
- [@Nothing](https://www.ibm.com/docs/en/domino-designer/8.5.3?topic=functions-nothing)
