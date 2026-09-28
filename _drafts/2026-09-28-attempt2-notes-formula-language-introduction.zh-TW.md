---
title: "Notes Formula 語言入門"
description: "本文介紹 HCL Domino 中的 Formula 語言，涵蓋其基本結構、@Functions 和 @Commands 的使用，以及如何在應用程式中實現動態行為。"
pubDate: "2026-09-28T09:27:56+08:00"
lang: "zh-TW"
slug: "notes-formula-language-introduction"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html"
  - title: "Formula Language Coding Guidelines"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=language-formula-coding-guidelines"
  - title: "Formula Language @Functions A-Z"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTES_FORMULA_LANGUAGE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-formula-language-introduction" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-formula-language-introduction
-->

## 什麼是 Formula 語言？

Formula 語言是 HCL Domino 中的一種腳本語言，主要用於在 Notes 應用程式中執行計算、邏輯判斷和資料操作。它由兩部分組成：@Functions 和 @Commands。

- **@Functions**：用於執行計算和邏輯操作，返回一個值。例如，`@Length` 函數可用於計算字串的長度。

- **@Commands**：用於執行用戶介面操作，如打開資料庫、創建郵件等。

## Formula 語言的基本結構

Formula 語言的語法相對簡單，主要由表達式和函數組成。以下是一個基本的 Formula 語言範例：

```formula
@If(@IsNewDoc; "新文件"; "現有文件")
```

在這個範例中，`@If` 函數根據 `@IsNewDoc` 的返回值來決定返回 "新文件" 或 "現有文件"。

## 使用 @Functions

@Functions 是 Formula 語言的核心，提供了各種內建函數來執行特定的計算或邏輯操作。以下是一些常用的 @Functions：

- `@Length(text)`：返回字串的長度。
- `@UpperCase(text)`：將字串轉換為大寫。
- `@Date(year; month; day)`：創建一個日期值。

例如，以下公式計算字段 "Subject" 的長度：

```formula
@Length(Subject)
```

## 使用 @Commands

@Commands 用於執行用戶介面操作，通常用於按鈕或菜單選項中。以下是一些常用的 @Commands：

- `@Command([Compose]; "Memo")`：創建一封新的郵件。
- `@Command([OpenView]; "All Documents")`：打開 "所有文件" 視圖。

例如，以下公式創建一個按鈕，點擊後打開 "所有文件" 視圖：

```formula
@Command([OpenView]; "All Documents")
```

## 在應用程式中添加公式

在 HCL Domino Designer 中，您可以在多個地方使用 Formula 語言來實現動態行為：

- **字段公式**：用於設置字段的預設值或驗證輸入。
- **按鈕公式**：用於定義按鈕點擊時執行的操作。
- **代理程式**：用於批量處理文檔或執行定時任務。

例如，您可以在字段的 "預設值" 屬性中使用以下公式來設置當前日期：

```formula
@Today
```

## 結論

Formula 語言是 HCL Domino 中強大且靈活的工具，允許開發人員在應用程式中實現各種動態行為。通過熟悉其語法和函數，您可以有效地增強 Notes 應用程式的功能和用戶體驗。

有關更多詳細資訊，請參閱 [Formula 語言](https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html) 和 [Formula 語言編碼指南](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=language-formula-coding-guidelines)。
