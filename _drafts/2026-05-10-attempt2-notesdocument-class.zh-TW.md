---
title: "深入理解 NotesDocument 類別：LotusScript 的實踐指南"
description: "本教程詳細介紹了如何使用 LotusScript 中的 NotesDocument 類別來創建、訪問和操作 HCL Domino 資料庫中的文件，並提供實際範例。"
pubDate: "2026-05-10T07:21:50+08:00"
lang: "zh-TW"
slug: "notesdocument-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "Programming in Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_OVERVIEW_OF_SCRIPTS_AND_FORMULAS_3325_OVERVIEW.html"
  - title: "Accessing sessions"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_WAYS_TO_ACCESS_NOTES_SESSIONS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesdocument-class
-->

## 什麼是 NotesDocument 類別？

`NotesDocument` 類別代表 HCL Domino 資料庫中的一個文件。透過此類別，開發者可以創建新文件、讀取和修改現有文件的內容，以及執行各種與文件相關的操作。

## 創建新文件

要在 LotusScript 中創建新文件，首先需要獲取當前會話和目標資料庫的引用。以下是創建新文件的基本步驟：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)

' 設置文件的欄位值
doc.Form = "MainForm"
doc.Subject = "新的文件"

' 保存文件
doc.Save True, False
```

在上述程式碼中，`session.CurrentDatabase` 獲取當前資料庫的引用，`New NotesDocument(db)` 創建一個新的文件對象，並通過設置欄位值和保存操作來完成文件的創建。

## 訪問現有文件

要訪問現有文件，可以使用多種方法，例如根據文件的唯一標識符（UNID）或 NoteID 來獲取文件：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_STRING")

If Not doc Is Nothing Then
    ' 訪問文件的欄位值
    MsgBox doc.GetItemValue("Subject")(0)
End If
```

在此範例中，`db.GetDocumentByUNID` 方法根據提供的 UNID 獲取對應的文件，然後使用 `GetItemValue` 方法讀取特定欄位的值。

## 修改文件內容

要修改現有文件的內容，可以直接設置欄位值，然後保存更改：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_STRING")

If Not doc Is Nothing Then
    ' 修改欄位值
doc.ReplaceItemValue "Subject", "更新後的主題"
    ' 保存更改
doc.Save True, False
End If
```

在此範例中，`ReplaceItemValue` 方法用於更新欄位的值，`Save` 方法用於保存更改。

## 刪除文件

要刪除文件，可以使用 `Remove` 方法：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_STRING")

If Not doc Is Nothing Then
    ' 刪除文件
doc.Remove True
End If
```

`Remove` 方法的參數決定是否永久刪除文件。傳遞 `True` 表示永久刪除，`False` 表示將文件移至刪除文件夾。

## 結論

`NotesDocument` 類別是 LotusScript 中操作 HCL Domino 資料庫文件的核心工具。透過熟悉其方法和屬性，開發者可以高效地創建、訪問、修改和刪除資料庫中的文件，從而實現各種應用需求。

有關 `NotesDocument` 類別的更多詳細資訊，請參閱 [官方文檔](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOCUMENT_CLASS.html)。
