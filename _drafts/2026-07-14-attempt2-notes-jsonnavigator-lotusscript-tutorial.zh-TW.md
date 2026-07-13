---
title: "使用 LotusScript 操作 NotesJSONNavigator：解析與生成 JSON"
description: "本教程介紹如何在 LotusScript 中使用 NotesJSONNavigator 類別來解析和生成 JSON 數據，包括實際範例和注意事項。"
pubDate: "2026-07-14T07:56:03+08:00"
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
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html" was already cited by [hcl-domino-rest-api-update] on 2026-07-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-jsonnavigator-lotusscript-tutorial
-->

## 簡介

在現代應用程式開發中，JSON（JavaScript Object Notation）已成為資料交換的標準格式。HCL Domino 提供了 `NotesJSONNavigator` 類別，讓開發者能夠在 LotusScript 中方便地解析和生成 JSON 資料。本文將介紹如何使用 `NotesJSONNavigator` 來處理 JSON，並提供實際範例。

## 解析 JSON

要在 LotusScript 中解析 JSON 字串，您可以使用 `NotesJSONNavigator` 類別。以下是解析 JSON 的步驟：

1. **創建 `NotesJSONNavigator` 實例**：

   ```lotusscript
   Dim session As New NotesSession
   Dim jsonNavigator As NotesJSONNavigator
   Set jsonNavigator = session.CreateJSONNavigator(jsonString)
   ```

2. **訪問 JSON 元素**：

   ```lotusscript
   Dim jsonElement As NotesJSONElement
   Set jsonElement = jsonNavigator.GetElementByName("keyName")
   MsgBox jsonElement.Value
   ```

## 生成 JSON

要在 LotusScript 中生成 JSON，您可以按照以下步驟操作：

1. **創建 `NotesJSONNavigator` 實例**：

   ```lotusscript
   Dim session As New NotesSession
   Dim jsonNavigator As NotesJSONNavigator
   Set jsonNavigator = session.CreateJSONNavigator()
   ```

2. **添加 JSON 元素**：

   ```lotusscript
   Call jsonNavigator.AppendElement("keyName", "value")
   ```

3. **獲取 JSON 字串**：

   ```lotusscript
   Dim jsonString As String
   jsonString = jsonNavigator.ToJSON()
   MsgBox jsonString
   ```

## 注意事項

- **錯誤處理**：在解析 JSON 時，確保捕捉可能的錯誤，例如無效的 JSON 格式。
- **字符編碼**：確保 JSON 字串使用正確的字符編碼，避免解析錯誤。

## 結論

使用 `NotesJSONNavigator` 類別，開發者可以在 LotusScript 中方便地解析和生成 JSON 資料。這對於需要與其他系統進行資料交換的應用程式非常有用。更多詳細資訊，請參考 [HCL Domino REST API 文檔](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html)。
