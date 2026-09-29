---
title: "使用 NotesJSONArray 類別處理 JSON 陣列"
description: "學習如何在 LotusScript 中使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列。"
pubDate: "2026-09-29T10:31:25+08:00"
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
attempt: 2
slug: notes-jsonarray-class
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino Designer 提供了 NotesJSONArray 類別，讓開發者能夠在 LotusScript 中輕鬆處理 JSON 陣列。本文將介紹如何使用 NotesJSONArray 類別來建立、解析和操作 JSON 陣列。

## NotesJSONArray 類別概述

NotesJSONArray 類別是 HCL Domino Designer 中的一部分，專門用於處理 JSON 陣列。它提供了多種方法，讓開發者能夠新增、移除和存取陣列中的元素。詳細的類別說明可參考 [NotesJSONArray 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html)。

## 建立和解析 JSON 陣列

以下範例展示了如何在 LotusScript 中建立一個 JSON 陣列，並解析其內容：

```lotusscript
Dim session As New NotesSession
Dim jsonArray As NotesJSONArray
Set jsonArray = session.CreateJSONArray

' 新增元素到 JSON 陣列
Call jsonArray.AppendElement("Apple")
Call jsonArray.AppendElement("Banana")
Call jsonArray.AppendElement("Cherry")

' 解析 JSON 陣列
Dim i As Integer
For i = 0 To jsonArray.Size - 1
    Dim element As NotesJSONElement
    Set element = jsonArray.GetElementByIndex(i)
    Print element.Value
Next
```

在此範例中，我們首先建立了一個新的 NotesJSONArray 物件，然後使用 `AppendElement` 方法新增三個字串元素。接著，透過迴圈和 `GetElementByIndex` 方法，逐一存取並輸出陣列中的元素。

## 操作 JSON 陣列元素

NotesJSONArray 類別提供了多種方法來操作陣列中的元素，例如：

- `RemoveElementByIndex(index As Integer)`：移除指定索引的元素。
- `ReplaceElementByIndex(index As Integer, value As Variant)`：替換指定索引的元素。

以下範例展示了如何使用這些方法：

```lotusscript
' 移除第二個元素（索引從 0 開始）
Call jsonArray.RemoveElementByIndex(1)

' 替換第一個元素
Call jsonArray.ReplaceElementByIndex(0, "Apricot")

' 輸出更新後的陣列
For i = 0 To jsonArray.Size - 1
    Set element = jsonArray.GetElementByIndex(i)
    Print element.Value
Next
```

在此範例中，我們首先移除了索引為 1 的元素（"Banana"），然後將索引為 0 的元素從 "Apple" 替換為 "Apricot"。最後，輸出更新後的陣列內容。

## 與 NotesJSONNavigator 和 NotesJSONElement 的整合

在處理更複雜的 JSON 結構時，NotesJSONNavigator 和 NotesJSONElement 類別非常有用。NotesJSONNavigator 用於遍歷 JSON 結構，而 NotesJSONElement 則代表 JSON 中的單一元素。

以下範例展示了如何使用這些類別來解析包含陣列的 JSON 字串：

```lotusscript
Dim jsonString As String
jsonString = "{""fruits"": [""Apple"", ""Banana"", ""Cherry""]}"

Dim navigator As NotesJSONNavigator
Set navigator = session.CreateJSONNavigator(jsonString)

' 移動到 "fruits" 陣列
Dim element As NotesJSONElement
Set element = navigator.GetElementByName("fruits")

If element.IsArray Then
    Set jsonArray = element.Value
    For i = 0 To jsonArray.Size - 1
        Set element = jsonArray.GetElementByIndex(i)
        Print element.Value
    Next
End If
```

在此範例中，我們首先建立了一個包含陣列的 JSON 字串，然後使用 NotesJSONNavigator 來解析該字串，並存取 "fruits" 陣列中的元素。詳細的類別說明可參考 [NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) 和 [NotesJSONElement 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html)。

## 結論

透過使用 NotesJSONArray、NotesJSONNavigator 和 NotesJSONElement 類別，開發者可以在 LotusScript 中有效地處理 JSON 資料。這些類別提供了豐富的方法，讓開發者能夠建立、解析和操作 JSON 陣列，從而增強應用程式與現代資料格式的整合能力。
