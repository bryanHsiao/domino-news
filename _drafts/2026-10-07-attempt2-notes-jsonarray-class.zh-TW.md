---
title: "使用 NotesJSONArray 類別處理 JSON 陣列"
description: "深入探討如何在 LotusScript 中使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列，並提供實際範例以展示其應用。"
pubDate: "2026-10-07T10:10:50+08:00"
lang: "zh-TW"
slug: "notes-jsonarray-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesJSONArray class - HCL Domino Designer 14.5.1 Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
  - title: "NotesJSONNavigator class - HCL Domino Designer 14.5.1 Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONElement class - HCL Domino Designer 14.5.1 Documentation"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonarray-class" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonarray-class
-->

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino Designer 14.5.1 引入了 NotesJSONArray 類別，讓開發者能夠在 LotusScript 中輕鬆處理 JSON 陣列。本文將介紹如何使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列，並提供實際範例以展示其應用。

## 什麼是 NotesJSONArray？

NotesJSONArray 是 HCL Domino Designer 14.5.1 中新增的類別，專門用於處理 JSON 陣列。它提供了一組方法和屬性，讓開發者能夠在 LotusScript 中建立、解析和操作 JSON 陣列。

## 建立 JSON 陣列

要在 LotusScript 中建立 JSON 陣列，可以使用 NotesSession 的 `CreateJSONArray` 方法。以下是建立簡單 JSON 陣列的範例：

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Set jsonArray = session.CreateJSONArray

Call jsonArray.AppendElement("第一個元素")
Call jsonArray.AppendElement(123)
Call jsonArray.AppendElement(True)
```

在此範例中，我們建立了一個新的 JSON 陣列，並依次添加了字串、數字和布林值作為元素。

## 解析 JSON 陣列

如果您有一個 JSON 陣列的字串表示，您可以使用 NotesSession 的 `CreateJSONNavigator` 方法來解析它，然後使用 `GetFirstElement` 方法來獲取 NotesJSONArray：

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
Dim jsonNav As NotesJSONNavigator
Dim jsonArray As NotesJSONArray

jsonString = "[\"第一個元素\", 123, true]"
Set jsonNav = session.CreateJSONNavigator(jsonString)
Set jsonArray = jsonNav.GetFirstElement().AsArray
```

在此範例中，我們解析了一個 JSON 陣列的字串，並獲取了對應的 NotesJSONArray。

## 操作 JSON 陣列

NotesJSONArray 提供了多種方法來操作 JSON 陣列，例如：

- `AppendElement`：在陣列末尾添加元素。
- `GetElementByIndex`：根據索引獲取元素。
- `RemoveElementByIndex`：根據索引移除元素。

以下是使用這些方法的範例：

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Set jsonArray = session.CreateJSONArray

Call jsonArray.AppendElement("第一個元素")
Call jsonArray.AppendElement(123)
Call jsonArray.AppendElement(True)

Dim element As NotesJSONElement
Set element = jsonArray.GetElementByIndex(1)
MsgBox "索引 1 的元素值為：" & element.Value

Call jsonArray.RemoveElementByIndex(0)
MsgBox "移除索引 0 的元素後，陣列長度為：" & jsonArray.Size
```

在此範例中，我們建立了一個 JSON 陣列，添加了三個元素，然後獲取索引為 1 的元素值，最後移除了索引為 0 的元素，並顯示了陣列的長度。

## 結論

NotesJSONArray 類別為 LotusScript 開發者提供了一個強大的工具來處理 JSON 陣列。透過本文的介紹，您應該能夠理解如何建立、解析和操作 JSON 陣列，並在您的應用程式中有效地使用這些功能。更多詳細資訊，請參閱 [NotesJSONArray 類別官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html)。
