---
title: "NotesViewNavigator 入門：用導航器走 view，不要再 GetFirstDocument 硬撈"
description: "NotesViewNavigator 是 LotusScript 走 view 的進階工具：能拿到 ViewEntry（含類別、總計、位置等 view 才有的中介資料）、能從子集合（單一類別、未讀、某層以下）建立、效能上比 GetFirstDocument 迴圈高，但用之前要先把 AutoUpdate 關掉。本文整理 4 個 properties、約 36 個 methods、7 個 CreateViewNav* 變體與重要 caveat。"
pubDate: "2026-04-29T01:35:08+08:00"
lang: "zh-TW"
slug: "notes-view-navigator"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
  - "Performance"
sources:
  - title: "NotesViewNavigator (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html"
  - title: "NotesViewNavigator properties — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_PROPERTIES.html"
  - title: "NotesViewNavigator methods — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_METHODS.html"
  - title: "NotesView CreateViewNav method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATEVIEWNAV_METHOD_VIEW.html"
---

## 為什麼不用 GetFirstDocument 就好？

LotusScript 走 view 最入門的寫法是：

```lotusscript
Set doc = view.GetFirstDocument()
Do Until doc Is Nothing
    ' work
    Set doc = view.GetNextDocument(doc)
Loop
```

短小、易讀、絕大多數場景夠用。但碰到下列情境時，[`NotesViewNavigator`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html)（Release 5 起就有）會比較順手：

- 你需要的不是 `Document`，而是**含 view 中介資料的 `ViewEntry`**（位置、SiblingCount、IsCategory/IsTotal、ColumnValues 等）
- 你想**只走 view 的某個子集**（單一類別下、所有未讀、某層以下、某 entry 的後代）
- 你需要走**類別總計列**或**類別本身**，不只是文件
- 你想用「樹狀」方式爬 — 子→父→兄弟姊妹，而不是平面 next/prev

`NotesViewNavigator` 由 [`NotesView` 的 `CreateViewNav*` 系列方法](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATEVIEWNAV_METHOD_VIEW.html) 建立。

## Properties（只有 4 個）

文檔列出的所有 properties — 沒有什麼 `Navigator` 或 `Entry` 屬性，那是常見的 hallucination：

| Property | 型別 | 用途 |
|---|---|---|
| `CacheSize` | Read-write | 導航器快取大小（以 view entries 為單位） |
| `Count` | Read-only | 導航器涵蓋的 entry 總數 |
| `MaxLevel` | Read-write | 導航器走到的最大層級 |
| `ParentView` | Read-only | 對應的 NotesView |

## 7 種 `CreateViewNav*` 建立法

從 `NotesView` 端拿到 navigator 的 7 種方法 — 重點是**你要走 view 的哪個子集**：

| 方法 | 涵蓋範圍 |
|---|---|
| `CreateViewNav` | 整個 view 的所有 entries |
| `CreateViewNavFrom(entry)` | 從指定 entry 開始到結束 |
| `CreateViewNavFromAllUnread` | 所有未讀 entries |
| `CreateViewNavFromCategory(category)` | 指定類別下的所有 entries |
| `CreateViewNavFromChildren(entry)` | 指定 entry 的直接子代（不含孫代） |
| `CreateViewNavFromDescendants(entry)` | 指定 entry 的所有後代 |
| `CreateViewNavMaxLevel(maxLevel)` | view 中到指定層級為止的所有 entries |

選對 create 比後續走法選對 method 還重要 — 用 `CreateViewNavFromCategory` 比建完整 nav 再 GotoChild 過濾快得多。

## Methods 分三類

### Get* — 拿 entry 不動內部 cursor

最常用的：

