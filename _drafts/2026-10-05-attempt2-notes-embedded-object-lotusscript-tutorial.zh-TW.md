---
title: "使用 LotusScript 操作 NotesEmbeddedObject 的指南"
description: "深入探討如何在 LotusScript 中使用 NotesEmbeddedObject 類別來處理嵌入式物件、物件連結和檔案附件，包括其屬性、方法和實作範例。"
pubDate: "2026-10-05T09:43:31+08:00"
lang: "zh-TW"
slug: "notes-embedded-object-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesEmbeddedObject (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "Working with attachments and embedded objects in LotusScript classes"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-working-attachments-embedded-objects-in-lotusscript"
  - title: "EmbedObject (NotesRichTextItem - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_EMBEDOBJECT_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-working-attachments-embedded-objects-in-lotusscript&utm_source=openai" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-embedded-object-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 開發中，LotusScript 提供了強大的功能來處理嵌入式物件、物件連結和檔案附件。`NotesEmbeddedObject` 類別是這些操作的核心，允許開發者在 Notes 文件中嵌入和管理各種物件。本文將詳細介紹如何使用 `NotesEmbeddedObject` 類別，包括其屬性、方法，以及實作範例。

## NotesEmbeddedObject 類別概述

`NotesEmbeddedObject` 類別代表以下三種物件之一：

- **嵌入式物件（Embedded Object）**：直接嵌入到 Notes 文件中的物件。
- **物件連結（Object Link）**：指向外部物件的連結。
- **檔案附件（File Attachment）**：附加到 Notes 文件的檔案。

需要注意的是，嵌入式物件和物件連結在 UNIX 和 Macintosh 平台上不受支援，但檔案附件則支援。 ([help.hcl-software.com](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html?utm_source=openai))

## 創建嵌入式物件

要在 Notes 文件的富文本項目中創建嵌入式物件，可以使用 `NotesRichTextItem` 類別的 `EmbedObject` 方法。以下是創建嵌入式物件的範例：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embObj As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set rtItem = New NotesRichTextItem(doc, "Body")

' 創建嵌入式物件
Set embObj = rtItem.EmbedObject(EMBED_OBJECT, "Excel.Sheet", "C:\path\to\file.xlsx", "EmbeddedExcel")

Call doc.Save(True, False)
```

在此範例中，`EmbedObject` 方法的參數如下：

- `EMBED_OBJECT`：指定要創建嵌入式物件。
- `"Excel.Sheet"`：指定創建物件的應用程式類別。
- `"C:\path\to\file.xlsx"`：指定要嵌入的檔案路徑。
- `"EmbeddedExcel"`：指定嵌入物件的名稱。 ([help.hcl-software.com](https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_EMBEDOBJECT_METHOD.html?utm_source=openai))

## 訪問嵌入式物件

要訪問 Notes 文件中的嵌入式物件，可以使用 `NotesRichTextItem` 或 `NotesDocument` 類別的 `EmbeddedObjects` 屬性。以下是訪問嵌入式物件的範例：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embObj As NotesEmbeddedObject
Dim embObjs As Variant

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_OF_DOCUMENT")
Set rtItem = doc.GetFirstItem("Body")

' 獲取所有嵌入式物件
embObjs = rtItem.EmbeddedObjects

Forall obj In embObjs
    Set embObj = obj
    Msgbox "嵌入式物件名稱: " & embObj.Name
End Forall
```

在此範例中，`EmbeddedObjects` 屬性返回一個包含所有嵌入式物件的陣列，然後我們可以遍歷該陣列來訪問每個物件的屬性。 ([ibm.com](https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-working-attachments-embedded-objects-in-lotusscript&utm_source=openai))

## 操作嵌入式物件

`NotesEmbeddedObject` 類別提供了多種方法來操作嵌入式物件，包括：

- **Activate**：激活嵌入式物件。
- **DoVerb**：執行嵌入式物件的動作。
- **ExtractFile**：將嵌入式物件提取為檔案。
- **Remove**：從富文本項目中移除嵌入式物件。

以下是使用 `ExtractFile` 方法提取嵌入式物件的範例：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embObj As NotesEmbeddedObject
Dim embObjs As Variant

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_OF_DOCUMENT")
Set rtItem = doc.GetFirstItem("Body")

' 獲取所有嵌入式物件
embObjs = rtItem.EmbeddedObjects

Forall obj In embObjs
    Set embObj = obj
    If embObj.Type = EMBED_ATTACHMENT Then
        Call embObj.ExtractFile("C:\path\to\save\" & embObj.Name)
    End If
End Forall
```

在此範例中，`ExtractFile` 方法將嵌入式物件提取並保存到指定的路徑。 ([ibm.com](https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=classes-working-attachments-embedded-objects-in-lotusscript&utm_source=openai))

## 結論

`NotesEmbeddedObject` 類別為開發者提供了強大的功能來處理 Notes 文件中的嵌入式物件、物件連結和檔案附件。通過理解其屬性和方法，開發者可以有效地創建、訪問和操作這些物件，從而增強應用程式的功能和靈活性。
