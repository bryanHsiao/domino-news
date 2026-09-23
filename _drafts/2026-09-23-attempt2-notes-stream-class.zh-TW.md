---
title: "使用 NotesStream 類別進行檔案操作的教學"
description: "本教學將介紹如何使用 LotusScript 中的 NotesStream 類別來讀取和寫入檔案，並提供實際範例說明其應用。"
pubDate: "2026-09-23T09:19:40+08:00"
lang: "zh-TW"
slug: "notes-stream-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesStream class"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html"
  - title: "Open method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPEN_METHOD_STREAM.html"
  - title: "Write method"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITE_METHOD_STREAM.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-stream-class
-->

## 介紹

在 HCL Domino 的 LotusScript 中，`NotesStream` 類別提供了一種方便的方法來處理檔案的讀取和寫入操作。透過此類別，開發者可以輕鬆地讀取檔案內容、寫入資料到檔案，以及處理文字編碼等。本文將介紹如何使用 `NotesStream` 類別進行基本的檔案操作，並提供實際範例說明其應用。

## NotesStream 類別概述

`NotesStream` 類別允許開發者在 LotusScript 中讀取和寫入文字或二進位資料流。該類別提供了多種方法和屬性來控制資料流的行為，例如開啟和關閉流、讀取和寫入資料、設定編碼等。

## 使用範例

以下範例展示了如何使用 `NotesStream` 類別來讀取和寫入檔案。

### 讀取檔案內容

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream

If stream.Open("C:\\example.txt", "UTF-8") Then
    Dim content As String
    content = stream.ReadText
    MsgBox "檔案內容: " & content
    stream.Close
Else
    MsgBox "無法開啟檔案。"
End If
```

在此範例中，我們首先建立了一個 `NotesStream` 物件，然後使用 `Open` 方法以 UTF-8 編碼開啟指定路徑的檔案。如果檔案成功開啟，則使用 `ReadText` 方法讀取其內容，最後關閉流。

### 寫入資料到檔案

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream

If stream.Open("C:\\output.txt", "UTF-8") Then
    stream.WriteText "這是一個測試內容。"
    stream.Close
    MsgBox "資料已成功寫入檔案。"
Else
    MsgBox "無法開啟檔案。"
End If
```

在此範例中，我們建立了一個 `NotesStream` 物件，並使用 `Open` 方法以 UTF-8 編碼開啟或建立指定路徑的檔案。接著，使用 `WriteText` 方法將文字寫入檔案，最後關閉流。

## 注意事項

- 在使用 `NotesStream` 進行檔案操作時，請確保檔案路徑正確，並且具有適當的存取權限。
- 使用 `Open` 方法時，可以指定不同的編碼格式，如 "UTF-8"、"ASCII" 等，根據需求選擇適當的編碼。
- 完成檔案操作後，請務必使用 `Close` 方法關閉流，以釋放資源。

透過上述範例，開發者可以熟悉如何在 LotusScript 中使用 `NotesStream` 類別進行檔案的讀取和寫入操作，從而更有效地處理檔案資料。更多詳細資訊，請參考 [NotesStream 類別](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html) 和 [Open 方法](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPEN_METHOD_STREAM.html) 的官方文件。
