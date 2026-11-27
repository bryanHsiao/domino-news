---
title: "深入解析 @DbLookup 函數：從外部資料庫檢索資料"
description: "本文詳細介紹如何使用 @DbLookup 函數從外部資料庫檢索資料，包括語法、參數和實際應用示例。"
pubDate: "2026-11-27T12:51:30+08:00"
lang: "zh-TW"
slug: "dblookup-formula-function"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Server"
sources:
  - title: "@DbLookup (Formula Language)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_ODBC.html"
  - title: "Accessing data outside the current document and database"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ACCESSING_DATA_OUTSIDE_THE_CURRENT_DOCUMENT_AND_DATABASE.html"
  - title: "Formulas that look for values in columns and views"
    url: "https://help.hcl-software.com/dom_designer/beta/12.0.1/basic/H_ABOUT_FORMULAS_THAT_LOOK_FOR_VALUES_IN_COLUMNS_AND_VIEWS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_ODBC.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: dblookup-formula-function
-->

## 什麼是 @DbLookup 函數？

`@DbLookup` 是 HCL Domino 中的公式語言函數，允許開發者從指定的資料庫和視圖中檢索資料。這對於需要從其他文件或資料庫中獲取資訊的應用程式非常有用。

## 語法與參數

`@DbLookup` 的基本語法如下：

```formula
@DbLookup( "Notes" : "NoCache" ; server : database ; view ; key ; fieldNameOrColumnNumber )
```

- **"Notes" : "NoCache"**：指定操作的是 Domino 資料庫，且不使用快取。
- **server : database**：指定伺服器和資料庫名稱。使用空字串（""）表示當前伺服器或資料庫。
- **view**：要查詢的視圖名稱。
- **key**：要匹配的鍵值，與視圖中第一個排序的列進行比較。
- **fieldNameOrColumnNumber**：要返回的欄位名稱或列號。

## 使用示例

假設我們有一個名為 "Products" 的資料庫，其中包含一個名為 "AllProducts" 的視圖，該視圖的第一列是產品名稱，第二列是價格。以下公式將返回名為 "Laptop" 的產品價格：

```formula
@DbLookup( "Notes" : "NoCache" ; "" : "Products.nsf" ; "AllProducts" ; "Laptop" ; 2 )
```

在此示例中：

- **"Notes" : "NoCache"**：指定操作的是 Domino 資料庫，且不使用快取。
- **"" : "Products.nsf"**：表示當前伺服器上的 "Products.nsf" 資料庫。
- **"AllProducts"**：視圖名稱。
- **"Laptop"**：要查找的鍵值。
- **2**：返回視圖的第二列，即價格。

## 注意事項

- **排序要求**：`@DbLookup` 依賴於視圖的第一列進行查找，因此該列必須排序。未排序的列可能導致不可預測的結果。

- **返回值限制**：`@DbLookup` 返回的資料最大為 64KB。如果返回的資料超過此限制，可能會導致錯誤。

- **錯誤處理**：如果查找失敗，`@DbLookup` 會返回錯誤。可以使用 `@IsError` 函數來檢測並處理這些錯誤。

## 結論

`@DbLookup` 是一個強大的函數，允許開發者從外部資料庫和視圖中檢索資料。正確理解其語法和參數，並注意使用中的注意事項，可以有效地提高應用程式的功能和性能。

有關更多資訊，請參閱 [@DbLookup (Formula Language)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DBLOOKUP_ODBC.html) 和 [從當前文件和資料庫外部訪問資料](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ACCESSING_DATA_OUTSIDE_THE_CURRENT_DOCUMENT_AND_DATABASE.html)。
