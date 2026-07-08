---
title: "NotesStream 與文字編碼：字元集、BOM，與位元組 vs 字元的陷阱"
description: "NotesStream 讀寫檔案，但只要你的文字不是純 ASCII，三件事就會咬人：你用哪個字元集開的、有沒有寫進 BOM，以及 Position 是位元組位移、而且「不支援多位元組字元」。本文說明 Open 的字元集參數、EOL 常數、WriteText 到底何時寫 BOM（UTF-16 會、UTF-8 不會），以及為什麼 Bytes 永遠不等於 Len()。"
pubDate: 2026-07-08T07:30:00+08:00
lang: zh-TW
slug: notes-stream-encoding
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesStream class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html"
  - title: "WriteText method (NotesStream) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITETEXT_METHOD_STREAM.html"
  - title: "Position property (NotesStream) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_POSITION_PROPERTY_STREAM.html"
relatedJava: ["Stream"]
relatedSsjs: ["Stream"]
---

你用 agent 寫一個 CSV 匯出，在自己機器上開沒問題，然後同事回報帶重音的名字變成亂碼 —— 或者檔案最前面多了一個怪字元、弄壞了他們的匯入程式。這兩個都是 `NotesStream` 的編碼問題，而只要你知道這個類別默默假設你懂的三件事，兩者都可避免：你用哪個字元集開的、有沒有寫進 BOM、以及 `Position` 數的是位元組、不是字元。

---

## 重點摘要

- 用明確的字元集開：`stream.Open(path$, "UTF-8")`。預設是 `"System"`（機器的 ANSI 代碼頁）—— 對可攜的文字來說很少是你要的。`Charset` 屬性唯讀；你是*透過* `Open` 設定它。
- **WriteText 只對 UTF-16 家族寫 BOM，UTF-8 從不寫。** 文件說：在空檔上、字元集為「Unicode、UTF-16、UTF-16BE 或 UTF-16LE」時，它「在 stream 開頭寫入 byte order mark 或 signature bytes」。UTF-8 刻意不在這份清單裡。
- **`Position` 是位元組位移** ——「不支援多位元組字元」。設 `Position = n` 可能讓你落在 UTF-8/UTF-16 一個字元的*中間*。
- **`Bytes` 對非 ASCII 永遠不等於 `Len(text)`**，而且它*排除* BOM：「大小排除任何偵測到的 Unicode signature 或 byte order mark。」
- 行尾是常數：`WriteText(text$, eol&)` 預設 `EOL_NONE`（5）；`ReadText` 預設 `EOL_CRLF`（0）。這個不對稱代表逐行 round-trip 要明確指定常數。

## 用對的字元集開檔

一個 [`NotesStream`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESSTREAM_CLASS.html) ——「一串二進位或字元資料」—— 來自 session，字元集是 `Open` 的參數：

```lotusscript
Dim session As New NotesSession
Dim s As NotesStream
Set s = session.CreateStream
If Not s.Open("c:\export\names.csv", "UTF-8") Then
  Print "Open failed" : Exit Sub
End If
```

可接受的字元集名稱包含 `ASCII`、`ISO-8859-1` 到 `-15`、`Shift_JIS`、`Big5`、`GB2312`、`UTF-7`、`UTF-8`、`UTF-16`、`UTF-16BE`、`UTF-16LE`、`Windows-125x` 家族，以及 `System`（預設 —— OS 的 ANSI 代碼頁）。唯讀的 `Charset` 屬性把你開檔用的字元集回報給你；你不能直接指派它。這個不對稱很重要：`Open` 的參數決定磁碟上的 bytes 怎麼編碼與解碼，而用*不同*字元集重開同一個檔會悄悄誤解碼 —— API 不會警告你。

## BOM：UTF-16 會、UTF-8 不會

這是這個類別裡最有用的一個事實。依 [`WriteText`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_WRITETEXT_METHOD_STREAM.html) 文件：

> 「如果 stream 開在一個空檔上、且字元集是 Unicode、UTF-16、UTF-16BE 或 UTF-16LE，這個方法會在 stream 開頭寫入 byte order mark 或 signature bytes。」

