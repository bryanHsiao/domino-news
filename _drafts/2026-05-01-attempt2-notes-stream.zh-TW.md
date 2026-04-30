---
title: "使用 NotesStream 進行檔案操作的指南"
description: "深入探討如何在 LotusScript 中使用 NotesStream 類別進行檔案讀寫操作，並提供實際範例。"
pubDate: "2026-05-01T07:23:50+08:00"
lang: "zh-TW"
slug: "notes-stream"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Server"
sources:
  - title: "NotesStream class (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESSTREAM_CLASS.html"
  - title: "OpenNTF: File Operations in LotusScript"
    url: "https://openntf.org/main.nsf/project.xsp?r=project/File%20Operations%20in%20LotusScript"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 2
slug: notes-stream
-->

## 簡介

在 HCL Domino 的 LotusScript 中，`NotesStream` 類別提供了一種有效的方法來處理檔案的讀寫操作。透過 `NotesStream`，開發者可以讀取和寫入文字或二進位檔案，這對於需要處理外部檔案的應用程式非常有用。

## NotesStream 類別概述

`NotesStream` 類別允許開發者在 LotusScript 中讀取和寫入檔案內容。它提供了多種方法和屬性來控制檔案操作，例如開啟、關閉、讀取、寫入等。

## 使用範例

以下是一個使用 `NotesStream` 類別讀取文字檔案內容的範例：

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream

If stream.Open("C:\\example.txt") Then
    Dim content As String
    content = stream.ReadText
    MsgBox content
    stream.Close
Else
    MsgBox "無法開啟檔案。"
End If
```

在此範例中，`CreateStream` 方法用於建立一個新的 `NotesStream` 實例，`Open` 方法用於開啟指定路徑的檔案，`ReadText` 方法用於讀取檔案內容，最後使用 `Close` 方法關閉流。

## 進階操作

`NotesStream` 也支援二進位檔案的讀寫。以下是一個寫入二進位檔案的範例：

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream

If stream.Open("C:\\output.bin", "w") Then
    Dim data(3) As Byte
    data(0) = 72
    data(1) = 101
    data(2) = 108
    data(3) = 108
    stream.Write(data)
    stream.Close
    MsgBox "檔案寫入成功。"
Else
    MsgBox "無法開啟檔案。"
End If
```

在此範例中，`Open` 方法的第二個參數 "w" 表示以寫入模式開啟檔案，`Write` 方法用於寫入二進位資料。

## 注意事項

- 確保在操作完成後關閉 `NotesStream`，以釋放系統資源。
- 在讀取或寫入檔案時，處理可能的錯誤，例如檔案不存在或無法存取。

## 結論

`NotesStream` 類別為 LotusScript 提供了一種靈活且強大的方式來處理檔案操作。透過熟悉其方法和屬性，開發者可以有效地在應用程式中實現各種檔案讀寫功能。

有關 `NotesStream` 類別的詳細資訊，請參閱 [官方文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESSTREAM_CLASS.html)。
