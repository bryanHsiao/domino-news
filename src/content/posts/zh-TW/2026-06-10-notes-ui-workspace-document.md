---
title: "NotesUIWorkspace × NotesUIDocument：LotusScript 的前端自動化"
description: "站上前面拆過的 NotesDatabase、NotesDocument 都是後端類別 — 但當你要在使用者按下按鈕的當下、讀他「螢幕上還沒存檔」的欄位值、跳一個對話框問他、或把當前文件切到編輯模式，靠的是另一半：NotesUIWorkspace 與 NotesUIDocument。本文拆解這組前端雙人組、最關鍵的「前端值 vs 後端 Document」觀念、FieldGetText/FieldSetText、Prompt 與 PickList 對話框，以及一個最容易忘的鐵則：UI class 不能在背景 / 排程 agent 裡跑。"
pubDate: 2026-06-10T07:30:00+08:00
lang: zh-TW
slug: notes-ui-workspace-document
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesUIWorkspace class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html"
  - title: "NotesUIDocument class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDOCUMENT_CLASS.html"
  - title: "Prompt method (NotesUIWorkspace) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROMPT_METHOD_7966_ABOUT.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-ui-workspace-document.webp"
coverStyle: "ukiyo-e"
---

站上前面拆過的類別 — `NotesDatabase`、`NotesDocument`、`NotesView` — 全是後端。它們在伺服器上、在背景 agent 裡都能跑，看不到、也不需要看到使用者的螢幕。但有一整類需求它們碰不到：使用者正在表單上打字、還沒按存檔，你想讀他**當下螢幕上**那個欄位的值；或想在他按下按鈕時跳一個「確定要送出嗎？」的對話框；或把當前開著的文件直接切到編輯模式。

這些都發生在「前端」 — Notes Client 的視窗裡。對應的就是另一半：[`NotesUIWorkspace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html)（當前工作區視窗）跟 `NotesUIDocument`（當前開著的文件）。這篇拆解這組前端雙人組，以及一個一旦搞混就會 debug 半天的核心觀念：**螢幕上的值，跟後端 Document 存的值，不是同一個東西。**

---

## 重點摘要

- `NotesUIWorkspace` 用 `Dim ws As New NotesUIWorkspace` 建立，代表「當前工作區視窗」
- `ws.CurrentDocument` 拿到 `NotesUIDocument` — 使用者**現在開著、有焦點**的那份文件
- **核心觀念**：`NotesUIDocument` 是螢幕上的文件（含未存檔的編輯）；它的 `.Document` 屬性才是後端 [`NotesDocument`](/domino-news/posts/notes-document/)（上次存檔的狀態）
- 讀／寫螢幕上的欄位用 `FieldGetText` / `FieldSetText`；存檔前它們不會進後端
- 跟使用者互動：`Prompt`（是非 / 輸入 / 清單對話框）、`PickListStrings`（從清單選人選文件）
- **鐵則**：UI class **不能在背景 agent、API 呼叫的 agent、或 NotesAgent.Run 觸發的 agent 裡跑** — 只有工作站使用者能執行

---

## 前端 vs 後端：先搞懂這一個

這是用 UI class 最常踩的坑，先講清楚。假設使用者打開一份文件、在 `Subject` 欄位把標題從「報價單」改成「報價單(已修訂)」，**但還沒按存檔**。這時候：

| 你呼叫的 | 拿到的值 | 為什麼 |
|---|---|---|
| `uidoc.FieldGetText("Subject")` | `報價單(已修訂)` | 讀的是**螢幕上**的當前值 |
| `uidoc.Document.GetItemValue("Subject")(0)` | `報價單` | 讀的是**後端**上次存檔的值 |

官方對 [`NotesUIDocument`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDOCUMENT_CLASS.html) 的定義是「Represents the document that's currently open in the Notes workspace」 — 它是**螢幕上那份**。而它的 [`Document`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOCUMENT_PROPERTY.html) 屬性，官方寫得很直接：「The back-end document that corresponds to the currently open document.」 — 對應的後端文件。

所以規則很簡單：**還沒存檔的編輯只存在於前端**。要拿使用者剛打、還沒存的值，走 `FieldGetText`；要拿已經存進資料庫的值，走 `.Document`。搞混這兩個，就會出現「我明明改了，程式卻讀到舊值」的鬼打牆。

## NotesUIWorkspace：拿到「當前的東西」

`NotesUIWorkspace` 是進入前端的入口，直接 `New`：

```lotusscript
Dim ws As New NotesUIWorkspace
Dim uidoc As NotesUIDocument
Set uidoc = ws.CurrentDocument
```

它的三個 `Current*` 屬性，分別對應到使用者眼前的三種東西：

| 屬性 | 回傳 | 官方說明 |
|---|---|---|
| `CurrentDocument` | `NotesUIDocument` | 「the document in the window that currently has focus」 |
| `CurrentView` | `NotesUIView` | 當前開著的 view |
| `CurrentDatabase` | `NotesUIDatabase` | 當前開著的資料庫 |

⚠️ 一個 focus 陷阱：官方提醒，表單裡的程式碼**不能假設自己有焦點**，除非它掛在 action button 之類的控制項上。在 composite app 或預覽窗格裡，`CurrentDocument` 可能不是你以為的那一份。把取 `CurrentDocument` 的程式放在按鈕事件裡最安全。

## NotesUIDocument：操作開啟中的文件

拿到 `uidoc` 之後，最常用的是這組欄位操作方法：

| 方法 | 作用（官方原文） |
|---|---|
| [`FieldGetText(name)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FIELDGETTEXT_METHOD.html) | 「returns the contents of a field you specify, as a string」 |
| `FieldSetText(name, value)` | 「Sets the value of a field... The existing contents... are written over」 |
| `FieldContains(name, value)` | 檢查欄位是否含某文字 |
| `FieldClear(name)` | 清空欄位 |
| `FieldAppendText(name, value)` | 附加文字、不蓋掉原內容 |

