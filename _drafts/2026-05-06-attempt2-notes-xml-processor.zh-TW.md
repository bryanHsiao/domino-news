---
title: "使用 NotesXMLProcessor 處理 XML 的實用指南"
description: "深入探討 NotesXMLProcessor 類別，學習如何在 LotusScript 中有效地處理 XML 資料，包括設定輸入輸出、處理方法，以及與其他 XML 處理類別的整合。"
pubDate: "2026-05-06T07:24:15+08:00"
lang: "zh-TW"
slug: "notes-xml-processor"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesXMLProcessor (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html"
  - title: "Using XML with LotusScript"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=domino-using-xml-lotusscript"
  - title: "Process (NotesXMLProcessor - LotusScript)"
    url: "https://www.ibm.com/docs/en/domino-designer/9.0.1?topic=lotusscript-process-notesxmlprocessor"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-xml-processor
-->

## 簡介

在 HCL Domino 開發中，處理 XML 資料是常見的需求。LotusScript 提供了一組強大的類別來協助開發者處理 XML，其中的基礎類別是 `NotesXMLProcessor`。本指南將深入探討 `NotesXMLProcessor` 的功能，並示範如何在 LotusScript 中有效地處理 XML 資料。

## NotesXMLProcessor 概述

`NotesXMLProcessor` 是所有 XML 處理類別的基礎類別，包含了共用的屬性和方法。其衍生類別包括：

- `NotesDXLExporter`：將 Domino 資料轉換為 DXL（Domino XML）。
- `NotesDXLImporter`：將 DXL 轉換回 Domino 資料。
- `NotesDOMParser`：將 XML 解析為標準的 DOM（文件物件模型）樹。
- `NotesSAXParser`：使用 SAX（簡單 API）解析 XML。
- `NotesXSLTransformer`：透過 XSLT 轉換 DXL。

這些類別繼承了 `NotesXMLProcessor` 的屬性和方法，使得 XML 處理更加一致和方便。

## 主要屬性和方法

### 屬性

- `ExitOnFirstFatalError`：布林值，指示在遇到致命錯誤時是否應該終止處理。
- `Log`：唯讀字串，包含處理器產生的警告、錯誤和致命錯誤的 XML 表示。
- `LogComment`：可寫字串，添加到日誌開頭的註解。

### 方法

- `SetInput`：指定 XML 處理的輸入。
- `SetOutput`：指定 XML 處理的輸出。
- `Process`：啟動 XML 資料的轉換或解析。

## 使用範例

以下範例展示如何使用 `NotesDXLExporter` 將當前資料庫的內容導出為 DXL。

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Set db = session.CurrentDatabase

    ' 創建輸出流
    Dim stream As NotesStream
    Set stream = session.CreateStream
    Dim filename As String
    filename = "c:\dxl\" & Left(db.FileName, Len(db.FileName) - 3) & "xml"
    If Not stream.Open(filename) Then
        Messagebox "無法打開 " & filename,, "錯誤"
        Exit Sub
    End If
    Call stream.Truncate

    ' 創建 DXL 導出器
    Dim exporter As NotesDXLExporter
    Set exporter = session.CreateDXLExporter
    Call exporter.SetInput(db)
    Call exporter.SetOutput(stream)

    ' 執行導出
    Call exporter.Process

    ' 關閉流
    Call stream.Close
    Messagebox "DXL 導出完成。"
End Sub
```

在此範例中，我們：

1. 創建了一個 `NotesStream` 對象作為輸出流。
2. 使用 `CreateDXLExporter` 方法創建了一個 `NotesDXLExporter` 對象。
3. 設定了輸入為當前資料庫，輸出為我們創建的流。
4. 調用 `Process` 方法執行導出。

## 注意事項

- 在使用 `NotesStream` 作為輸入或輸出時，確保在讀取或寫入之前關閉並重新打開流，以避免潛在的問題。
- 在處理大型 XML 文件時，注意內存使用，必要時考慮分批處理。

## 結論

`NotesXMLProcessor` 提供了一個統一的接口來處理 XML 資料，透過其衍生類別，開發者可以方便地在 LotusScript 中進行 XML 的解析、轉換和導入導出。熟悉這些類別的使用將有助於提升開發效率，並擴展應用的功能。

有關更多詳細資訊，請參閱 [NotesXMLProcessor 官方文件](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html) 和 [使用 LotusScript 處理 XML](https://www.ibm.com/docs/en/domino-designer/9.0.0?topic=domino-using-xml-lotusscript)。
