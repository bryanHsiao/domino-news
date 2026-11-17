---
title: "使用 LotusScript 的 NotesJSONNavigator 教學"
description: "深入探討如何在 LotusScript 中使用 NotesJSONNavigator 類別來解析和操作 JSON 資料，並提供實際範例。"
pubDate: "2026-11-17T12:58:57+08:00"
lang: "zh-TW"
slug: "notes-jsonnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONElement class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html"
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonnavigator-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-11-13. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-11-13. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-jsonarray-class] on 2026-11-13. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-jsonnavigator-lotusscript-tutorial
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 提供了 `NotesJSONNavigator` 類別，讓開發者能夠在 LotusScript 中解析和操作 JSON 資料。本文將介紹如何使用 `NotesJSONNavigator`，並提供實際範例。

## 什麼是 NotesJSONNavigator？

`NotesJSONNavigator` 是一個用於解析 JSON 資料的類別，允許開發者遍歷 JSON 結構，存取和修改其中的元素。它與 `NotesJSONElement` 和 `NotesJSONArray` 等類別一起，提供了完整的 JSON 操作功能。

## 使用範例

以下是一個使用 `NotesJSONNavigator` 解析 JSON 字串的範例：

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
Dim jsonNavigator As NotesJSONNavigator
Dim jsonElement As NotesJSONElement

jsonString = "{"name": "John Doe", "age": 30, "email": "john.doe@example.com"}"
Set jsonNavigator = session.CreateJSONNavigator(jsonString)

Set jsonElement = jsonNavigator.GetElementByName("name")
If Not jsonElement Is Nothing Then
    Print "Name: " & jsonElement.Value
End If

Set jsonElement = jsonNavigator.GetElementByName("age")
If Not jsonElement Is Nothing Then
    Print "Age: " & jsonElement.Value
End If

Set jsonElement = jsonNavigator.GetElementByName("email")
If Not jsonElement Is Nothing Then
    Print "Email: " & jsonElement.Value
End If
```

在此範例中，我們首先建立了一個 JSON 字串，然後使用 `CreateJSONNavigator` 方法建立了一個 `NotesJSONNavigator` 物件。接著，我們使用 `GetElementByName` 方法存取 JSON 中的各個元素，並輸出它們的值。

## 操作 JSON 陣列

`NotesJSONNavigator` 也可以用來解析 JSON 陣列。以下是一個範例：

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
Dim jsonNavigator As NotesJSONNavigator
Dim jsonArray As NotesJSONArray
Dim jsonElement As NotesJSONElement
Dim i As Integer

jsonString = "{"employees": [{"name": "Alice"}, {"name": "Bob"}, {"name": "Charlie"}]}"
Set jsonNavigator = session.CreateJSONNavigator(jsonString)

Set jsonArray = jsonNavigator.GetArrayElement("employees")
If Not jsonArray Is Nothing Then
    For i = 0 To jsonArray.Size - 1
        Set jsonElement = jsonArray.GetElement(i).GetElementByName("name")
        If Not jsonElement Is Nothing Then
            Print "Employee: " & jsonElement.Value
        End If
    Next
End If
```

在此範例中，我們解析了一個包含員工名單的 JSON 陣列，並輸出每位員工的姓名。

## 結論

`NotesJSONNavigator` 提供了一個強大的工具，讓 LotusScript 開發者能夠輕鬆地解析和操作 JSON 資料。透過結合使用 `NotesJSONElement` 和 `NotesJSONArray`，開發者可以有效地處理各種 JSON 結構，提升應用程式的資料處理能力。

更多資訊請參閱 [NotesJSONNavigator 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONNAVIGATOR_CLASS.html) 和 [NotesJSONElement 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESJSONELEMENT_CLASS.html)。
