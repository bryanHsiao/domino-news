---
title: "HCL Notes Formula 語言入門指南"
description: "深入了解 HCL Notes 的 Formula 語言，學習如何在表單和視圖中使用 @Functions 和 @Commands 來增強應用程式功能。"
pubDate: "2026-06-19T07:38:12+08:00"
lang: "zh-TW"
slug: "notes-formula-language-introduction"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Formula Language Coding Guidelines"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_6_FORMULAS_USING_THE_NOTES_FORMULA_LANGUAGE.html"
  - title: "Formula Language @Functions A-Z"
    url: "https://www.ibm.com/support/knowledgecenter/de/SSVRGU_9.0.0/com.ibm.designer.domino.main.doc/H_7_FORMULAS_FUNCTION_REFERENCE.html"
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTES_FORMULA_LANGUAGE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_6_FORMULAS_USING_THE_NOTES_FORMULA_LANGUAGE.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-formula-language-introduction
-->

## 什麼是 Formula 語言？

Formula 語言是 HCL Notes 中的一種腳本語言，主要用於在表單（form）和視圖（view）中執行計算、資料驗證和其他邏輯操作。它提供了一組稱為 @Functions 和 @Commands 的函數，讓開發者能夠輕鬆地操控和顯示資料。

## @Functions 和 @Commands 的區別

- **@Functions**：這些函數用於執行計算和邏輯操作，並返回一個值。例如，`@UpperCase` 將字串轉換為大寫，`@Now` 返回當前日期和時間。

- **@Commands**：這些命令用於執行用戶界面的操作，例如打開文件、切換視圖等。需要注意的是，@Commands 主要在用戶觸發的事件中使用，如按鈕點擊。

## 在表單中使用 Formula 語言

在表單中，Formula 語言常用於：

- **欄位的預設值**：使用公式為欄位設置初始值。例如，為日期欄位設置當前日期：

  ```
  @Now
  ```

- **欄位的輸入驗證**：確保用戶輸入的資料符合特定條件。例如，確保數字欄位的值大於零：

  ```
  @If(數字欄位 > 0; @Success; @Failure("請輸入大於零的數字"))
  ```

## 在視圖中使用 Formula 語言

在視圖中，Formula 語言主要用於：

- **選擇公式（Selection Formula）**：確定哪些文檔應該顯示在視圖中。例如，僅顯示狀態為 "已批准" 的文檔：

  ```
  狀態 = "已批准"
  ```

- **列公式（Column Formula）**：計算並顯示列中的值。例如，顯示姓名的全名：

  ```
  姓 + " " + 名
  ```

## 常用的 @Functions

以下是一些常用的 @Functions：

- `@UpperCase(text)`：將字串轉換為大寫。
- `@LowerCase(text)`：將字串轉換為小寫。
- `@Length(text)`：返回字串的長度。
- `@Now`：返回當前日期和時間。
- `@Text(number)`：將數字轉換為字串。

## 注意事項

- **上下文**：某些 @Functions 和 @Commands 只能在特定的上下文中使用。例如，@Commands 通常需要在用戶觸發的事件中使用。

- **錯誤處理**：使用 `@If` 和 `@Failure` 等函數來處理可能的錯誤情況，確保應用程式的穩定性。

透過熟悉和掌握 Formula 語言，開發者可以在 HCL Notes 中創建更強大和靈活的應用程式。更多詳細資訊，請參閱 [Formula Language Coding Guidelines](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_6_FORMULAS_USING_THE_NOTES_FORMULA_LANGUAGE.html) 和 [Formula Language @Functions A-Z](https://www.ibm.com/support/knowledgecenter/de/SSVRGU_9.0.0/com.ibm.designer.domino.main.doc/H_7_FORMULAS_FUNCTION_REFERENCE.html)。
