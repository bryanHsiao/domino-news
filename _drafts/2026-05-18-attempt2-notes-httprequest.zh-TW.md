---
title: "使用 NotesHTTPRequest 類別在 LotusScript 中進行 HTTP 請求"
description: "本教程介紹如何在 LotusScript 中使用 NotesHTTPRequest 類別發送 HTTP 請求，包括 GET 和 POST 方法的實作，以及處理 JSON 響應的範例。"
pubDate: "2026-05-18T07:24:04+08:00"
lang: "zh-TW"
slug: "notes-httprequest"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesHTTPRequest class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html"
  - title: "NotesHTTPRequest class examples"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTES_HTTPREQUEST_CLASS_EX.html"
  - title: "NotesHTTPRequest class properties"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTES_HTTPREQUEST.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html" was already cited by [lotusscript-http-json] on 2026-05-07. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-httprequest
-->

## 簡介

在 HCL Domino 12.0.2 版本中，LotusScript 引入了 `NotesHTTPRequest` 類別，允許開發者直接在 LotusScript 中發送 HTTP 請求，無需依賴外部庫或工具。這為與外部 REST API 的整合提供了便利。

## 初始化 NotesHTTPRequest

要使用 `NotesHTTPRequest`，首先需要創建其實例：

```lotusscript
Dim http As NotesHTTPRequest
Set http = session.CreateHTTPRequest()
```

## 發送 GET 請求

以下範例展示如何發送 GET 請求並處理響應：

```lotusscript
Dim url As String
Dim response As String

url = "https://api.example.com/data"
response = http.Get(url)

If http.ResponseCode = 200 Then
    ' 處理響應內容
    MsgBox "成功獲取資料: " & response
Else
    MsgBox "請求失敗，狀態碼: " & CStr(http.ResponseCode)
End If
```

在此範例中，`http.Get(url)` 發送 GET 請求至指定的 URL，並將響應內容存儲在 `response` 變數中。`http.ResponseCode` 用於檢查 HTTP 狀態碼，以確保請求成功。

## 發送 POST 請求

以下範例展示如何發送帶有 JSON 主體的 POST 請求：

```lotusscript
Dim url As String
Dim payload As String
Dim response As String

url = "https://api.example.com/submit"
payload = "{ ""name"": ""John Doe"", ""email"": ""john@example.com"" }"

http.SetHeader "Content-Type", "application/json"
response = http.Post(url, payload)

If http.ResponseCode = 201 Then
    MsgBox "資料成功提交。"
Else
    MsgBox "提交失敗，狀態碼: " & CStr(http.ResponseCode)
End If
```

在此範例中，`http.SetHeader` 設置請求的 `Content-Type` 為 `application/json`，`http.Post(url, payload)` 發送 POST 請求，並將 JSON 格式的資料作為主體。

## 處理 JSON 響應

`NotesHTTPRequest` 與 `NotesJSONNavigator` 結合使用，可方便地解析 JSON 響應。以下範例展示如何解析 JSON 響應：

```lotusscript
Dim jsonNav As NotesJSONNavigator
Set jsonNav = session.CreateJSONNavigator(response)

Dim name As String
Dim email As String

name = jsonNav.GetElementByName("name").Value
email = jsonNav.GetElementByName("email").Value

MsgBox "姓名: " & name & ", 電子郵件: " & email
```

在此範例中，`session.CreateJSONNavigator(response)` 解析 JSON 響應，並使用 `GetElementByName` 方法提取特定字段的值。

## 結論

`NotesHTTPRequest` 類別為 LotusScript 提供了強大的 HTTP 請求功能，允許開發者直接與外部 REST API 進行整合。通過結合 `NotesJSONNavigator`，可以方便地處理 JSON 響應，擴展 Domino 應用的功能。

有關 `NotesHTTPRequest` 類別的更多資訊，請參閱 [官方文檔](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html)。

> 參考資料：
> - [NotesHTTPRequest 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTES_HTTPREQUEST_CLASS.html)
> - [NotesHTTPRequest 類別範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTES_HTTPREQUEST_CLASS_EX.html)
> - [NotesHTTPRequest 類別屬性](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROPERTIES_NOTES_HTTPREQUEST.html)
