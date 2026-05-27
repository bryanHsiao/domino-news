---
title: "db.Search：用 @Formula 暴力搜尋 — 不需要 index 的那條路"
description: "NotesDatabase.Search 是 LotusScript 第二種搜尋機制 — 不靠 full-text index、靠 @Formula 在每一份文件上跑判斷式。本文拆解三個參數（formula / dateTime / maxDocs）跟 FTSearch 不一樣的語意、為什麼回傳 unsorted collection、dateTime 怎麼當作增量處理的 cursor、maxDocs=0 是真的「不限」（不像 FTSearch 預設 5000 上限）、formula 裡哪些 @function 不能用（UI 互動類 / lookup 類）、Stamp 改完 collection 不會 refresh 的陷阱、跟 production-ready 增量 agent 範例。三部曲第二篇、續篇會把這個跟 FTSearch / DQL 三選一比較。"
pubDate: 2026-05-28T07:30:00+08:00
lang: zh-TW
slug: lotusscript-db-search
tags:
  - "LotusScript"
  - "Tutorial"
sources:
  - title: "Search method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SEARCH_METHOD.html"
  - title: "NotesDatabase class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS.html"
  - title: "Collecting documents by searching — HCL Domino Designer"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COLLECTING_DOCUMENTS_BY_SEARCHING.html"
  - title: "FTSearch method (NotesDatabase) — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_FTSEARCH_METHOD_DB.html"
relatedJava: ["Database"]
relatedSsjs: ["database"]
---

你想找這個 DB 裡「所有 `Type = "Order"` 而且 `Total > 1000` 的訂單」。條件結構化、跟「文字搜尋」沒太大關係。能用 [Part 1 講的 FTSearch](/domino-news/zh-TW/posts/lotusscript-ftsearch) 嗎？技術上可以、但條件寫成 FT query 既不直觀、又得依賴 admin 端建好 FT index。

LotusScript 給的第二條路是 `NotesDatabase.Search` — 直接寫 `@Formula` 條件、Domino 對每份文件 evaluate 一次、回傳符合的。沒索引依賴、沒 5000 上限、語法跟你寫 view selection formula 同一套。代價是 O(N) 全表掃描 — 對小 / 中型庫無妨、對百萬文件級的就要重新評估。

這篇是搜尋三部曲第二篇、拆三個參數的真實語意（特別是跟 FTSearch 看起來像、其實完全不同的那幾個）、formula 裡哪些 @function 不能用、Stamp 改完文件 collection 不會 refresh 的陷阱、跟 production-ready 增量處理 agent 範例。

---

## 重點摘要

- [**`db.Search(formula$, dateTime, maxDocs%)`**](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SEARCH_METHOD.html) 是 LotusScript 用 @Formula 對每份文件跑判斷式的搜尋 — **不需要 full-text index**、走文件逐筆掃描
- 官方明示「the search query is a formula」、跟 [FTSearch](/domino-news/zh-TW/posts/lotusscript-ftsearch) 的 query 字串完全是兩套語言
- **`maxDocs=0` 是真的「全部」** — 不像 FTSearch 0 = default cap (5000)、Search 0 真的無上限
- **回傳 unsorted `NotesDocumentCollection`** — 沒有 sortopt / options 參數、要排序自己處理
- **`dateTime` 是「只看這時間之後修改過的文件」** — 增量處理場景的天然 cursor、傳 `Nothing` 等同看全庫
- **Formula 是 @Formula language 的子集** — UI 互動類（`@Prompt` / `@Picklist` / `@DbColumn` 等）不能用、邏輯運算 / 字串操作 / 日期算術 OK
- **Stamp / Save 改完內容、原 collection 不會 refresh** — 是 snapshot、不是 live view
- **效能特性**：O(N) 文件數、適合條件選擇性高的小型 / 中型 DB；大表 + 高頻率查詢請改 [DQL](/domino-news/zh-TW/posts/dql-getting-started)

---

## 為什麼還需要 db.Search

