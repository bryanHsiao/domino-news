---
title: "NotesUIDatabase：攔下一個刪除的唯一地方"
description: "在 Notes client 裡，使用者可以從任何 view、用 Delete 鍵、用剪下、或拖進垃圾桶刪掉一份文件 —— 你沒辦法一條路一條路去守。NotesUIDatabase 是看得見全部路徑的單一 chokepoint：它的 QueryDocumentDelete 事件在任何東西被標記刪除之前，整個資料庫觸發一次。一篇前端資料庫類別的實測報告 —— 通往後端的 Database 橋、刪除／封存事件，以及你掛在「那個攔得住每條路的事件」上的軟刪除守衛。"
pubDate: 2026-07-28T07:30:00+08:00
lang: zh-TW
slug: notes-ui-database
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesUIDatabase (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIDATABASE_CLASS.html"
  - title: "NotesUIWorkspace (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html"
  - title: "NotesDatabase (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-ui-database.webp"
coverStyle: "collage"
---

你想擋住使用者硬刪紀錄 —— 留一條稽核軌跡，或翻一個 `Deleted` 旗標、而不是真的把 note 移掉。於是你開始找地方掛鉤，而問題是 Notes client 裡的「刪除」不是單一路徑。使用者可以在任何 view 按 Delete 鍵、剪下一份文件、把它拖進垃圾桶、或從一個你沒守的 view 刪。守每個 view 的事件，代表要守全部、永遠，包含明年某人新加的那些。

有一個 chokepoint 看得見每一條路：`NotesUIDatabase` 與它的 `QueryDocumentDelete` 事件。它在任何東西被標記刪除之前，整個資料庫觸發一次 —— 不管是哪個 view、哪個手勢觸發的。這是那個前端資料庫類別的實測報告：[`NotesUIView`](/domino-news/zh-TW/posts/notes-ui-view) 的姊妹，範圍是整個資料庫而不是單一 view，也是刪除與封存守衛的自然歸宿。

---

## 重點摘要

- `NotesUIDatabase` 代表 Notes client 裡目前開著的那個資料庫；它的事件宣告在資料庫的 globals（Database Script）上，涵蓋整個資料庫、不分 view。
- `QueryDocumentDelete`「在一份文件或一組被選取的文件被標記為刪除或剪下之前觸發」—— 那是攔截刪除的單一位置。設 `Continue = False` 就否決它。
- `Source.Documents` 是這次事件正在處理的文件（要被刪的那些），所以你在同一個 handler 裡就能做軟刪除：翻一個旗標、否決真正的刪除。
- `.Database` 橋回後端 [`NotesDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html)；你從 `ws.CurrentDatabase` 或事件的 `Source` 參數拿到 `NotesUIDatabase`。
- 跟 `NotesUIView` 一樣的邊界：Notes client／Nomad only，沒有 web、agent、COM。

## 刪除的 chokepoint

`QueryDocumentDelete` 是撐起這個類別地位的事件。文件描述得很精確：它「在一份文件或一組被選取的文件被標記為刪除或剪下之前觸發」。*就在之前*，而且它涵蓋刪除*和*剪下 —— 所以 Delete 鍵、選單、剪下移動全都匯流過它。在 handler 裡，`Source.Documents` 是要被刪的那組，`Continue = False` 取消操作。做軟刪除需要的一切就這些：

```lotusscript
Sub Querydocumentdelete(Source As Notesuidatabase, Continue As Variant)
    Dim col As NotesDocumentCollection
    Set col = Source.Documents          ' 即將被刪的文件
    Dim doc As NotesDocument
    Set doc = col.GetFirstDocument()
    Do Until doc Is Nothing
        Call doc.ReplaceItemValue("Deleted", "1")
        Call doc.ReplaceItemValue("DeletedBy", Source.Database.Parent.EffectiveUserName)
        Call doc.Save(True, False)
        Set doc = col.GetNextDocument(doc)
    Loop
    Continue = False                    ' 否決真正的刪除 —— 旗標就是刪除
End Sub
```

旗標變成刪除、note 留著，一個用 `Deleted != "1"` 過濾的 view 把它藏起來。因為守衛住在資料庫上，不管使用者從哪個 view 刪它都成立 —— 這就是把它放這裡、而不是放在任何單一 [`NotesUIView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIVIEW_CLASS.html) 上的理由。

## 拿到物件、跨到後端

兩種入口，跟 `NotesUIView` 對稱。在事件外你問 [`NotesUIWorkspace`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESUIWORKSPACE_CLASS.html)：`Set uidb = ws.CurrentDatabase`。在資料庫事件裡，`Source` 參數就是那個物件。

通往後端的橋是 `Database` 屬性 ——「唯讀，對應目前開著的資料庫的後端資料庫」。從那裡你就進了一般後端地盤：`Source.Database.Parent` 是 `NotesSession`，所以 `EffectiveUserName`、ACL 檢查、以及其他你在伺服器端會做的事，都只差一跳。跟 view 類別一樣，樣式是跨前端到後端的邊界一次、在後端做事。

## 其餘的事件

`QueryDocumentDelete` 是頭條，但這個面更廣，而且全是刪除／生命週期守衛：

- `PostDocumentDelete` 在刪除命令之後、note 真正被移除之前觸發 —— 記錄剛剛被標記了什麼的地方。
- `QueryDocumentUndelete` 在刪除標記被移除之前觸發，所以你連反刪除也能守。
- `QueryDropToArchive` / `PostDropToArchive` 夾住封存，`QueryDragDrop` / `PostDragDrop` 夾住資料庫之間的拖放。
- `PostOpen` 在 view 層的開啟之後跑（在 `NotesUIView` 的 `QueryOpen` 與 `PostOpen` 之後），`QueryClose` 在資料庫關閉之前觸發。

`Query*` / `Post*` 的分法跟前端類別各處是同一份合約：`Query*` 在之前跑、能用 `Continue = False` 否決；`Post*` 在之後跑、只旁觀。

## 那個姊妹，與那條邊界

`NotesUIDatabase` 與 `NotesUIView` 是同一個想法的兩種範圍。[view 類別](/domino-news/zh-TW/posts/notes-ui-view)掌管選取與單一 view 的互動 ——「使用者反白了什麼、正在開什麼」。資料庫類別掌管整個資料庫的生命週期 ——「這裡面任何地方，有沒有東西正在被刪、被封存、被拖走」。當一個守衛必須不分畫面上是哪個 view 都成立時 —— 刪除就是教科書案例 —— 它屬於資料庫。當它是關於此刻使用者面前那幾列時，它屬於 view。

兩者共用同一條硬邊界：它們需要一個執行中的 Notes client。web request 或 agent 裡沒有「目前的資料庫」，所以兩個類別在那裡都不存在，這樣建的刪除守衛只保護 client。如果同一批紀錄能從 web 碰到，那條路需要它自己的守衛 —— web agent 或 XPages 邏輯裡的一個後端檢查 —— 因為 `QueryDocumentDelete` 對它永遠不會觸發。

## 同類別在其他語言

跟 `NotesUIView` 一樣，沒有對應，理由也一樣是結構性的。Domino Java API 是後端 API，沒有 client UI 的東西；SSJS 活在 XPages、有自己的元件與事件模型，而不是 `NotesUIDatabase`。所以「攔截刪除」這個目標跨得過去 —— 每個 stack 都有它自己攔一個刪除的地方 —— 但這個*類別*跨不過去。要在 web 上做同樣的軟刪除，你是在 web agent 或 XPages 邏輯裡放一個後端檢查，不是移植 `NotesUIDatabase`。
