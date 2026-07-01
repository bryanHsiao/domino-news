---
title: "NotesDocument：LotusScript 中的文檔操作"
description: "深入探討 NotesDocument 類別，學習如何在 LotusScript 中創建、讀取、更新和刪除 HCL Domino 資料庫中的文檔。"
pubDate: "2026-07-02T07:34:13+08:00"
lang: "zh-TW"
slug: "notesdocument-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesDocument (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html"
  - title: "Examples: NoteID property (NotesDocument - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTEID_PROPERTY.html"
  - title: "Examples: Items property (NotesDocument - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXAMPLES_ITEMS_PROPERTY.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENT_CLASS.html" was already cited by [lotusscript-evaluate] on 2026-06-20. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notesdocument-lotusscript-tutorial
-->

在 HCL Domino 的 LotusScript 開發中，`NotesDocument` 類別是操作資料庫中文檔的核心。本文將介紹如何使用 `NotesDocument` 類別來創建、讀取、更新和刪除文檔，並提供實用的程式碼範例。

## 創建新文檔

要在資料庫中創建新文檔，可以使用 `NotesDatabase` 類別的 `CreateDocument` 方法：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument

Set db = session.CurrentDatabase
Set doc = db.CreateDocument

doc.Form = "Memo"
doc.Subject = "新文檔標題"
doc.Body = "這是新文檔的內容。"

doc.Save True, False
```

上述程式碼創建了一個新的文檔，設置其表單為 "Memo"，主題為 "新文檔標題"，內容為 "這是新文檔的內容。"，並將其保存到資料庫中。

## 讀取現有文檔

要讀取現有文檔，可以使用 `NotesDatabase` 類別的 `GetDocumentByUNID` 方法，根據文檔的通用唯一標識符（UNID）來獲取文檔：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim unid As String

Set db = session.CurrentDatabase
unid = "C1257D1C003B5A7C85257D1C003B5A7C"
Set doc = db.GetDocumentByUNID(unid)

If Not doc Is Nothing Then
    MsgBox "文檔主題: " & doc.GetItemValue("Subject")(0)
Else
    MsgBox "未找到文檔。"
End If
```

此程式碼根據指定的 UNID 獲取文檔，並顯示其主題。

## 更新文檔

要更新現有文檔，可以修改其項目值，然後保存更改：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim unid As String

Set db = session.CurrentDatabase
unid = "C1257D1C003B5A7C85257D1C003B5A7C"
Set doc = db.GetDocumentByUNID(unid)

If Not doc Is Nothing Then
    doc.ReplaceItemValue "Subject", "更新後的主題"
    doc.Save True, False
    MsgBox "文檔已更新。"
Else
    MsgBox "未找到文檔。"
End If
```

此程式碼將指定文檔的主題更新為 "更新後的主題"，並保存更改。

## 刪除文檔

要刪除文檔，可以使用 `Remove` 方法：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim unid As String

Set db = session.CurrentDatabase
unid = "C1257D1C003B5A7C85257D1C003B5A7C"
Set doc = db.GetDocumentByUNID(unid)

If Not doc Is Nothing Then
    doc.Remove True
    MsgBox "文檔已刪除。"
Else
    MsgBox "未找到文檔。"
End If
```

此程式碼刪除了指定的文檔。

## 獲取文檔的 NoteID

每個文檔在資料庫中都有一個唯一的 NoteID，可以通過 `NoteID` 屬性獲取：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim noteID As String

Set db = session.CurrentDatabase
Set doc = db.GetFirstDocument

If Not doc Is Nothing Then
    noteID = doc.NoteID
    MsgBox "文檔的 NoteID: " & noteID
Else
    MsgBox "未找到文檔。"
End If
```

此程式碼獲取資料庫中第一個文檔的 NoteID 並顯示。

## 列出文檔中的所有項目

可以使用 `Items` 屬性列出文檔中的所有項目：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim item As NotesItem

Set db = session.CurrentDatabase
Set doc = db.GetFirstDocument

If Not doc Is Nothing Then
    Forall item In doc.Items
        MsgBox "項目名稱: " & item.Name
    End Forall
Else
    MsgBox "未找到文檔。"
End If
```

此程式碼列出了文檔中的所有項目名稱。

通過掌握 `NotesDocument` 類別的這些基本操作，開發者可以在 LotusScript 中有效地管理 HCL Domino 資料庫中的文檔。
