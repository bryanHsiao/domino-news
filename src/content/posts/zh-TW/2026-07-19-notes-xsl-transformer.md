---
title: "NotesXSLTransformer：用 LotusScript 以 XSLT 轉換 XML 與 DXL"
description: "NotesXSLTransformer 把 XSLT stylesheet 套到 XML 或 DXL 上、寫出轉換結果 — 是 Domino XML 工具組裡繼 DOM 與 SAX parser 之後的最後一塊。本文說明 session.CreateXSLTransformer 與它的三種來源、stylesheet 必須是 stream 的規則、把 DXL export → 轉換 → import 串起來而不落暫存檔的 pipelining 模型、以及那個透過 Log 屬性與 On Error（而非事件）運作的錯誤處理。"
pubDate: 2026-07-19T07:30:00+08:00
lang: zh-TW
slug: notes-xsl-transformer
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesXSLTransformer class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXSLTRANSFORMER_CLASS.html"
  - title: "CreateXSLTransformer method (NotesSession) — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEXSLTRANSFORMER_METHOD_SESSION.html"
  - title: "Example: NotesXSLTransformer class — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESXSLTRANSFORMER_CLASS.html"
relatedJava: ["XSLTransformer"]
relatedSsjs: ["XSLTransformer"]
cover: "/covers/notes-xsl-transformer.webp"
coverStyle: "watercolor"
---

一個外部系統丟給你一份 XML — 一批訂單、或一份 HR 名冊 — 而你要它變成 Notes 文件。問題是它的標籤結構跟你的表單欄位對不起來：進來的是 `<order><customer>`，你的表單要的是 `CustName`、`OrderNo` 這些欄位名。你可以寫一支逐欄 parse XML、再逐欄 `doc.ReplaceItemValue` 的迴圈 —— 或者，你用一張 XSLT stylesheet 把那份外部 XML 直接重塑成符合表單的 DXL，交給 [`NotesDXLImporter`](/domino-news/zh-TW/posts/notes-dxl-importer) 建文件。做這個重塑的引擎，就是 [`NotesXSLTransformer`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESXSLTRANSFORMER_CLASS.html) —「DXL（Domino XML）資料透過 XSLT 的轉換」。它是 LotusScript XML 家族的最後一員，與 [DOM](/domino-news/zh-TW/posts/notes-dom-parser) 和 [SAX](/domino-news/zh-TW/posts/notes-sax-parser) parser 並列，嵌進同一條以 stream 為基礎的 pipeline。同一個引擎也反過來用：把文件匯出成 DXL、再轉成別的系統要的格式送出去。

![三步驟示意：外部系統送來的 `<order>` XML（標籤名跟表單對不起來）→ 一張 XSLT stylesheet 把 @id/customer/total 映射成 OrderNo/CustName/Amount → 產出符合 Order 表單的 DXL，由 NotesDXLImporter 建成 Notes 文件](/domino-news/post-images/notes-xslt-xml-to-dxl-mapping.png)

---

## 重點摘要

