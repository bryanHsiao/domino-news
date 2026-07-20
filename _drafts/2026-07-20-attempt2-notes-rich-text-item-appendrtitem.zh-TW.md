---
title: "使用 LotusScript 中的 AppendRTItem 方法合併 NotesRichTextItem"
description: "本文介紹如何在 LotusScript 中使用 AppendRTItem 方法將一個 NotesRichTextItem 的內容附加到另一個 NotesRichTextItem，並提供實際範例與注意事項。"
pubDate: "2026-07-20T08:00:38+08:00"
lang: "zh-TW"
slug: "notes-rich-text-item-appendrtitem"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "AppendRTItem (NotesRichTextItem - LotusScript)"
    url: "https://www.ibm.com/docs/SSVRGU_9.0.1/basic/H_APPENDRTITEM_METHOD.html"
  - title: "AppendText (NotesRichTextItem - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_APPENDTEXT_METHOD.html"
  - title: "AppendStyle (NotesRichTextItem - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_APPENDSTYLE_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-rich-text-item-appendrtitem
-->

在 HCL Domino 的 LotusScript 中，`NotesRichTextItem` 類別提供了多種方法來操作富文本字段。其中，`AppendRTItem` 方法允許將一個富文本項的內容附加到另一個富文本項的末尾。

## AppendRTItem 方法概述

`AppendRTItem` 方法的語法如下：

```lotusscript
Call notesRichTextItem.AppendRTItem(notesRichTextItem2)
```

- `notesRichTextItem2`：要附加的富文本項。

此方法將 `notesRichTextItem2` 的內容插入到 `notesRichTextItem` 的末尾。

## 使用範例

以下範例展示如何使用 `AppendRTItem` 方法將一個文檔的富文本字段內容附加到另一個文檔的富文本字段中：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc1 As NotesDocument
Dim doc2 As NotesDocument
Dim rtItem1 As NotesRichTextItem
Dim rtItem2 As NotesRichTextItem

Set db = session.CurrentDatabase
Set doc1 = db.GetDocumentByUNID("UNID1")
Set doc2 = db.GetDocumentByUNID("UNID2")

Set rtItem1 = doc1.GetFirstItem("Body")
Set rtItem2 = doc2.GetFirstItem("Body")

Call rtItem1.AppendRTItem(rtItem2)
Call doc1.Save(True, False)
```

在此範例中，`doc2` 的 `Body` 富文本字段內容被附加到 `doc1` 的 `Body` 富文本字段末尾，並保存了 `doc1`。

## 注意事項

- **插入位置**：`AppendRTItem` 方法會將內容附加到目標富文本項的末尾。

- **與其他方法的兼容性**：在使用 `BeginInsert` 方法設置插入點後，不能調用 `AppendRTItem` 方法。

- **界面更新**：在編輯模式下打開的文檔中，對富文本的更改不會立即顯示。需要關閉並重新打開文檔才能看到更改。

更多詳細信息，請參閱 [AppendRTItem 方法的官方文檔](https://www.ibm.com/docs/SSVRGU_9.0.1/basic/H_APPENDRTITEM_METHOD.html)。

## 相關方法

- **AppendText**：將文本插入到富文本項中，文本將以當前樣式呈現。

- **AppendStyle**：在富文本項中插入樣式，後續文本將使用該樣式的屬性。

這些方法提供了更靈活的方式來操作富文本內容。

通過理解和使用 `AppendRTItem` 方法，開發者可以更有效地在 LotusScript 中操作富文本字段，實現更複雜的文檔處理需求。
