---
title: "NotesRichTextTable：在程式裡往 rich text 塞一個表格"
description: "你在程式裡用 NotesRichTextItem 組一封 rich text 信或文件，需要一個表格來排版摘要或報表 — NotesRichTextItem.AppendTable 建出來的就是 NotesRichTextTable。本文拆解怎麼建立、RowCount / ColumnCount、AddRow / RemoveRow、SetColor / SetAlternateColor 交替色、RightToLeft，以及怎麼用 NotesRichTextNavigator 走訪既有表格與一個關鍵限制：不知道 rich text 的確切結構，就讀不出儲存格內容。"
pubDate: 2026-06-24T07:30:00+08:00
lang: zh-TW
slug: notes-rich-text-table
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextTable class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTTABLE_CLASS.html"
  - title: "NotesRichTextItem class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "AppendTable method (NotesRichTextItem) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDTABLE_METHOD.html"
relatedJava: ["RichTextTable"]
relatedSsjs: ["RichTextTable"]
---

你在程式裡用 [`NotesRichTextItem`](/domino-news/posts/notes-rich-text-item/) 組一封 rich text 通知信，內容要一個小表格 —— 訂單明細、簽核摘要、對帳清單。純文字排不出整齊的格線，這時要的就是 [`NotesRichTextTable`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTTABLE_CLASS.html)。

官方定義很短：「Represents a table in a rich text item.」（Release 6 起）。它跟站上 RichText 系列其他類別一樣 —— 不是 `New` 出來的，而是從 rich text item 長出來：呼叫 `AppendTable`，回傳的就是這個表格物件。

---

## 重點摘要

- 用 [`NotesRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html) 的 [`AppendTable`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDTABLE_METHOD.html) 建立，「Inserts a table in a rich text item」。
- 屬性（多唯讀）：`RowCount` / `ColumnCount`（列數 / 欄數）、`Color` / `AlternateColor`（主色 / 交替色）、`RightToLeft`（讀寫，由右至左排列）。
- 方法：`AddRow`（加列）、`RemoveRow`（刪列）、`SetColor` / `SetAlternateColor`（設色）。
- 走訪既有表格：用 `NotesRichTextNavigator` 的 `RTELEM_TYPE_TABLE` 定位表格、`RTELEM_TYPE_TABLECELL` 取儲存格（儲存格依「先列後欄」排序）。
- **關鍵限制**：官方原文 —— 不知道 rich text 的確切結構，就**無法判斷儲存格裡放了什麼**（文字段落、run、doclink…）。

## 建立：AppendTable

```lotusscript
Dim doc As NotesDocument
Set doc = db.CreateDocument()
Dim body As NotesRichTextItem
Set body = doc.CreateRichTextItem("Body")

Dim table As NotesRichTextTable
Set table = body.AppendTable(3, 2)   ' 3 列、2 欄
```

`AppendTable` 的基本參數就是「幾列、幾欄」（它還有選用參數可設左欄標籤、邊界、段落樣式等）。建好後就拿到一個 `NotesRichTextTable`。

## 屬性與方法

| 成員 | 作用 |
|---|---|
| `RowCount` / `ColumnCount` | 唯讀，列數 / 欄數 |
| `AddRow(count, targetRow)` | 加列 |
| `RemoveRow(count, targetRow)` | 刪列 |
| `Color` / `SetColor(color)` | 表格主色 |
| `AlternateColor` / `SetAlternateColor(color)` | 交替色（樣式用雙色時的另一色） |
| `SetRowDisplay` | 控制列的顯示方式 |
| `RightToLeft` | 讀寫，讀序是否由右至左 |

**交替色**很實用 —— 設了 `SetColor` + `SetAlternateColor`，表格會一列一色交替（斑馬紋），長表格的可讀性差很多：

```lotusscript
Dim session As New NotesSession
Dim white As NotesColorObject
Dim gray As NotesColorObject
Set white = session.CreateColorObject() : white.NotesColor = COLOR_WHITE
Set gray = session.CreateColorObject() : gray.NotesColor = COLOR_GRAY
Call table.SetColor(white)
Call table.SetAlternateColor(gray)
```

## 走訪既有表格

如果是要讀一份既有文件裡的表格（不是新建），走 [`NotesRichTextNavigator`](/domino-news/posts/notes-rich-text-navigator/)：用 `RTELEM_TYPE_TABLE` 找到表格、用 `RTELEM_TYPE_TABLECELL` 一格一格走（官方：儲存格「依列、再依欄」排序）。

但這裡有個一定要知道的限制，官方寫得很白：

> 「You cannot determine the contents of a cell (text paragraphs, text runs, doclinks, and so on) unless you know the exact structure of the rich text item.」

也就是說 —— 你能走到「第幾格」，但**那一格裡裝的是文字、還是 doclink、還是別的，得你自己事先知道結構**才解得出來。rich text 本質是一串混合元素，table cell 不會幫你標好型別。所以「程式自動解析任意 rich text 表格內容」這件事，沒有想像中簡單；可控的場景是「表格是你自己程式建的、結構你清楚」。

## 同類別在其他語言

| 語言 | 對應類別 | 建立方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `RichTextTable` | `rtitem.appendTable(rows, cols)` |
| SSJS / XPages | `RichTextTable` | 同上 |

三邊一致：`appendTable` 建立、`addRow` / `removeRow`、交替色那套都一樣。要在後端 Java agent 產帶表格的 rich text（例如自動對帳信），這篇照搬即可。搭配站上的 [`NotesRichTextStyle`](/domino-news/posts/notes-rich-text-style/) 還能順便控字體與顏色。
