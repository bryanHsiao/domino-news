---
title: "Formula 語言中的 @Exp 函數：計算指數的實用工具"
description: "深入探討 HCL Domino Designer 中 Formula 語言的 @Exp 函數，學習如何在應用程式中有效地計算指數。"
pubDate: "2026-11-22T10:53:21+08:00"
lang: "zh-TW"
slug: "formula-language--exp-function"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "@Exp (Formula Language)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXP.html"
  - title: "Formula Language Rules"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_5_FORMULAS_UNDERSTANDING_THE_NOTES_FORMULA_LANGUAGE.html"
  - title: "Using @functions"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_WAYS_TO_USE_FUNCTIONS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXP.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: formula-language--exp-function
-->

## 介紹

在 HCL Domino Designer 的 Formula 語言中，@Exp 函數是一個強大的工具，用於計算自然對數的底數 e（約為 2.718282）提升至指定的冪次方。這在需要進行指數運算的應用程式中非常有用。

## @Exp 函數的語法

```formula
@Exp( power )
```

- **power**：數值或數值列表，表示 e 要提升的冪次方。請注意，Notes/Domino 只能計算 -11355.1371 到 11356.5234 之間的數值，超出此範圍將返回 @ERROR。

## 返回值

該函數返回一個數值或數值列表，表示 e 提升至指定冪次方的結果。

## 使用範例

1. 計算 e 的 1.25 次方：

   ```formula
   @Exp(1.25)
   ```

   返回值：約為 3.49034295746184。

2. 計算 e 的 -1.25 次方：

   ```formula
   @Exp(-1.25)
   ```

   返回值：約為 0.28650479686019。

3. 計算 e 的 1.25 次方和 -1.25 次方，並返回列表：

   ```formula
   @Exp(1.25 : (-1.25))
   ```

   返回值：約為 3.49034295746184 和 0.28650479686019 的列表。

## 注意事項

- 如果參數是列表，@Exp 函數將對列表中的每個元素進行操作，並返回具有相同元素數量的列表。

- 在使用 @Exp 函數時，確保輸入的數值在允許的範圍內，以避免返回 @ERROR。

## 結論

@Exp 函數在需要進行指數計算的 Formula 語言應用程式中非常有用。透過理解其語法和使用方式，開發者可以更有效地在 HCL Domino Designer 中實現複雜的數學運算。

有關更多資訊，請參閱 [@Exp (Formula Language)](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXP.html) 和 [Formula Language Rules](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_5_FORMULAS_UNDERSTANDING_THE_NOTES_FORMULA_LANGUAGE.html)。
