---
title: "NotesView AutoUpdate=False：迴圈裡改文件為什麼越跑越慢、還跳「Entry not found in index」"
description: "一個 agent 迴圈跑 view、順手改文件，結果越跑越慢，甚至偶爾拋「Entry not found in index」。罪魁是 NotesView 預設會自動刷新：當你的迴圈改動的正是這個 view 索引的文件，view 就在你腳下一直重整，效能爛掉、導覽位置也可能失效。解法一行——迴圈前 view.AutoUpdate = False。這篇講清楚機制、正確的「先抓下一個再改」寫法，以及三個要知道的副作用（快照、只管當前程式、要 Refresh 才看得到更新）。"
pubDate: 2026-09-15T07:30:00+08:00
lang: zh-TW
slug: notes-view-autoupdate
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Performance"
sources:
  - title: "AutoUpdate property (NotesView) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html"
  - title: "Refresh method (NotesView) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_REFRESH_METHOD_VIEW.html"
  - title: "NotesView class (LotusScript) — HCL Domino Designer（官方）"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_NOTESVIEW_CLASS.html"
relatedJava: ["View"]
relatedSsjs: ["view"]
---

寫一個 agent，`GetFirstDocument` / `GetNextDocument` 跑過一個 view、對每份文件改個欄位再存。文件不多時沒事；量一大，就發現它**越跑越慢**，甚至偶爾拋一個看起來莫名其妙的錯：**「Entry not found in index」**。你檢查邏輯沒問題，怎麼會這樣？

問題不在你的迴圈邏輯，在 **view 會自己在你腳下重整**。這篇講清楚為什麼，以及那個一行的解。

## 重點摘要

- **`NotesView` 預設 `AutoUpdate = True`**：view 會自動刷新——[官方](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html)寫「True (default) indicates that the view is automatically refreshed.」
- **迴圈裡改文件＝改到 view 自己**：你改的欄位若影響這個 view（新增、刪除、或改到選取公式用到的欄位），每改一次就可能觸發一次刷新——**效能爛掉，還可能讓導覽位置失效**（那個「Entry not found in index」）。
- **解法一行**：迴圈**之前**設 `view.AutoUpdate = False`，關掉自動刷新，迭代就穩、就快。
- **三個副作用要知道**：關掉後 view 是**快照**、看不到迴圈中的變動；它只管**你這段程式**的刷新（`updall` 等照樣更新索引）；要看到更新得自己 `Refresh`。

## 為什麼會越跑越慢、又跳錯

[官方 AutoUpdate 頁](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html)把話講得很直白：

> 「It is best to avoid automatically updating the view by explicitly setting this property to False especially if the view is a base for navigators or entry collections. **Automatic updates degrade performance and may invalidate entries in child objects.**」

拆開看你的情境：view 預設會在「navigation method 碰到一份被更新過的文件」時自動刷新。而你的迴圈**正在改動這個 view 索引的文件**——改到選取公式或排序欄位，這份文件在 view 裡的位置就變了（甚至被選出／被剔除）。於是每存一次，view 可能就重整一次；文件多的時候，這是一層一層疊上去的浪費，**越跑越慢**。

更糟的是導覽位置：你手上的 `doc` 是「刷新前」那個索引位置抓到的，view 一重整，`GetNextDocument(doc)` 可能就找不到它在新索引裡的位置——這正是 **「Entry not found in index」** 的來源，官方也點名這在「view 當作 navigator 或 entry collection 的 base」時特別容易發生。

## 正確寫法：關掉自動刷新 + 先抓下一個再改

兩個動作：迴圈前 `AutoUpdate = False`；迴圈裡**先取下一份的 handle、再改目前這一份**（這樣就算目前這份被你改到脫離 view，你也早就握著下一個了）。

```lotusscript
Dim view As NotesView
Set view = db.GetView("MyView")
view.AutoUpdate = False              ' ← 迴圈前先關掉自動刷新（關鍵）

Dim doc As NotesDocument
Dim nextDoc As NotesDocument
Set doc = view.GetFirstDocument
While Not doc Is Nothing
    Set nextDoc = view.GetNextDocument(doc)   ' 先抓下一個 handle
    Call doc.ReplaceItemValue("Status", "Done")
    Call doc.Save(True, False)                 ' 再改目前這一份
    Set doc = nextDoc
Wend
```

`AutoUpdate = False` 之後，這個 view 物件就成了**進迴圈那一刻的快照**：它不會因為你的存檔一直重整，迭代穩定、也快很多。這正是官方建議「especially if the view is a base for navigators or entry collections」時要做的事。

## 三個要知道的副作用

1. **它是快照，看不到迴圈中的變動。** 關掉自動刷新後，迴圈期間新增／改動的文件不會反映在這個 view 物件裡——這通常正是你要的（穩定迭代），但若你**需要**看到更新，官方寫明：「If this property is False, **you must call Refresh** to navigate to an update.」——自己在適當時機呼叫 [`view.Refresh`](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_REFRESH_METHOD_VIEW.html)。
2. **它只管「你這段程式」的刷新。** [官方](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_AUTOUPDATE_PROPERTY.html)：「This property only addresses refreshes by the currently running code. Other code, such as running the `Updall` task against the database, will update the view index... regardless of the value of this property.」——你關掉的只是「你自己的程式觸發的自動刷新」，伺服器上 `updall` 或別的程式照樣更新索引，這不受你影響。
3. **改到 view 選取欄位仍要小心結果。** 即使關了自動刷新，若你在迭代中大量改動選取／排序欄位，還是要清楚「這是對快照迭代」；需要「改完再重跑一次乾淨的 view」時，收尾 `Refresh` 或重新 `GetView` 拿一份新的。

## 小結

`GetNextDocument` 迴圈裡改文件會越跑越慢、或跳「Entry not found in index」，幾乎都是同一個原因：**view 預設會自動刷新，而你改的正是它索引的文件**。迴圈前一行 `view.AutoUpdate = False`、搭配「先抓下一個 handle 再改目前這份」，就穩又快——只要記得它現在是快照、要看更新得自己 `Refresh`。想深入 view 的走訪方式，見 [NotesViewNavigator 導覽](/domino-news/posts/notes-view-navigator)。
