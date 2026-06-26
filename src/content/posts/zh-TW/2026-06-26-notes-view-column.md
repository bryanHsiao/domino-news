---
title: "NotesViewColumn：用程式讀一個 view 有哪些欄、各自的公式與排序"
description: "你想盤點一個 view 有哪些欄、每欄是欄位還是公式、有沒有排序或分類、哪些被隱藏 — 不用開 Designer，用 NotesViewColumn 就能在程式裡讀出來。本文拆解從 view.Columns 取得、Title / ItemName / Formula / Position / IsSorted / IsCategory / IsHidden / IsField / IsFormula 等屬性，以及它跟先前 NotesViewEntry 的 ColumnValues 怎麼對應（同一個 Position 索引）。"
pubDate: 2026-06-26T07:30:00+08:00
lang: zh-TW
slug: notes-view-column
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "NotesViewColumn class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWCOLUMN_CLASS.html"
  - title: "NotesView class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
  - title: "Formula property (NotesViewColumn) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FORMULA_PROPERTY_VIEWCOLUMN.html"
relatedJava: ["ViewColumn"]
relatedSsjs: ["ViewColumn"]
cover: "/covers/notes-view-column.webp"
coverStyle: "collage"
---

接手一個沒文件的資料庫，你想搞清楚某個 view 到底長怎樣：有哪幾欄、每欄顯示的是某個欄位還是一段公式、哪幾欄有排序、哪欄是分類、哪幾欄被隱藏。打開 Designer 一欄一欄看可以，但要寫工具盤點幾十個 view 呢？

那就是 [`NotesViewColumn`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEWCOLUMN_CLASS.html) 的用途。官方定義：「Represents a column in a view or folder.」它讓你**在程式裡讀 view 的欄定義** —— 跟先前 [`NotesForm`](/domino-news/posts/notes-form/) 讀表單設計是同一類「讀設計」的能力。而且它跟前幾天介紹的 [`NotesViewEntry`](/domino-news/posts/notes-view-entry/) 正好接得起來：`ViewEntry.ColumnValues` 那串值，對應的就是這些欄。

---

## 重點摘要

- 從 [`NotesView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) 的 `Columns` 屬性取得（回傳陣列，view 的所有欄）。
- **讀標題與來源**：`Title`（欄標題）、`ItemName`（程式名，通常就是欄位名）、`Formula`（若該欄是公式）。
- **判斷欄的型態**：`IsField`（值來自欄位）、`IsFormula`（值來自簡單函式或公式）、`IsCategory`（是分類欄）。
- **排序與顯示**：`IsSorted`、`IsResortAscending`、`IsHidden`、`Width`、`IsResize`。
- `Position` —— 欄在 view 中的位置，**從左到右、由 1 開始**。這個索引正好對應 `ViewEntry.ColumnValues`。

## 取得與走訪

```lotusscript
Dim view As NotesView
Set view = db.GetView("Orders")
Dim col As NotesViewColumn
Forall col In view.Columns
    Print col.Position & ": " & col.Title & " (" & col.ItemName & ")"
End Forall
```

`view.Columns` 給你整個 view 的欄陣列，逐欄讀屬性就能把整個 view 的欄結構盤出來。

## 各屬性在說什麼

| 屬性 | 內容 |
|---|---|
| `Title` | 欄標題（讀寫） |
| `ItemName` | 「the programmatic name of a column, which is usually the field (item) name」程式名／欄位名（唯讀） |
| `Formula` | 該欄的公式（讀寫，若該欄是公式型） |
| `Position` | 欄位置，**從左到右由 1 開始**（唯讀） |
| `IsField` | 值是否來自欄位（唯讀） |
| `IsFormula` | 值是否來自簡單函式／公式（唯讀） |
| `IsCategory` | 是否為分類欄（唯讀） |
| `IsSorted` | 是否自動排序（讀寫） |
| `IsHidden` | 是否隱藏（讀寫） |
| `Width` / `IsResize` | 欄寬 / 可否調整 |

要「自動產生 view 文件」就靠這幾個：`IsField` / `IsFormula` 分辨這欄是直接顯示欄位、還是算出來的；是公式就讀 [`Formula`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FORMULA_PROPERTY_VIEWCOLUMN.html) 把那段公式抓出來。

## 跟 NotesViewEntry 接起來

這是 `NotesViewColumn` 最實用的搭配。前幾天那篇講 `NotesViewEntry.ColumnValues` 時提過一個坑：**`ColumnValues(n)` 的 n 對應的是 view 的欄順序，不是欄位名**。

`NotesViewColumn.Position` 就是那個 n 的來源。所以你可以先用 `view.Columns` 建一張「Position → Title / ItemName」對照表，再讀每個 entry 的 `ColumnValues`，就能把「第幾欄的值」對回「這欄是什麼」 —— 做動態報表、欄位不寫死的匯出時，這個組合很關鍵：

```lotusscript
' 先建欄對照
Dim titles List As String
Forall c In view.Columns
    titles(Cstr(c.Position)) = c.Title
End Forall
' 再讀 entry 的值就能對回欄名
```

## 同類別在其他語言

| 語言 | 對應類別 | 取得方式 |
|---|---|---|
| Java（`lotus.domino.*`） | `ViewColumn` | `view.getColumns()` |
| SSJS / XPages | `ViewColumn` | `view.getColumns()` |

三邊一致：`getColumns()` 取陣列、`getItemName()` / `getFormula()` / `isCategory()` 等。寫 Domino 設計盤點 / 文件產生工具時，這篇的欄屬性對照可直接用。
