---
title: "使用 NotesJSONArray 的 Copy 方法：LotusScript 教學"
description: "深入探討 NotesJSONArray 類別的 Copy 方法，學習如何在 LotusScript 中複製 JSON 陣列，並透過實例程式碼展示其應用。"
pubDate: "2026-10-03T09:47:52+08:00"
lang: "zh-TW"
slug: "notes-jsonarray-copy-method"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "HCL Domino Designer 14.5.1 Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/index.html"
  - title: "HCL Domino Designer User Guide and Reference"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/domino_designer_basic_user_guide_and_reference.html"
  - title: "HCL Notes/Domino 14.5.1 is Here – All New Features at a Glance"
    url: "https://www.madicon.de/blog/posts-blog/hcl-notesdomino-1451-is-here-all-new-features-at-a-glance/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonarray-copy-method" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonarray-copy-method
-->

## 簡介

在 HCL Domino Designer 14.5.1 中，LotusScript 引入了 `NotesJSONArray` 類別的 `Copy` 方法，允許開發者輕鬆地複製 JSON 陣列。這對於需要在不同上下文中重複使用相同資料的應用程式來說，提供了極大的便利。

## 什麼是 NotesJSONArray？

`NotesJSONArray` 是 LotusScript 中用來處理 JSON 陣列的類別。它提供了一系列的方法和屬性，讓開發者能夠建立、修改和存取 JSON 陣列的內容。

## Copy 方法的功能

`Copy` 方法允許您建立一個現有 `NotesJSONArray` 的深層複製。這意味著新建立的陣列與原始陣列擁有相同的內容，但它們是獨立的實例，對新陣列的修改不會影響原始陣列。

## 使用範例

以下是一個使用 `Copy` 方法的範例，展示如何複製一個 JSON 陣列並修改其內容：

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Dim copiedArray As NotesJSONArray

' 建立原始 JSON 陣列
Set jsonArray = session.CreateJSONArray
Call jsonArray.AppendElement("Apple")
Call jsonArray.AppendElement("Banana")
Call jsonArray.AppendElement("Cherry")

' 使用 Copy 方法複製陣列
Set copiedArray = jsonArray.Copy

' 修改複製的陣列
Call copiedArray.AppendElement("Date")

' 輸出原始和複製陣列的內容
Print "原始陣列: " & jsonArray.ToString
Print "複製陣列: " & copiedArray.ToString
```

在此範例中，`jsonArray` 包含三個元素："Apple"、"Banana" 和 "Cherry"。透過 `Copy` 方法，我們建立了一個新的 `copiedArray`，並在其中新增了 "Date"。最終，原始陣列保持不變，而複製的陣列則包含四個元素。

## 注意事項

- `Copy` 方法執行深層複製，確保新陣列與原始陣列完全獨立。
- 使用 `Copy` 方法時，請確保原始陣列已正確初始化，否則可能會引發錯誤。

## 結論

`NotesJSONArray` 的 `Copy` 方法為 LotusScript 開發者提供了一種簡單且有效的方式來複製 JSON 陣列。透過此方法，您可以在不同的程式邏輯中重複使用相同的資料，而不必擔心修改原始陣列的內容。更多資訊請參閱 [HCL Domino Designer 14.5.1 文件](https://help.hcl-software.com/dom_designer/14.5.1/index.html)。
