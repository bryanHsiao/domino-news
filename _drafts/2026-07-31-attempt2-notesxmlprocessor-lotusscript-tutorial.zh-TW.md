---
title: "NotesXMLProcessor：LotusScript 中的 XML 處理基礎"
description: "深入探討 NotesXMLProcessor 類別，了解其在 LotusScript 中的應用，並透過實例展示如何有效地處理 XML 資料。"
pubDate: "2026-07-31T08:04:54+08:00"
lang: "zh-TW"
slug: "notesxmlprocessor-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesXMLProcessor (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html"
  - title: "Using XML with LotusScript"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_USING_XML_WITH_LOTUSSCRIPT_METHODS_XML.html"
  - title: "Process (NotesXMLProcessor - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_PROCESS_METHOD_XMLPROCESSOR.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notesxmlprocessor-lotusscript-tutorial
-->

## 簡介

在 HCL Domino 的開發環境中，處理 XML 資料是常見的需求。LotusScript 提供了一系列類別來支援 XML 的處理，其中 `NotesXMLProcessor` 是所有 XML 處理類別的基礎類別。本文將介紹 `NotesXMLProcessor` 的主要功能，並透過實例展示如何在 LotusScript 中使用它來處理 XML 資料。

## NotesXMLProcessor 類別概述

`NotesXMLProcessor` 是一個抽象基礎類別，包含所有 XML 處理類別共用的屬性和方法。其衍生類別包括：

- `NotesDOMParser`：將 XML 解析為 DOM 樹。
- `NotesDXLExporter`：將 Domino 資料轉換為 DXL（Domino XML）。
- `NotesDXLImporter`：將 DXL 轉換回 Domino 資料。
- `NotesSAXParser`：使用 SAX（簡單 API）解析 XML。
- `NotesXSLTransformer`：透過 XSLT 轉換 DXL 資料。

需要注意的是，`NotesXMLProcessor` 本身是抽象類別，無法直接實例化。相反，應透過 `NotesSession` 類別的相應方法來創建其衍生類別的實例。

## 主要屬性和方法

### 屬性

- `ExitOnFirstFatalError`：布林值，指示在遇到致命錯誤時是否應該終止處理。
- `Log`：只讀屬性，包含處理器生成的警告、錯誤和致命錯誤的 XML 表示。
- `LogComment`：可讀寫屬性，添加到日誌開頭的註解。

### 方法

- `SetInput`：指定 XML 處理的輸入。
- `SetOutput`：指定 XML 處理的輸出。
- `Process`：啟動 XML 資料的轉換或解析。

## 使用範例：將 Domino 資料庫導出為 DXL

以下範例展示如何使用 `NotesDXLExporter`（繼承自 `NotesXMLProcessor`）將當前資料庫導出為 DXL 檔案。

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Set db = session.CurrentDatabase

    ' 創建輸出流
    Dim stream As NotesStream
    Set stream = session.CreateStream
    Dim filename As String
    filename = "C:\dxl\" & Left(db.FileName, Len(db.FileName) - 3) & "xml"
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

    ' 檢查日誌
    If exporter.Log <> "" Then
        Messagebox "導出過程中出現錯誤: " & exporter.Log,, "錯誤"
    Else
        Messagebox "導出成功!",, "成功"
    End If
End Sub
```

在此範例中，我們首先創建了一個 `NotesStream` 物件作為輸出，然後使用 `CreateDXLExporter` 方法創建了一個 `NotesDXLExporter` 物件。透過 `SetInput` 和 `SetOutput` 方法設置輸入和輸出，最後調用 `Process` 方法執行導出。導出完成後，檢查 `Log` 屬性以確保沒有錯誤發生。

## 結論

`NotesXMLProcessor` 作為 LotusScript 中處理 XML 的基礎類別，提供了統一的接口和共用的功能。透過理解其屬性和方法，開發者可以更有效地使用其衍生類別來處理各種 XML 相關的任務。更多詳細資訊，請參閱 [NotesXMLProcessor 官方文件](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTESXMLPROCESSOR_CLASS.html) 和 [LotusScript 中使用 XML](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_USING_XML_WITH_LOTUSSCRIPT_METHODS_XML.html)。
