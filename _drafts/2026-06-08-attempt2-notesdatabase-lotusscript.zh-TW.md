---
title: "使用 LotusScript 操作 NotesDatabase：完整指南"
description: "深入探討如何使用 LotusScript 的 NotesDatabase 類別來存取和管理 HCL Domino 資料庫，包括建立、開啟、複製和刪除資料庫的實作範例。"
pubDate: "2026-06-08T07:28:35+08:00"
lang: "zh-TW"
slug: "notesdatabase-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDatabase (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_NOTESDATABASE_CLASS.html"
  - title: "Examples: NotesDatabase class"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_EXAMPLES_NOTESDATABASE_CLASS.html"
  - title: "Accessing Domino databases"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_WAYS_TO_ACCESS_NOTES_DATABASES.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesdatabase-lotusscript
-->

## 簡介

在 HCL Domino 開發中，`NotesDatabase` 類別是 LotusScript 中用來存取和管理 Notes 資料庫的核心。透過此類別，開發者可以執行多種操作，如開啟現有資料庫、建立新資料庫、複製資料庫，以及刪除資料庫等。

## 建立和開啟資料庫

要存取現有的資料庫，您可以使用 `NotesSession` 的 `GetDatabase` 方法，或直接使用 `NotesDatabase` 的 `New` 方法。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("伺服器名稱", "資料庫路徑")
If db.IsOpen Then
    ' 資料庫已成功開啟
Else
    ' 無法開啟資料庫
End If
```

在上述程式碼中，`伺服器名稱` 和 `資料庫路徑` 分別是目標資料庫所在的伺服器名稱和資料庫的路徑。如果資料庫位於本地，`伺服器名稱` 可以使用空字串（""）。

## 建立新資料庫

若要建立新的資料庫，可以使用 `NotesDatabase` 的 `Create` 方法。

```lotusscript
Dim session As New NotesSession
Dim db As New NotesDatabase("", "newdb.nsf")
If Not db.IsOpen Then
    Call db.Create("", "newdb.nsf", True)
    ' 新資料庫已建立
Else
    ' 資料庫已存在
End If
```

此程式碼在本地建立名為 `newdb.nsf` 的新資料庫。如果資料庫已存在，`IsOpen` 屬性將返回 `True`。

## 複製和刪除資料庫

要複製現有的資料庫，可以使用 `CreateCopy` 方法。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("", "existingdb.nsf")
If db.IsOpen Then
    Dim newDb As NotesDatabase
    Set newDb = db.CreateCopy("", "copydb.nsf")
    ' 資料庫已成功複製
Else
    ' 無法開啟原始資料庫
End If
```

要刪除資料庫，可以使用 `Remove` 方法。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("", "tobedeleted.nsf")
If db.IsOpen Then
    Call db.Remove
    ' 資料庫已刪除
Else
    ' 無法開啟資料庫
End If
```

## 存取資料庫中的文件

透過 `NotesDatabase`，您可以存取資料庫中的文件集合。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("", "existingdb.nsf")
If db.IsOpen Then
    Dim docColl As NotesDocumentCollection
    Set docColl = db.AllDocuments
    Dim doc As NotesDocument
    Set doc = docColl.GetFirstDocument
    While Not doc Is Nothing
        ' 處理文件
        Set doc = docColl.GetNextDocument(doc)
    Wend
Else
    ' 無法開啟資料庫
End If
```

## 結論

`NotesDatabase` 類別提供了豐富的方法和屬性，讓開發者能夠有效地存取和管理 HCL Domino 資料庫。透過上述範例，您可以開始在 LotusScript 中操作資料庫，並根據需求進行進一步的開發。
