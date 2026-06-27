---
title: "FTSearch / db.Search / DQL：Domino 三種搜尋機制怎麼選"
description: "Domino 14 之後、文件搜尋有三條技術路徑：FTSearch（文字索引）、db.Search（@Formula 全表掃描）、DQL（V12 引入、結構化 query、走 design catalog 跟 NIF 索引）。本文用一張多維對比表 + 一棵決策樹整理三者的差異 — index 需求、語法、效能、即時性、回傳順序、可組合性 — 並深入講 Domino 14 開始 DQL 支援 `@FTSearch()` term 把全文檢索整合進結構化 query 的意義。三個實戰場景（一次性查詢 / scheduled agent / 高頻 REST API）對應建議路徑、附 cross-link 整個搜尋系列跟 DQL 三部曲。"
pubDate: 2026-05-29T07:30:00+08:00
lang: zh-TW
slug: domino-search-decision
tags:
  - "LotusScript"
  - "DQL"
sources:
  - title: "FTSearch method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html"
  - title: "Search method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SEARCH_METHOD.html"
  - title: "DQL Full-Text Search (@FTSearch term) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.0/basic/dql_fulltextsearch.html"
  - title: "Collecting documents by searching — HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COLLECTING_DOCUMENTS_BY_SEARCHING.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-search-decision.webp"
coverStyle: "pencil-sketch"
---

Domino 14 之後、文件搜尋有三條技術路徑：[FTSearch](/domino-news/zh-TW/posts/lotusscript-ftsearch) 走文字索引、[db.Search](/domino-news/zh-TW/posts/lotusscript-db-search) 走 `@Formula` 暴力掃描、[DQL](/domino-news/zh-TW/posts/dql-getting-started) 走結構化 query 計畫。三條都能把符合條件的文件抓出來、但效能模型、index 成本、適合的資料規模差幾個數量級 — 選對的省下幾小時 batch / 幾百毫秒 request、選錯的就算把 formula 寫到最簡 也救不回來。

哪一條適合手上的問題？「庫多大」「條件偏文字還是結構化」「查詢頻率」這三個問題的答案組合決定路徑。

這篇是搜尋三部曲的 capstone — 多維度對比表、決策樹、Domino 14 把 FTSearch 整合進 DQL 的 `@FTSearch()` term、跟三個實戰場景（ad-hoc 查詢 / scheduled agent / 高頻 REST API）對應的建議路徑。

---

## 重點摘要