- `GetFirst` / `GetLast` / `GetNext` / `GetPrev`
- `GetFirstDocument` / `GetLastDocument` / `GetNextDocument` / `GetPrevDocument` — 跳過類別/總計列，只回文件
- `GetNextCategory` / `GetPrevCategory` — 只走類別列
- `GetChild` — 第一個子 entry
- `GetParent`
- `GetNextSibling` / `GetPrevSibling`
- `GetNth(n)` — top level 的第 n 個
- `GetPos(position)` — 指定 view position（如 `"3.2"`）的 entry
- `GetEntry(obj)` — 對應指定 NotesDocument 或 ViewEntry 的 navigator entry
- `GetCurrent` — 內部 cursor 目前位置

### Goto* — 移動內部 cursor，回 boolean

每個 `Get*` 大致都有對應的 `Goto*`：`GotoFirst`、`GotoNext`、`GotoChild`、`GotoParent`、`GotoNextSibling`、`GotoFirstDocument`、`GotoNextCategory`、`GotoPos`、`GotoEntry` … 一整套。回傳 `True/False` 表示有沒有成功移動。

### Mark* — 整個 navigator 的已讀狀態

- `MarkAllRead` — 把 navigator 涵蓋的所有文件標為已讀
- `MarkAllUnread` — 反向

對「把使用者收件夾的所有未讀標已讀」這種操作很方便（搭 `CreateViewNavFromAllUnread`）。

## 效能：先把 AutoUpdate 關掉

文檔明確警告：

> 「Avoid automatically updating the parent view by explicitly setting AutoUpdate to False. Automatic updates degrade performance and may invalidate entries in the navigator (`Entry not found in index`).」

走 navigator 之前一律：

```lotusscript
Set view = db.GetView("My View")
view.AutoUpdate = False    ' 一定要做
Set nav = view.CreateViewNav()
```

不關 AutoUpdate 的後果是：別人在你跑 navigator 時改了文件，view 自動 refresh，navigator 持有的 entry index 失效，你下一個 `GetNext` 拿到 `Entry not found in index` 例外。

需要看到新資料時手動 `view.Refresh()` 即可。

## 實用範例：列出某類別下所有文件

```lotusscript
Sub ListByCategory(db As NotesDatabase, viewName As String, cat As String)
    Dim view As NotesView
    Dim nav As NotesViewNavigator
    Dim entry As NotesViewEntry

    Set view = db.GetView(viewName)
    view.AutoUpdate = False

    Set nav = view.CreateViewNavFromCategory(cat)
    Set entry = nav.GetFirstDocument()    ' 跳過類別列
    Do Until entry Is Nothing
        Print entry.Document.UniversalID & " | " & _
              CStr(entry.ColumnValues(0))    ' view 第一欄
        Set entry = nav.GetNextDocument(entry)
    Loop
End Sub
```

幾個重點：

1. `AutoUpdate = False` — 第一行就做
2. `CreateViewNavFromCategory` — 直接指定類別，比建完整 nav 再過濾快
3. `GetFirstDocument` / `GetNextDocument` — 跳過該類別的標題列與總計列
4. `entry.ColumnValues(0)` — 直接拿 view 的欄位值，不用再開 Document（這是 navigator 比 GetFirstDocument 迴圈快的關鍵）

## 一個重要 caveat：重複 entry

如果文件被分類在**多個類別**下，同一份 document 在 view 裡會出現多次。導航時：

- `GetEntry(doc)` 永遠回**第一個** ViewEntry instance（不是「全部」）
- 用「不是來自當前 view」的物件建的 navigator，也只回第一個 instance

這在報表類「我以為總共有 N 筆」對不上時要記得查。

## 什麼時候 *不* 用 NotesViewNavigator

- 只想拿文件、view 不分類、沒效能問題 → `GetFirstDocument` 迴圈就夠
- 要做大量篩選+排序 → 考慮 `NotesViewEntryCollection` 或 DQL（[V12 起的 NotesQueryResultsProcessor](https://bryanhsiao.github.io/domino-news/posts/notes-query-results-processor)）
- 需要併發查詢 → DRAPI

navigator 的甜蜜點是 **「我要走 view 的某個子集，而且想拿到 view 的中介資料」**。對到這個情境，它是工具箱裡最對的一支扳手。
