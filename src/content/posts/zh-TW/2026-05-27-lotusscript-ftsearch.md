---
title: "FTSearch：Domino 全文檢索的三層 API（NotesDatabase / NotesView / NotesDocumentCollection）"
description: "FTSearch 是 Domino 三個 class 都有的方法 — 三個層級回傳不同型別、語意各異。本文拆解 NotesDatabase.FTSearch（回傳 collection）、NotesView.FTSearch（in-place 過濾 view、回傳 Long）、NotesDocumentCollection.FTSearch（in-place 縮減 collection、無回傳）三者差異、sortopt 與 options 常數、query syntax operators 速查、CreateFTIndex 的 5 個 options bitmask、跟 `load updall -x` 的對應、沒建 index 時 method 還會跑（只是降速）、5000 doc 預設上限、wildcard `*` 只能放 term 結尾、operators 必須大寫等實戰陷阱。三部曲第一篇、後續會接 db.Search 跟三選一決策篇。"
pubDate: 2026-05-27T07:30:00+08:00
lang: zh-TW
slug: lotusscript-ftsearch
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "FTSearch method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html"
  - title: "FTSearch method (NotesView) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_VIEW.html"
  - title: "FTSearch method (NotesDocumentCollection) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html"
  - title: "CreateFTIndex method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEFTINDEX_METHOD_DB.html"
  - title: "Refining a search query using operators — HCL Domino"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/othr_refiningasearchqueryusingoperators_r.html"
relatedJava: ["Database", "View", "DocumentCollection"]
relatedSsjs: ["database", "view", "documentCollection"]
cover: "/covers/lotusscript-ftsearch.png"
coverStyle: "oil-chiaroscuro"
---

你手上的 NSF 裝了 50 萬份訂單、使用者在 portal 輸入「invoice」、希望把含這個字的文件列出來 — Domino 內建的解法是 **FTSearch**、文字全文索引的搜尋 method。

翻文件會發現 `FTSearch` 同時掛在三個 class 上：`NotesDatabase`、`NotesView`、`NotesDocumentCollection`。同樣的 method 名、三個 class 回傳卻不一樣 — 一個給你 collection、一個給 Long 計數、一個甚麼都不回傳。為什麼會這樣設計？該選哪一個？

這篇是 Domino 文件搜尋三部曲的第一篇、拆三層 API 的語意差異、query syntax operators、index 管理跟 `load updall -x` 的對應、跟一個會讓 code 在開發環境跑得好好的、production 上卻效能崩盤的陷阱。

---

## 重點摘要

- **FTSearch 是三個 class 都有的方法、但語意不一樣**：[`NotesDatabase.FTSearch`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html) 回傳新的 `NotesDocumentCollection`、[`NotesView.FTSearch`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_VIEW.html) **in-place 過濾 view 本身**回 Long、[`NotesDocumentCollection.FTSearch`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_COLLECTION.html) **in-place 縮減 collection** 無回傳
- **沒建 FT index 不會錯** — method 還會跑、官方文件直書「works, but less efficiently」、實務上會慢很多
- **max=0 不是「不限制」是「拿到 default 上限」** — 預設 5000 doc、要超過要改 notes.ini
- **Query syntax operators 必須大寫**（AND / OR / NOT）— 小寫會被當成搜尋詞、結果靜默失準
- **`*` wildcard 只能放在 term 結尾**、不能放開頭或中間
- **`CreateFTIndex` 只在 local DB 跑** — server 端要 `load updall -x` 由 admin 觸發
- **三層級對應三種使用情境**：DB-level 給原生「全庫搜」、View-level 給「在 view 上互動式 filter」、Collection-level 給「結構化條件 + 文字條件接力」

---

## 為什麼需要三層 API

Domino 文件搜尋有三種 entry point、不是設計多餘、是對應**三種來源**：

| 你手上有什麼 | 該用哪一個 | 為什麼 |
|---|---|---|
| 一個 `NotesDatabase` 物件、想全庫搜 | `db.FTSearch(...)` | 跑遍整庫、回傳新 collection |
| 一個 `NotesView` 物件、想在 UI 過濾 | `view.FTSearch(...)` | view 本身被 filter、後續 `GetFirstDocument` 就只看到符合的 |
| 一個 `NotesDocumentCollection`（前面用別的方法收到的）、想再做文字 filter | `collection.FTSearch(...)` | 把 collection 砍掉不符合的、保留剩下 |

