---
title: "使用 LotusScript 操作 NotesForm：深入指南"
description: "本文提供了如何使用 LotusScript 操作 NotesForm 的詳細指南，包括存取表單、檢索欄位資訊，以及修改表單屬性等實用範例。"
pubDate: "2026-07-25T08:06:29+08:00"
lang: "zh-TW"
slug: "notesform-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesForm (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESFORM_CLASS.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "LotusScript Classes A-Z"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.0?topic=classes-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notesform-lotusscript-tutorial" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESFORM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesform-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 應用程式開發中，LotusScript 是一種強大的工具，允許開發者以程式方式存取和操作資料庫中的各種元素。其中，`NotesForm` 類別代表資料庫中的表單，透過此類別，開發者可以檢視和修改表單的屬性、欄位等資訊。

## 存取 NotesForm

要存取資料庫中的特定表單，首先需要建立 `NotesDatabase` 物件，然後使用 `GetForm` 方法來檢索表單。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim form As NotesForm

Set db = session.CurrentDatabase
Set form = db.GetForm("表單名稱")
```

在上述程式碼中，`GetForm` 方法根據表單名稱返回對應的 `NotesForm` 物件。請注意，您需要確保表單名稱正確無誤。

## 檢索表單欄位資訊

取得 `NotesForm` 物件後，可以使用其 `Fields` 屬性來獲取表單中所有欄位的名稱。

```lotusscript
Dim fieldNames As Variant
fieldNames = form.Fields

Forall fieldName In fieldNames
    Print fieldName
End Forall
```

這段程式碼將列印出表單中所有欄位的名稱，方便開發者了解表單的結構。

## 修改表單屬性

`NotesForm` 類別提供了多種屬性，允許開發者修改表單的行為。例如，可以使用 `ProtectReaders` 和 `ProtectUsers` 屬性來控制哪些使用者可以讀取或編輯該表單。

```lotusscript
form.ProtectReaders = True
form.ProtectUsers = True
Call form.Save
```

上述程式碼將設定表單的讀取和編輯保護，並保存更改。請注意，修改表單屬性後，必須呼叫 `Save` 方法來保存更改。

## 刪除表單

如果需要刪除特定表單，可以使用 `Remove` 方法。

```lotusscript
Call form.Remove
```

請謹慎使用此方法，因為刪除表單可能會影響到使用該表單的現有文件。

## 結論

透過 `NotesForm` 類別，開發者可以以程式方式存取和操作 HCL Domino 資料庫中的表單。熟悉此類別的屬性和方法，將有助於更有效地開發和維護 Domino 應用程式。更多詳細資訊，請參閱 [NotesForm (LotusScript)](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESFORM_CLASS.html) 和 [使用 Domino 類別](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_NOTES_CLASSES.html)。
