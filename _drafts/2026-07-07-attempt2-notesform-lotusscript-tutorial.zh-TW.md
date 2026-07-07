---
title: "使用 LotusScript 操作 NotesForm：深入指南"
description: "本文提供如何使用 LotusScript 操作 NotesForm 的詳細指南，包括存取表單、讀取屬性、修改表單內容等，並附有實際範例。"
pubDate: "2026-07-07T08:10:15+08:00"
lang: "zh-TW"
slug: "notesform-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesForm (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESFORM_CLASS.html"
  - title: "Examples: Name property (NotesForm - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NAME_PROPERTY_FORM.html"
  - title: "Forms and Frames - HCL Domino C API Documentation"
    url: "https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Forms_and_Frames/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESFORM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesform-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 開發中，表單（form）是用來定義文件結構和外觀的核心元素。透過 LotusScript 的 `NotesForm` 類別，開發者可以程式化地存取和操作資料庫中的表單。本文將深入探討如何使用 `NotesForm` 類別，並提供實際範例以協助理解。

## 存取 NotesForm

要存取資料庫中的表單，首先需要取得 `NotesDatabase` 物件，然後透過其 `Forms` 屬性或 `GetForm` 方法來取得特定的 `NotesForm` 物件。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim form As NotesForm

Set db = session.CurrentDatabase
Set form = db.GetForm("表單名稱")
```

在上述程式碼中，`GetForm` 方法根據表單名稱返回對應的 `NotesForm` 物件。

## 讀取表單屬性

`NotesForm` 提供多種屬性，允許開發者讀取表單的相關資訊。例如，`Name` 屬性返回表單的名稱。

```lotusscript
Dim formName As String
formName = form.Name
Print "表單名稱: " & formName
```

此外，`Fields` 屬性返回表單中所有欄位的名稱集合。

```lotusscript
Dim fieldNames As Variant
fieldNames = form.Fields
Forall fieldName In fieldNames
    Print "欄位名稱: " & fieldName
End Forall
```

## 修改表單內容

雖然 `NotesForm` 提供了多種屬性和方法來讀取表單資訊，但直接修改現有表單的內容需要謹慎處理。一般而言，建議透過設計工具進行修改，而非程式化地更改表單結構。

## 鎖定和解鎖表單

在多用戶環境中，可能需要鎖定表單以防止同時修改。`NotesForm` 提供了 `Lock` 和 `UnLock` 方法來實現此功能。

```lotusscript
Dim lockStatus As Boolean
lockStatus = form.Lock("用戶名稱")
If lockStatus Then
    ' 執行需要鎖定的操作
    form.UnLock
Else
    Print "無法鎖定表單"
End If
```

## 刪除表單

如果需要刪除資料庫中的表單，可以使用 `Remove` 方法。

```lotusscript
Call form.Remove
```

請注意，刪除表單是不可逆的操作，應謹慎執行。

## 結論

透過 `NotesForm` 類別，開發者可以程式化地存取和操作 HCL Domino 資料庫中的表單。本文介紹了如何存取表單、讀取其屬性、鎖定和解鎖，以及刪除表單的基本操作。更多詳細資訊，請參閱 [NotesForm (LotusScript)](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_NOTESFORM_CLASS.html) 和 [Forms and Frames - HCL Domino C API Documentation](https://opensource.hcltechsw.com/domino-c-api-docs/howto/user_guide/Forms_and_Frames/)。
