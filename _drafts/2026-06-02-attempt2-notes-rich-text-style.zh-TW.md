---
title: "使用 NotesRichTextStyle 設定富文本樣式"
description: "本教程介紹如何使用 LotusScript 中的 NotesRichTextStyle 類別來設定 HCL Domino 文件中的富文本樣式，包括字體、大小、顏色等。"
pubDate: "2026-06-02T07:36:56+08:00"
lang: "zh-TW"
slug: "notes-rich-text-style"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesRichTextStyle (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESRICHTEXTSTYLE_CLASS.html"
  - title: "NotesRichTextItem (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "NotesRichTextParagraphStyle (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESRICHTEXTPARAGRAPHSTYLE_CLASS.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 0.
  - en body must have >= 2 inline links, got 0.
attempt: 2
slug: notes-rich-text-style
-->

在 HCL Domino 的開發中，我們經常需要在文件中插入富文本內容，並對其應用特定的樣式設定。LotusScript 提供了 NotesRichTextStyle 類別，讓開發者能夠程式化地設定富文本的樣式屬性，如字體、大小、顏色等。

## NotesRichTextStyle 類別概述

NotesRichTextStyle 類別代表富文本的樣式屬性，包含以下主要屬性：

- **Bold**：布林值，指示文本是否為粗體。
- **Italic**：布林值，指示文本是否為斜體。
- **Underline**：布林值，指示文本是否有底線。
- **FontSize**：整數，指定字體大小。
- **NotesFont**：整數，指定字體類型。
- **NotesColor**：整數，指定文本顏色。

要建立新的 NotesRichTextStyle 物件，可以使用 NotesSession 的 CreateRichTextStyle 方法。

## 使用範例

以下範例展示如何在 LotusScript 中使用 NotesRichTextStyle 來設定富文本樣式：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim doc As NotesDocument
Dim rtItem As NotesRichTextItem
Dim rtStyle As NotesRichTextStyle

Set db = session.CurrentDatabase
Set doc = db.CreateDocument
Set rtItem = doc.CreateRichTextItem("Body")
Set rtStyle = session.CreateRichTextStyle

' 設定樣式屬性
rtStyle.Bold = True
rtStyle.Italic = True
rtStyle.Underline = False
rtStyle.FontSize = 12
rtStyle.NotesFont = FONT_COURIER
rtStyle.NotesColor = COLOR_RED

' 將樣式應用於富文本項目
Call rtItem.AppendStyle(rtStyle)
Call rtItem.AppendText("這是一段應用樣式的文本。")

' 儲存文件
Call doc.Save(True, False)
```

在此範例中，我們：

1. 建立了一個新的 NotesRichTextStyle 物件。
2. 設定了粗體、斜體、字體大小、字體類型和顏色等樣式屬性。
3. 將該樣式應用於富文本項目，並插入文本內容。
4. 儲存了包含富文本內容的文件。

## 注意事項

- 在應用樣式之前，確保已建立並初始化 NotesRichTextItem 物件。
- NotesRichTextStyle 的屬性值應根據需求進行設定，未設定的屬性將保持預設值。
- 應用樣式後，後續插入的文本將繼承該樣式，直到應用新的樣式或重置樣式。

透過使用 NotesRichTextStyle 類別，開發者可以在 HCL Domino 應用程式中程式化地控制富文本內容的樣式，提升文件的可讀性和美觀性。
