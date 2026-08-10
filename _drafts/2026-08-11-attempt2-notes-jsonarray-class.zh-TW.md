---
title: "使用 NotesJSONArray 類別處理 JSON 陣列"
description: "深入探討如何在 LotusScript 中使用 NotesJSONArray 類別來解析和操作 JSON 陣列，並提供實際範例。"
pubDate: "2026-08-11T07:37:33+08:00"
lang: "zh-TW"
slug: "notes-jsonarray-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
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
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notes-jsonarray-class
-->

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 提供了一組強大的 LotusScript 類別來處理 JSON 資料，其中之一是 `NotesJSONArray` 類別。本文將介紹如何使用 `NotesJSONArray` 類別來解析和操作 JSON 陣列。

## 什麼是 NotesJSONArray？

`NotesJSONArray` 是 LotusScript 中的一個類別，專門用於表示和操作 JSON 陣列。它提供了多種方法來存取和修改陣列中的元素。要使用此類別，您需要先建立一個 `NotesSession`，然後透過 `NotesSession` 物件的 `CreateJSONNavigator` 方法來解析 JSON 字串，接著使用 `GetArray` 方法來取得 `NotesJSONArray` 物件。

## 如何使用 NotesJSONArray？

以下是一個示例，展示如何在 LotusScript 中使用 `NotesJSONArray` 來解析和操作 JSON 陣列：

```lotusscript
Sub ProcessJSONArray
    Dim session As New NotesSession
    Dim jsonString As String
    Dim jsonNavigator As NotesJSONNavigator
    Dim jsonArray As NotesJSONArray
    Dim jsonElement As NotesJSONElement
    Dim i As Integer

    ' 定義 JSON 字串
    jsonString = "[\"Apple\", \"Banana\", \"Cherry\"]"

    ' 解析 JSON 字串
    Set jsonNavigator = session.CreateJSONNavigator(jsonString)

    ' 取得 JSON 陣列
    Set jsonArray = jsonNavigator.GetArray()

    ' 遍歷陣列元素
    For i = 0 To jsonArray.Size - 1
        Set jsonElement = jsonArray.GetElement(i)
        Print "Element " & i & ": " & jsonElement.Value
    Next

    ' 新增元素到陣列
    Call jsonArray.AppendElement("Date")

    ' 刪除陣列中的第一個元素
    Call jsonArray.RemoveElement(0)

    ' 取得更新後的 JSON 字串
    jsonString = jsonNavigator.Stringify()
    Print "Updated JSON String: " & jsonString
End Sub
```

在上述程式碼中：

1. 我們定義了一個包含三個水果名稱的 JSON 字串。
2. 使用 `CreateJSONNavigator` 方法解析該 JSON 字串，取得 `NotesJSONNavigator` 物件。
3. 透過 `GetArray` 方法取得 `NotesJSONArray` 物件。
4. 使用 `Size` 方法取得陣列的大小，並遍歷每個元素，使用 `GetElement` 方法取得 `NotesJSONElement` 物件，然後輸出其值。
5. 使用 `AppendElement` 方法在陣列末尾新增一個元素。
6. 使用 `RemoveElement` 方法刪除陣列中的第一個元素。
7. 最後，使用 `Stringify` 方法將更新後的 JSON 物件轉換回字串，並輸出結果。

## 相關類別

在處理 JSON 資料時，`NotesJSONNavigator` 和 `NotesJSONElement` 類別也非常重要：

- **NotesJSONNavigator**：用於導航和操作 JSON 結構的主要類別。它提供了方法來存取 JSON 物件的各個部分，包括陣列和物件。

- **NotesJSONElement**：表示 JSON 中的單一元素，無論是物件、陣列、字串、數字等。透過此類別，您可以存取和修改 JSON 中的個別元素。

透過結合使用這些類別，您可以在 LotusScript 中有效地解析和操作 JSON 資料。

## 結論

`NotesJSONArray` 類別為 LotusScript 提供了一種方便的方法來處理 JSON 陣列。透過上述示例，您可以了解如何解析 JSON 字串、存取陣列元素，以及修改陣列內容。這些技能對於在 HCL Domino 環境中開發現代應用程式至關重要。