[Part 1 FTSearch](/domino-news/zh-TW/posts/lotusscript-ftsearch) 講了文字索引的高效路徑。但 FTSearch 有兩個前提：

1. **要建 full-text index** — server 端要 admin 配合、disk 要空間
2. **Query 是文字導向** — 你想搜「Status = 'Open' AND Total > 1000」這種結構化條件、用 FT operators 寫得彆扭

db.Search 走另一條路：直接在 [`@Formula` language](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COLLECTING_DOCUMENTS_BY_SEARCHING.html)裡寫條件、Domino 對每一份文件 evaluate 一次、留下 result = `True` 的。

代價是 — **scan 整庫每份文件**、效能正比於文件總數。但對於：

- 一次性 / 低頻 ad-hoc 查詢
- 結構化條件多、文字條件少（或沒有）
- 沒辦法建 FT index（local 開發環境、admin 不配合等）
- 小型 / 中型 DB（幾千到幾萬份文件）

— db.Search 反而是最直接的工具。

---

## Signature 拆解

[`db.Search`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_SEARCH_METHOD.html) 三個參數、跟 FTSearch 看起來像、語意完全不同：

```lotusscript
Set ndc = db.Search(formula$, notesDateTime, maxDocs%)
```

| 參數 | 型別 | 必填 | 跟 FTSearch 的對比 |
|---|---|---|---|
| `formula$` | String | ✅ | FTSearch 是 FT query；這裡是 **@Formula** |
| `notesDateTime` | NotesDateTime | ✅ | FTSearch 沒這參數；這裡是「只看這時間之後修改的」cursor |
| `maxDocs%` | Integer | ✅ | FTSearch 0 = default cap 5000；**Search 0 = 真的全部** |

