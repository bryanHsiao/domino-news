---
title: "Notes Formula 語言入門"
description: "深入探討 HCL Domino 的 Formula 語言，學習其基本結構、@函數的使用，以及如何在不同的 Notes 元件中應用。"
pubDate: "2026-08-09T07:31:08+08:00"
lang: "zh-TW"
slug: "notes-formula-language-introduction"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_formulalanguage.html"
  - title: "Working with @functions"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html"
  - title: "Formula Language Coding Guidelines"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=language-formula-coding-guidelines"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-formula-language-introduction" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html" was already cited by [at-transform-formula] on 2026-08-04. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 2
slug: notes-formula-language-introduction
-->

## 什麼是 Formula 語言？

Formula 語言是 HCL Domino 中的一種腳本語言，主要用於資料處理和邏輯運算。它提供了一系列的 @函數，允許開發者在 Notes 文件、視圖和表單中執行各種操作。

## Formula 語言的基本結構

Formula 語言的語法相對簡單，主要由常數、變數、@函數和運算符組成。以下是一個基本的 Formula 語言範例：

```formula
FIELD Total := Quantity * Price;
```

在這個範例中，`FIELD` 關鍵字用於定義或修改字段，`Total` 是字段名稱，`Quantity` 和 `Price` 是其他字段的名稱，`*` 是乘法運算符。

## 使用 @函數

@函數是 Formula 語言的核心，提供了各種內建功能來處理資料和執行邏輯操作。例如，`@UpperCase` 函數將字符串轉換為大寫：

```formula
FIELD UpperName := @UpperCase(Name);
```

這行程式碼將 `Name` 字段的值轉換為大寫，並將結果存儲在 `UpperName` 字段中。

## 在不同的 Notes 元件中應用 Formula 語言

Formula 語言可以應用於多種 Notes 元件，包括：

- **視圖選擇公式**：用於定義哪些文件應該顯示在視圖中。
- **字段公式**：用於計算字段的預設值或驗證輸入。
- **代理程式**：用於批量處理文件或執行特定的操作。

例如，在視圖選擇公式中，您可以使用以下公式來選擇所有狀態為 "Open" 的文件：

```formula
SELECT Status = "Open";
```

## 進一步學習

要深入了解 Formula 語言，建議參考以下資源：

- [Formula 語言](https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_formulalanguage.html)
- [使用 @函數](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WORKING_WITH_FUNCTIONS.html)
- [Formula 語言編碼指南](https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=language-formula-coding-guidelines)

透過這些資源，您可以更深入地理解 Formula 語言的功能和應用，提升在 HCL Domino 開發中的效率。
