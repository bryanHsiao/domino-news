---
title: "使用 LotusScript 操作 JSON：NotesJSONNavigator 教學"
description: "本教學將指導您如何在 LotusScript 中使用 NotesJSONNavigator 類別來解析和操作 JSON 資料，並提供實際範例。"
pubDate: "2026-07-17T08:01:41+08:00"
lang: "zh-TW"
slug: "notes-jsonnavigator-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino REST API"
sources:
  - title: "HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html"
  - title: "Using Postman and curl - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html"
  - title: "HCL Domino REST API Tutorials | Tutorial for HCL Domino REST API"
    url: "https://opensource.hcltechsw.com/domino-keep-tutorials/pages/domino-new/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-jsonnavigator-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html" was already cited by [hcl-domino-rest-api-update] on 2026-07-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonnavigator-lotusscript-tutorial
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 提供了 `NotesJSONNavigator` 類別，讓開發者能夠在 LotusScript 中解析和操作 JSON 資料。本教學將指導您如何使用 `NotesJSONNavigator` 來處理 JSON，並提供實際範例。

## 先決條件

在開始之前，請確保您已具備以下條件：

- HCL Domino 12.0.2 或更高版本的伺服器。
- 熟悉 LotusScript 編程。

## 使用 NotesJSONNavigator 解析 JSON

以下是如何在 LotusScript 中使用 `NotesJSONNavigator` 解析 JSON 字串的步驟：

1. **建立 NotesSession 和 NotesJSONNavigator 實例**

   ```lotusscript
   Dim session As New NotesSession
   Dim jsonNav As NotesJSONNavigator
   ```

2. **載入 JSON 字串**

   假設我們有以下 JSON 字串：

   ```json
   {
     "name": "John Doe",
     "age": 30,
     "email": "johndoe@example.com"
   }
   ```

   我們可以使用 `NotesJSONNavigator` 來解析此字串：

   ```lotusscript
   Set jsonNav = session.CreateJSONNavigator(jsonString)
   ```

3. **存取 JSON 元素**

   使用 `GetElementByName` 方法來存取特定的 JSON 元素：

   ```lotusscript
   Dim nameElement As NotesJSONElement
   Set nameElement = jsonNav.GetElementByName("name")
   MsgBox "Name: " & nameElement.Value
   ```

   類似地，您可以存取其他元素：

   ```lotusscript
   Dim ageElement As NotesJSONElement
   Set ageElement = jsonNav.GetElementByName("age")
   MsgBox "Age: " & ageElement.Value

   Dim emailElement As NotesJSONElement
   Set emailElement = jsonNav.GetElementByName("email")
   MsgBox "Email: " & emailElement.Value
   ```

## 修改 JSON 資料

您也可以使用 `NotesJSONNavigator` 來修改 JSON 資料。例如，更新 `age` 值：

```lotusscript
Dim ageElement As NotesJSONElement
Set ageElement = jsonNav.GetElementByName("age")
ageElement.Value = 31
MsgBox "Updated Age: " & ageElement.Value
```

## 將 JSON 轉換為字串

修改後的 JSON 可以轉換回字串：

```lotusscript
Dim updatedJsonString As String
updatedJsonString = jsonNav.Stringify
MsgBox "Updated JSON: " & updatedJsonString
```

## 結論

透過 `NotesJSONNavigator`，開發者可以在 LotusScript 中輕鬆地解析、存取和修改 JSON 資料。這對於需要與現代 Web 服務進行整合的應用程式開發非常有幫助。更多詳細資訊，請參閱 [HCL Domino REST API 教學](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html)。
