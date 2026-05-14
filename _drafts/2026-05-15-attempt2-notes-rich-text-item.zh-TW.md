---
title: "深入解析 NotesRichTextItem：LotusScript 中的富文本处理"
description: "本文详细介绍了如何在 LotusScript 中使用 NotesRichTextItem 类进行富文本处理，包括创建、修改和导航富文本项的实用示例。"
pubDate: "2026-05-15T07:24:00+08:00"
lang: "zh-TW"
slug: "notes-rich-text-item"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesRichTextItem (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "Accessing rich text items in LotusScript classes"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_WAYS_TO_ACCESS_RICH_TEXT_ITEMS.html"
  - title: "Examples: NotesRichTextRange class"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXAMPLES_NOTESRICHTEXTRANGE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-rich-text-item" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESRICHTEXTITEM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-rich-text-item
-->

## 什麼是 NotesRichTextItem？

在 HCL Domino 的 LotusScript 中，`NotesRichTextItem` 類別代表文檔中的富文本項。富文本允許在單一欄位中包含多種格式的文本、附件、嵌入對象、表格和文檔鏈接等元素。這使得開發者能夠創建和操作複雜的文檔內容。

## 創建和初始化 NotesRichTextItem

要在文檔中創建新的富文本項，可以使用 `NotesDocument` 的 `CreateRichTextItem` 方法。以下是創建名為 "Body" 的富文本項的示例：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set rtItem = doc.CreateRichTextItem("Body")
```

在此示例中，我們首先獲取當前數據庫，然後創建一個新的文檔，最後在該文檔中添加一個名為 "Body" 的富文本項。

## 向富文本項添加文本

您可以使用 `AppendText` 方法向富文本項添加純文本：

```lotusscript
Call rtItem.AppendText("這是一段富文本內容。")
```

如果需要添加新行，可以使用 `AddNewLine` 方法：

```lotusscript
Call rtItem.AddNewLine(1)
```

這將在富文本項中添加一個新行。

## 嵌入附件和對象

`NotesRichTextItem` 允許嵌入文件附件和對象。要嵌入文件附件，可以使用 `EmbedObject` 方法：

```lotusscript
Dim filePath As String
filePath = "C:\path\to\file.txt"
Call rtItem.EmbedObject(EMBED_ATTACHMENT, "", filePath)
```

這將在富文本項中嵌入指定路徑的文件作為附件。

## 使用 NotesRichTextNavigator 和 NotesRichTextRange 進行導航和修改

`NotesRichTextNavigator` 和 `NotesRichTextRange` 類別提供了在富文本項中導航和修改內容的功能。

以下示例展示了如何使用 `NotesRichTextRange` 設置富文本項中所有文本的字體大小：

```lotusscript
Dim rtNav As NotesRichTextNavigator
Dim rtRange As NotesRichTextRange
Dim rtStyle As NotesRichTextStyle

Set rtNav = rtItem.CreateNavigator
Set rtRange = rtItem.CreateRange
Set rtStyle = session.CreateRichTextStyle

rtStyle.FontSize = 12
Call rtRange.SetStyle(rtStyle)
```

在此示例中，我們創建了一個導航器和一個範圍，然後設置該範圍內所有文本的字體大小為 12 點。

## 保存文檔

在對富文本項進行修改後，請確保保存文檔以應用更改：

```lotusscript
Call doc.Save(True, False)
```

這將保存文檔並將更改寫入磁盤。

## 結論

`NotesRichTextItem` 類別為 LotusScript 開發者提供了強大的工具，用於創建和操作富文本內容。通過結合使用 `NotesRichTextNavigator` 和 `NotesRichTextRange`，您可以精確地控制富文本項的內容和格式。更多詳細信息和示例，請參閱 [NotesRichTextItem (LotusScript)](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESRICHTEXTITEM_CLASS.html) 和 [NotesRichTextRange 類別示例](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXAMPLES_NOTESRICHTEXTRANGE_CLASS.html)。
