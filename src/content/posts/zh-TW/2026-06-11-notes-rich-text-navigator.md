---
title: "NotesRichTextNavigator × NotesRichTextRange：用程式走訪與改寫 Rich Text"
description: "你有 500 份文件的 Body 欄位，要找出每一個 doclink、或把某個字串全部換掉 — 光靠 NotesRichTextItem 拿到整個欄位還不夠，你需要更細的工具。NotesRichTextNavigator 讓你依「元素型態」一個一個走訪 rich text，NotesRichTextRange 讓你選定一段、然後套樣式或刪除。本文拆解這兩個 Release 6 起的搭檔、element-type 常數、FindAndReplace 的選項與回傳值，以及一個踩了就 debug 半天的鐵則：FindAndReplace 之後所有 navigation marker 全部失效。"
pubDate: 2026-06-11T07:30:00+08:00
lang: zh-TW
slug: notes-rich-text-navigator
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextNavigator class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTNAVIGATOR_CLASS.html"
  - title: "NotesRichTextRange class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTRANGE_CLASS.html"
  - title: "FindAndReplace method (NotesRichTextRange) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FINDANDREPLACE_METHOD_RTRANGE.html"
relatedJava: ["RichTextNavigator", "RichTextRange"]
relatedSsjs: ["RichTextNavigator", "RichTextRange"]
---

你接到一個任務：500 份文件的 `Body` 欄位裡，把舊公司名「Acme」全部換成「AcmeCorp」；順便統計每份文件裡有幾個 doclink。站上先前那篇 [`NotesRichTextItem`](/domino-news/posts/notes-rich-text-item/) 能讓你拿到整個 Body 欄位、也能 `AppendText`，但它給的是「整塊」 — 它沒辦法讓你說「走到下一個表格」「選中這一段然後換字」。

要做到這種**細粒度的走訪與改寫**，Domino 從 Release 6 起補了兩個搭檔：[`NotesRichTextNavigator`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTNAVIGATOR_CLASS.html)（在 rich text 裡「移動游標」）跟 [`NotesRichTextRange`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTRANGE_CLASS.html)（選定一段、然後對它動手）。這篇拆解它們怎麼配合，以及 `FindAndReplace` 一個不講就會中招的陷阱。

---

## 重點摘要

- 兩者都從 [`NotesRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html) 生出來：`body.CreateNavigator()`、`body.CreateRange()`
- **Navigator = 游標**：用 `FindFirstElement` / `FindNextElement` 配合 element-type 常數（`RTELEM_TYPE_TABLE`、`RTELEM_TYPE_DOCLINK`…）一個一個走
- **限制**：navigator 只能在「同一種型態」之間走 — 找得到「下一個表格」，但沒有「不分型態的下一個元素」
- **Range = 選取範圍**：用 `SetBegin` / `SetEnd`（搭配 navigator）劃定範圍，再 `SetStyle` 套樣式、`Remove` 刪除、讀 `TextRun` / `TextParagraph`
- **`FindAndReplace(target, replacement, options)`** 回傳替換次數；選項可組合：`RT_FIND_CASEINSENSITIVE`、`RT_REPL_ALL` 等
- **鐵則**：`FindAndReplace` 之後，該 rich text item 裡**所有 navigation marker（含 range）全部失效** — 要繼續用得重建

---

## 從 NotesRichTextItem 生出兩個工具

兩個類別都不是 `New` 出來的，而是從你已經拿到的 rich text 欄位身上長出來：

```lotusscript
Dim body As NotesRichTextItem
Set body = doc.GetFirstItem("Body")

Dim rtnav As NotesRichTextNavigator
Set rtnav = body.CreateNavigator()

Dim rtrange As NotesRichTextRange
Set rtrange = body.CreateRange()
```

分工很清楚：**navigator 負責「移動到哪」，range 負責「對選中的那段做什麼」。** 兩者常常一起用 — navigator 先定位，再把位置交給 range 當邊界。

## NotesRichTextNavigator：依元素型態走訪

官方定義：「Represents a means of navigation in a rich text item.」 它維護一個「目前位置」，你用 Find 系列方法去移動它：

| 方法 | 作用 |
|---|---|
| `FindFirstElement(type)` | 移到第一個某型態的元素，回傳 `Boolean` |
| `FindNextElement(type)` | 移到下一個同型態元素 |
| `FindNthElement(type, n)` | 移到第 n 個 |
| `FindFirstString(s)` / `FindNextString(s)` | 移到字串出現處 |
| `GetElement()` | 取得目前位置的元素 |

`type` 用的是 `RTELEM_TYPE_*` 常數，涵蓋 rich text 裡各種「東西」：

| 常數 | 元素 |
|---|---|
| `RTELEM_TYPE_TEXTPARAGRAPH` | 文字段落 |
| `RTELEM_TYPE_TEXTRUN` | 文字 run（同樣式的一段） |
| `RTELEM_TYPE_DOCLINK` | doclink |
| `RTELEM_TYPE_FILEATTACHMENT` | 附件 |
| `RTELEM_TYPE_OLE` | OLE 物件 |
| `RTELEM_TYPE_SECTION` | 可收合區段 |
| `RTELEM_TYPE_TABLE` | 表格 |
| `RTELEM_TYPE_TABLECELL` | 表格儲存格 |

⚠️ **最關鍵的限制**，官方原文：「Navigation is within elements of the same type... You cannot find or get an element regardless of type.」 — navigator 只能在**同型態**之間移動。沒有「不管什麼型態、給我下一個元素」這種操作。你要走訪 Body，得先決定「我這趟要找哪一種」，一種一種掃。

走訪典型寫法就是 `FindFirstElement` 開頭、`FindNextElement` 收尾的迴圈：

```lotusscript
If rtnav.FindFirstElement(RTELEM_TYPE_DOCLINK) Then
    Dim n As Integer
    Do
        n = n + 1
    Loop While rtnav.FindNextElement(RTELEM_TYPE_DOCLINK)
End If
' n = 這份文件 Body 裡的 doclink 數量
```

## NotesRichTextRange：選一段、然後動它

官方定義：「Represents a range of elements in a rich text item.」 預設範圍涵蓋整個 item。它的唯讀屬性讓你「看」這段是什麼：

| 屬性 | 內容 |
|---|---|
| `Type` | 範圍裡第一個元素的型態 |
| `TextRun` | 從起點到下一個換行或樣式變化的文字 |
| `TextParagraph` | 從起點到下一個段落的文字 |
| `Style` | 第一個 text run 的樣式 |
| `Navigator` | 一個被限制在此範圍內的 navigator |

而方法讓你「動」這段：`SetBegin(nav)` / `SetEnd(nav)` 用 navigator 劃定起訖、`SetStyle(style)` 把樣式套到整段、`Remove()` 刪掉範圍內容、`Reset()` 還原成預設、`Clone()` 複製。

把選定範圍的字級改大，就是官方範例的做法：

```lotusscript
Set body = doc.GetFirstItem("Body")
Set rtrange = body.CreateRange
Set rtstyle = session.CreateRichTextStyle
rtstyle.FontSize = 18
Call rtrange.SetStyle(rtstyle)
Call doc.Save(True, True)
```

## FindAndReplace：跨 rich text 找字換字

[`FindAndReplace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FINDANDREPLACE_METHOD_RTRANGE.html) 是 `NotesRichTextRange` 最實用的方法。簽章：

