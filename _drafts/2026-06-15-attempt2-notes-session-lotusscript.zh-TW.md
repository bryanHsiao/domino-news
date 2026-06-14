---
title: "NotesSession：LotusScript 中的核心環境物件"
description: "深入探討 NotesSession 類別，學習如何在 LotusScript 中存取當前使用者資訊、環境變數和資料庫。"
pubDate: "2026-06-15T07:32:44+08:00"
lang: "zh-TW"
slug: "notes-session-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesSession (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html"
  - title: "Initialize (NotesSession - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_INITIALIZE_METHOD_SESSION_COM.html"
  - title: "CreateDateTime (NotesSession - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_CREATEDATETIME_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-session-lotusscript
-->

## 簡介

在 LotusScript 中，`NotesSession` 類別代表當前腳本的執行環境，提供存取環境變數、地址簿、當前使用者資訊，以及 Notes 平台和版本號等功能。理解並有效使用 `NotesSession` 是開發高效能 Domino 應用程式的關鍵。

## 創建 NotesSession 物件

要在 LotusScript 中存取當前的 `NotesSession`，可以使用以下語法：

```lotusscript
Dim session As New NotesSession
```

或者：

```lotusscript
Set session = New NotesSession
```

由於每個腳本只能有一個會話，`New` 方法每次呼叫時都會返回相同的物件。請注意，不要刪除會話物件。

## 存取當前使用者資訊

`NotesSession` 提供多種屬性來存取當前使用者的資訊：

- `UserName`：返回當前使用者的完整名稱。
- `CommonUserName`：返回當前使用者的通用名稱。
- `EffectiveUserName`：返回當前使用者的有效名稱，考慮了代理執行等情況。

例如，以下程式碼顯示當前使用者的名稱：

```lotusscript
Dim session As New NotesSession
MsgBox "當前使用者：" & session.UserName
```

## 存取當前資料庫

`NotesSession` 的 `CurrentDatabase` 屬性允許您存取當前正在運行的資料庫：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase
MsgBox "當前資料庫：" & db.Title
```

## 創建日期時間物件

使用 `CreateDateTime` 方法，您可以創建新的 `NotesDateTime` 物件，表示特定的日期和時間：

```lotusscript
Dim session As New NotesSession
Dim dt As NotesDateTime
Set dt = session.CreateDateTime("2026/06/14 11:32:32 PM")
MsgBox "創建的日期時間：" & dt.LSLocalTime
```

## 設置和獲取環境變數

`NotesSession` 提供方法來設置和獲取環境變數：

- `SetEnvironmentVar`：設置環境變數的值。
- `GetEnvironmentString`：獲取環境變數的字串值。
- `GetEnvironmentValue`：獲取環境變數的數值。

例如，設置並獲取環境變數：

```lotusscript
Dim session As New NotesSession
Call session.SetEnvironmentVar("MyVar", "Hello World")
Dim value As String
value = session.GetEnvironmentString("MyVar")
MsgBox "環境變數 MyVar 的值：" & value
```

## 結論

`NotesSession` 類別是 LotusScript 中與 Domino 環境互動的核心。通過熟悉其屬性和方法，開發者可以有效地存取使用者資訊、環境變數和資料庫，從而開發出功能強大的 Domino 應用程式。更多詳細資訊，請參閱 [NotesSession 官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSESSION_CLASS.html)。
