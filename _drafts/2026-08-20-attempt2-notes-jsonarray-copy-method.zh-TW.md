---
title: "使用 NotesJSONArray 的新 Copy 方法進行深層複製"
description: "HCL Domino Designer 14.5.1 引入了 NotesJSONArray 的新 Copy 方法，允許在 LotusScript 中進行深層複製。本文將詳細介紹該方法的使用方式，並提供實際範例。"
pubDate: "2026-08-20T07:24:46+08:00"
lang: "zh-TW"
slug: "notes-jsonarray-copy-method"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "What's new in Domino Designer 14.5.1?"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/whats_new_14.5.1.html"
  - title: "NotesJSONArray class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-08-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-08-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-jsonarray-copy-method
-->

## 簡介

在 HCL Domino Designer 14.5.1 中，LotusScript 的 `NotesJSONArray` 類別新增了 `Copy` 方法，允許開發者對 JSON 陣列進行深層複製。這對於需要在不影響原始資料的情況下操作 JSON 資料的應用程式非常有用。

## `Copy` 方法概述

`Copy` 方法會返回一個新的 `NotesJSONArray` 實例，其中包含與原始陣列相同的元素，但彼此獨立。這意味著對新陣列的修改不會影響原始陣列。

## 使用範例

以下是如何在 LotusScript 中使用 `Copy` 方法的範例：

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Dim jsonNavigator As NotesJSONNavigator

' 創建一個新的 JSON 陣列
Set jsonArray = session.CreateJSONArray
Call jsonArray.AppendElement("元素1")
Call jsonArray.AppendElement("元素2")

' 使用 Copy 方法進行深層複製
Dim jsonArrayCopy As NotesJSONArray
Set jsonArrayCopy = jsonArray.Copy

' 修改複製的陣列
Call jsonArrayCopy.SetElement(0, "新元素1")

' 驗證原始陣列未受影響
Print jsonArray.GetElement(0).Value ' 輸出：元素1
Print jsonArrayCopy.GetElement(0).Value ' 輸出：新元素1
```

在此範例中，`jsonArray` 包含兩個元素。透過 `Copy` 方法，我們創建了一個新的 `jsonArrayCopy`，並修改了其第一個元素。結果顯示，原始陣列 `jsonArray` 的內容未受影響，證明了 `Copy` 方法的深層複製特性。

## 注意事項

- `Copy` 方法僅適用於 `NotesJSONArray`、`NotesJSONObject` 和 `NotesJSONElement` 類別。
- 深層複製確保新實例與原始實例完全獨立，適合需要在不影響原始資料的情況下進行操作的場景。

## 結論

`Copy` 方法的引入為 LotusScript 中的 JSON 操作提供了更大的靈活性。開發者現在可以輕鬆地對 JSON 資料進行深層複製，確保原始資料的完整性。更多詳細資訊，請參閱 [NotesJSONArray 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html) 和 [NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) 的官方文件。
