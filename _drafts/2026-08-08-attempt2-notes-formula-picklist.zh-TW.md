---
title: "深入解析 @PickList：HCL Notes 中的強大選擇對話框函數"
description: "了解如何在 HCL Notes 中使用 @PickList 函數，透過自訂視圖或名稱對話框，讓使用者選擇文件或名稱，並將選擇結果應用於表單或按鈕操作。"
pubDate: "2026-08-08T07:35:42+08:00"
lang: "zh-TW"
slug: "notes-formula-picklist"
tags:
  - "Tutorial"
  - "Formula"
  - "Notes Client"
sources:
  - title: "@PickList (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-picklist-formula-language"
  - title: "Examples: @PickList"
    url: "https://www.ibm.com/docs/da/SSVRGU_8.5.3/com.ibm.designer.domino.main.doc/H_EXAMPLES_PICKLIST.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-picklist-formula-language, https://www.ibm.com/docs/da/SSVRGU_8.5.3/com.ibm.designer.domino.main.doc/H_EXAMPLES_PICKLIST.html
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-picklist-formula-language" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-formula-picklist
-->

## 什麼是 @PickList？

`@PickList` 是 HCL Notes 中的公式語言函數，允許開發者顯示對話框，讓使用者從指定的視圖或名稱列表中選擇一個或多個項目。這在需要使用者互動以選擇特定數據時非常有用。

## @PickList 的語法

`@PickList` 函數有多種語法形式，以下是最常用的格式：

```plaintext
@PickList( [CUSTOM] : [SINGLE] ; server : file ; view ; title ; prompt ; column ; categoryname )
```

- `[CUSTOM]`：關鍵字，表示顯示自訂視圖。
- `[SINGLE]`：可選關鍵字，限制使用者只能選擇一個文件。
- `server`：伺服器名稱。
- `file`：資料庫的路徑和檔名。
- `view`：要顯示的視圖名稱。
- `title`：對話框的標題。
- `prompt`：對話框內的提示文字。
- `column`：要返回的列號。
- `categoryname`：可選，指定要顯示的分類名稱。

## 使用範例

1. **顯示產品視圖，讓使用者選擇產品**

   ```plaintext
   choice := @PickList( [CUSTOM] ; "" ; "Products" ; "選擇產品" ; "請選擇您想訂購的產品" ; 1 );
   ```

   此範例顯示當前資料庫中的 "Products" 視圖，讓使用者選擇產品，並返回第一列的值。

2. **限制使用者只能選擇一個文件**

   ```plaintext
   choice := @PickList( [CUSTOM] : [SINGLE] ; "" ; "Products" ; "選擇產品" ; "請選擇您想訂購的產品" ; 1 );
   ```

   在此範例中，`[SINGLE]` 關鍵字限制使用者只能選擇一個產品。

3. **顯示特定分類的項目**

   ```plaintext
   choice := @PickList( [CUSTOM] ; "" ; "By Category" ; "選擇產品" ; "請選擇您想訂購的產品" ; 1; "Leather");
   ```

   此範例顯示 "By Category" 視圖中 "Leather" 分類下的項目。

4. **顯示名稱對話框，讓使用者選擇人員或群組**

   ```plaintext
   FIELD person := person;
   @SetField( "person"; @PickList( [NAME] ) )
   ```

   此範例顯示名稱對話框，讓使用者選擇人員、群組或伺服器，並將選擇的名稱放入 "person" 欄位中。

## 注意事項

- `@PickList` 函數適用於按鈕、手動代理程式、貼上代理程式、表單操作和視圖操作公式。它不適用於欄位、選擇、郵件代理程式、排程代理程式、隱藏條件、視窗標題或表單公式。
- 此函數無法在 Web 應用程式中使用。
- 返回的數據量限制為 64KB。

透過 `@PickList` 函數，開發者可以在 HCL Notes 中輕鬆實現使用者互動，提升應用程式的靈活性和易用性。更多詳細資訊，請參閱 [@PickList (Formula Language)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-picklist-formula-language) 和 [@PickList 範例](https://www.ibm.com/docs/da/SSVRGU_8.5.3/com.ibm.designer.domino.main.doc/H_EXAMPLES_PICKLIST.html)。