最小的官方範例就是把當前文件的 `Subject` 印出來：

```lotusscript
Dim workspace As New NotesUIWorkspace
Dim uidoc As NotesUIDocument
Set uidoc = workspace.CurrentDocument
Messagebox( uidoc.FieldGetText( "Subject" ) )
```

文件狀態的控制則靠這些：`Save()` 存檔、`Close()` 關閉、`Refresh()`（官方：「its computed fields are recalculated」重算計算欄位）、`Reload()` 把後端的變更重抓回前端。還有幾個常用唯讀／讀寫屬性：`IsNewDoc`（「a document that hasn't been saved」尚未存檔的新文件）、`EditMode`（讀寫，是否在編輯模式）、`ModifiedSinceSaved`（有沒有未存變更）。

### FieldSetText 還是 Document.ReplaceItemValue？

兩個都能改欄位，但時機不同：

- **`FieldSetText`** — 改的是螢幕上的值，使用者**馬上看得到**，也會觸發表單上的相依邏輯。適合「使用者正開著文件、你要即時改他看到的內容」。
- **`Document.ReplaceItemValue`**（走後端 [`NotesDocument`](/domino-news/posts/notes-document/)）— 改的是後端值，不碰 UI。適合背景處理、或不需要視覺回饋的程式化修改。

簡單記：**人正看著螢幕、要即時反應 → FieldSetText；其餘 → 後端 Document。**

## 跟使用者互動：Prompt 與 PickList

前端類別最實用的就是「問使用者」。[`Prompt`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_PROMPT_METHOD_7966_ABOUT.html) 一個方法包辦多種對話框，官方定義：「Displays a dialog box and returns a value based on your actions in the dialog box.」

```lotusscript
Dim ws As New NotesUIWorkspace
Dim ans As Variant
ans = ws.Prompt(PROMPT_YESNO, "確認", "確定要送出這張報價單嗎？")
If ans = 1 Then
    Call uidoc.Save()
End If
```

用第一個參數的常數決定對話框型態，常見的有：

| 常數 | 對話框 | 回傳 |
|---|---|---|
| `PROMPT_OK` | 只有 OK | — |
| `PROMPT_YESNO` | 是 / 否 | `1` / `0` |
| `PROMPT_YESNOCANCEL` | 是 / 否 / 取消 | `1` / `0` / `-1` |
| `PROMPT_OKCANCELEDIT` | 文字輸入框 | 輸入的字串 |
| `PROMPT_OKCANCELLIST` | 單選清單 | 選中的字串 |
| `PROMPT_OKCANCELLISTMULT` | 多選清單 | 字串陣列 |

簽章是 `ws.Prompt(type%, title$, prompt$ [, default] [, values])` — 清單型態時，把選項用 `values` 陣列帶進去。

要讓使用者「從一個 view 裡挑文件」，則用 `PickListStrings`（官方：「Creates a string array from a list selected by the user」）或 `PickListCollection`（回傳 `NotesDocumentCollection`）。這比自己刻一個選擇清單省事得多。

## 一定要知道的限制：UI class 不能在背景跑

這是 UI class 跟後端類別最大的分界，也是新手最常撞的牆。官方原文：

> 「You cannot use the UI classes in a background agent, an agent called through an API, or an agent called by the NotesAgent Run method. Only workstation users can run scripts that access UI objects.」

換句話說：**只有工作站上、真人操作的情境才能用 UI class。** 排程 agent、Web agent、被 `NotesAgent.Run` 觸發的 agent 裡放 `NotesUIWorkspace`，輕則拿到 Nothing、重則報錯。需要在背景改文件，就老老實實走後端 `NotesDatabase` / `NotesDocument`。

這條限制其實正好對應前面的「前端 vs 後端」：UI class 的存在前提就是「有個使用者、有個螢幕」。沒有螢幕的場景，本來就不該用它。

## 同類別在其他語言

跟 GPS 那組一樣，這次的跨語言結論也是 **沒有對應**：

| 語言 | 對應類別 | 說明 |
|---|---|---|
| Java（`lotus.domino.*`） | 無 | 後端 Java API 沒有任何 UI 類別 |
| SSJS / XPages | 無 | XPages 是完全不同的元件模型（`view`、`document` data source、SSJS 事件），不是 NotesUIDocument 的對應 |

`NotesUIWorkspace` / `NotesUIDocument` 是 **LotusScript + Notes Client 專屬**的前端類別。要做 Web 端的等價互動，走的是 XPages 那套自己的世界 — 那會是未來另一篇單獨的題目，跟這裡的 client 前端不是同一條路。
