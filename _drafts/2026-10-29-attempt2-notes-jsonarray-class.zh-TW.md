---
title: "使用 NotesJSONArray 類別處理 JSON 陣列"
description: "學習如何在 LotusScript 中使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列。"
pubDate: "2026-10-29T10:12:41+08:00"
lang: "zh-TW"
slug: "notes-jsonarray-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesJSONArray class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html"
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONElement class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonarray-class" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-jsonarray-class
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 14.5.1 引入了新的 LotusScript 類別來處理 JSON 資料，其中之一是 `NotesJSONArray` 類別。本文將介紹如何使用 `NotesJSONArray` 類別來建立、解析和操作 JSON 陣列。

## 建立 JSON 陣列

要在 LotusScript 中建立 JSON 陣列，可以使用 `NotesSession` 的 `CreateJSONArray` 方法。以下範例展示了如何建立一個包含多個值的 JSON 陣列：

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Set jsonArray = session.CreateJSONArray

Call jsonArray.AppendElement("Apple")
Call jsonArray.AppendElement("Banana")
Call jsonArray.AppendElement("Cherry")

MsgBox jsonArray.ToString
```

在此範例中，我們建立了一個新的 JSON 陣列，並添加了三個字串元素。最後，使用 `ToString` 方法將 JSON 陣列轉換為字串表示，結果為：

```json
["Apple","Banana","Cherry"]
```

## 解析 JSON 陣列

如果您有一個 JSON 陣列的字串表示，並希望在 LotusScript 中解析它，可以使用 `NotesSession` 的 `CreateJSONNavigator` 方法。以下範例展示了如何解析 JSON 陣列並存取其元素：

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
Dim jsonNav As NotesJSONNavigator
Dim jsonArray As NotesJSONArray

jsonString = '["Apple","Banana","Cherry"]'
Set jsonNav = session.CreateJSONNavigator(jsonString)
Set jsonArray = jsonNav.GetJSONArray

For i = 0 To jsonArray.Size - 1
    MsgBox jsonArray.GetElement(i).Value
Next
```

在此範例中，我們解析了一個 JSON 陣列字串，並迭代其元素，顯示每個值。

## 操作 JSON 陣列

`NotesJSONArray` 類別提供了多種方法來操作 JSON 陣列，例如添加、插入、移除元素等。以下範例展示了如何在 JSON 陣列中插入和移除元素：

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Set jsonArray = session.CreateJSONArray

Call jsonArray.AppendElement("Apple")
Call jsonArray.AppendElement("Cherry")

' 在索引 1 處插入 "Banana"
Call jsonArray.InsertElement(1, "Banana")

' 移除索引 2 的元素
Call jsonArray.RemoveElement(2)

MsgBox jsonArray.ToString
```

執行上述程式碼後，JSON 陣列的內容將為：

```json
["Apple","Banana"]
```

## 結論

`NotesJSONArray` 類別為 LotusScript 提供了強大的功能來處理 JSON 陣列，使開發者能夠更輕鬆地與 JSON 資料進行互動。透過本文的介紹，您應該能夠在自己的應用程式中有效地使用 `NotesJSONArray` 類別來建立、解析和操作 JSON 陣列。

有關更多詳細資訊，請參閱 [NotesJSONArray 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html) 和 [NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) 的官方文件。
