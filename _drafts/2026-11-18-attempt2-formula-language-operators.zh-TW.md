---
title: "深入理解 HCL Domino 的公式語言運算子"
description: "本文介紹 HCL Domino 公式語言中的各種運算子，包括算術、比較、邏輯和串聯運算子，並提供實際範例以說明其用法。"
pubDate: "2026-11-18T12:03:51+08:00"
lang: "zh-TW"
slug: "formula-language-operators"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Arithmetic operators"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_ARITHMETIC_OPERATORS.html"
  - title: "Formula Language Rules"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_5_FORMULAS_UNDERSTANDING_THE_NOTES_FORMULA_LANGUAGE.html"
  - title: "Order of evaluation for formula statements"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ORDER_OF_EVALUATION_FOR_FORMULA_STATEMENTS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_ARITHMETIC_OPERATORS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: formula-language-operators
-->

## HCL Domino 公式語言中的運算子概述

在 HCL Domino 的公式語言中，運算子是執行各種計算和邏輯操作的關鍵元素。理解這些運算子的功能和使用方式，對於開發高效且正確的公式至關重要。以下將介紹主要的運算子類型及其應用。

### 算術運算子

算術運算子用於執行基本的數學運算，包括加法、減法、乘法和除法。

- `+`：加法
- `-`：減法
- `*`：乘法
- `/`：除法

**範例**：

```lotusscript
result := 10 + 5;  // result 為 15
result := 10 - 5;  // result 為 5
result := 10 * 5;  // result 為 50
result := 10 / 5;  // result 為 2
```

請注意，除法運算可能會產生小數結果，需根據需求進行處理。

### 比較運算子

比較運算子用於比較兩個值，返回布林值（`True` 或 `False`）。

- `=`：等於
- `!=` 或 `<>`：不等於
- `>`：大於
- `<`：小於
- `>=`：大於或等於
- `<=`：小於或等於

**範例**：

```lotusscript
isEqual := (10 = 5);  // isEqual 為 False
isGreater := (10 > 5);  // isGreater 為 True
```

### 邏輯運算子

邏輯運算子用於組合多個條件，返回布林值。

- `&`：邏輯 AND
- `|`：邏輯 OR
- `!`：邏輯 NOT

**範例**：

```lotusscript
result := (10 > 5) & (5 < 3);  // result 為 False
result := (10 > 5) | (5 < 3);  // result 為 True
result := !(10 > 5);  // result 為 False
```

### 串聯運算子

串聯運算子用於連接兩個或多個字串。

- `+`：串聯字串

**範例**：

```lotusscript
fullName := "John" + " " + "Doe";  // fullName 為 "John Doe"
```

### 運算子的優先順序

在公式語言中，運算子的優先順序決定了運算的執行順序。一般而言，優先順序從高到低如下：

1. 算術運算子：`*`、`/`、`+`、`-`
2. 比較運算子：`=`、`!=`、`>`、`<`、`>=`、`<=`
3. 邏輯運算子：`!`、`&`、`|`

為了確保運算順序符合預期，建議使用括號明確指定運算順序。

**範例**：

```lotusscript
result := (10 + 5) * 2;  // result 為 30
```

### 結論

熟悉 HCL Domino 公式語言中的各種運算子及其優先順序，有助於撰寫更高效且正確的公式。建議在實際應用中多加練習，以鞏固對這些運算子的理解和運用。

更多詳細資訊，請參閱 [算術運算子](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_ARITHMETIC_OPERATORS.html) 和 [公式語言規則](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_5_FORMULAS_UNDERSTANDING_THE_NOTES_FORMULA_LANGUAGE.html)。
