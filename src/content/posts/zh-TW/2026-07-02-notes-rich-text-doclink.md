---
title: "NotesRichTextDocLink 與 NotesRichTextSection：用程式做 doclink 與摺疊區段"
description: "兩個你平常會在 Designer 裡手動插入的 rich-text 功能 —— 跳到資料庫／view／文件的 doclink，以及可摺疊區段 —— 都能用程式做。但這兩個類別都不是你 New 出來的：你透過 NotesRichTextItem（AppendDocLink、BeginSection/EndSection）建立元件，再透過 NotesRichTextNavigator 讀回來。本文說明這個「寫用一套 API、讀用另一套」的拆分、doclink 屬性、BeginSection/EndSection 規則，以及陷阱。"
pubDate: 2026-07-02T07:30:00+08:00
lang: zh-TW
slug: notes-rich-text-doclink
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesRichTextDocLink class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTDOCLINK_CLASS.html"
  - title: "AppendDocLink method — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDDOCLINK_METHOD.html"
  - title: "NotesRichTextSection class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTSECTION_CLASS.html"
relatedJava: ["RichTextDoclink", "RichTextSection"]
relatedSsjs: ["NotesRichTextDoclink", "NotesRichTextSection"]
---

你用 agent 組一封通知信，想讓它包含一個直接點進來源文件的可點連結 —— 不是 URL，是真正的 Notes doclink。或者你在做一份很長的報表，想把附錄收進一個讀者可以展開的摺疊區段。兩者都是 rich-text 元件、都能用程式做 —— 但方式跟你想的不太一樣。

[`NotesRichTextDocLink`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTDOCLINK_CLASS.html) 和 `NotesRichTextSection` 都不是你 `New` 出來的類別。它們是*讀取*用的物件。你透過 `NotesRichTextItem` 的方法**建立**元件，而只有在你用 `NotesRichTextNavigator` **巡覽**既有 rich text 時，才會拿到類別實例。這個「寫用一套 API、讀用另一套」的拆分，是要先搞懂的事。

---

## 重點摘要

- **建 doclink**：`Call rtitem.AppendDocLink(target, comment$ [, hotspotText$])`，其中 `target` 是 `NotesDatabase`、`NotesView` 或 `NotesDocument`。
- **建區段**：用前後夾住內容 —— `rtitem.BeginSection(title$, …)` → 加文字 → `rtitem.EndSection`。你**不能**包住已經存在的 rich text。
- 只有在用 `NotesRichTextNavigator` 搭配元件類型 `RTELEM_TYPE_DOCLINK` / `RTELEM_TYPE_SECTION` 巡覽時，你才會拿到 `NotesRichTextDocLink` / `NotesRichTextSection` *物件* —— 用來讀、改、或移除一個既有的。
- doclink 屬性可讀寫：`DbReplicaID`、`ViewUNID`、`DocUNID`、`HotSpotText`、`DisplayComment`、`ServerHint`。
- `AppendDocLink` 需要目標資料庫**設好一個 default view** 才能解析連結。
- 區段：`Title` 與 `IsExpanded` 可讀寫；`BarColor` 與 `TitleStyle` 唯讀（在 `BeginSection` 時設、或用 `SetBarColor` / `SetTitleStyle`）。注意命名不一致 —— 屬性叫 `IsExpanded`，但 `BeginSection` 的參數叫 `expand`。
- 兩個類別都是 **Release 6 新增**。

## Doclink

類別說明就一句「代表 rich text item 裡的一個 doclink」—— 一個跳到資料庫、view 或文件的可點熱點。你不直接建立它；你在 rich text item 上呼叫 `AppendDocLink`，由目標的*型別*決定你得到哪種連結。直接取自官方範例：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Dim newDoc As NotesDocument
Dim rtitem As NotesRichTextItem
Set db = session.CurrentDatabase
Set newDoc = New NotesDocument(db)
Set rtitem = New NotesRichTextItem(newDoc, "Body")

' 連到資料庫
Call rtitem.AppendDocLink(db, db.Title)

' 連到 view
Dim view As NotesView
Set view = db.GetView("Boots")
Call rtitem.AppendDocLink(view, view.Name & " in " & db.Title)

