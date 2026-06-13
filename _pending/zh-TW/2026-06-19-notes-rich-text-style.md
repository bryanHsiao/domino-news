---
title: "NotesRichTextStyle：在程式裡設定粗體、字級、顏色（兼談 STYLE_NO_CHANGE）"
description: "你在程式裡用 NotesRichTextItem 組 rich text，想讓某段變粗體、放大、換顏色 — 那個「樣式」就是 NotesRichTextStyle。本文拆解它怎麼建立、Bold / Italic / FontSize / NotesColor 等屬性、用 AppendStyle 與 SetStyle 套用，以及一個關鍵設計：新建的 style 所有屬性預設都是 STYLE_NO_CHANGE（不更動），你只需要設你想改的那幾個、其餘維持原樣。"
pubDate: 2026-06-19T07:30:00+08:00
lang: zh-TW
slug: notes-rich-text-style
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextStyle class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTSTYLE_CLASS.html"
  - title: "NotesRichTextItem class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html"
  - title: "FontSize property (NotesRichTextStyle) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FONTSIZE_PROPERTY.html"
relatedJava: ["RichTextStyle"]
relatedSsjs: ["RichTextStyle"]
---

你在程式裡用 [`NotesRichTextItem`](/domino-news/posts/notes-rich-text-item/) 把文字一段段 append 進 Body，現在想讓標題那段變粗體、放大兩級、換成藍色。問題是 —— append 文字的時候，「樣式」要從哪裡來？

答案是 [`NotesRichTextStyle`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTSTYLE_CLASS.html)。它的定義就是「Represents rich text attributes」—— 一包「字要長什麼樣」的屬性（粗體、字級、顏色、字體…）。你先做出一個 style、設好要的屬性，再把它套到 rich text 上。這篇順便講清楚一個一開始很容易誤會的設計：**STYLE_NO_CHANGE**。

---

## 重點摘要

- 用 `session.CreateRichTextStyle()` 建立
- **屬性**（讀寫）：`Bold`、`Italic`、`Underline`、`StrikeThrough`、`Effects`、`FontSize`、`NotesColor`、`NotesFont`、`PassThruHTML`
- **關鍵**：新建的 style，所有屬性預設都是 **`STYLE_NO_CHANGE`** —— 代表「不更動」。你**只設想改的那幾個**，其餘維持原樣
- **套用**：`NotesRichTextItem.AppendStyle(style)`（之後 append 的文字用此樣式）、或 [`NotesRichTextRange`](/domino-news/posts/notes-rich-text-navigator/) 的 `SetStyle(style)`（套到已選範圍）
- `IsDefault`（唯讀）：判斷是否所有屬性都還在預設狀態
- 沒有方法 —— 它就是一包屬性

---

## 建立並設定

從 `NotesSession` 建立，然後設你要的屬性：

```lotusscript
Dim session As New NotesSession
Dim style As NotesRichTextStyle
Set style = session.CreateRichTextStyle()
style.Bold = True
style.FontSize = 14
```

它身上的屬性涵蓋常見的文字格式：

| 屬性 | 控制 |
|---|---|
| `Bold` / `Italic` / `Underline` / `StrikeThrough` | 粗體 / 斜體 / 底線 / 刪除線 |
| [`FontSize`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FONTSIZE_PROPERTY.html) | 字級（point） |
| `NotesColor` | 顏色 |
| `NotesFont` | 字體 |
| `Effects` | 特殊效果（上標、下標等） |
| `PassThruHTML` | 是否標記為 pass-through HTML |

它**沒有任何方法** —— 純粹是一包屬性容器。

## 關鍵觀念：STYLE_NO_CHANGE

這是 `NotesRichTextStyle` 最該先懂的設計。官方明說：剛 `CreateRichTextStyle()` 出來時，**所有屬性的值都是 `STYLE_NO_CHANGE`**。

`STYLE_NO_CHANGE` 的意思是「**這個屬性不去動它**」。所以像 `Bold` 這種屬性其實是**三態**，不是單純 True/False：

- `True` —— 設成粗體
- `False` —— 設成非粗體
- `STYLE_NO_CHANGE`（預設）—— 不碰粗體這個屬性，維持原樣

這個設計很實用：你想「只把字放大、其他格式都不要動」，就**只設 `FontSize`**，別去碰 `Bold`、`NotesColor` 等 —— 它們留在 `STYLE_NO_CHANGE`，套用時就不會把原本的粗體 / 顏色洗掉。**只設你想改的，是這個類別的正確用法。** 反過來，如果你 `style.Bold = False` 想「順便清掉粗體」，那是明確的動作、不是「沒設」。

`IsDefault`（唯讀）就是用來判斷「這個 style 是不是所有屬性都還在預設（全 `STYLE_NO_CHANGE`）」。

## 套用到 rich text

設好的 style 有兩種套法：

**1. `AppendStyle` —— 影響之後 append 的文字。** 在 [`NotesRichTextItem`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTITEM_CLASS.html) 上呼叫，之後再 `AppendText` 的內容就帶這個樣式：

```lotusscript
Dim body As NotesRichTextItem
Set body = doc.CreateRichTextItem("Body")
Call body.AppendStyle(style)
Call body.AppendText("這段是粗體 14 級")
```

**2. `SetStyle` —— 套到一個已選範圍。** 在 [`NotesRichTextRange`](/domino-news/posts/notes-rich-text-navigator/) 上呼叫，把樣式套到選定的那一段（這是官方範例的做法）：

```lotusscript
Set body = doc.GetFirstItem("Body")
Dim rtrange As NotesRichTextRange
Set rtrange = body.CreateRange
Dim rtstyle As NotesRichTextStyle
Set rtstyle = session.CreateRichTextStyle
rtstyle.FontSize = 18
Call rtrange.SetStyle(rtstyle)
Call doc.Save(True, True)
```

簡單記：**邊組邊套用 `AppendStyle`；改既有內容的某段用 `SetStyle`。**

## 同類別在其他語言

| 語言 | 對應類別 | 建立方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `RichTextStyle` | `session.createRichTextStyle()` |
| SSJS / XPages | `RichTextStyle` | `session.createRichTextStyle()` |

三邊一致，連 `STYLE_NO_CHANGE` 三態的觀念都一樣。Java/SSJS 用 getter/setter（`setBold(...)` / `setFontSize(...)`），常數在 Java 端是 `RichTextStyle.STYLE_NO_CHANGE`。要在後端 Java 組帶格式的 rich text，這篇「只設想改的」原則照樣適用。