- **Domino 14 之後有三條搜尋路徑**：[FTSearch](/domino-news/zh-TW/posts/lotusscript-ftsearch)（FT index）、[db.Search](/domino-news/zh-TW/posts/lotusscript-db-search)（@Formula 全掃）、[DQL](/domino-news/zh-TW/posts/dql-getting-started)（catalog + NIF + bulk readers）
- **三者本質差異**：FTSearch 走文字索引（適合「找含某字的」）、db.Search 走逐文 evaluate（適合「條件複雜但庫小」）、DQL 走結構化 query plan（適合「庫大、條件需高效」）
- **Domino 14 把 FTSearch 整合進 DQL** — 用 [`@FTSearch('query')` term](https://help.hcl-software.com/dom_designer/14.5.0/basic/dql_fulltextsearch.html) 在 DQL 裡寫全文條件、跟其他結構化 term 用 Boolean operator 串
- **沒有「全勝」選項** — 三者各有強項弱項、選錯成本可能差幾個數量級
- **決策樹三個問題**：庫多大？條件文字 vs 結構化？需不需要 ordering？— 三個答案組合決定走哪條
- **常被忽略的組合策略**：先 `db.Search` 用結構化條件縮範圍、再 `collection.FTSearch` 跑文字精篩、是中型庫的甜蜜點

---

## 三條路線的本質

下表的維度整理自 HCL 官方的 [Collecting documents by searching](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COLLECTING_DOCUMENTS_BY_SEARCHING.html) conceptual page 跟三個 method 各自的 reference 頁。

| 維度 | FTSearch | db.Search | DQL |
|---|---|---|---|
| **資料結構** | Full-text inverted index（單獨檔案 / 目錄）| 無、scan 文件本體 | Design catalog + NIF 索引 + 必要時 view re-use |
| **Query 語言** | FT query string（AND/OR/NOT/CONTAINS/wildcards）| @Formula（@Contains/@Modified/@IsAvailable 等）| DQL（SQL-like、`'view'.column = X`）|
| **適合的條件型態** | 文字內容搜尋 | 任意 @Formula 邏輯 | 結構化欄位過濾 |
| **效能模型** | O(matched terms)、Index lookup | O(N) 全表 scan | O(matched index entries)、走 explain plan |
| **Index 成本** | FT index 占 disk、需要 admin 建 | 無 index 需求 | Design catalog 需要維護、view-as-base 走 NIF |
| **回傳順序** | 預設按 relevance、可選 date sort | Unsorted | 走 view 的話有 sort、bare-field 無 sort |
| **max 結果** | 預設 5000 cap、改 notes.ini | 真的無限 | 真的無限 |
| **Live vs Snapshot** | Snapshot collection | Snapshot collection | Snapshot collection |
| **可用 context** | LotusScript / Java / SSJS / DQL term | LotusScript / Java / SSJS | LotusScript / Java / REST API / Notes Client F9 |
| **Reader 欄位處理** | 套用（看不到沒權限的）| 套用 | **bulk readers query 模式**、效能提升 |

幾個關鍵觀察：

### FTSearch 的相對位置

- **強**：[`FTSearch`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html) 的純文字搜尋速度、relevance scoring、stem / thesaurus 支援
- **弱**：結構化條件（`Total > 1000`）寫起來彆扭、5000 預設 cap、依賴 FT index 維護
- **甜蜜點**：搜尋 free-text 欄位（Subject / Body / Comments 等）、回相關性最高的 top-N

### db.Search 的相對位置

- **強**：[`db.Search`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SEARCH_METHOD.html) 不需 index、formula 表達力強、`dateTime` cursor 適合增量處理
- **弱**：O(N) 效能、不能寫 UI / lookup 類 @function、結果 unsorted
- **甜蜜點**：admin 不配合建 index 的舊系統、低頻 ad-hoc 查詢、scheduled agent 走增量處理

### DQL 的相對位置

- **強**：大表效能、SQL-like 可讀性、`'view'.column` 走 NIF index、explain plan 可調效能、reader 欄位透過 bulk query 模式優化
- **弱**：catalog 維護、有 Domino 12+ 版本門檻、某些 @function 不支援、調效能需要懂 explain plan
- **甜蜜點**：高頻結構化查詢、REST API 後端、大型 NSF（百萬份文件等級）

DQL 本身的細節在 [DQL 三部曲（入門 / 踩雷 / 上 production）](/domino-news/zh-TW/posts/dql-getting-started)有完整三篇深入、本文不重複。

---

## 決策樹 — 三個問題定路徑

```
庫多大？
├─ 小（<10K 文件）
│   └─ 條件型態？
│       ├─ 純文字 → FTSearch
│       └─ 結構化 → db.Search
│
├─ 中（10K-100K 文件）
│   └─ 查詢頻率？
│       ├─ 高頻（>10 次/分）→ DQL
│       └─ 低頻 / 一次性 → 任意、但偏好 DQL
│
└─ 大（>100K 文件）
    └─ 條件型態？
        ├─ 純文字 → FTSearch（必須有 index）
        ├─ 結構化 → DQL
        └─ 兩者皆有 → DQL + @FTSearch term
```

這棵樹是 first-order heuristic、實務上還要考慮：

- **是否能建 FT index** — admin 政策 / disk 限制可能直接砍掉 FTSearch 選項
- **是否走 REST API** — 那必然 DQL（Domino REST API 後端就是 DQL）
- **是否需要 ordering** — FTSearch 內建 relevance / date sort 很省事、其他兩條要自己處理

---

## Domino 14 的整合：DQL `@FTSearch()`

Domino 14 把 FTSearch 整合進 DQL — 用 [`@FTSearch('query')`](https://help.hcl-software.com/dom_designer/14.5.0/basic/dql_fulltextsearch.html) （也可寫 `@FTS(...)`）作為 DQL term、跟結構化條件用 Boolean 串接：

```dql
@FTSearch('urgent') AND Status = 'Open'
```

```dql
IN ALL ('CustomersByCountry') OR @FTS('[name] < (b)')
```

```dql
@FTSearch('[TextField1] = (hello)') AND DateField1 > @dt('2026-06-12T04:17:31-04:00')
```

幾個重要規則（直接引用官方文件）：

- 「The function name is case-insensitive.」— `@FTSearch` 或 `@FTS` 都可
- 「@FTSearch() is a standalone term that returns the set of documents which matches the given full-text query, meaning that you cannot use any operators after it, only Booleans.」— `@FTSearch(...) >= 100` 是無效語法、要把比較條件單獨寫成另一個 term 再 AND
- 「The maximum query string size is 256 bytes.」— 內層 FT query 字串有長度限制
- 「The syntax rules ... is the same as the FTSearch() function in LotusScript/Java classes and the C API」— 你在 Part 1 學到的 query syntax operators 在這裡通用

這個整合的意義是 **不必再為「文字 + 結構化條件」寫 two-step chain**（先 db.Search 再 collection.FTSearch、或先 FTSearch 再 LotusScript filter）— 一個 DQL query 表達完整。

但要注意：**DQL `@FTSearch` 仍然依賴 FT index**、沒 index 不會自動降級成 scan。可以用 [`db.IsFTIndexed`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISFTINDEXED_PROPERTY.html) 在 production code 預先檢查、不然 admin 端的 index 維護仍是先決條件。

---

## 三個實戰場景對照

### 場景 1：一次性 ad-hoc 查詢

「客服跟我說有客戶投訴上週寄出的訂單沒收到、幫我找一下」

```lotusscript
' 走 db.Search 直接、條件清楚、跑一次就完事
Dim cutoff As New NotesDateTime("")
Call cutoff.SetNow()
Call cutoff.AdjustDay(-7)

Set docs = db.Search( _
    "Type = ""Order"" & @Contains(CustomerEmail; ""@" & customerDomain & """)", _
    cutoff, 0)
```

為什麼選 db.Search：

- 一次性、不在乎效能 O(N)
- 條件包含 `@Contains` 走文字、又有結構化 `Type =`
- 不想為這次查詢建 FT index

### 場景 2：scheduled agent 處理新文件

「每 30 分鐘、把新進的 high-priority 訂單推到外部系統」

```lotusscript
' 走 db.Search + dateTime cursor、增量處理
Set docs = db.Search( _
    "Type = ""Order"" & Priority = ""High"" & Status = ""New""", _
    lastRunCursor, 0)
' ...如 Part 2 incremental agent 範例
```

為什麼選 db.Search：

- `dateTime` cursor 是天然的增量游標
- 每次跑只看增量、O(N_new) 不是 O(N_total)
- 條件結構化、formula 寫起來順

### 場景 3：高頻 REST API 後端

「客戶 portal 的搜尋頁、預期 1000+ req/min、要支援 keyword 跟 filter 組合」

```dql
@FTSearch('keyword') AND Status = 'Open' AND Total > 1000
```

為什麼選 DQL `@FTSearch` term：

- 高頻 → 不能 O(N) scan
- keyword 走 FT index 快、filter 走 NIF index 快
- 用一個 DQL query 表達完整、不用 two-step chain
- Domino REST API 後端原生就是 DQL

---

## 三條路線都不選的情境

有時候應該重新檢視「要不要 search」這個前提：

- **如果是固定 key 查單筆** — 用 `db.GetDocumentByUNID()` 或 `view.GetDocumentByKey()`、別 search
- **如果是 view 已經 sort / filter 好的列表** — 直接走 view navigator / view entry collection、`NotesViewNavigator` 那條更快（見 [NotesViewNavigator 文章](/domino-news/zh-TW/posts/notes-view-navigator)）
- **如果是要走 REST API、又不是 Domino REST API** — 上層 wrap 一層 cache 可能比每次都 search 更務實

Search 不是越用越好 — 每多一層 search 就是一次「掃 NoteID 集合」的成本。本系列三篇是「真的需要 search 時、怎麼選」的指南、不是「凡事都 search」的鼓勵。

---

## 系列結語

這套搜尋三部曲跟之前的 [DQL 三部曲](/domino-news/zh-TW/posts/dql-getting-started)放在一起、Domino 文件搜尋的 surface 就算完整覆蓋了：

| 系列 | 主題 |
|---|---|
| [Part 1: FTSearch](/domino-news/zh-TW/posts/lotusscript-ftsearch) | 文字索引的三層 API |
| [Part 2: db.Search](/domino-news/zh-TW/posts/lotusscript-db-search) | @Formula 暴力搜尋 |
| **Part 3: 三選一決策**（本篇）| 對比 + 決策樹 + DQL `@FTSearch` 整合 |
| [DQL 入門](/domino-news/zh-TW/posts/dql-getting-started) | SQL-like query 語法 |
| [DQL 踩雷](/domino-news/zh-TW/posts/dql-pitfalls) | 寫 query 時 6 個細節 |
| [DQL Production](/domino-news/zh-TW/posts/dql-production) | catalog / permissions / `sessionAsSigner` |

寫對的 search、效能差幾個數量級 — 選錯、就算優化 formula 也救不回來。本系列三篇加 DQL 三篇是把每條路的細節都攤開、實戰時依手上條件對表查就好。
