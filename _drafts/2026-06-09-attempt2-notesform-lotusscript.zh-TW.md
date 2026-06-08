---
title: "使用 LotusScript 操作 NotesForm"
description: "深入探討如何使用 LotusScript 的 NotesForm 類別來存取和操作 HCL Domino 資料庫中的表單，包括獲取表單名稱、檢查是否為子表單，以及列出所有表單。"
pubDate: "2026-06-09T07:31:09+08:00"
lang: "zh-TW"
slug: "notesform-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesForm (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFORM_CLASS.html"
  - title: "Name (NotesForm - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NAME_PROPERTY_FORM.html"
  - title: "IsSubForm (NotesForm - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISSUBFORM_PROPERTY.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notesform-lotusscript
-->

## 簡介

在 HCL Domino 開發中，表單（form）是資料庫設計的核心元素之一。透過 LotusScript 的 `NotesForm` 類別，開發者可以程式化地存取和操作資料庫中的表單。本教程將介紹如何使用 `NotesForm` 類別來獲取表單名稱、檢查表單是否為子表單，以及列出資料庫中的所有表單。

## 存取 NotesForm

要存取資料庫中的表單，首先需要獲取 `NotesDatabase` 對象，然後使用其 `Forms` 屬性來獲取所有表單的集合。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim form As NotesForm

Set db = session.CurrentDatabase
Forall form In db.Forms
    ' 在此處對每個表單進行操作
End Forall
```

在上述程式碼中，`db.Forms` 返回一個包含所有表單的集合，透過 `Forall` 迴圈可以遍歷每個表單。

## 獲取表單名稱

每個 `NotesForm` 對象都有一個 `Name` 屬性，該屬性返回表單的名稱。

```lotusscript
Dim formName As String
formName = form.Name
Print "表單名稱: " & formName
```

需要注意的是，`Name` 屬性返回的是表單的主要名稱，若表單有別名，則可以使用 `Aliases` 屬性來獲取。

## 檢查是否為子表單

`NotesForm` 類別的 `IsSubForm` 屬性用於指示表單是否為子表單。

```lotusscript
Dim isSub As Boolean
isSub = form.IsSubForm
If isSub Then
    Print "這是子表單"
Else
    Print "這不是子表單"
End If
```

`IsSubForm` 屬性返回布林值，`True` 表示該表單是子表單，`False` 表示不是。

## 列出所有表單

以下示例程式碼展示如何列出當前資料庫中的所有表單名稱。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim form As NotesForm
Dim formCount As Integer
Dim msgString As String

Set db = session.CurrentDatabase
formCount = 0
msgString = ""
Forall form In db.Forms
    formCount = formCount + 1
    msgString = msgString & Chr(10) & "     " & form.Name
End Forall
Messagebox "此資料庫有 " & formCount & " 個表單:" & msgString
```

此程式碼遍歷資料庫中的所有表單，計算總數並顯示每個表單的名稱。

## 結論

透過 LotusScript 的 `NotesForm` 類別，開發者可以方便地存取和操作 HCL Domino 資料庫中的表單。理解如何使用其屬性和方法，能夠有效地管理和操作表單，提升開發效率。

有關 `NotesForm` 類別的更多資訊，請參閱 [官方文檔](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESFORM_CLASS.html)。
