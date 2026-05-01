---
title: "LotusScript NotesStream 實戰指南：把檔案讀寫做對"
description: "NotesStream 是 LotusScript 從 Notes/Domino 代理人讀寫檔案的標準抽象。本文整理 Open 真正的 signature、Truncate-before-write 的寫入慣例、文字與二進位 I/O 的差異，以及官方文件實際載明的陷阱。"
pubDate: "2026-05-02T07:00:00+08:00"
lang: "zh-TW"
slug: "notes-stream"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "NotesStream class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESSTREAM_CLASS.html"
  - title: "NotesStream.Open method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_OPEN_METHOD_STREAM.html"
  - title: "NotesStream.Truncate method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_TRUNCATE_METHOD_STREAM.html"
cover: "/covers/notes-stream.png"
---

## NotesStream 到底是什麼

`NotesStream` 是 LotusScript 在 Notes/Domino 代理人或 script library 內讀寫檔案的標準抽象。流程一律是：用 `NotesSession.CreateStream` 建立 stream，再以 `Open` 指向實際檔案，最後依需求進行讀或寫——可以是文字（搭配 charset），也可以是純二進位。

它**不是**「fopen 加上 mode flag」那種 API。`"r"`、`"w"`、`"a"` 都不存在。最接近「寫入模式」的概念，是後文會提到的 `Truncate`。

## 建立並開啟 stream

`CreateStream` 不接任何參數，直接回傳一個全新、空的 stream：

```lotusscript
Dim session As New NotesSession
Dim s As NotesStream
Set s = session.CreateStream
```

`Open` 只接受兩個參數——而第二個是 **charset**，不是 mode：

```lotusscript
If Not s.Open("C:\reports\sales.txt", "UTF-8") Then
    Error 1, "Cannot open file"
End If
```

完整 signature 是 `flag = notesStream.Open(pathname$ [, charset$])`。`charset$` 為 optional，預設 `"System"`。合法值包含 `ASCII`、`UTF-8`、`UTF-16`、`Big5`、`Shift_JIS`，以及給「純位元組」用的特殊值 `"Binary"`。檔案不存在時，`Open` 會自動建立。完整 charset 清單列於 [NotesStream.Open 方法文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_OPEN_METHOD_STREAM.html)。

`Open` 在路徑無效、stream 已開啟、stream 內已有資料，或 charset 無法辨識時，會回傳 `False`。

## 讀取：文字 vs 位元組

讀取有兩個方法，**彼此不可互換**：

| 方法 | 回傳型別 | 適用情境 |
|---|---|---|
| `ReadText([oneLine&], [eol&])` | `String` | 已知 charset 的文字內容 |
| `Read([length&])` | `Variant` 位元組陣列 | 二進位內容 |

`ReadText` 預設讀取整個 stream（上限 2 GB），也可帶 `STMREAD_LINE` 一次只讀一行。`Read` 每次呼叫**最多 65 535 bytes**——較大的二進位檔案要在 `IsEOS` 為 `True` 之前迴圈累積讀取。

## 寫入文字

```lotusscript
Set s = session.CreateStream
If Not s.Open("C:\out.txt", "UTF-8") Then Error 1, "open failed"
Call s.Truncate
Call s.WriteText("Hello, Domino", EOL_CRLF)
Call s.Close
```

兩個要點：

1. **`Truncate` 才是「從零開始覆寫」的正確做法。** 根據 [NotesStream.Truncate 方法文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_TRUNCATE_METHOD_STREAM.html)，它會刪除 stream 內容並把 `Bytes` 重置為 0、`Position` 重置為 0、`IsEOS` 變為 `True`。要覆寫舊檔時，在 `Open` 之後呼叫 Truncate。
2. **`WriteText` 在特定條件下會自動寫入 BOM**——當 charset 為 `Unicode` / `UTF-16` / `UTF-16BE` / `UTF-16LE`、且 stream 為空時。事後讀到的 `Bytes` 屬性會明確排除 BOM。

`WriteText(text$, [eol&])` 每次最多 2 GB。`eol&` 控制行尾字元：`EOL_CRLF`（預設）、`EOL_CR`、`EOL_LF`、`EOL_LFCR`、`EOL_NONE`。

## 寫入二進位

二進位 I/O 用 `Write`，參數是 `Variant` 位元組陣列——每次最多 **65 535 bytes**：

```lotusscript
Dim s As NotesStream
Dim buf(0 To 3) As Byte
buf(0) = 72   ' H
buf(1) = 101  ' e
buf(2) = 108  ' l
buf(3) = 108  ' l

Set s = session.CreateStream
If Not s.Open("C:\out.bin", "Binary") Then Error 1, "open failed"
Call s.Truncate
Call s.Write(buf)
Call s.Close
```

charset 用 `"Binary"` 即可告訴 stream 以純位元組模式處理檔案，不做任何編碼轉換。`Write` 回傳實際寫入的 bytes 數（`Long`）。

## Position 與 IsEOS

`Position` 是可讀可寫的 `Long`，代表自 stream 起點起算的 byte offset。設為 `0` 倒回起點；設為大於檔案大小的值，會直接跳到 end-of-stream。讀取會從目前 `Position` 開始消耗；寫入則無論你設在哪，最後都會把 `Position` 推到 end-of-stream。

`IsEOS` 在 `Truncate`、任一 `Write` / `WriteText` 之後，或讀取已耗盡時會變成 `True`，是讀取迴圈裡判斷「結束了沒」的標準依據。

> 文件提醒：`Position` 設為非 0 值時不會特別處理 multi-byte 字元——你可能會切到字元中間。

## 文件明確寫進的三個陷阱

### 1. Close 一個 zero-byte 的 stream 會刪檔

[NotesStream class 文件](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESSTREAM_CLASS.html) 原文：*"Closing a stream with zero bytes deletes the associated file."* 如果只 `Open` + `Truncate` + `Close` 卻沒寫入任何東西，檔案會被刪。

### 2. `Read` / `Write` 每次上限 65 535 bytes

二進位資料較大時，`Read(length&)` 必須迴圈讀到 `IsEOS`；`Write` 也要分批呼叫。

### 3. `Open` 不是 idempotent

stream 已開啟、或還有殘留 buffered 內容時，`Open` 會直接失敗。要重用同一個 stream 物件指向不同檔案，要先 `Close`。

## 收尾：好好 Close

文件雖說 stream 會在離開 scope 時隱式關閉，但永遠該明確 `Call s.Close`。這會釋放檔案鎖、刷出狀態，再加上前述「zero-byte 規則」，可以讓檔案生命週期變得可預期，而不是「等 LotusScript 高興時才清掉」。
