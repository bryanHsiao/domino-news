---
title: "NotesItem 類別：LotusScript 操作 Notes 文件中的欄位"
description: "深入探討 NotesItem 類別，學習如何使用 LotusScript 存取和操作 Notes 文件中的欄位，並提供實用範例。"
pubDate: "2026-07-26T08:02:42+08:00"
lang: "zh-TW"
slug: "notesitem-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesItem (LotusScript)"
    url: "https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html"
  - title: "Using the Domino classes"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_NOTES_CLASSES.html"
  - title: "LotusScript Classes A-Z"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_4_LOTUSSCRIPT_NOTES_CLASSES_REFERENCE.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_USING_THE_NOTES_CLASSES.html" was already cited by [notesform-lotusscript-tutorial] on 2026-07-25. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html?utm_source=openai" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesitem-lotusscript-tutorial
-->

在 HCL Domino 開發中，**NotesItem** 類別是用於存取和操作 Notes 文件中欄位（field）的關鍵工具。透過此類別，開發者可以讀取、修改和管理文件中的各種欄位資料。

## NotesItem 類別概述

**NotesItem** 代表 Notes 文件中的特定欄位。在使用者介面中，文件的欄位透過表單（form）的欄位來顯示。當表單的欄位名稱與文件的欄位名稱相同時，該欄位會顯示在表單中。例如，`Subject` 欄位會顯示為 `[Subject]`。使用 LotusScript，無論文件使用何種表單，開發者都可以存取文件中的所有欄位。 ([hcljapan.co.jp](https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html?utm_source=openai))

## 創建和存取 NotesItem

要存取文件中的特定欄位，首先需要獲取該文件的 **NotesDocument** 物件，然後使用 `GetFirstItem` 方法來獲取 **NotesItem**：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim item As NotesItem

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("<document_unid>")
Set item = doc.GetFirstItem("<field_name>")
```

在上述程式碼中，`<document_unid>` 是文件的唯一標識符，`<field_name>` 是要存取的欄位名稱。

## 讀取和修改欄位值

獲取 **NotesItem** 物件後，可以使用其 `Text` 屬性來讀取或修改欄位的值：

```lotusscript
Dim fieldValue As String

' 讀取欄位值
fieldValue = item.Text

' 修改欄位值
item.Text = "新的值"

' 保存更改
Call doc.Save(True, False)
```

請注意，修改欄位值後，需要調用 `doc.Save` 方法來保存更改。

## 檢查欄位類型

**NotesItem** 提供了 `Type` 屬性，允許開發者檢查欄位的類型：

```lotusscript
Dim itemType As Integer

itemType = item.Type

Select Case itemType
    Case RICHTEXT
        ' 處理富文本欄位
    Case TEXT
        ' 處理文本欄位
    ' 其他類型...
End Select
```

這樣可以根據欄位類型執行不同的操作。

## 結論

**NotesItem** 類別是 LotusScript 中操作 Notes 文件欄位的強大工具。透過熟悉其方法和屬性，開發者可以有效地讀取、修改和管理文件中的欄位資料。更多詳細資訊，請參閱 [NotesItem 類別官方文件](https://www.hcljapan.co.jp/software/help/DominoDesigner/topic/com.ibm.designer.domino.main.doc/H_NOTESITEM_CLASS.html)。
