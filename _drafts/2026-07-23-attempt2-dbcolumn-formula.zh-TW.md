---
title: "使用 @DbColumn 函數從視圖中擷取資料"
description: "深入探討 HCL Domino 中的 @DbColumn 函數，學習如何從視圖中擷取資料，並了解其語法、參數及實際應用。"
pubDate: "2026-07-23T08:02:53+08:00"
lang: "zh-TW"
slug: "dbcolumn-formula"
tags:
  - "Tutorial"
  - "Formula"
  - "Domino Server"
sources:
  - title: "@DbColumn (Domino data source) (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=functions-dbcolumn-domino-data-source-formula-language"
  - title: "Accessing data outside the current document and database"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_DATA_OUTSIDE_THE_CURRENT_DOCUMENT_AND_DATABASE.html"
  - title: "Formula Language Coding Guidelines"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_6_FORMULAS_USING_THE_NOTES_FORMULA_LANGUAGE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=functions-dbcolumn-domino-data-source-formula-language" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: dbcolumn-formula
-->

## 介紹

在 HCL Domino 的公式語言中，`@DbColumn` 函數允許開發者從指定資料庫的視圖或資料夾中擷取整列的值。這對於需要動態載入選項或關聯資料的應用程式特別有用。

## 語法

```plaintext
@DbColumn( class : cache ; server : database ; view ; columnNumber )
```

- `class`：指定資料庫類型。對於 Domino 資料庫，使用 "Notes" 或空字串（""）。
- `cache`：控制快取行為。可選擇 ""（使用快取）或 "NoCache"（不使用快取）。
- `server`：伺服器名稱。若為本地資料庫，使用空字串（""）。
- `database`：資料庫名稱，包含路徑，例如 "names.nsf"。
- `view`：視圖或資料夾的名稱。
- `columnNumber`：要擷取的欄位編號，從 1 開始計算。

## 使用範例

假設我們有一個名為 "Inventory" 的資料庫，其中包含一個名為 "Products" 的視圖，該視圖的第二欄包含產品名稱。以下公式將擷取該欄的所有值：

```plaintext
@DbColumn(""; "" : "Inventory.nsf"; "Products"; 2)
```

在此範例中：

- `""`：表示使用 Domino 資料庫並啟用快取。
- `"" : "Inventory.nsf"`：指定本地資料庫 "Inventory.nsf"。
- `"Products"`：視圖名稱。
- `2`：擷取視圖的第二欄。

## 注意事項

- **快取行為**：使用快取（""）可以提高效能，特別是當資料穩定時。若需要最新資料，可使用 "ReCache" 來刷新快取。

- **欄位編號**：計算欄位編號時，需忽略顯示常數值的欄位，以及僅包含特定 @ 函數的欄位，如 @DocChildren、@DocDescendants 等。

- **安全性**：使用 `@DbColumn` 時，確保當前使用者對目標資料庫和視圖具有適當的存取權限。

## 限制

- `@DbColumn` 不適用於欄位公式、選擇公式或郵件代理程式。

- 若返回的資料超過 64KB，`@DbColumn` 可能無法正常運作。

## 結論

`@DbColumn` 是 HCL Domino 公式語言中強大的函數，允許開發者從視圖中擷取整列的資料。透過正確的語法和參數設置，您可以有效地動態載入資料，提升應用程式的靈活性和效能。

更多詳細資訊，請參閱 [@DbColumn (Domino 資料來源) (公式語言)](https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=functions-dbcolumn-domino-data-source-formula-language) 和 [從當前文件和資料庫外部存取資料](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ACCESSING_DATA_OUTSIDE_THE_CURRENT_DOCUMENT_AND_DATABASE.html)。
