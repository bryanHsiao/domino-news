---
title: "使用 NotesEmbeddedObject 類別處理嵌入物件的指南"
description: "深入探討如何在 HCL Domino 中使用 NotesEmbeddedObject 類別來嵌入和管理物件，並提供實用的 LotusScript 範例。"
pubDate: "2026-08-15T07:24:03+08:00"
lang: "zh-TW"
slug: "notes-embedded-object"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesEmbeddedObject class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "Embedding data in a Notes document"
    url: "https://help.hcl-software.com/notes/12.0.2/client/sh_embed_data_in_doc_c.html"
  - title: "EmbedObject method"
    url: "https://www.ibm.com/docs/SSVRGU_8.5.3/com.ibm.designer.domino.main.doc/H_EMBEDOBJECT_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-embedded-object" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESEMBEDDEDOBJECT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-embedded-object
-->

## 簡介

在 HCL Domino 中，`NotesEmbeddedObject` 類別允許開發者在 Notes 文件的富文本欄位中嵌入物件、物件連結或檔案附件。這對於需要在應用程式中整合外部內容的情境非常有用。

## 嵌入物件的基本概念

嵌入物件是來自其他應用程式的資料副本，儲存在 Notes 文件中。這些物件可以是完整的檔案附件、嵌入的應用程式物件（如 Excel 工作表）或物件連結。需要注意的是，嵌入物件與原始檔案之間沒有連結，因此對原始檔案的更改不會反映在嵌入物件中。

## 使用 LotusScript 嵌入物件

以下是如何使用 LotusScript 在 Notes 文件的富文本欄位中嵌入物件的步驟：

1. **初始化 NotesRichTextItem**：

   ```lotusscript
   Dim rtItem As NotesRichTextItem
   Set rtItem = doc.GetFirstItem("Body")
   ```

2. **嵌入物件**：

   使用 `EmbedObject` 方法將物件嵌入到富文本欄位中。此方法的語法如下：

   ```lotusscript
   Set embeddedObject = rtItem.EmbedObject(EMBED_OBJECT, "ClassName", "FilePath")
   ```

   - `EMBED_OBJECT`：常數，表示要嵌入物件。
   - `ClassName`：字串，指定應用程式的名稱，例如 "Excel.Sheet"。
   - `FilePath`：字串，指定要嵌入的檔案路徑。

   例如，若要嵌入一個 Excel 工作表：

   ```lotusscript
   Set embeddedObject = rtItem.EmbedObject(EMBED_OBJECT, "Excel.Sheet", "C:\path\to\file.xlsx")
   ```

3. **保存文件**：

   ```lotusscript
   Call doc.Save(True, False)
   ```

完整的範例程式碼如下：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embeddedObject As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
doc.Form = "Main"
Set rtItem = New NotesRichTextItem(doc, "Body")
Set embeddedObject = rtItem.EmbedObject(EMBED_OBJECT, "Excel.Sheet", "C:\path\to\file.xlsx")
Call doc.Save(True, False)
```

## 存取嵌入物件

要存取已嵌入的物件，可以使用 `NotesRichTextItem` 的 `EmbeddedObjects` 屬性。以下範例展示如何列出富文本欄位中的所有嵌入物件：

```lotusscript
Dim rtItem As NotesRichTextItem
Dim embeddedObject As NotesEmbeddedObject

Set rtItem = doc.GetFirstItem("Body")
Forall obj In rtItem.EmbeddedObjects
    Set embeddedObject = obj
    MsgBox "嵌入物件名稱：" & embeddedObject.Name
End Forall
```

## 注意事項

- **物件名稱**：嵌入物件的名稱可以透過 `NotesEmbeddedObject` 的 `Name` 屬性取得。
- **物件類型**：可以使用 `Type` 屬性來判斷嵌入物件的類型，例如 `EMBED_ATTACHMENT`、`EMBED_OBJECT` 或 `EMBED_OBJECTLINK`。
- **啟動嵌入物件**：使用 `Activate` 方法可以啟動嵌入物件，開啟相應的應用程式來編輯物件。

```lotusscript
Call embeddedObject.Activate(True)
```

## 結論

透過 `NotesEmbeddedObject` 類別，開發者可以在 HCL Domino 中有效地嵌入和管理各種物件，增強應用程式的功能和互動性。更多詳細資訊和範例，請參考 [NotesEmbeddedObject 類別範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESEMBEDDEDOBJECT_CLASS.html) 和 [嵌入資料到 Notes 文件](https://help.hcl-software.com/notes/12.0.2/client/sh_embed_data_in_doc_c.html)。