```lotusscript
count& = rtrange.FindAndReplace(target$, replacement$, [options&])
```

回傳值是**實際替換的次數**（`Long`）。`options` 可以用加法或 `Or` 組合：

| 常數 | 值 | 意義 |
|---|---|---|
| `RT_FIND_CASEINSENSITIVE` | 1 | 不分大小寫（預設分） |
| `RT_FIND_PITCHINSENSITIVE` | 2 | 不分字距 |
| `RT_FIND_ACCENTINSENSITIVE` | 4 | 不分重音 |
| `RT_REPL_PRESERVECASE` | 8 | 替換時保留原大小寫 |
| `RT_REPL_ALL` | 16 | 替換全部出現處（預設只換下一個） |

把 Body 裡所有「Acme」換成「AcmeCorp」、不分大小寫：

```lotusscript
Dim rtrange As NotesRichTextRange
Set rtrange = body.CreateRange
Dim cnt As Long
cnt = rtrange.FindAndReplace("Acme", "AcmeCorp", _
    RT_REPL_ALL Or RT_FIND_CASEINSENSITIVE)
If cnt > 0 Then Call doc.Save(True, True)
```

⚠️ **這裡有個一定要記住的陷阱**，官方原文：「All navigation markers in the RTitem, including ranges, are invalidated after a FindAndReplace operation.」 — `FindAndReplace` 跑完之後，這個 rich text item 上**所有的 navigator 跟 range 全部失效**。如果你還要繼續走訪或再選範圍，必須用 `SetBegin` / `SetEnd` 重建一個新的 range，不能沿用舊的。很多「換完之後程式就怪怪的」都是栽在這裡。

## 同類別在其他語言

這組在三種語言都有，名字也一致：

| 語言 | 對應類別 | 建立方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `RichTextNavigator` / `RichTextRange` | `rtitem.createNavigator()` / `createRange()` |
| SSJS / XPages | `RichTextNavigator` / `RichTextRange` | 同上 |

觀念完全共通：navigator 走訪、range 選取改寫、element-type 常數那一套都一樣。差別只在 Java / SSJS 用方法呼叫（`findFirstElement(...)`）而非屬性語法，且常數在 Java 端是 `RichTextItem.RTELEM_TYPE_*` 的形式。要寫後端 Java 版批次處理 rich text 時，這篇的流程可以直接搬。
