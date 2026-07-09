---
title: "使用 NotesJSONNavigator 處理 JSON 資料的 LotusScript 教學"
description: "本教學將介紹如何在 LotusScript 中使用 NotesJSONNavigator 類別來解析和操作 JSON 資料，包括建立 JSON 導覽器、附加元素，以及遍歷 JSON 結構等。"
pubDate: "2026-07-09T08:13:33+08:00"
lang: "zh-TW"
slug: "notesjsonnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesJSONNavigator (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "NotesStream (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESSTREAM_CLASS.html"
  - title: "NotesSession (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html" was already cited by [notes-property-broker] on 2026-06-27. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesjsonnavigator-lotusscript-tutorial
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript 物件表示法）已成為資料交換的標準格式。HCL Domino 提供了 `NotesJSONNavigator` 類別，讓開發者能夠在 LotusScript 中解析和操作 JSON 資料。本文將介紹如何使用 `NotesJSONNavigator` 來處理 JSON 資料。

## 建立 NotesJSONNavigator

要建立 `NotesJSONNavigator` 物件，您需要先建立一個 `NotesSession` 物件，然後使用 `CreateJSONNavigator` 方法。以下是建立空的 JSON 導覽器的範例：

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator("")
```

如果您有現有的 JSON 字串，可以在建立時傳入該字串：

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator("{"name":"John Doe","age":30}")
```

## 附加元素到 JSON 物件

您可以使用 `AppendElement` 方法將新元素附加到 JSON 物件中。以下範例展示如何建立一個包含多個屬性的 JSON 物件：

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator("")

Call jsonNav.AppendElement("John Doe", "name")
Call jsonNav.AppendElement(30, "age")
Call jsonNav.AppendElement(True, "isMember")

MsgBox jsonNav.Stringify(), 0, "JSON 物件"
```

上述程式碼將建立以下 JSON 物件：

```json
{
  "name": "John Doe",
  "age": 30,
  "isMember": true
}
```

## 附加陣列和物件

`NotesJSONNavigator` 也允許您附加陣列和嵌套物件。以下範例展示如何附加一個陣列和一個嵌套物件：

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Dim arr As NotesJSONArray
Dim obj As NotesJSONObject

Set jsonNav = session.CreateJSONNavigator("")

Set arr = jsonNav.AppendArray("hobbies")
Call arr.AppendElement("reading")
Call arr.AppendElement("traveling")

Set obj = jsonNav.AppendObject("address")
Call obj.AppendElement("123 Main St", "street")
Call obj.AppendElement("Anytown", "city")

MsgBox jsonNav.Stringify(), 0, "JSON 物件"
```

上述程式碼將建立以下 JSON 物件：

```json
{
  "hobbies": ["reading", "traveling"],
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  }
}
```

## 遍歷 JSON 結構

您可以使用 `GetElementByName`、`GetNthElement` 和 `GetElementByPointer` 等方法來遍歷 JSON 結構。以下範例展示如何存取特定的 JSON 元素：

```lotusscript
Dim session As New NotesSession
Dim jsonNav As NotesJSONNavigator
Dim el As NotesJSONElement

Const testJSON$ = "{"name":"John Doe","age":30,"address":{"street":"123 Main St","city":"Anytown"}}"

Set jsonNav = session.CreateJSONNavigator(testJSON$)

Set el = jsonNav.GetElementByName("name")
MsgBox el.Value, 0, "姓名"

Set el = jsonNav.GetElementByPointer("/address/city")
MsgBox el.Value, 0, "城市"
```

上述程式碼將顯示以下訊息框：

```
姓名
John Doe
```

```
城市
Anytown
```

## 結論

透過 `NotesJSONNavigator` 類別，開發者可以在 LotusScript 中方便地解析和操作 JSON 資料。這使得在 HCL Domino 應用程式中處理現代化的資料交換格式變得更加容易。更多詳細資訊，請參閱 [NotesJSONNavigator 官方文件](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html)。
