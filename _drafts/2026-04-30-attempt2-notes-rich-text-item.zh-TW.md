---
title: "深入解析 NotesRichTextItem：LotusScript 中的富文本操作"
description: "本教程詳細介紹如何在 LotusScript 中使用 NotesRichTextItem 類別來創建和操作富文本內容，包括添加文本、格式化和嵌入對象等實踐範例。"
pubDate: "2026-04-30T07:25:00+08:00"
lang: "zh-TW"
slug: "notes-rich-text-item"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesRichTextItem class"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "NotesRichTextItem class (Java)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/Java/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "Working with rich text items in LotusScript"
    url: "https://www.ibm.com/docs/en/notes/9.0.1?topic=ssw-9-0-1-composite-applications-dev-working-with-rich-text-items-in-lotusscript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-rich-text-item
-->

在 HCL Domino 應用程式開發中，富文本（rich text）是常見的資料類型，允許開發者在文件中包含格式化的文字、表格、圖片等多媒體內容。LotusScript 提供了 NotesRichTextItem 類別，專門用於創建和操作富文本項目。

## 什麼是 NotesRichTextItem？

NotesRichTextItem 是 LotusScript 中的一個類別，代表 Notes 文件中的富文本欄位。透過此類別，開發者可以程式化地添加、修改和格式化富文本內容。例如，您可以插入段落、表格、圖片，甚至嵌入其他對象。

## 創建和初始化 NotesRichTextItem

要在 LotusScript 中創建一個新的富文本項目，首先需要獲取目標文件，然後使用 `CreateRichTextItem` 方法創建富文本欄位。

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set rtItem = doc.CreateRichTextItem("Body")
```

在上述程式碼中，`"Body"` 是富文本欄位的名稱。如果文件中已存在同名的富文本欄位，`CreateRichTextItem` 方法將返回該現有欄位。

## 添加文本和格式化

使用 NotesRichTextItem，您可以添加純文本並應用各種格式。例如，添加段落並設置字體樣式：

```lotusscript
Call rtItem.AppendText("這是一個標題")
Call rtItem.AddNewLine(1)
Call rtItem.AppendText("這是正文內容。")
```

要應用格式，可以使用 `AppendStyle` 方法與 NotesRichTextStyle 結合：

```lotusscript
Dim style As New NotesRichTextStyle
style.Bold = True
style.FontSize = 12
Call rtItem.AppendStyle(style)
Call rtItem.AppendText("加粗的文本")
```

## 插入表格

NotesRichTextItem 允許插入表格，使用 `AppendTable` 方法：

```lotusscript
Dim table As NotesRichTextTable
Set table = rtItem.AppendTable(3, 2)
```

這將插入一個 3 行 2 列的表格。您可以使用 `BeginInsert` 和 `EndInsert` 方法來填充表格內容。

## 嵌入對象

您還可以在富文本中嵌入對象，如文件附件或 OLE 對象。例如，嵌入一個文件：

```lotusscript
Call rtItem.EmbedObject(EMBED_ATTACHMENT, "", "C:\path\to\file.txt")
```

## 保存和關閉文件

完成富文本內容的編輯後，記得保存並關閉文件：

```lotusscript
Call doc.Save(True, False)
```

## 結論

透過 NotesRichTextItem 類別，開發者可以在 LotusScript 中靈活地創建和操作富文本內容，滿足各種應用需求。更多詳細資訊，請參閱 [NotesRichTextItem 類別官方文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESRICHTEXTITEM_CLASS.html)。
