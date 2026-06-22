---
title: "NotesEmbeddedObject：在 LotusScript 中處理嵌入物件與附件"
description: "深入探討如何在 LotusScript 中使用 NotesEmbeddedObject 類別來嵌入物件、連結物件和附件，並提供實用範例。"
pubDate: "2026-06-23T07:35:08+08:00"
lang: "zh-TW"
slug: "notes-embedded-object"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesEmbeddedObject (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html"
  - title: "EmbedObject (NotesRichTextItem - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD.html"
  - title: "Examples: NotesEmbeddedObject class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESEMBEDDEDOBJECT_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-embedded-object
-->

## 簡介

在 HCL Domino 開發中，處理嵌入物件（embedded object）、物件連結（object link）和附件（file attachment）是常見的需求。LotusScript 提供了 `NotesEmbeddedObject` 類別，讓開發者能夠有效地管理這些元素。本文將介紹如何使用此類別，並提供實際範例。

## NotesEmbeddedObject 類別概述

`NotesEmbeddedObject` 代表以下三種元素之一：

- 嵌入物件
- 物件連結
- 附件

該類別包含多個屬性和方法，允許開發者存取和操作這些元素的各種資訊和功能。

## 創建嵌入物件或附件

要在富文本項目中嵌入物件或附件，可以使用 `NotesRichTextItem` 類別的 `EmbedObject` 方法。此方法的語法如下：

```lotusscript
Set notesEmbeddedObject = notesRichTextItem.EmbedObject(type%, class$, source$, [name$])
```

參數說明：

- `type%`：指定要創建的物件類型，可選值包括：
  - `EMBED_ATTACHMENT` (1454)：附件
  - `EMBED_OBJECT` (1453)：嵌入物件
  - `EMBED_OBJECTLINK` (1452)：物件連結
- `class$`：當 `type%` 為 `EMBED_OBJECT` 且希望從應用程式創建嵌入物件時，指定應用程式名稱（例如，"1-2-3 Worksheet"），此時 `source$` 為空字串（""）。對於其他情況，設為空字串（""）。
- `source$`：當 `type%` 為 `EMBED_OBJECT` 且希望從檔案創建嵌入物件時，指定檔案名稱，此時 `class$` 為空字串（""）。對於 `EMBED_ATTACHMENT` 或 `EMBED_OBJECTLINK`，指定要附加或連結的檔案名稱。
- `name$`：可選，指定嵌入物件的名稱，以便日後引用。

以下範例展示如何在富文本項目中嵌入附件：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim embObj As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = New NotesDocument(db)
doc.Form = "Main"
Set rtItem = New NotesRichTextItem(doc, "Body")
Set embObj = rtItem.EmbedObject(EMBED_ATTACHMENT, "", "C:\path\to\file.txt", "file.txt")
doc.Save True, True
```

在此範例中，`EmbedObject` 方法用於將位於 `C:\path\to\file.txt` 的檔案作為附件嵌入到 `Body` 富文本項目中，並命名為 "file.txt"。

## 存取嵌入物件或附件

要存取現有的嵌入物件或附件，可以使用以下方法：

- 若已知其名稱和所在的富文本項目，使用 `NotesRichTextItem` 的 `GetEmbeddedObject` 方法。
- 若要存取特定富文本項目中的所有嵌入物件、物件連結和附件，使用 `NotesRichTextItem` 的 `EmbeddedObjects` 屬性。
- 若要存取特定文件中的所有嵌入物件和物件連結，包括那些不在特定富文本項目中的，使用 `NotesDocument` 的 `EmbeddedObjects` 屬性。

以下範例展示如何列出文件中的所有嵌入物件：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim embObj As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_OF_DOCUMENT")
Forall o In doc.EmbeddedObjects
    Set embObj = o
    MsgBox "Name: " & embObj.Name & Chr(10) & "Type: " & embObj.Type
End Forall
```

此範例中，`EmbeddedObjects` 屬性返回文件中的所有嵌入物件，並顯示其名稱和類型。

## 操作嵌入物件或附件

`NotesEmbeddedObject` 類別提供多種方法來操作嵌入物件或附件：

- `Activate`：加載嵌入物件或物件連結。
- `DoVerb`：執行嵌入物件的特定動作。
- `ExtractFile`：將附件複製到磁碟。
- `Remove`：永久刪除嵌入物件、物件連結或附件。

以下範例展示如何將附件提取到磁碟：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim embObj As NotesEmbeddedObject

Set db = session.CurrentDatabase
Set doc = db.GetDocumentByUNID("UNID_OF_DOCUMENT")
Set embObj = doc.GetAttachment("file.txt")
Call embObj.ExtractFile("C:\path\to\save\file.txt")
```

在此範例中，`ExtractFile` 方法用於將名為 "file.txt" 的附件提取到指定的磁碟路徑。

## 結論

透過 `NotesEmbeddedObject` 類別，開發者可以在 LotusScript 中有效地管理嵌入物件、物件連結和附件。熟悉其屬性和方法，將有助於開發更強大和靈活的 HCL Domino 應用程式。

有關更多資訊，請參閱 [NotesEmbeddedObject 類別官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESEMBEDDEDOBJECT_CLASS.html) 和 [EmbedObject 方法官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EMBEDOBJECT_METHOD.html)。