UTF-8 不在那份清單裡 —— 所以 UTF-8 stream **不會**有 BOM。這通常正是你要的（多數 Unix 工具不喜歡 UTF-8 BOM），但也代表如果某個消費端*要求* UTF-8 BOM，你得自己寫那幾個 bytes。反過來，UTF-16 檔會自動有 BOM —— 但只在檔案一開始是空的時候。而且 BOM 對 `Bytes` 是隱形的：「大小排除任何偵測到的 Unicode signature 或 byte order mark」，所以當有 UTF-16 BOM 時，別拿 `Bytes` 去算磁碟檔案大小。

## Position 是位元組、不是字元

這是產生亂碼讀取的陷阱。[`Position`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_POSITION_PROPERTY_STREAM.html) 屬性是「從 stream 開頭起算的位元組位移」，而文件補上關鍵警告：「不支援多位元組字元。」在 UTF-8 裡，一個帶重音的拉丁字元是兩個位元組、一個 CJK 字元是三個；在 UTF-16 裡每個都至少兩個。所以 `Position = 5` 落在第 5 個位元組，那可能是一個字元的*中間*。要 seek 到字元邊界，你得自己知道各字元的位元組寬度 —— 沒有以字元為單位的 seek。

推論是：`Bytes`（磁碟大小）與 `Len(text)`（字元數）對任何非 ASCII 都會分歧，這也是最乾淨地看見編碼在運作的方式：

```lotusscript
Sub Initialize
  Dim session As New NotesSession
  Dim s As NotesStream
  Dim txt As String
  txt = "Héllo 世界"                     ' 重音 + CJK

  ' 寫 UTF-8（無 BOM），再比較位元組大小與字元長度
  Set s = session.CreateStream
  Call s.Open("c:\export\demo.txt", "UTF-8")
  Call s.Truncate                        ' 確保是空的
  Call s.WriteText(txt, EOL_CRLF)
  Print "Charset:   " & s.Charset
  Print "Bytes:     " & s.Bytes          ' > Len(txt)：é=2 bytes、世/界 各 3 bytes
  Print "Len(txt):  " & Len(txt)         ' 字元數
  Call s.Close

  ' 用「同樣」的字元集讀回來
  Set s = session.CreateStream
  Call s.Open("c:\export\demo.txt", "UTF-8")
  s.Position = 0                         ' 位元組 0 = 開頭（安全）
  Print "Round-trip: " & s.ReadText()
  Call s.Close
End Sub
```

*（由文件的 `Open` / `WriteText` / `ReadText` / `Bytes` 簽名組出來、用以凸顯編碼行為，而非單一份 HCL 原文。）*

這裡 `Bytes` 會回報比 `Len(txt)` 大 —— 那個差距*就是*多位元組編碼被看見了。而因為我們用寫入時同樣的 `"UTF-8"` 讀回，round-trip 是乾淨的；改用 `System` 或 `ISO-8859-1` 開，帶重音的字元就會壞掉。

## 行尾

`WriteText` 可選的第二個參數是行尾樣式，常數值得記牢：`EOL_CRLF`（0）、`EOL_LF`（1）、`EOL_CR`（2）、`EOL_PLATFORM`（3）、`EOL_ANY`（4，讀取端 —— 把 CR/LF/CRLF 任一都當行尾）、`EOL_NONE`（5）。陷阱是兩個方向的預設不同：`WriteText` 預設 `EOL_NONE`（不附加任何東西），而 `ReadText` 預設 `EOL_CRLF`。如果你寫行時不指定 EOL、然後期待用 CRLF 逐行讀，它們不會被切開 —— 兩端都明確傳常數。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesStream` | `Stream` | `Stream` |

Java 的 `lotus.domino.Stream` 與 SSJS 的 `Stream`（都經 `session.createStream()`）在 `open` 上帶同樣的字元集參數、同一套 `EOL_*` 常數、以及同樣以位元組為單位的 `Position`。BOM 行為與位元組-vs-字元的區別是編碼的性質、不是語言的，所以這裡的每個提醒都原樣適用 —— 方法名只是小寫成 `writeText` / `readText`。
