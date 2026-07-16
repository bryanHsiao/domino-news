---
title: "使用 LotusScript 操作 NotesJSONNavigator：深入教程"
description: "本教程將指導您如何在 LotusScript 中使用 NotesJSONNavigator 類別來解析和操作 JSON 數據，並提供實際範例以加深理解。"
pubDate: "2026-07-16T08:00:48+08:00"
lang: "zh-TW"
slug: "notes-jsonnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino REST API"
sources:
  - title: "HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/index.html"
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-quickstart] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" was already cited by [domino-rest-api-quickstart] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonnavigator-lotusscript-tutorial
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 提供了 `NotesJSONNavigator` 類別，讓開發者能夠在 LotusScript 中解析和操作 JSON 資料。本文將深入探討如何使用 `NotesJSONNavigator`，並提供實際範例以加深理解。

## 什麼是 NotesJSONNavigator？

`NotesJSONNavigator` 是 LotusScript 中的一個類別，允許開發者解析 JSON 字串，並以類似樹狀結構的方式遍歷和操作 JSON 資料。透過此類別，您可以輕鬆地存取 JSON 物件的屬性和值。

## 使用 NotesJSONNavigator 的步驟

1. **初始化 NotesJSONNavigator**

   首先，您需要創建一個 `NotesJSONNavigator` 的實例，並載入 JSON 字串。

   ```lotusscript
   Dim session As New NotesSession
   Dim jsonNav As NotesJSONNavigator
   Set jsonNav = session.CreateJSONNavigator(jsonString)
   ```

2. **遍歷 JSON 結構**

   使用 `NotesJSONNavigator`，您可以遍歷 JSON 的各個節點，並存取其值。

   ```lotusscript
   Dim element As NotesJSONElement
   Set element = jsonNav.GetFirstElement
   Do Until element Is Nothing
       ' 處理元素
       Set element = jsonNav.GetNextElement
   Loop
   ```

3. **存取特定屬性**

   若要存取 JSON 物件的特定屬性，您可以使用 `GetElementByName` 方法。

   ```lotusscript
   Dim nameElement As NotesJSONElement
   Set nameElement = jsonNav.GetElementByName("name")
   If Not nameElement Is Nothing Then
       Dim nameValue As String
       nameValue = nameElement.Value
   End If
   ```

4. **修改 JSON 值**

   您也可以修改 JSON 物件的值，然後將其轉換回字串。

   ```lotusscript
   Call nameElement.SetValue("New Name")
   Dim updatedJsonString As String
   updatedJsonString = jsonNav.ToJSON
   ```

## 實際範例

假設我們有以下的 JSON 字串：

```json
{
    "name": "John Doe",
    "age": 30,
    "email": "john.doe@example.com"
}
```

我們希望在 LotusScript 中解析此 JSON，並修改 `email` 屬性的值。

```lotusscript
Dim session As New NotesSession
Dim jsonString As String
jsonString = "{\"name\": \"John Doe\", \"age\": 30, \"email\": \"john.doe@example.com\"}"

Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator(jsonString)

Dim emailElement As NotesJSONElement
Set emailElement = jsonNav.GetElementByName("email")
If Not emailElement Is Nothing Then
    Call emailElement.SetValue("new.email@example.com")
End If

Dim updatedJsonString As String
updatedJsonString = jsonNav.ToJSON
Print updatedJsonString
```

執行上述程式碼後，`updatedJsonString` 將包含更新後的 JSON 字串，其中 `email` 屬性的值已被修改。

## 結論

透過 `NotesJSONNavigator`，開發者可以在 LotusScript 中輕鬆地解析和操作 JSON 資料。這對於需要與現代 Web 服務進行整合的 Domino 應用程式而言，提供了強大的工具。建議參考 [HCL Domino REST API 文檔](https://opensource.hcltechsw.com/Domino-rest-api/index.html) 以獲取更多資訊。
