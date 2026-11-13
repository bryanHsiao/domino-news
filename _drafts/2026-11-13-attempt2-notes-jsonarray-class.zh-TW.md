---
title: "使用 NotesJSONArray 類別處理 JSON 陣列的實作指南"
description: "深入探討如何在 LotusScript 中使用 NotesJSONArray 類別來解析和操作 JSON 陣列，並提供實際範例以協助開發者有效處理 JSON 資料。"
pubDate: "2026-11-13T11:14:15+08:00"
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
attempt: 2
slug: notes-jsonarray-class
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 提供了 NotesJSONArray 類別，讓開發者能夠在 LotusScript 中方便地解析和操作 JSON 陣列。本文將介紹如何使用 NotesJSONArray 類別，並提供實際範例以協助您有效地處理 JSON 資料。

## NotesJSONArray 類別概述

NotesJSONArray 是 HCL Domino 中的一個類別，專門用於處理 JSON 陣列。它提供了一系列方法，讓開發者能夠讀取、修改和遍歷 JSON 陣列中的元素。您可以透過 [NotesJSONArray 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONARRAY_CLASS.html) 的官方文件獲取更多資訊。

## 建立和解析 JSON 陣列

要在 LotusScript 中使用 NotesJSONArray，首先需要建立一個 NotesJSONNavigator 物件，然後從中取得 NotesJSONArray。

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
Dim jsonNavigator As NotesJSONNavigator
Dim jsonArray As NotesJSONArray

jsonString = "[\"apple\", \"banana\", \"cherry\"]"
Set jsonNavigator = session.CreateJSONNavigator(jsonString)
Set jsonArray = jsonNavigator.GetJSONArray()
```

在上述程式碼中，我們建立了一個包含三個字串元素的 JSON 陣列，並透過 NotesJSONNavigator 解析該陣列。更多關於 NotesJSONNavigator 的資訊，請參閱 [NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) 的官方文件。

## 遍歷和讀取 JSON 陣列元素

取得 NotesJSONArray 物件後，可以使用其方法來遍歷和讀取陣列中的元素。

```lotusscript
Dim i As Integer
Dim element As NotesJSONElement

For i = 0 To jsonArray.Size - 1
    Set element = jsonArray.GetElement(i)
    Print element.Value
Next
```

此程式碼遍歷了 JSON 陣列中的所有元素，並輸出其值。NotesJSONElement 提供了 Value 屬性，讓我們能夠取得元素的值。更多關於 NotesJSONElement 的資訊，請參閱 [NotesJSONElement 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html) 的官方文件。

## 修改 JSON 陣列元素

您也可以修改 JSON 陣列中的元素。

```lotusscript
jsonArray.SetElement(1, "blueberry")
```

此程式碼將陣列中索引為 1 的元素從 "banana" 修改為 "blueberry"。

## 新增和移除 JSON 陣列元素

NotesJSONArray 也提供了新增和移除元素的方法。

```lotusscript
jsonArray.AppendElement("date")
jsonArray.RemoveElement(0)
```

上述程式碼首先在陣列末尾新增了一個元素 "date"，然後移除了索引為 0 的元素，即 "apple"。

## 結論

透過使用 NotesJSONArray 類別，開發者可以在 LotusScript 中方便地解析、遍歷、修改、新增和移除 JSON 陣列中的元素。這使得在 HCL Domino 環境中處理 JSON 資料變得更加直觀和高效。希望本文的介紹和範例能夠協助您更好地理解和應用 NotesJSONArray 類別。
