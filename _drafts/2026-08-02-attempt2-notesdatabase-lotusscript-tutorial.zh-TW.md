---
title: "深入探討 NotesDatabase：LotusScript 中的核心類別"
description: "本文詳細介紹了 NotesDatabase 類別的功能，包括如何存取、建立和管理 Notes 資料庫，並提供實用的程式碼範例。"
pubDate: "2026-08-02T07:59:00+08:00"
lang: "zh-TW"
slug: "notesdatabase-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDatabase (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
  - title: "GetDocumentByID (NotesDatabase - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_GETDOCUMENTBYID_METHOD.html"
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOCUMENT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notesdatabase-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html" was already cited by [notes-ui-database] on 2026-07-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesdatabase-lotusscript-tutorial
-->

## 簡介

`NotesDatabase` 類別是 LotusScript 中用於表示和操作 HCL Domino 資料庫的核心類別。透過此類別，開發者可以存取資料庫的各種屬性和方法，例如讀取、修改文件，管理視圖和代理程式等。

## 存取現有資料庫

要存取現有的資料庫，您可以使用 `NotesSession` 類別的 `GetDatabase` 方法。以下範例展示如何開啟特定伺服器上的資料庫：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.GetDatabase("伺服器名稱", "資料庫路徑")
If Not db.IsOpen Then
    MsgBox "無法開啟資料庫"
    Exit Sub
End If
```

在此程式碼中，`GetDatabase` 方法用於取得指定伺服器和路徑的資料庫。如果資料庫無法開啟，則顯示錯誤訊息。

## 建立新資料庫

您也可以使用 `NotesDatabase` 類別的 `Create` 方法來建立新的資料庫。以下範例展示如何在本地伺服器上建立新資料庫：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = New NotesDatabase("", "newdb.nsf")
If Not db.Create("", "newdb.nsf", True) Then
    MsgBox "無法建立資料庫"
    Exit Sub
End If
```

此程式碼在本地伺服器上建立名為 `newdb.nsf` 的新資料庫。如果建立失敗，則顯示錯誤訊息。

## 存取資料庫中的文件

一旦取得 `NotesDatabase` 物件，您可以使用其方法來存取和操作資料庫中的文件。例如，使用 `GetDocumentByID` 方法可以透過文件的 NoteID 來取得特定文件：

```lotusscript
Dim doc As NotesDocument
Set doc = db.GetDocumentByID("12345678")
If doc Is Nothing Then
    MsgBox "找不到文件"
    Exit Sub
End If
```

在此範例中，`GetDocumentByID` 方法用於取得指定 NoteID 的文件。如果找不到該文件，則顯示錯誤訊息。

## 建立新文件

您可以使用 `CreateDocument` 方法來建立新的文件：

```lotusscript
Dim doc As NotesDocument
Set doc = db.CreateDocument()
doc.Form = "表單名稱"
doc.Subject = "新文件"
If Not doc.Save(True, False) Then
    MsgBox "無法儲存文件"
    Exit Sub
End If
```

此程式碼建立一個新的文件，設定其表單名稱和主旨，然後儲存該文件。

## 結論

`NotesDatabase` 類別提供了豐富的方法和屬性，讓開發者能夠有效地存取和管理 HCL Domino 資料庫。透過熟悉此類別，您可以更靈活地開發和維護 LotusScript 應用程式。

有關 `NotesDatabase` 類別的更多資訊，請參閱 [官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html)。
