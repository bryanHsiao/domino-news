---
title: "@DbLookup 與 @DbColumn：你沒在傳的那個 cache 關鍵字，與 64K 那道牆"
description: "有人改了一份 keyword 文件、重載表單，下拉還是顯示舊值。或者一份 keyword 清單長到幾千筆就悄悄不再長，直到某筆查不到才有人發現。這兩個都不是 Domino 隨機出包，而是 @DbLookup / @DbColumn 兩個有文件記載的行為，藏在多數公式忽略的地方：cache 關鍵字，與 64KB 上限。一篇關於這兩者的實測報告 —— 三種 cache 選項（預設／NoCache／ReCache）、以及這些函式回傳量的硬上限 64KB，配上 classic web 各自踩雷的情境。"
pubDate: 2026-08-04T07:30:00+08:00
lang: zh-TW
slug: dblookup-cache-64k
tags:
  - "Formula"
  - "Performance"
sources:
  - title: "@DbLookup (Domino data source) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DBLOOKUP_NOTES_DATABASES.html"
  - title: "@DbColumn (Domino data source) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DBCOLUMN_NOTES_DATABASES.html"
  - title: "NotesView (LotusScript) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/dblookup-cache-64k.webp"
coverStyle: "low-poly-3d"
---

有人改了一份 keyword 文件、重載表單，下拉卻還是顯示舊值 —— 而且是整個 session 都這樣。或者一份本來完整的 keyword 清單長到幾千筆就悄悄停住，沒人注意，直到某筆紀錄找不到。這些不是 Domino 隨機的不穩。它們是 [`@DbLookup`](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DBLOOKUP_NOTES_DATABASES.html) 與 [`@DbColumn`](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_DBCOLUMN_NOTES_DATABASES.html) 兩個有文件記載的行為，兩個都藏在多數公式忽略的地方：cache 關鍵字，與 64KB 上限。

這是一篇關於這兩者的實測報告 —— 你很可能當成空字串傳、卻不知道它在做什麼的那個 cache 選項，以及這些函式能交回多少資料的硬上限。

---

## 重點摘要

- 第一個參數帶著一個 **cache 關鍵字**，把它留成 `""` **不是**「不快取」——它*就是*快取。預設（`""`）把結果快取整個 session；下一個相同的查詢會沿用它，直到有東西呼叫 `"ReCache"`。
- `"NoCache"` 每次都讀最新（資料對、比較慢）。`"ReCache"` 讀最新*而且*刷新快取給後續的預設查詢用。依資料多易變來選。
- `@DbLookup` 與 `@DbColumn` 各自回傳量**不超過 64KB**。超過就失敗或截斷 —— 這就是一份會長大的 keyword 清單悄悄變不完整的原因。
- 在 classic web，computed-for-display 欄位每次渲染都重算，所以 cache 選擇與 64K 上限都比在 Notes client 上打得更兇。

## 把 cache 關鍵字講清楚

大家記得的簽名是 `@DbColumn(""; server:db; view; column)` —— 而開頭那個 `""` 就是快取所在。它不是佔位符；它是一個選擇，而文件對這三個值講得很精確：

- **`""`（預設）**——「快取這次查詢的結果。每個後續對同一位置的查詢（在同一個 Domino session 內、且執行此查詢的資料庫維持開啟時）都沿用那份資料，直到你指定 `ReCache`。」對穩定資料很好；對 session 進行中會變的任何東西，就是一個舊資料 bug。
- **`"NoCache"`**——「從資料庫取得查詢結果；不使用快取。」當每次查詢都必須看到最新時用它。注意這個細節：它*忽略*快取但不更新它 ——「如果同樣的查詢已被快取，該快取不會被更新。」
- **`"ReCache"`**——「用資料庫的最新資料刷新快取。」它讀最新、把新結果存起來，之後一個預設（`""`）查詢就會拿到那個刷新後的值。

所以那個「下拉顯示舊值」的 bug，正是預設快取忠實地做它的工作：你編輯了 keyword 文件，但表單的 computed 欄位這個 session 稍早跑過 `@DbColumn(""; …)`、正在交回快取的清單。修法要看意圖 —— 對「必須永遠最新」的欄位用 `"NoCache"`，或在「改動來源資料的程式」之後補一個 `"ReCache"`、讓下一個預設查詢是新的。到處都塞 `"NoCache"`「保險一點」是反過來的錯：每個 keyword 欄位在每次開表單時都重讀它的 view，一張有一打查詢的忙碌表單就變慢 —— 而對很少變的資料毫無好處。

```
REM {易變 —— 必須反映本 session 做的編輯};
@DbColumn("" : "NoCache"; "" : "App.nsf"; "vwActiveProjects"; 1)

REM {穩定的參考資料 —— 快取它};
@DbColumn(""; "" : "App.nsf"; "vwCountryCodes"; 1)
```

## 64KB 那道牆

兩個函式都有硬上限：它們「回傳量不超過 64KB」。對一份國家清單沒問題；對任何開放式的東西就是地雷。一個掃過「每個客戶」的 view 的 `@DbColumn`、或一個把橫跨幾千筆比對的多值欄位拉出來的 `@DbLookup`，在測試環境用 200 列跑得好好的，然後在正式環境 5,000 列時越過 64KB、回傳一個錯誤或被截斷的集合。那份「不再長大」的 keyword 清單沒有停 —— 它撞牆了，而因為一份被截斷的清單看起來還是一份清單，沒人看得出來，直到那筆缺的被需要。

當一個結果會無上限地長大時，`@DbColumn` / `@DbLookup` 是錯的工具。把查詢收窄到它不可能超過 64KB —— 把 view 分類、用 category `@DbLookup`、而不是把整欄拉出來 —— 或把讀取搬到後端，那裡一個 [`NotesView`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESVIEW_CLASS.html) navigator（或 DQL）沒有這種上限、還能分頁走結果。經驗法則：這些公式是給*有界的*參考資料 —— 代碼清單、小的 keyword 集合 —— 不是給「隨你文件數成長的資料集」讀的。

## 為什麼 web 讓兩者都更糟

在 Notes client 上，一個 computed keyword 欄位在文件開啟時求值、之後多半靜止。在 classic web 上，computed-for-display 欄位每次 Domino 渲染表單都重算，所以一張查詢吃重的 web 表單在每次頁面載入都跑它的 `@DbColumn`。這同時放大兩個問題：預設快取更可能在一個更長命的 session 裡供出舊資料，而 64K 上限被打在一個使用者會反覆觸發的同一條渲染路徑上。如果你在把一張 keyword 吃重的表單搬上 web，cache 關鍵字與每個 `@DbColumn` 的大小是你要先稽核的兩件事 —— 不是因為函式變了，而是因為 web 操它操得比 client 兇太多。
