---
title: "Notes Formula 語言入門"
description: "介紹 HCL Domino 中的 Formula 語言，包括其語法、@函數和@命令的使用，以及在表單和視圖中的應用。"
pubDate: "2026-06-30T07:26:34+08:00"
lang: "zh-TW"
slug: "notes-formula-language-introduction"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Designer"
sources:
  - title: "Formula Language"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTES_FORMULA_LANGUAGE.html"
  - title: "General syntax rules"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GENERAL_SYNTAX_RULES.html"
  - title: "Formula language"
    url: "https://en.wikipedia.org/wiki/Formula_language"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-formula-language-introduction" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
attempt: 2
slug: notes-formula-language-introduction
-->

## 什麼是 Formula 語言？

Formula 語言是 HCL Domino 中的一種腳本語言，主要用於處理字符串和列表。許多語言元素以 @ 字符開頭，因此也被稱為 @Formula 語言。它最初由 Ray Ozzie 在 Lotus Notes 的早期開發中創建，並在後續版本中進行了重寫和增強。

## Formula 語言的結構

Formula 語言由兩部分組成：

- **@函數**：用於計算和簡單邏輯處理。
- **@命令**：用於執行用戶界面中的操作。

@函數可用於多個地方，例如：

- **選擇文檔**：在視圖中選擇要顯示的文檔，或選擇要進一步處理的文檔。
- **提供字段的默認值**：為字段提供初始值，轉換用戶輸入的數據，或驗證數據。
- **從 Notes 數據庫或關聯數據庫中獲取值**：為用戶提供可選擇的值列表。
- **處理一組文檔**：在代理中使用公式，對每個選定的文檔執行操作。

@命令類似於菜單命令，執行 Notes 客戶端中的操作，例如：

- 打開 Notes 數據庫
- 創建電子郵件
- 將光標放置在特定的數據輸入字段
- 關閉窗口
- 啟動代理

## Formula 語言的語法規則

在編寫 Formula 語言時，需要遵循以下一般語法規則：

- **語句分隔符**：使用分號（;）分隔多個語句。
- **空格**：在運算符、標點和值之間可以有任意數量的空格，但關鍵字之間必須至少有一個空格。
- **大小寫**：除文本常量外，大小寫不敏感。關鍵字通常使用大寫，@函數和@命令名稱使用混合大小寫。
- **運算符和值**：兩個值之間必須至少有一個運算符。

## 在表單和視圖中的應用

在表單設計中，可以編寫以下類型的公式：

- **默認值公式**：為字段提供初始值，當創建文檔時執行。
- **輸入轉換公式**：在用戶輸入數據後，轉換該數據。
- **輸入驗證公式**：在用戶提交數據前，驗證該數據。

在視圖設計中，公式可用於：

- **選擇文檔**：確定哪些文檔應顯示在視圖中。
- **計算列值**：根據文檔字段計算視圖列的值。

## 結論

Formula 語言是 HCL Domino 中強大的工具，允許開發人員在不使用更複雜的編程語言的情況下，實現各種功能。通過理解其語法和應用場景，開發人員可以更有效地設計和管理 Domino 應用程序。

> 參考資料：
> - [Formula Language](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTES_FORMULA_LANGUAGE.html)
> - [General syntax rules](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GENERAL_SYNTAX_RULES.html)
> - [Formula language](https://en.wikipedia.org/wiki/Formula_language)
