---
title: "@Transform 函數：批次處理清單元素的強大工具"
description: "深入探討 HCL Domino 中的 @Transform 函數，學習如何對清單中的每個元素應用公式，並返回處理後的清單。"
pubDate: "2026-10-04T10:27:47+08:00"
lang: "zh-TW"
slug: "at-transform-formula"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "@Transform (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language"
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html"
  - title: "Evaluating Formulas - HCL Domino C API Documentation"
    url: "https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Evaluating_Formulas/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "at-transform-formula" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html" was already cited by [notes-formula-language-introduction] on 2026-09-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: at-transform-formula
-->

在 HCL Domino 的公式語言中，`@Transform` 函數是一個強大的工具，允許開發者對清單中的每個元素應用特定的公式，並返回處理後的清單。這對於需要批次處理清單元素的情境特別有用。

## 語法

```
@Transform( list ; variableName ; formula )
```

- **list**：要處理的文字、數字或日期時間清單。
- **variableName**：變數名稱，在公式中引用當前處理的清單元素。
- **formula**：應用於每個清單元素的有效公式，必須返回一個值。

## 使用範例

### 範例 1：計算平方根

假設有一個包含數字的清單，我們希望計算每個數字的平方根。如果數字為負數，則返回其絕對值的負平方根。

```
@Transform(OriginalList; "x";
@If(x >= 0; @Sqrt(x); -@Sqrt(@Abs(x))))
```

此公式對 `OriginalList` 中的每個元素 `x` 進行處理，返回一個新的清單，其中包含每個元素的平方根或負平方根。

### 範例 2：添加前綴

假設有一個文字清單，我們希望在每個元素的開頭添加星號（*），但如果元素已經以星號開頭，則保持不變。

```
FIELD originalCorrected := @Transform(original; "var";
@If(@Begins(var; "*");
var;
"*" + var))
```

此公式創建了一個新欄位 `originalCorrected`，其中包含處理後的清單。

## 注意事項

- 如果公式的某次迭代返回 `@Nothing`，則該元素不會被添加到返回的清單中。
- 如果公式的某次迭代返回錯誤，`@Transform` 會返回錯誤。

透過 `@Transform` 函數，開發者可以更有效地對清單元素進行批次處理，簡化代碼並提高效率。

更多詳細資訊，請參閱 [@Transform 函數官方文件](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-transform-formula-language)。
