---
title: "使用 NotesJSONNavigator 解析 JSON 資料的指南"
description: "本指南介紹如何在 LotusScript 中使用 NotesJSONNavigator 類別來解析和操作 JSON 資料，並提供實際範例。"
pubDate: "2026-05-02T07:22:58+08:00"
lang: "zh-TW"
slug: "notes-json-navigator"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesJSONNavigator class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesJSONNavigator properties"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_PROPERTIES.html"
  - title: "NotesJSONNavigator methods"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_METHODS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html" was already cited by [notes-query-results-processor] on 2026-04-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-json-navigator
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 提供了 `NotesJSONNavigator` 類別，讓開發者能夠在 LotusScript 中解析和操作 JSON 資料。

## NotesJSONNavigator 類別概述

`NotesJSONNavigator` 是一個用於遍歷和操作 JSON 結構的 LotusScript 類別。它提供了多種方法和屬性，方便開發者存取 JSON 物件的各個部分。

## 建立 NotesJSONNavigator 實例

要開始使用 `NotesJSONNavigator`，首先需要從 JSON 字串建立一個實例。以下是如何在 LotusScript 中完成此操作的範例：

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
Dim jsonNavigator As NotesJSONNavigator

jsonString = "{\"name\": \"John Doe\", \"age\": 30, \"email\": \"john.doe@example.com\"}"
Set jsonNavigator = session.CreateJSONNavigator(jsonString)
```

在此範例中，我們使用 `CreateJSONNavigator` 方法從 JSON 字串建立了一個 `NotesJSONNavigator` 實例。

## 存取 JSON 資料

建立 `NotesJSONNavigator` 實例後，可以使用其方法來存取 JSON 資料。例如，以下程式碼展示了如何存取 JSON 物件中的各個屬性：

```lotusscript
Dim name As String
Dim age As Integer
Dim email As String

name = jsonNavigator.GetElementValue("name")
age = CInt(jsonNavigator.GetElementValue("age"))
email = jsonNavigator.GetElementValue("email")

Print "Name: " & name
Print "Age: " & age
Print "Email: " & email
```

在此範例中，`GetElementValue` 方法用於取得指定鍵的值。

## 遍歷 JSON 陣列

如果 JSON 結構包含陣列，`NotesJSONNavigator` 也提供了方法來遍歷陣列元素。以下範例展示了如何處理 JSON 陣列：

```lotusscript
Dim jsonArrayString As String
Dim jsonArrayNavigator As NotesJSONNavigator
Dim i As Integer

jsonArrayString = "[\"apple\", \"banana\", \"cherry\"]"
Set jsonArrayNavigator = session.CreateJSONNavigator(jsonArrayString)

For i = 0 To jsonArrayNavigator.GetCount - 1
    Print jsonArrayNavigator.GetElementValue(i)
Next
```

在此範例中，`GetCount` 方法返回陣列的元素數量，`GetElementValue` 方法用於存取每個元素的值。

## 結論

`NotesJSONNavigator` 類別為 LotusScript 開發者提供了一個強大的工具，用於解析和操作 JSON 資料。透過熟悉其方法和屬性，開發者可以有效地在 HCL Domino 應用程式中處理 JSON 資料。

有關 `NotesJSONNavigator` 類別的更多資訊，請參閱 [官方文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html)。