三者背後共用同一個 full-text index（如果 DB 有建）、共用同一套 query syntax — 差別**只在輸入跟回傳的型別**。

---

## NotesDatabase.FTSearch — 全庫搜尋

完整 signature：

```lotusscript
Set ndc = db.FTSearch(query$, maxdocs%, [sortoptions%], [otheroptions%])
```

| 參數 | 型別 | 必填 | 意義 |
|---|---|---|---|
| `query$` | String | ✅ | full-text query 字串、可帶 operators / wildcards |
| `maxdocs%` | Integer | ✅ | 最多回幾筆。`0` = 拿到 default 上限（5000）|
| `sortoptions%` | Integer | optional | 排序方式、常數見下 |
| `otheroptions%` | Integer | optional | 額外 flag、加總組合 |

回傳：[`NotesDocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html)、官方原文「A collection of documents that match the full-text query, sorted by the selected option」。

### sortoptions 常數

| 常數 | 值 | 行為 |
|---|---:|---|
| `FT_SCORES` | 8 | 預設、依相關性分數排序 |
| `FT_DATE_ASC` | 64 | 依文件日期升冪 |
| `FT_DATE_DES` | 32 | 依文件日期降冪 |
| `FT_DATECREATED_ASC` | 1543 | 依建立日期升冪 |
| `FT_DATECREATED_DES` | 1542 | 依建立日期降冪 |

### otheroptions 常數（加總組合）

| 常數 | 值 | 行為 |
|---|---:|---|
| `FT_FUZZY` | 16384 | 模糊比對、容錯 |
| `FT_STEMS` | 512 | 詞幹搜尋（`running` 找到 `run` / `ran`）|
| `FT_THESAURUS` | 1024 | 同義詞展開 |
| `FT_DATABASE` | 8192 | 包含 Domino DB |
| `FT_FILESYSTEM` | 4096 | 包含非 DB 的檔案 |

實例 — 找含「invoice」的文件、依分數排序、最多 50 筆、開 stem 搜尋：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

Dim docs As NotesDocumentCollection
Set docs = db.FTSearch("invoice", 50, FT_SCORES, FT_STEMS)

Print "Found " & docs.Count & " documents"

Dim doc As NotesDocument
Set doc = docs.GetFirstDocument()
Do Until doc Is Nothing
    Print doc.GetItemValue("Subject")(0) & _
          "  (score: " & doc.FTSearchScore & ")"
    Set doc = docs.GetNextDocument(doc)
Loop
```

注意 `doc.FTSearchScore` — 每個 document 物件在 FTSearch 回來後都帶這個 property、是 0–100 整數、越高越相關。

---

## NotesView.FTSearch — in-place 過濾 view

```lotusscript
numDocs& = view.FTSearch(query$, maxDocs%)
```

跟 DB 版差最多的兩點：

1. **回傳 Long、不是 collection** — 拿到「過濾後剩幾筆」的計數
2. **View 物件本身被改了** — 之後對這個 view 呼叫 `GetFirstDocument` / `GetNextDocument` 只看得到符合的文件

要還原成完整 view、呼叫 [`view.Clear()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_VIEW.html)：

```lotusscript
Dim view As NotesView
Set view = db.GetView("(AllByCustomer)")

Dim n As Long
n = view.FTSearch("Acme AND status=open", 0)
Print "Matched " & n & " entries in view"

' 走訪過濾後的結果
Dim doc As NotesDocument
Set doc = view.GetFirstDocument()
Do Until doc Is Nothing
    Print "  " & doc.GetItemValue("CustomerName")(0)
    Set doc = view.GetNextDocument(doc)
Loop

' 用完還原 view
Call view.Clear()
```

**有 FT index 時**：結果依 relevance 降序排列。**沒有 index 時**：保留 view 原本的排序、只是過濾。

這個層級適合 UI 場景 — 譬如 user 在 view 上輸入關鍵字、view 即時 filter — 因為改的是 view 物件本身、不需要額外管理 collection。

---

## NotesDocumentCollection.FTSearch — 接力過濾

```lotusscript
Call collection.FTSearch(query$, maxDocs%)
```

回傳 void、collection 被**就地縮減**。官方文件：「reduces the collection to those documents that match」。

實用場景：先用 `db.Search()`（@Formula）收一批結構化條件符合的、再用 FTSearch 接力做文字過濾：

```lotusscript
' 第一步：用 formula 找所有 Type="Order" 而且 Total > 1000 的
Dim orders As NotesDocumentCollection
Set orders = db.Search( _
    "Type = ""Order"" & Total > 1000", _
    Nothing, 0)

' 第二步：在這批 orders 裡面、再找含 "rush" 字樣的
Call orders.FTSearch("rush", 0)

Print "Large rush orders: " & orders.Count
```

過濾後 collection 依 relevance 降序、`FTSearchScore` 一樣可以拿到。

⚠️ Collection-level 的 FTSearch **沒有 sortopt / options 參數** — 只能用 default 行為。要排序得自己處理或改走 DB-level。

---

## Query syntax 速查表

[Domino full-text query operators](https://help.hcl-software.com/domino/11.0.1/admin/othr_refiningasearchqueryusingoperators_r.html) 的官方文件、整理常用：

### 邏輯 operators（**必須大寫**）

| Operator | 寫法 | 意義 |
|---|---|---|
| `AND` | `invoice AND paid` | 兩個詞都要在 |
| `OR` | `invoice OR receipt` | 任一個在 |
| `NOT` | `invoice NOT cancelled` | 排除 |

小寫的 `and` / `or` 會被當成搜尋詞、結果靜默失準 — 寫 query 字串前永遠 `UCase()` 一下你的 operators。

### 欄位 scope

```
[FieldName] CONTAINS value
[FieldName] = value
[FieldName] IS PRESENT      ' 該欄位非空
[FieldName] > 100            ' 數值 / 日期比較
[Status] = "Open" AND [Total] > 500
```

`[_CreationDate]` / `[_RevisionDate]` 是內建 metadata pseudo-field。

### Wildcards

| 寫法 | 意義 | 限制 |
|---|---|---|
| `bench*` | benchmark / benchmarks / benchmarking | `*` **只能放 term 結尾**、不能放開頭或中間 |
| `b?nch` | bench / banch... | `?` 代表任一單一字元 |

### 鄰近 operators

```
documents PARAGRAPH revenue   ' 兩字必須在同一段
documents SENTENCE revenue    ' 兩字必須在同一句
```

### 精確片語 + 大小寫

```
"exact phrase here"        ' 雙引號內逐字比對
EXACTCASE Hello            ' 大小寫敏感
TERMWEIGHT 2 important     ' 加權搜尋（影響 score）
```

---

## FT Index 的建立與管理

### 檢查 DB 有沒有 index

```lotusscript
If Not db.IsFTIndexed Then
    Print "Warning: no FT index, search will be slow"
End If
```

[`IsFTIndexed`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ISFTINDEXED_PROPERTY.html) 是 read-only Boolean、DB 必須先 open 才能讀。

### 程式建 index（僅 local DB）

[`CreateFTIndex`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_CREATEFTINDEX_METHOD_DB.html) 的 options 是 bitmask、用加法組合：

| Flag | 值 | 意義 |
|---|---:|---|
| `FTINDEX_ATTACHED_FILES` | 1 | 索引附件純文字 |
| `FTINDEX_ENCRYPTED_FIELDS` | 2 | 索引加密欄位 |
| `FTINDEX_ALL_BREAKS` | 4 | 索引句子 / 段落斷點（給 PARAGRAPH / SENTENCE 用）|
| `FTINDEX_CASE_SENSITIVE` | 8 | 大小寫敏感 index（給 EXACTCASE 用）|
| `FTINDEX_ATTACHED_BIN_FILES` | 16 | 索引附件二進位（PDF / Office 等）|

```lotusscript
' 建一個會抓段落斷點 + 大小寫敏感的 index、若已存在先砍掉
Call db.CreateFTIndex( _
    FTINDEX_ALL_BREAKS + FTINDEX_CASE_SENSITIVE, _
    True)
```

⚠️ **此方法只在 local DB 跑**。Server 端的 DB 必須由 admin 透過 `load updall -x <dbname>` 或 DB property 介面建立。

### 更新 / 刪除

```lotusscript
' 更新 index（增量）
Call db.UpdateFTIndex(False)

' 沒 index 就建一個（local only）
Call db.UpdateFTIndex(True)

' 刪掉 index
Call db.RemoveFTIndex()
```

`UpdateFTIndex(True)` 跟 `CreateFTIndex` 的差別：前者**有 index 就更新、沒 index 才建**、後者強制建新的。Production 增量場景用前者。

### Index 自動更新頻率

`db.FTIndexFrequency` 屬性控制 server 端自動 update 的頻率、常數對應 DB property dialog 裡的選項（Immediate / Hourly / Daily / Scheduled）。

---

## 三個常踩的坑

### 1. 沒 index、method 不會抱怨

最容易誤判的 bug — 寫了 FTSearch、跑起來「能用」、但生產上慢得讓 server 崩。原因是 [Domino 官方文件](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html)直接寫：「If the database is not full-text indexed, this method works, but less efficiently」。

對策：production code 永遠先檢查：

```lotusscript
If Not db.IsFTIndexed Then
    ' 兩條路選一：
    ' (a) 嘗試自己建（local only、production 通常不適用）
    ' (b) raise error 給 admin、不要悄悄變慢
    Error 1001, "DB " & db.FilePath & " has no FT index — performance will degrade"
End If
```

### 2. `max=0` 不是「不限」

很多人以為 `db.FTSearch(query, 0)` 是「拿全部結果」、結果**只拿到 5000 筆**。官方上限預設 5000、要超過要改 `notes.ini` 的 `FT_MAX_SEARCH_RESULTS`。

對策：production 處理大結果集、要分批跑（用 sortopt 排序 + 條件分段）、或乾脆改走 DQL（容量沒這個上限、見續篇）。

### 3. View.FTSearch 改了 view 沒還原

```lotusscript
' ❌ 錯：view 物件用完沒清、下次別人開這個 view 還是被過濾狀態
Call view.FTSearch("urgent", 0)
' ...處理結果...
' 結束、view 物件被 GC

' ✅ 對：用完明確清掉
Call view.FTSearch("urgent", 0)
' ...處理結果...
Call view.Clear()
```

Server-side agent 通常無所謂（view 物件 scope 內就 GC 了）、但 XPages / classic web app 重用 view 物件的場景要小心、否則使用者看到的會是上次 search 的殘留結果。

---

## 跟其他搜尋機制的關係

FTSearch 不是 Domino 唯一的搜尋機制 — 是「文字索引」這條路線。本系列**續篇 [`db.Search`](/domino-news/zh-TW/posts/lotusscript-db-search)** 會講 formula-based search（不需要 index、走暴力掃描）、第三篇會把 FTSearch / db.Search / DQL 三個機制放在一起比較適用情境、跟 [DQL 三部曲](/domino-news/zh-TW/posts/dql-getting-started)做交叉連結。

Domino 14 之後 DQL 也整合了 `@FTSearch()` term、可以把全文檢索直接寫進 DQL query — 這個關係在第三篇深入。

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesDatabase.FTSearch` / `NotesView.FTSearch` / `NotesDocumentCollection.FTSearch` |
| Java | `lotus.domino.Database.FTSearch()` / `View.FTSearch()` / `DocumentCollection.FTSearch()`（命名去掉 `Notes` 前綴、用完要 `.recycle()`）|
| SSJS | `database.FTSearch(...)` / `view.FTSearch(...)` / `documentCollection.FTSearch(...)`（XPages 內可直接呼叫、回傳 wrapper 物件）|

跨語言 API surface 一致 — query syntax 三者共用、sortopt / options 常數值相同（只是命名空間在 Java 是 `Database.FT_SCORES` 等）。
