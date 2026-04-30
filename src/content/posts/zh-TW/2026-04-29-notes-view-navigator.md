---
title: "NotesViewNavigator 入門：用導航器走視圖，不要再 GetFirstDocument 硬撈"
description: "NotesViewNavigator（視圖導航器）是 LotusScript 走視圖的進階工具：能拿到 ViewEntry（視圖條目，含類別、總計、位置等視圖才有的中介資料）、能從子集合（單一類別、未讀、某層以下）建立、效能上比 GetFirstDocument 迴圈高，但使用之前要先把 AutoUpdate 關掉。本文整理 4 個屬性、約 36 個方法、7 個 CreateViewNav* 變體與重要注意事項。"
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
  - title: "NotesView CreateViewNav method — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_CREATEVIEWNAV_METHOD_1631.html"
  - title: "NotesView (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEW_CLASS.html"
cover: "/covers/notes-view-navigator.png"
---

## 為什麼不用 GetFirstDocument 就好？

LotusScript 走視圖（view）最入門的寫法是：

```lotusscript
Set doc = view.GetFirstDocument()
Do Until doc Is Nothing
    ' work
    Set doc = view.GetNextDocument(doc)
Loop
```

短小、易讀、絕大多數場景夠用。但碰到下列情境時，[`NotesViewNavigator`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEWNAVIGATOR_CLASS.html)（視圖導航器，從 Release 5 起就有）會比較順手：

- 你需要的不是文件物件（`Document`），而是 **`ViewEntry`（視圖條目）**，它帶有視圖才有的中介資料：位置、`SiblingCount`、`IsCategory` / `IsTotal`、`ColumnValues` 等
- 你只想走視圖的**某個子集**（單一類別下、所有未讀、某層以下、某個條目的後代）
- 你需要走**類別總計列**或**類別本身**，不只是文件
- 你想用**樹狀**方式爬 —— 子 → 父 → 兄弟姊妹，而不是平面的下一個 / 上一個

導航器由 [`NotesView`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESVIEW_CLASS.html) 的 `CreateViewNav*` 系列方法建立。

## 屬性（只有 4 個）

文檔列出的全部屬性 —— 沒有什麼 `Navigator` 或 `Entry` 屬性，那是 AI 常見的幻覺：

| 屬性 | 存取 | 用途 |
|---|---|---|
| `CacheSize` | 可讀寫 | 導航器快取大小（以視圖條目為單位） |
| `Count` | 唯讀 | 導航器涵蓋的條目總數 |
| `MaxLevel` | 可讀寫 | 導航器走到的最大層級 |
| `ParentView` | 唯讀 | 對應的 `NotesView` |

## 7 種 `CreateViewNav*` 建立法

從 `NotesView` 端拿到導航器的 7 種方法 —— 重點是 **你要走視圖的哪個子集**：

| 方法 | 涵蓋範圍 |
|---|---|
| `CreateViewNav` | 整個視圖的所有條目 |
| `CreateViewNavFrom(entry)` | 從指定條目開始到結束 |
| `CreateViewNavFromAllUnread` | 所有未讀條目 |
| `CreateViewNavFromCategory(category)` | 指定類別下的所有條目 |
| `CreateViewNavFromChildren(entry)` | 指定條目的直接子代（不含孫代） |
| `CreateViewNavFromDescendants(entry)` | 指定條目的所有後代 |
| `CreateViewNavMaxLevel(maxLevel)` | 視圖中到指定層級為止的所有條目 |

挑對建立法比後續挑對遍歷方法還重要 —— 用 `CreateViewNavFromCategory` 比建完整導航器再 `GotoChild` 過濾快得多。

## 方法分三類

### `Get*` —— 取出條目，不動內部游標

最常用的：

- `GetFirst` / `GetLast` / `GetNext` / `GetPrev`
- `GetFirstDocument` / `GetLastDocument` / `GetNextDocument` / `GetPrevDocument` —— 跳過類別/總計列，只回文件
- `GetNextCategory` / `GetPrevCategory` —— 只走類別列
- `GetChild` —— 第一個子條目
- `GetParent`
- `GetNextSibling` / `GetPrevSibling`
- `GetNth(n)` —— 最上層的第 n 個
- `GetPos(position)` —— 指定視圖位置（如 `"3.2"`）的條目
- `GetEntry(obj)` —— 對應指定 `NotesDocument` 或 `ViewEntry` 的導航器條目
- `GetCurrent` —— 內部游標目前位置

