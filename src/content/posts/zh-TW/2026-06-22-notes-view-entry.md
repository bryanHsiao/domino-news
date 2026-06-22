---
title: "NotesViewEntry × NotesViewEntryCollection：不開文件就高效讀 view 的每一列"
description: "要把一個 view 裡每份文件的某些欄位值讀出來，很多人迴圈跑文件、逐筆 GetItemValue — 但那會把每份文件都打開，幾千筆就很慢。NotesViewEntry 讓你直接讀 view 已經算好的 ColumnValues、完全不開文件；NotesViewEntryCollection 是這些列的集合，還能跳過分類/總計列、做集合運算與 StampAll 批次蓋章。本文拆解這對「高效讀 view」的搭檔、ColumnValues 的效能關鍵、entry 的身份與階層屬性。"
pubDate: 2026-06-22T07:30:00+08:00
lang: zh-TW
slug: notes-view-entry
tags:
  - "LotusScript"
  - "Tutorial"
  - "Performance"
sources:
  - title: "NotesViewEntry class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_2925.html"
  - title: "NotesViewEntryCollection class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRYCOLLECTION_9327.html"
  - title: "NotesView class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
relatedJava: ["ViewEntry", "ViewEntryCollection"]
relatedSsjs: ["ViewEntry", "ViewEntryCollection"]
cover: "/covers/notes-view-entry.webp"
coverStyle: "pencil-sketch"
---

你要把一個 view 裡每份文件的「訂單編號、金額、狀態」這幾個欄位讀出來做報表。直覺寫法是：迴圈跑 view 裡的文件、每筆 `doc.GetItemValue("...")`。能動 —— 但它把**每一份文件都打開了一次**，幾千筆下來，慢到讓人懷疑人生。

關鍵在於：**那些欄位的值，view 早就算好、顯示在欄位裡了。** 你要的東西其實已經在 view 的索引裡，根本不需要再去開文件。[`NotesViewEntry`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRY_CLASS_2925.html)（view 的一列）的 `ColumnValues` 就直接給你那一列的欄值；[`NotesViewEntryCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWENTRYCOLLECTION_9327.html) 則是這些列的集合。這對搭檔就是「高效讀 view」的正解。

---

## 重點摘要

- `NotesViewEntry` 是「view 的一列」（官方：「a row in a view」）；`NotesViewEntryCollection` 是這些列的集合。
- **核心優勢**：`entry.ColumnValues` 直接讀 view 已算好的欄值 —— **完全不用開文件**，是迴圈跑文件 `GetItemValue` 的數量級加速。
- 取得：`view.AllEntries`（全部）、`view.GetAllEntriesByKey(key)`（依排序鍵）、`view.GetEntryByKey(key)`（單一）。
- collection 走訪：`GetFirstEntry` / `GetNextEntry` / `GetNthEntry`；**只含對應文件的列、不含分類與總計列**。
- entry 的身份/階層屬性：`UniversalID`、`NoteID`、`IsCategory` / `IsDocument` / `IsTotal`、`IndentLevel`、`ChildCount`。
- 批次操作：`StampAll`（整批蓋同一個欄位值）、集合運算 `Intersect` / `Merge` / `Subtract`、`PutAllInFolder`。

## 兩個類別、一條關係

- **`NotesViewEntryCollection`** —— 官方定義：「Represents a collection of view entries, selected according to specific criteria.」一批 view 列。
- **`NotesViewEntry`** —— 「A view entry represents a row in a view.」其中一列。

從 [`NotesView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) 取得：

```lotusscript
Dim view As NotesView
Set view = db.GetView("Orders")
Dim vc As NotesViewEntryCollection
Set vc = view.AllEntries
```

要依排序鍵篩選用 `view.GetAllEntriesByKey(key)`。

## 核心優勢：ColumnValues 不開文件就拿值

這是整篇的重點。`NotesViewEntry.ColumnValues` 是一個陣列，**對應這一列在 view 裡各欄的值** —— 而這些值 view 早就算好存在索引裡了。所以：

```lotusscript
Dim entry As NotesViewEntry
Set entry = vc.GetFirstEntry()
Do Until entry Is Nothing
    Dim cols As Variant
    cols = entry.ColumnValues        ' 直接拿這一列的欄值，沒開文件
    Print cols(0) & " / " & cols(1) & " / " & cols(2)
    Set entry = vc.GetNextEntry(entry)
Loop
```

對比「迴圈跑文件、逐筆 `GetItemValue`」 —— 後者每筆都要把整份文件從磁碟讀進記憶體。當你只需要 view 上看得到的那幾欄、且 view 已經有那些欄時，`ColumnValues` 是數量級的差距。**報表、匯出、批次盤點這類「只讀 view 上的值」的需求，都該走這條。**

> 反過來提醒：`ColumnValues` 的索引對應的是 **view 的欄順序**，不是文件欄位名。view design 改了欄順序，`cols(n)` 的 n 就會跟著變 —— 所以這招的代價是「跟 view design 綁定」。需要欄位名穩定、或要讀 view 上沒有的欄位時，才回去 `entry.Document.GetItemValue(...)`。

## entry 的身份與階層

每個 entry 也帶文件身份與 view 階層資訊：

| 屬性 | 內容 |
|---|---|
| `UniversalID` | 文件的 UNID（跨副本唯一） |
| `NoteID` | 這列的 note ID |
| `Document` | 對應的 `NotesDocument`（要開文件時才用） |
| `IsDocument` / `IsCategory` / `IsTotal` | 這列是文件列 / 分類列 / 總計列 |
| `IndentLevel` / `ChildCount` / `DescendantCount` | view 階層位置與子孫數 |
| `IsConflict` | 是不是複寫/儲存衝突文件 |

`IsCategory` / `IsTotal` 很實用 —— 官方明說 ViewEntryCollection「never contain categories or totals」，但如果你改用 `NotesViewNavigator` 走訪，就會遇到分類列與總計列，這時靠這幾個旗標分辨。

## 批次操作：StampAll 與集合運算

collection 不只是讀，還能批次改：

- **`StampAll(itemName, value)`** —— 把整個集合的每份文件某個欄位**一次蓋成同一個值**，不用逐筆開檔存檔，伺服器端批次處理、非常快。適合「把這批文件的 Status 全設成 Closed」這種需求。
- **集合運算**：`Intersect`（交集）、`Merge`（聯集）、`Subtract`（差集）、`Contains`（包含） —— 拿兩個 collection 做集合邏輯。
- `PutAllInFolder` / `RemoveAll` / `UpdateAll` 等批次動作。

```lotusscript
' 把某 view 裡符合鍵值的整批文件 Status 設成 Closed
Dim vc As NotesViewEntryCollection
Set vc = view.GetAllEntriesByKey("2026-Q2")
Call vc.StampAll("Status", "Closed")
```

## 同類別在其他語言

| 語言 | 對應類別 | 取得方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `ViewEntry` / `ViewEntryCollection` | `view.getAllEntries()` / `view.getAllEntriesByKey(key)` |
| SSJS / XPages | `ViewEntry` / `ViewEntryCollection` | 同上 |

三邊一致：`getColumnValues()` 不開文件讀欄值、`stampAll()` 批次蓋章、集合運算都一樣。XPages 後端做報表 / 匯出時，這個「讀 ColumnValues 而不是開文件」的原則同樣是效能關鍵。