- 從 session 建立它：[`Set xsl = session.CreateXSLTransformer(input, styleSheet, output)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEXSLTRANSFORMER_METHOD_SESSION.html) — 三個參數都可選（可稍後用 `SetInput` / `SetStyleSheet` / `SetOutput` 設），然後呼叫 `Process`。
- **stylesheet 必須是 `NotesStream`。** input 可以是 String、`NotesStream`、或另一個 XML processor（`NotesDOMParser` / `NotesSAXParser` / `NotesDXLExporter`）；output 可以是 `NotesStream`、一個 parser、一個 `NotesDXLImporter`、或一個 `NotesRichTextItem`。
- **在交出去之前，別自己讀寫那些以檔案為底的 stream** —「你不能在一個關聯到檔案的 NotesStream 物件被用作 XML 輸入或輸出之前，明確地讀或寫它」（檢查 `Bytes` 可以）。
- **錯誤處理是透過 `On Error` + `lsxbeerr.lss` 常數與唯讀的 `Log` 屬性 — 沒有事件。**（不同於 `NotesSAXParser` 會拋 SAX 事件處理器。）
- **Pipelining：** 一個 XML 程序的輸出可以是下一個的輸入，所以你能把 `NotesDXLExporter` → `NotesXSLTransformer` → `NotesDXLImporter` 串起來、不落任何暫存檔。Release 6 新增；不支援 COM。

## 三 stream 的寫法

日常的形狀是三個 `NotesStream` — XML 輸入、XSL stylesheet、輸出 — 接進 transformer。這是[官方範例](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXAMPLES_NOTESXSLTRANSFORMER_CLASS.html)（讀 `hello.xml`、套 `hello.xsl`、寫 `hello.txt`）：

```lotusscript
%INCLUDE "lsxbeerr.lss"

Sub Initialize
  On Error lsERR_NOTES_XSLT_INPUT_OBJECT GoTo err_IN
  On Error lsERR_NOTES_XSLT_OUTPUT_OBJECT GoTo err_OUT
  On Error lsERR_NOTES_XSLT_STYLESHEET_OBJECT GoTo err_SS

  Dim session As New NotesSession
  Dim XML_in As NotesStream, XSL_ss As NotesStream, XML_out As NotesStream

  Set XML_in = session.CreateStream
  If Not XML_in.Open("c:\dxl\hello.xml") Then Exit Sub
  If XML_in.Bytes = 0 Then Exit Sub          ' 檢查 Bytes 是被允許的

  Set XSL_ss = session.CreateStream
  If Not XSL_ss.Open("c:\dxl\hello.xsl") Then Exit Sub   ' stylesheet 必須是 stream

  Set XML_out = session.CreateStream
  If Not XML_out.Open("c:\dxl\hello.txt") Then Exit Sub
  XML_out.Truncate                            ' 清掉舊輸出

  Dim transformer As NotesXSLTransformer
  Set transformer = session.CreateXSLTransformer(XML_in, XSL_ss, XML_out)
  transformer.Process
  Exit Sub
err_IN:
  MessageBox "XSL Input error",, "XSLTransformer" : Exit Sub
err_OUT:
  MessageBox "XSL Output error",, "XSLTransformer" : Exit Sub
err_SS:
  MessageBox "Style Sheet error",, "XSLTransformer" : Exit Sub
End Sub
```

重要的習慣都在這裡：每個以檔案為底的 stream 都打開、但別自己讀寫它（檢查 `Bytes = 0` 確認輸入存在是唯一的例外）、`Truncate` 輸出 stream 好清掉舊內容、讓單一個 `Process` 跑完整個轉換。

## 錯誤走 Log，不走事件

這是這個類別跟它的 SAX 手足不同、也是一個錯誤假設會浪費時間的地方：**`NotesXSLTransformer` 沒有事件模型。** 沒有 `XSLT_*` 回呼要接。錯誤處理改成兩件事。第一，`On Error` 配上 `%INCLUDE "lsxbeerr.lss"` 帶進來的後端錯誤常數 — `lsERR_NOTES_XSLT_INPUT_OBJECT`、`_OUTPUT_OBJECT`、`_STYLESHEET_OBJECT` — 這就是官方範例區分「輸入問題」與「stylesheet 問題」的方式。第二，唯讀的 `Log` 屬性，「一個由 processor 產生的警告、錯誤、致命錯誤的 XML 表示」，你可以在 `Process` 之後讀它拿細節；`ExitOnFirstFatalError` 控制處理是否在第一個致命錯誤就停。如果你原本期待一個 SAX 式的處理器，這一段就是要重讀的。

## Pipelining：跳過暫存檔

transformer 之所以把 parser 與 DXL 物件也當作 input/output、不只是 stream，原因是 pipelining —「把操作組合起來，讓一個 XML 程序的輸出成為另一個的輸入」。舉一個具體的：你要把一批文件從舊資料庫搬到一個表單設計不同的新資料庫，其中一個欄位改了名 —— 舊的叫 `Cust`，新表單要 `CustomerName`。與其寫 LotusScript 逐份文件複製、逐欄改名，你把三個物件串起來：

- `NotesDXLExporter`（把舊庫文件匯出成 DXL）→ **`NotesXSLTransformer`**（stylesheet 把 `<item name='Cust'>` 改寫成 `<item name='CustomerName'>`）→ [`NotesDXLImporter`](/domino-news/zh-TW/posts/notes-dxl-importer)（把改寫後的 DXL 寫進新庫）。

那支 stylesheet 做的就是這種節點層級的改寫：

```xml
<!-- 進來的 -->  <item name='Cust'><text>Acme</text></item>
<!-- 出去的 -->  <item name='CustomerName'><text>Acme</text></item>
```

欄位對應寫在宣告式的 stylesheet 裡，不寫在程式流程裡 —— 多一個欄位改名就多一條 template，不動 LotusScript。stylesheet 仍然是一個 `NotesStream`，但 XML 輸入與輸出變成活的物件，沒有任何中間檔碰到磁碟。`AddParameter` 讓你把最上層的 `<xsl:param>` 值傳進 stylesheet，所以同一個轉換能每次跑用不同參數（例如目標表單名、或一個批次代碼）。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `session.CreateXSLTransformer(...)` → `NotesXSLTransformer` | `session.createXSLTransformer(...)` → `XSLTransformer` | `session.createXSLTransformer(...)` |

Java 有一個對應的 `lotus.domino.XSLTransformer`，但它不是 1:1 鏡像 — Java 的 DXL/XSLT 路線用 JAXP 式的 result-target 模型（`XSLTResultTarget`，由 `FileOutputStream` 或 `StringWriter` 建構），而非那個 stream 三件組。SSJS 透過 session 取到同一個後端工廠方法。核心概念 — 餵 XML/DXL 與一個 stylesheet、拿到轉換後的輸出、優先用 pipelining 而非暫存檔 — 在三種語言都通用。
