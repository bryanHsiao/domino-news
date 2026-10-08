---
title: "使用 NotesStream 類別進行檔案操作的指南"
description: "深入探討如何在 LotusScript 中使用 NotesStream 類別進行檔案的讀寫操作，包括建立、開啟、讀取、寫入和關閉檔案的步驟。"
pubDate: "2026-10-08T10:36:15+08:00"
lang: "zh-TW"
slug: "notes-stream-class"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesStream (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESSTREAM_CLASS.html"
  - title: "Examples: Open method (NotesStream - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.1/basic/H_EXAMPLES_OPEN_METHOD_STREAM.html"
  - title: "Examples: Write method"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXAMPLES_WRITE_METHOD_STREAM.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "notes-stream-class" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESSTREAM_CLASS.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-stream-class
-->

## 簡介

在 HCL Domino 的 LotusScript 中，`NotesStream` 類別提供了一種有效的方法來處理二進位或文字資料流。這對於需要讀取或寫入檔案的應用程式開發者來說非常有用。本文將詳細介紹如何使用 `NotesStream` 類別進行檔案操作。

## 建立和開啟 NotesStream

要使用 `NotesStream`，首先需要透過 `NotesSession` 物件的 `CreateStream` 方法來建立一個新的 `NotesStream` 物件。接著，使用 `Open` 方法將該流與特定的檔案關聯。

```lotusscript
Dim session As New NotesSession
Dim stream As NotesStream
Set stream = session.CreateStream
If Not stream.Open("C:\\example.txt", "UTF-8") Then
    MsgBox "無法開啟檔案。"
    Exit Sub
End If
```

在上述程式碼中，`Open` 方法的第一個參數是檔案的完整路徑，第二個參數是檔案的字元集。若檔案不存在，`Open` 方法將會建立該檔案。

## 寫入資料到檔案

一旦成功開啟檔案，可以使用 `WriteText` 方法將文字寫入流中。

```lotusscript
Call stream.WriteText("這是一個範例文字。")
```

寫入後，建議使用 `Close` 方法關閉流，以確保所有資料都被正確寫入檔案。

```lotusscript
Call stream.Close
```

## 讀取檔案內容

要讀取檔案內容，可以使用 `ReadText` 方法。首先，確保流的 `Position` 屬性設為 0，以從檔案的開頭開始讀取。

```lotusscript
stream.Position = 0
Dim fileContent As String
fileContent = stream.ReadText
MsgBox fileContent
```

## 檢查流的狀態

在操作流時，檢查其狀態是很重要的。`IsEOS` 屬性可用來判斷是否已到達流的結尾。

```lotusscript
If stream.IsEOS Then
    MsgBox "已到達檔案結尾。"
End If
```

## 結論

`NotesStream` 類別為 LotusScript 提供了一個強大的工具，用於處理檔案的讀寫操作。透過正確地建立、開啟、讀取、寫入和關閉流，開發者可以有效地管理應用程式中的檔案操作。更多詳細資訊和範例，請參閱 [NotesStream 類別官方文件](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_NOTESSTREAM_CLASS.html) 和 [Open 方法範例](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_EXAMPLES_OPEN_METHOD_STREAM.html)。
