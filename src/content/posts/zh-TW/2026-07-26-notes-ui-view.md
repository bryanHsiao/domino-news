---
title: "NotesUIView：唯一知道使用者選了什麼的類別"
description: "view 上的動作按鈕理應對使用者反白的那幾列作用 —— 但後端的 NotesView 根本沒有「選取」這個概念。那道缺口，正是 NotesUIView 填的。一篇前端 view 類別的實測報告：它的 Documents 屬性（活的選取狀態）、通往後端 View 的橋、你用來攔截使用者的 QueryOpenDocument／QueryClose 事件，以及那條把這一切擋在 web 與 agent 之外的硬邊界。"
pubDate: 2026-07-26T07:30:00+08:00
lang: zh-TW
slug: notes-ui-view
tags:
  - "LotusScript"
  - "Notes UI"
  - "Tutorial"
sources:
  - title: "NotesUIView (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIVIEW_CLASS.html"
  - title: "NotesUIWorkspace (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html"
  - title: "NotesView (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-ui-view.webp"
coverStyle: "pencil-sketch"
---

你在一個 view 上加了動作按鈕：「核准選取項目」。使用者勾了三列、按下去，你的程式需要*那三份文件*。於是你伸手去拿後端的 `NotesView` —— 那裡什麼都沒有。`NotesView` 能給你每一份文件、第一份文件、用 key 查一份文件；它沒辦法告訴你使用者面前反白的是哪幾列，因為後端 view 沒有使用者、也沒有選取狀態。那個狀態住在上一層、在 Notes client 裡，而暴露它的類別剛好只有一個：[`NotesUIView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIVIEW_CLASS.html)。

這是那個前端 view 類別的實測報告 —— 它做什麼、那個撐起它存在意義的單一屬性、以及把它牢牢釘在 classic client（與 Nomad）地盤、擋在 web 與 agent 之外的邊界。測於 Notes client；`NotesUIView` 說「新」也只是就「它是前端」而言 —— 它不支援 COM，也沒有 web 對應。

---

## 重點摘要

- `NotesUIView.Documents` 是「view 中目前被選取的文件」—— 一個 `NotesDocumentCollection`，剛好就是使用者反白的那些。這是你來拿的那個屬性；後端 `NotesView` 沒有對應物。
- 你從 `ws.CurrentView`（`ws` 是一個 `NotesUIWorkspace`）拿到 `NotesUIView`，或在 view 事件裡從事件交給你的 `Source` 參數拿。
- `.View` 橋回同一個 view 的後端 `NotesView`，所以你只跨前端到後端一次、重活都在後端做。
- 事件 —— `QueryOpenDocument`、`QueryClose`、`QueryRecalc`、`PostOpen` —— 是你在 client 動手之前攔截使用者的地方。在 `Query*` 事件裡設 `Continue = False` 就取消該動作。
- 它只在 Notes client／Nomad 裡有效。沒有 web、沒有 agent、沒有 COM。

## 撐起這個類別的那個屬性

`NotesUIView` 其餘的一切都是方便；`Documents` 才是它存在的理由。拿到它，你就把選取狀態當成一個一般的後端 collection 握在手上：

```lotusscript
Sub Click(Source As Button)
    Dim ws As New NotesUIWorkspace
    Dim uiview As NotesUIView
    Set uiview = ws.CurrentView

    Dim selected As NotesDocumentCollection
    Set selected = uiview.Documents          ' 剛好是使用者勾選的那幾列

    If selected.Count = 0 Then
        Messagebox "請先至少選一份文件。"
        Exit Sub
    End If

    Dim doc As NotesDocument
    Set doc = selected.GetFirstDocument()
    Do Until doc Is Nothing
        Call doc.ReplaceItemValue("Status", "Approved")
        Call doc.Save(True, False)
        Set doc = selected.GetNextDocument(doc)
    Loop
End Sub
```

注意這個形狀：一個前端呼叫（`uiview.Documents`）去得知選取，接著整個迴圈就是純後端的 `NotesDocumentCollection` 工作。每一個「對選取的列作用」的按鈕都是這個樣式 —— 在最上面跨一次邊界，之後再也不跨。

## 拿到物件、以及跨回後端

兩種入口。在事件外 —— 動作按鈕、工具列按鈕 —— 你問 [`NotesUIWorkspace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html)：`Set uiview = ws.CurrentView`。在 view 事件裡，client 把物件當成事件的 `Source` 參數交給你，你什麼都不用建。

反方向跨過去是 `.View` 屬性：它回傳畫面上這個 view 的後端 [`NotesView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html)。這就是你從「畫面上顯示的」走到「完整設計與資料」的方式 —— 讀 view 的欄、跑一個 `GetDocumentByKey`、任何需要後端的事。順帶還有幾個唯讀的前端便利屬性：`ViewName`、`ViewAlias`、`CaretNoteID`（游標所在的那一列，跟多列選取不同）、`CaretCategory`。行事曆 view 則有 `CalendarDateTime` / `CalendarDateTimeEnd`，也就是使用者點的那個區塊的起訖。

## 事件：在 client 動手之前攔截

`NotesUIView` 的另一半是它的事件面，宣告在 view 的設計上。`Query*` 事件在 client 做某件事*之前*觸發、而且能取消它；`Post*` 事件在*之後*觸發。

你最常伸手拿的是 `QueryOpenDocument` —— 使用者嘗試開啟一列時、在文件開啟之前觸發，所以它是你做轉向（「這筆已鎖定，改開唯讀副本」）或直接擋下開啟的地方。設 `Continue = False`，開啟就被取消：

```lotusscript
Sub Queryopendocument(Source As Notesuiview, Continue As Variant)
    Dim doc As NotesDocument
    Set doc = Source.Documents.GetFirstDocument()
    If doc.Status(0) = "Archived" Then
        Messagebox "已封存的紀錄請到封存資料庫開啟。"
        Continue = False
    End If
End Sub
```

`QueryClose` 守住離開 view，`QueryRecalc` 在重新整理前觸發，`PostOpen` 在 view 起來後跑一次（很適合用 `SelectDocument` 設定初始選取、或用 `DeselectAll` 清掉）。規則一致：`Query*` 能用 `Continue = False` 否決；`Post*` 只是通知。

## 那條邊界 —— 為什麼這些都到不了 web

`NotesUIView` 需要一個坐在 Notes client（或 Nomad，它*就是* client）前面的使用者。那不是要繞過的限制；那是它的定義。web request、XPages 頁面、排程 agent 裡都沒有「目前的 view」—— 沒有視窗、沒有選取、沒有游標。所以像這樣的前端類別在那些情境根本不存在，碰到 `NotesUIView` 的程式也沒辦法原封不動搬進 agent 或 web 函式庫。當你在 web 上需要「被選取的文件」時，你在一個完全不同的模型裡（比方 XPages view panel 的 `getSelectedIds`）—— 概念活下來，類別沒有。

## 同類別在其他語言

沒有對應，而原因是結構性的。Domino Java API 是一套後端 API —— 它有 `lotus.domino.View`，但沒有 client UI 的東西，因為 Java 在 Domino 上跑在 agent 與伺服器程式裡，那裡沒有前端可代表。SSJS 活在 XPages 裡，那有它自己的元件模型（`viewPanel`、`dataView`）與自己的選取 API，而不是 `NotesUIView`。所以這是一個 LotusScript 伸到另外兩者刻意不去的地方的案例：執行中的 Notes client。如果你在為 web 現代化一個「對選取列作用」的功能，你不是在移植 `NotesUIView` —— 你是在用目標 stack 自己的語彙重建那個互動。
