---
title: "使用 NotesDXLImporter 進行 DXL 匯入的 LotusScript 教學"
description: "本教學將指導您如何使用 NotesDXLImporter 類別在 LotusScript 中將 DXL（Domino XML）資料匯入到 HCL Domino 資料庫中。"
pubDate: "2026-10-09T10:50:33+08:00"
lang: "zh-TW"
slug: "notes-dxl-importer-lotusscript-tutorial"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesDXLImporter class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html"
  - title: "NotesDXLExporter class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLEXPORTER_CLASS.html"
  - title: "ImportDxl method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IMPORTDXL_METHOD.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-dxl-importer-lotusscript-tutorial
-->

## 簡介

HCL Domino 的 DXL（Domino XML）提供了一種以 XML 格式表示 Domino 資料庫內容的方式。透過 DXL，開發者可以匯出和匯入資料庫的設計元素和文件，實現資料的備份、傳輸和同步。在 LotusScript 中，`NotesDXLImporter` 類別用於將 DXL 資料匯入到 Domino 資料庫中。

## 先決條件

- 熟悉 LotusScript 編程。
- 擁有 HCL Domino Designer 的基本知識。
- 具備對 DXL 格式的基本理解。

## 步驟 1：建立 DXL 檔案

首先，您需要一個包含要匯入資料的 DXL 檔案。此檔案可以是從現有 Domino 資料庫中匯出的，或是手動建立的。以下是一個簡單的 DXL 文件範例，包含一個表單和一個文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dxl>
  <database>
    <form name="TestForm">
      <field name="Subject" type="text"/>
      <field name="Body" type="richtext"/>
    </form>
    <document form="TestForm">
      <item name="Subject">
        <text>測試主題</text>
      </item>
      <item name="Body">
        <text>這是測試內容。</text>
      </item>
    </document>
  </database>
</dxl>
```

## 步驟 2：在 LotusScript 中使用 NotesDXLImporter

在 Domino Designer 中，建立一個新的代理程式，並添加以下 LotusScript 代碼：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Dim importer As NotesDXLImporter
    Dim stream As NotesStream
    
    ' 獲取當前資料庫
    Set db = session.CurrentDatabase
    
    ' 初始化 DXLImporter
    Set importer = session.CreateDXLImporter
    Set stream = session.CreateStream
    
    ' 打開 DXL 檔案
    If Not stream.Open("C:\path\to\your\file.dxl") Then
        MsgBox "無法打開 DXL 檔案。"
        Exit Sub
    End If
    
    ' 設置匯入選項
    importer.ReplaceDesign = True
    importer.DocumentImportOption = DXLIMPORTOPTION_CREATE
    
    ' 執行匯入
    Call importer.Import(stream, db)
    
    ' 關閉流
    Call stream.Close
    
    MsgBox "DXL 匯入完成。"
End Sub
```

### 代碼解釋

1. **初始化物件**：
   - `session`：當前的 NotesSession。
   - `db`：當前的 NotesDatabase。
   - `importer`：`NotesDXLImporter` 物件，用於執行 DXL 匯入。
   - `stream`：`NotesStream` 物件，用於讀取 DXL 檔案。

2. **打開 DXL 檔案**：
   - 使用 `stream.Open` 方法打開指定路徑的 DXL 檔案。

3. **設置匯入選項**：
   - `ReplaceDesign`：設置為 `True`，表示如果設計元素已存在，則替換它們。
   - `DocumentImportOption`：設置為 `DXLIMPORTOPTION_CREATE`，表示創建新的文件。

4. **執行匯入**：
   - 使用 `importer.Import` 方法將 DXL 資料匯入到資料庫中。

5. **關閉流**：
   - 使用 `stream.Close` 方法關閉流。

## 注意事項

- 確保 DXL 檔案的路徑正確，並且檔案可讀取。
- 在執行匯入前，建議備份目標資料庫，以防止意外的資料丟失。
- 根據需要調整匯入選項，例如 `ReplaceDesign` 和 `DocumentImportOption`，以適應不同的匯入需求。

## 結論

透過 `NotesDXLImporter` 類別，您可以在 LotusScript 中輕鬆地將 DXL 資料匯入到 HCL Domino 資料庫中。這為資料的備份、傳輸和同步提供了靈活且強大的解決方案。更多詳細資訊，請參閱 [NotesDXLImporter 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDXLIMPORTER_CLASS.html) 和 [ImportDxl 方法](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_IMPORTDXL_METHOD.html)。
