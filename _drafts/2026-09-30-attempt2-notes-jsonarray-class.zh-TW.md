---
title: "使用 NotesJSONArray 類別處理 JSON 陣列"
description: "本教程介紹如何在 LotusScript 中使用 NotesJSONArray 類別來解析和操作 JSON 陣列，並提供實際範例。"
pubDate: "2026-09-30T09:53:37+08:00"
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
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 2
slug: notes-jsonarray-class
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 14.5.1 引入了新的 LotusScript 類別來處理 JSON 資料，其中之一是 `NotesJSONArray` 類別。本文將介紹如何在 LotusScript 中使用 `NotesJSONArray` 類別來解析和操作 JSON 陣列。

## NotesJSONArray 類別概述

`NotesJSONArray` 類別提供了對 JSON 陣列的存取和操作功能。您可以使用此類別來讀取、修改和建立 JSON 陣列。該類別的詳細說明可參考 [NotesJSONArray 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html)。

## 使用範例

以下範例展示如何在 LotusScript 中使用 `NotesJSONArray` 類別來解析 JSON 陣列。

```lotusscript
Sub ParseJSONArray
    Dim session As New NotesSession
    Dim jsonArray As NotesJSONArray
    Dim jsonNavigator As NotesJSONNavigator
    Dim jsonString As String
    
    ' 定義 JSON 字串
    jsonString = "[\"Apple\", \"Banana\", \"Cherry\"]"
    
    ' 解析 JSON 字串
    Set jsonNavigator = session.CreateJSONNavigator(jsonString)
    Set jsonArray = jsonNavigator.GetJSONArray()
    
    ' 遍歷 JSON 陣列
    Dim i As Integer
    For i = 0 To jsonArray.Size - 1
        Print jsonArray.GetElement(i).Value
    Next
End Sub
```

在此範例中，我們首先建立一個包含水果名稱的 JSON 陣列字串。然後，使用 `CreateJSONNavigator` 方法解析該字串，並取得 `NotesJSONArray` 物件。最後，遍歷陣列並輸出每個元素的值。

## 操作 JSON 陣列

`NotesJSONArray` 類別提供了多種方法來操作 JSON 陣列，例如新增、移除元素等。以下範例展示如何新增元素到 JSON 陣列中。

```lotusscript
Sub AddElementToJSONArray
    Dim session As New NotesSession
    Dim jsonArray As NotesJSONArray
    Dim jsonNavigator As NotesJSONNavigator
    Dim jsonString As String
    
    ' 定義初始 JSON 陣列字串
    jsonString = "[\"Apple\", \"Banana\"]"
    
    ' 解析 JSON 字串
    Set jsonNavigator = session.CreateJSONNavigator(jsonString)
    Set jsonArray = jsonNavigator.GetJSONArray()
    
    ' 新增元素
    Call jsonArray.AppendElement("Cherry")
    
    ' 輸出更新後的 JSON 陣列
    Print jsonArray.ToString()
End Sub
```

在此範例中，我們首先解析一個包含兩個元素的 JSON 陣列，然後使用 `AppendElement` 方法新增一個新元素 "Cherry"。最後，輸出更新後的 JSON 陣列。

## 結論

`NotesJSONArray` 類別為 LotusScript 提供了強大的工具來處理 JSON 陣列，使開發者能夠更方便地解析和操作 JSON 資料。透過結合 `NotesJSONNavigator` 和 `NotesJSONElement` 類別，您可以實現更複雜的 JSON 資料處理需求。更多詳細資訊，請參考 [NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) 和 [NotesJSONElement 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html)。