### `Goto*` —— 移動內部游標，回傳布林值

每個 `Get*` 大致都有對應的 `Goto*`：`GotoFirst`、`GotoNext`、`GotoChild`、`GotoParent`、`GotoNextSibling`、`GotoFirstDocument`、`GotoNextCategory`、`GotoPos`、`GotoEntry` …… 整套都有。回傳 `True` / `False` 表示有沒有成功移動。

### `Mark*` —— 整個導航器的已讀狀態

- `MarkAllRead` —— 把導航器涵蓋的所有文件標為已讀
- `MarkAllUnread` —— 反向

對「把使用者收件匣的所有未讀標為已讀」這種操作很方便（搭 `CreateViewNavFromAllUnread`）。

## 效能：先把 AutoUpdate 關掉

文檔明確警告：

> Avoid automatically updating the parent view by explicitly setting AutoUpdate to False. Automatic updates degrade performance and may invalidate entries in the navigator (`Entry not found in index`).
>
> （翻譯：請明確將父視圖的 AutoUpdate 設為 False 以避免自動更新。自動更新會拖慢效能，而且可能讓導航器中的條目失效，產生 `Entry not found in index` 錯誤。）

走導航器之前一律：

```lotusscript
Set view = db.GetView("My View")
view.AutoUpdate = False    ' 一定要做
Set nav = view.CreateViewNav()
```

不關 `AutoUpdate` 的後果是：別人在你跑導航器時改了文件，視圖自動重新整理，導航器持有的條目索引（entry index）失效，你下一次 `GetNext` 會拿到 `Entry not found in index` 錯誤。

需要看到新資料時手動呼叫 `view.Refresh()` 即可。

## 實用範例：列出某類別下所有文件

```lotusscript
Sub ListByCategory(db As NotesDatabase, viewName As String, cat As String)
    Dim view As NotesView
    Dim nav As NotesViewNavigator
    Dim entry As NotesViewEntry

    Set view = db.GetView(viewName)
    view.AutoUpdate = False

    Set nav = view.CreateViewNavFromCategory(cat)
    Set entry = nav.GetFirstDocument()    ' 跳過類別標題列
    Do Until entry Is Nothing
        Print entry.Document.UniversalID & " | " & _
              CStr(entry.ColumnValues(0))    ' 視圖第一欄
        Set entry = nav.GetNextDocument(entry)
    Loop
End Sub
```

幾個重點：

1. `AutoUpdate = False` —— 操作視圖的第一行就做
2. `CreateViewNavFromCategory` —— 直接指定類別，比建完整導航器再過濾快
3. `GetFirstDocument` / `GetNextDocument` —— 跳過該類別的標題列與總計列
4. `entry.ColumnValues(0)` —— 直接拿視圖的欄位值，不用再開啟文件物件（這是導航器比 `GetFirstDocument` 迴圈快的關鍵）

## 一個重要的注意事項：重複條目

如果文件被分類在 **多個類別** 下，同一份文件在視圖裡會出現多次。導航時：

- `GetEntry(doc)` 永遠回 **第一個** `ViewEntry` 實例（不是「全部」）
- 用「不是來自當前視圖」的物件建的導航器，也只回第一個實例

報表類「我以為總共有 N 筆」對不上的時候，要記得回頭查這個。

## 什麼時候 *不* 用 NotesViewNavigator

- 只想拿文件、視圖不分類、沒效能問題 → `GetFirstDocument` 迴圈就夠
- 要做大量篩選 + 排序 → 考慮 `NotesViewEntryCollection`，或 DQL（[V12 起的 NotesQueryResultsProcessor](https://bryanhsiao.github.io/domino-news/posts/notes-query-results-processor)）
- 需要併發查詢 → Domino REST API（DRAPI）

導航器的甜蜜點是 **「我要走視圖的某個子集，而且想拿到視圖的中介資料」**。對到這個情境，它是工具箱裡最對的一支扳手。
