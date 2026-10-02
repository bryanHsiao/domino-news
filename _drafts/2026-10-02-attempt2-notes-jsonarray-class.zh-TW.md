---
title: "使用 NotesJSONArray 類別處理 JSON 陣列"
description: "本教程介紹如何在 LotusScript 中使用 NotesJSONArray 類別來解析和操作 JSON 陣列，並提供實際範例說明其應用。"
pubDate: "2026-10-02T10:04:07+08:00"
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
  - Slug collision: "notes-jsonarray-class" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-09-29. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 2
slug: notes-jsonarray-class
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 14.5.1 引入了 NotesJSONArray 類別，讓開發者能夠在 LotusScript 中方便地解析和操作 JSON 陣列。本文將介紹如何使用 NotesJSONArray 類別，並提供實際範例說明其應用。

## NotesJSONArray 類別概述

NotesJSONArray 類別是 HCL Domino 14.5.1 中新增的 LotusScript 類別，專門用於處理 JSON 陣列。它提供了一系列方法，讓開發者能夠輕鬆地存取、修改和遍歷 JSON 陣列中的元素。

## 使用範例

以下範例展示如何在 LotusScript 中使用 NotesJSONArray 類別來解析和操作 JSON 陣列。

```lotusscript
Sub ProcessJSONArray
    Dim session As New NotesSession
    Dim jsonArray As NotesJSONArray
    Dim jsonNavigator As NotesJSONNavigator
    Dim jsonElement As NotesJSONElement
    
    ' 假設我們有以下 JSON 字串
    Dim jsonString As String
    jsonString = "[\"Apple\", \"Banana\", \"Cherry\"]"
    
    ' 創建 JSON 導航器
    Set jsonNavigator = session.CreateJSONNavigator(jsonString)
    
    ' 獲取 JSON 陣列
    Set jsonArray = jsonNavigator.GetJSONArray()
    
    ' 遍歷陣列並輸出每個元素
    Dim i As Integer
    For i = 0 To jsonArray.Size - 1
        Set jsonElement = jsonArray.GetElement(i)
        Print jsonElement.Value
    Next
End Sub
```

在此範例中，我們首先創建了一個 NotesSession 物件，然後使用 `CreateJSONNavigator` 方法來解析 JSON 字串。接著，透過 `GetJSONArray` 方法獲取 JSON 陣列，並使用 `GetElement` 方法遍歷陣列中的每個元素，最後輸出其值。

## 相關類別

在處理 JSON 資料時，NotesJSONNavigator 和 NotesJSONElement 類別也非常重要。

- **NotesJSONNavigator**：用於解析和導航 JSON 資料結構。它提供了多種方法來存取 JSON 物件和陣列。

- **NotesJSONElement**：代表 JSON 資料中的單個元素，無論是物件、陣列、字串、數字等。透過此類別，開發者可以存取和修改 JSON 元素的值。

## 結論

透過使用 NotesJSONArray、NotesJSONNavigator 和 NotesJSONElement 類別，開發者可以在 LotusScript 中方便地解析和操作 JSON 資料。這些類別的引入大大增強了 HCL Domino 在現代應用程式開發中的能力，讓開發者能夠更輕鬆地處理 JSON 格式的資料。

有關更多資訊，請參閱 [NotesJSONArray 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html)、[NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) 和 [NotesJSONElement 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html) 的官方文件。