回傳：**unsorted [`NotesDocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDOCUMENTCOLLECTION_CLASS.html)**。注意沒 sortopt — 想排序自己 `GetNthDocument` 走訪 + 自建 array sort、或寫 view。

### `notesDateTime` 的角色

跟一般想像不同 — 這不是「文件 pubDate 過濾」、是「文件 last modified time 過濾」：

```lotusscript
Dim session As New NotesSession
Dim db As NotesDatabase
Set db = session.CurrentDatabase

' 場景 A：看全庫
Set docs = db.Search("Type = ""Order""", Nothing, 0)

' 場景 B：只看「今天凌晨之後新增 / 修改過」的
Dim midnight As New NotesDateTime("")
Call midnight.SetNow()
Call midnight.AdjustHour(-24)  ' 24 小時前
Set newDocs = db.Search("Type = ""Order""", midnight, 0)
```

`Nothing` = 不做時間過濾。

**這個 cursor 是 production 增量處理的關鍵** — agent 每次跑、記下這次的 server time、下次只看那之後改過的。比 scheduled agent 每次掃全庫快幾個數量級。

### `maxDocs%` 的真語意

```lotusscript
' 真正拿全部
Set all = db.Search("Type = ""Order""", Nothing, 0)

' 拿前 100 份
Set top100 = db.Search("Type = ""Order""", Nothing, 100)
```

跟 FTSearch 的 `maxDocs=0` 不一樣 — FTSearch 0 = 「default cap 5000」、Search 0 = 「無上限」。這個容易記反、production code 寫清楚比較安全。

---

## Formula 能寫什麼、不能寫什麼

`formula$` 是 [@Formula language](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COLLECTING_DOCUMENTS_BY_SEARCHING.html) 的子集、不是完整版本 — 最後一個 expression 的值決定文件是否入選。

**可以用**：

```lotusscript
' 欄位值比較
db.Search("Status = ""Open""", Nothing, 0)
db.Search("Total > 1000 & Total < 5000", Nothing, 0)
db.Search("Form = ""Invoice"" | Form = ""Receipt""", Nothing, 0)

' 文件 metadata
db.Search("@IsAvailable(Approver)", Nothing, 0)        ' 該欄位存在
db.Search("@Modified > [05/01/2026]", Nothing, 0)      ' 修改時間
db.Search("@Created < [01/01/2025]", Nothing, 0)       ' 建立時間

' 字串操作
db.Search("@Contains(Subject; ""urgent"")", Nothing, 0)
db.Search("@Begins(CustomerName; ""ACM"")", Nothing, 0)
db.Search("@LowerCase(Status) = ""open""", Nothing, 0)

' 日期算術
db.Search("@Adjust(Created; 0; 0; 30; 0; 0; 0) < @Now", Nothing, 0)  ' 30 天以上

' 布林邏輯
db.Search("Type = ""Order"" & (Status = ""Open"" | Priority = ""High"")", _
          Nothing, 0)
```

**不能用** — 任何需要 UI 或外部 lookup 的 @function：

| 類型 | 例子 | 為什麼不行 |
|---|---|---|
| UI 互動 | `@Prompt`、`@Picklist`、`@DialogBox` | Search 在 server / agent context、沒有 UI |
| Lookup | `@DbLookup`、`@DbColumn`、`@GetDocField` | 會引發 side-effect、Search 的 evaluation context 不支援 |
| Environment 寫入 | `@SetEnvironment`、`@Environment` | 副作用、無法保證每份文件 evaluate 順序 |
| 寫入類 | `@SetField`、`@Command` | Search 是 read-only context |

實務上：先用 `@Modified` / `@Created` / 欄位比對 + `@Contains` 組合通常就夠了。需要 lookup 的場景、先用 Search 篩出第一輪、再在 LotusScript 裡走訪做 lookup。

---

## 回傳的 collection 是 snapshot — 不是 live view

最常踩的坑：拿到 collection、`StampAll` 改完所有文件、然後想「再走訪一次看新值」結果還是舊的：

```lotusscript
' ❌ 錯：以為改完 collection 會 reflect 新值
Set docs = db.Search("Status = ""Pending""", Nothing, 0)
Call docs.StampAll("Status", "Processed")

' 此時所有文件 Status 已經是 "Processed"
' 但這 collection 本身、走訪起來 docs.Count 還是原本那麼多
' GetItemValue 拿到的也是 stamp 後的新值

' 但若再執行同樣 search：
Set newDocs = db.Search("Status = ""Pending""", Nothing, 0)
Print newDocs.Count  ' = 0（剛剛改完、沒有 Pending 了）
```

要點：collection 是 **search 當下的 NoteID 列表 snapshot**、不是條件 query。Stamp 改完文件、collection 還持有同樣的 NoteID、但這些 NoteID 已經不符合原條件 — 重 search 才能拿到「現在符合的」。

對應陷阱 — 走訪過程中修改文件：

```lotusscript
' ❌ 危險：邊走邊改、可能跳過 / 重複處理
Dim doc As NotesDocument
Set doc = docs.GetFirstDocument()
Do Until doc Is Nothing
    doc.Status = "Processed"
    Call doc.Save(True, False)
    Set doc = docs.GetNextDocument(doc)  ' 後面可能拿到剛改過的
Loop
```

雖然這個 pattern 在實務上「通常」會跑完、但官方沒保證。安全做法是先把所有 NoteID 抓進 array、再走訪 array：

```lotusscript
' ✅ 安全：先 freeze NoteID list
Dim noteIds() As String
ReDim noteIds(docs.Count - 1)
Dim doc As NotesDocument
Set doc = docs.GetFirstDocument()
Dim i As Integer
i = 0
Do Until doc Is Nothing
    noteIds(i) = doc.NoteID
    i = i + 1
    Set doc = docs.GetNextDocument(doc)
Loop

' 走 array、不走 collection
For i = 0 To UBound(noteIds)
    Set doc = db.GetDocumentByID(noteIds(i))
    doc.Status = "Processed"
    Call doc.Save(True, False)
Next
```

---

## 實戰：增量處理 agent

把 `dateTime` cursor 跟 profile document 結合、做出每次只看新文件的 scheduled agent：

```lotusscript
Sub Initialize
    Dim session As New NotesSession
    Dim db As NotesDatabase
    Set db = session.CurrentDatabase

    ' 1. 從 profile document 讀上次處理到的時間
    Dim profile As NotesDocument
    Set profile = db.GetProfileDocument("IncrementalCursor")

    Dim cursor As NotesDateTime
    If profile.HasItem("LastRun") Then
        Set cursor = profile.GetFirstItem("LastRun").DateTimeValue
    Else
        ' 第一次跑、看 7 天內的
        Set cursor = session.CreateDateTime("")
        Call cursor.SetNow()
        Call cursor.AdjustDay(-7)
    End If

    Print "Looking for new Orders since " & cursor.LocalTime

    ' 2. 記下本次 run 開始時刻（給下次當 cursor、避免漏掉這次跑期間新增的）
    Dim runStart As New NotesDateTime("")
    Call runStart.SetNow()

    ' 3. Search 增量結果
    Dim docs As NotesDocumentCollection
    Set docs = db.Search("Type = ""Order"" & Status = ""New""", cursor, 0)

    Print "Found " & docs.Count & " new orders to process"

    ' 4. 處理（用 NoteID array 模式避免 walk-and-mutate 風險）
    Dim noteIds() As String
    If docs.Count > 0 Then
        ReDim noteIds(docs.Count - 1)
        Dim doc As NotesDocument
        Set doc = docs.GetFirstDocument()
        Dim i As Integer
        i = 0
        Do Until doc Is Nothing
            noteIds(i) = doc.NoteID
            i = i + 1
            Set doc = docs.GetNextDocument(doc)
        Loop

        For i = 0 To UBound(noteIds)
            Set doc = db.GetDocumentByID(noteIds(i))
            ' ...實際處理邏輯...
            doc.ReplaceItemValue "Status", "Processed"
            Call doc.Save(True, False)
        Next
    End If

    ' 5. 把這次 run 時刻寫回 profile、下次當 cursor
    Call profile.ReplaceItemValue("LastRun", runStart)
    Call profile.Save(True, False)
End Sub
```

關鍵設計 — 把 cursor 在 **search 開始前**就 freeze、不是用 `@Now`。否則 search 跑期間新增的文件會落在 cursor 之後、下次又被抓到（重複處理）或永遠不被抓到（漏處理）、依時間競態而定。

---

## 跟 FTSearch / DQL 的關係

`db.Search` 跟前一篇 [`FTSearch`](/domino-news/zh-TW/posts/lotusscript-ftsearch) 兩種搜尋並非互斥 — 實務上常組合：

```lotusscript
' 先用 Search 篩結構化條件、再用 FTSearch 過文字
Set docs = db.Search("Type = ""Order"" & Total > 1000", Nothing, 0)
Call docs.FTSearch("urgent", 0)  ' 在這批 orders 裡再找含 urgent 的
```

這個 chain 模式利用了：

- `db.Search` 不需 FT index、可以對「沒索引的欄位」做精準條件過濾
- `collection.FTSearch` 直接縮減原 collection、第二層文字過濾不浪費 index lookup 跑全庫

**Domino 14 後**還多了 [DQL](/domino-news/zh-TW/posts/dql-getting-started) — 結構化查詢的第三條路、效能優於 Search、語法跟 SQL 接近。Domino 14 同時把 FTSearch 整合進 DQL — 用 [`@FTSearch()` term](https://help.hcl-software.com/dom_designer/14.5.0/basic/dql_fulltextsearch.html) 可以把文字檢索條件寫進 DQL query 裡。三選一何時用誰、續篇詳述。

---

## 同類別在其他語言

| 語言 | 對應 |
|---|---|
| LotusScript | `NotesDatabase.Search(formula$, dateTime, max%)` |
| Java | `lotus.domino.Database.search(formula, since, max)`（命名 lowercase、用完要 `.recycle()`）|
| SSJS | `database.search(formula, since, max)`（XPages 內可直接呼叫）|

語意三者一致 — formula 用同一套 @Formula、回傳 unsorted collection。Java side 額外提供 `search(formula)` 跟 `search(formula, since)` overloads、不傳的參數視為「不限制」。
