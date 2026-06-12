---
title: "使用 NotesDXLExporter 進行 DXL 匯出：LotusScript 教學"
description: "本教學將介紹如何使用 LotusScript 中的 NotesDXLExporter 類別，將 HCL Domino 資料庫的內容匯出為 DXL（Domino XML）格式，並提供實際範例。"
pubDate: "2026-06-13T07:38:49+08:00"
lang: "zh-TW"
slug: "notesdxlexporter-lotusscript"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDXLExporter (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html"
  - title: "Example: NotesDXLExporter class"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_EXAMPLES_NOTESDXLEXPORTER_CLASS.html"
  - title: "Using XML with LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_USING_XML_WITH_LOTUSSCRIPT_METHODS_XML.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesdxlexporter-lotusscript
-->

## 簡介

在 HCL Domino 開發中，DXL（Domino XML）是一種用於表示 Domino 資料的 XML 格式。透過 DXL，開發者可以以標準化的方式匯出和匯入 Domino 資料，方便進行資料交換和備份。

LotusScript 提供了 `NotesDXLExporter` 類別，允許開發者將 Domino 資料庫、文件或文件集合匯出為 DXL 格式。本文將介紹如何使用 `NotesDXLExporter` 進行 DXL 匯出，並提供實際範例。

## `NotesDXLExporter` 類別概述

`NotesDXLExporter` 類別代表將 Domino 資料轉換為 DXL 的過程。該類別繼承自 `NotesXMLProcessor`，並包含多個屬性和方法，允許開發者控制匯出行為。

### 主要屬性

- `AttachmentOmittedText`：指定在匯出時省略附件時的替代文字。
- `ConvertNotesBitmapsToGIF`：指示是否將 Notes 位圖轉換為 GIF 格式。
- `DoctypeSYSTEM`：設定 DXL 文件的 DOCTYPE SYSTEM 屬性。
- `ForceNoteFormat`：指示是否強制使用 Note 格式進行匯出。
- `Log`：返回匯出過程的日誌。
- `MIMEOption`：控制 MIME 資料的匯出方式。
- `RichTextOption`：控制富文本的匯出方式。

### 主要方法

- `SetInput`：設定要匯出的 Domino 資料。
- `SetOutput`：設定匯出的 DXL 資料的輸出目標。
- `Process`：開始匯出過程。
- `Export`：將指定的 Domino 資料轉換為 DXL 字串。

## 使用範例

以下範例展示如何使用 `NotesDXLExporter` 將當前資料庫匯出為 DXL 文件。

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.CurrentDatabase

  ' 打開一個以當前資料庫命名的 XML 文件
  Dim stream As NotesStream
  Set stream = session.CreateStream
  filename$ = "c:\dxl\" & Left(db.FileName, Len(db.FileName) - 3) & "dxl"
  If Not stream.Open(filename$) Then
    Messagebox "無法打開 " & filename$,, "錯誤"
    Exit Sub
  End If
  Call stream.Truncate

  ' 匯出當前資料庫為 DXL
  Dim exporter As NotesDXLExporter
  Set exporter = session.CreateDXLExporter
  Call exporter.SetInput(db)
  Call exporter.SetOutput(stream)
  Call exporter.Process
End Sub
```

在此範例中，我們首先獲取當前的資料庫，然後創建一個 `NotesStream` 對象來保存匯出的 DXL 資料。接著，創建一個 `NotesDXLExporter` 對象，設定輸入為當前資料庫，輸出為我們創建的流，最後調用 `Process` 方法進行匯出。

## 注意事項

- 確保在匯出前，輸出目標（如文件路徑）是可寫的，並且有足夠的空間存儲匯出的 DXL 資料。
- 在匯出包含大量附件或富文本的資料時，可能需要調整相關屬性，如 `OmitRichtextAttachments` 或 `OmitRichtextPictures`，以控制匯出的內容。
- 匯出的 DXL 資料可以用於備份、資料交換或其他需要以 XML 格式表示 Domino 資料的場景。

## 結論

`NotesDXLExporter` 類別提供了一種方便的方法，將 Domino 資料匯出為 DXL 格式。透過適當的屬性設定和方法調用，開發者可以靈活地控制匯出行為，滿足不同的需求。更多詳細資訊，請參閱 [NotesDXLExporter (LotusScript)](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html) 和 [使用 XML 與 LotusScript](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_USING_XML_WITH_LOTUSSCRIPT_METHODS_XML.html)。