' 連到文件
Dim doc As NotesDocument
Set doc = view.GetFirstDocument
Call rtitem.AppendDocLink(doc, doc.Subject(0) & " in " & view.Name)
```

第二個參數是 hover 時的註解。還有一個可選的第三參數（Release 5+）給可見的方框熱點文字 —— 不給的話連結會顯示成一個小 token：`Call rtitem.AppendDocLink(db, db.Title, "Open the database")`。[`AppendDocLink`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_APPENDDOCLINK_METHOD.html) 文件點出一個重點：「這個方法要能運作，你必須在資料庫裡設一個 default view。」

要動一個*既有*的 doclink —— 改它的目標、改熱點標題、或移除它 —— 你得巡覽到它。類別說明把路徑寫得很清楚：「要存取一個 NotesRichTextDocLink 物件，使用 NotesRichTextNavigator 的方法搭配類型 RTELEM_TYPE_DOCLINK。」接著它可讀寫的 `DbReplicaID` / `ViewUNID` / `DocUNID` / `HotSpotText` / `DisplayComment` / `ServerHint` 就由你編輯，而兩個移除方法有個有用的差別：`Remove` 把 doclink 整個刪掉，而 `RemoveLinkage`「移除 rich text item 裡 doclink 的連結，但保留熱點文字與格式」—— 也就是解除連結但留下文字。

## 摺疊區段

[`NotesRichTextSection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESRICHTEXTSECTION_CLASS.html) ——「代表 rich text item 裡的一個可摺疊區段」—— 在建立規則上是兩者中最嚴格的。你不能包住既有內容；你必須在 append 新內容的同時前後夾住它：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase
Dim doc As New NotesDocument(db)
Dim rt As New NotesRichTextItem(doc, "Body")

Dim titleStyle As NotesRichTextStyle
Set titleStyle = session.CreateRichTextStyle
titleStyle.Bold = True

Dim bar As NotesColorObject
Set bar = session.CreateColorObject
bar.NotesColor = COLOR_BLUE

' 開一個摺疊的區段，append 內容，再結束它
Call rt.BeginSection("Appendix", titleStyle, bar, False)   ' expand = False -> 摺疊
Call rt.AppendText("This content lives inside the collapsible section.")
Call rt.AddNewLine(1)
Call rt.EndSection

Call doc.Save(True, False)
```

*（上面的 doclink 片段是官方範例的原文；這段區段片段是依文件簽名改寫的 —— 官方區段範例頁在 14.5.1 路徑下 404。）*

文件對規則講得很明白：「你不能建立一個包含既有 rich text 的區段。你必須用 BeginSection 開始、append rich text、再用 EndSection 結束。」`BeginSection` 的參數是 `title$`、一個可選的標題 `NotesRichTextStyle`、一個可選的 bar `NotesColorObject`、以及 `expand`（True = 展開，預設 False = 摺疊）。要讀或改既有區段，用 `RTELEM_TYPE_SECTION` 巡覽；接著 `Title` 與 `IsExpanded` 可讀寫，而 `SetBarColor` / `SetTitleStyle` 調整外觀。注意命名：屬性是 `IsExpanded`，但建立時的參數是 `expand`。

## 一個共通陷阱

兩種元件共有一個「文件已開啟」的怪癖：如果你編輯一份*目前在 UI 裡開著*的文件的 rich text，新的 doclink 或區段要等文件關閉再重開才會顯示出來。對沒開著的 agent 產生文件來說這從不咬人，但對著 `NotesUIDocument` 寫程式的人會被它意外到。

## 同類別在其他語言

| LotusScript | Java | SSJS / XPages |
|---|---|---|
| `NotesRichTextDocLink` | `RichTextDoclink` | `NotesRichTextDoclink` |
| `NotesRichTextSection` | `RichTextSection` | `NotesRichTextSection` |

「用 `NotesRichTextItem` 建、用 `NotesRichTextNavigator` 讀」這個拆分在三種語言裡都成立 —— `appendDocLink`、`beginSection` / `endSection`、以及 `RTELEM_TYPE_*` navigator 類型都一樣。這些類別在每種語言裡都是讀取端的把手，不是建構子。
