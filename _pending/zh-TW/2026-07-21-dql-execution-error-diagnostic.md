---
title: "DQL 跳「Domino Query 執行時錯誤」怎麼辦：三層診斷階梯"
description: "一個 DQL 查詢失敗，你看到「Domino Query 執行時錯誤:」後面接一大串文字。一篇讀懂這個訊息的實測報告：你在 Err 裡找到的 4854 對診斷毫無用處（每個 DQL 失敗都回它），答案永遠在「詳細原因」那一行。涵蓋四段訊息結構、三層階梯（catalog / view 沒建 / partial TIMEDATE）、讓查詢時好時壞的 design catalog 半殘、以及「0 筆且無錯誤」的排查清單。"
pubDate: 2026-07-21T07:30:00+08:00
lang: zh-TW
slug: dql-execution-error-diagnostic
tags:
  - "DQL"
  - "Tutorial"
sources:
  - title: "DQL design catalog — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_design_catalog.html"
  - title: "DQL view column lookups — HCL Domino 14.5 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_view_column.html"
  - title: "實測報告：DQL 執行時錯誤診斷階梯（domino-dev-kb）"
    url: "https://bryanhsiao.github.io/domino-dev-kb/cases/2026-07-16-dql-4854-diagnostic-ladder/"
relatedJava: ["DominoQuery"]
relatedSsjs: ["DominoQuery"]
---

你的 DQL 查詢失敗，畫面顯示 `Domino Query 執行時錯誤:` 後面拖著好幾行文字。你會很想抓那個錯誤數字去搜。別：你在 LotusScript 的 `Err` 裡找到的 `4854` 是這裡*最*沒用的東西。這是一篇關於「用它真正想被讀的方式去讀這個訊息」的實測報告——而簡短版是：整個診斷住在某一行特定的文字裡、不在錯誤碼裡。（環境：Domino 12.0.2，一個 412 份文件的測試資料庫；可重跑素材——5 個 view 與 4 個 agent——在[知識庫案例](https://bryanhsiao.github.io/domino-dev-kb/cases/2026-07-16-dql-4854-diagnostic-ladder/)裡。）

---

## 重點摘要

- **那個數字是死路。** *每一個* DQL 執行失敗都回 `Err = 4854`（`lsERR_NOTES_DQUERY_EXECUTION`）——語法錯誤、空查詢、view 不存在，全部都是。常數 `4852`/`4853`/`4855`/`4856` 存在但實務上用不到。**從訊息文字（`Error$`）診斷、永遠不要看數字。**
- 訊息有**四段**：`Domino Query 執行時錯誤:` 前綴、① 一行引擎分類、② 一行詳細原因（這才是重點）、③ 你的查詢回顯、④ 一個 Call hint。
- 第 ② 行上的**三層階梯**：`...needs to be cataloged via updall -e`（缺 catalog *或* view/直欄名打錯——先檢查拼字）→ `View never built [x]`（view 的 index 從沒建過；DQL 不代建）→ `Partial TIMEDATEs NOT supported...`（只給日期的 `@dt`）。
- **時好時壞（「有時會動」）**常是一個半殘的 design catalog——view 設計變更後，`updall -d` 可能失敗、把 catalog 留在不一致狀態，於是有的 view 報錯、有的默默回 0。用 `updall -e` 重建。
- 你的 error handler **必須印出完整的 `Error$`**——數字什麼都沒告訴你。

## 讀訊息、不是讀數字

最重要的一個重現發現：在 LotusScript 裡，DQL 失敗*一律*以 `Err = 4854` 浮現。我們什麼都丟給它——語法錯誤（`... and and ...`）、一個空查詢字串、一個不存在的 view——每一個都回 `4854`。這個常數是 `lsERR_NOTES_DQUERY_EXECUTION`，定義在 `lsxbeerr.lss`；它的手足 `4852`/`4853`/`4855`/`4856` 也有定義，但實務上你永遠看不到它們。所以那個數字*什麼都沒分類*。不管出了什麼錯，描述都在文字裡：

```lotusscript
On Error GoTo errh
' ... 跑 DQL 查詢 ...
Exit Sub
errh:
  Print "DQL failed: " & Error$      ' 整段文字——這是你的診斷
  Print "  (Err = " & Err & ")"      ' 永遠是 4854；忽略它
End Sub
```

漏了 `Error$`，你就把唯一有用的資訊丟掉了。

## 四段

這個訊息是有結構的。照順序讀它，會告訴你去哪裡看：

1. **前綴**——`Domino Query 執行時錯誤:`。只是外殼。
2. **① 引擎分類**——一個寬泛的類別，例如 `Query is not understandable`（語法）或 `Error validating view column name`。
3. **② 詳細原因**——*診斷關鍵。* 這是你要據以行動的那一行。
4. **③ 查詢回顯**——你的查詢文字被播回來。語法錯誤時，它後面接一行插入符號指標 `.....^.....`，標出確切的錯誤字元。
5. **④ Call hint**——它失敗的內部 API 點。

語法錯誤時，① 加上 ③ 的插入符號行定位到那個字元。其他一切，② 就是全部故事。

## 三層階梯（第 ② 行）

把「詳細原因」那一行由上而下對照這些：

| 第 ② 行說 | 成因 | 修法 |
|---|---|---|
| `invalid view name or database needs to be cataloged via updall -e` | 缺 design catalog **或** view/直欄名打錯 | **先檢查拼字**，然後 `load updall <db> -e` |
| `View never built [viewName] - query term will fail, aborting` | view 的 index 從沒建過（設計了卻沒開過）；DQL **不**代建 view index | 把 view 開一次，或 `load updall <db> -t <view>` |
| `Partial TIMEDATEs NOT supported with view column lookup, specify a full TIMEDATE` | view 直欄詞裡用了只給日期的 `@dt()` | 傳完整 timestamp，例如 `@dt('2024-01-01T00:00:00+08:00')`（見[日期直欄篇](/domino-news/zh-TW/posts/dql-view-date-column)）|

第一層那個雙重意義是陷阱：*同一句訊息*，不管是 catalog 真的缺、還是你只是打錯 [view 或直欄名](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_view_column.html)，都會出現。跑 `updall` 之前先檢查名字。至於 [design catalog](https://help.hcl-software.com/dom_designer/14.5.1/basic/dql_design_catalog.html) 本身，文件對它為什麼存在講得很清楚——「為了高速存取 view 與 view 直欄的內部資訊，DQL 處理使用一個 design catalog，裡面包含從 view note 擷取的設計資料」——以及沒有它會怎樣：「其他語法仍會運作，但不會有 view 存取、所有詞都會用 NSF 掃描來滿足」。你用 `load updall <db> -e` 建它、在設計變更後用 `load updall <db> -d` 更新它。

## 當它「有時會動」：半殘的 catalog

時好時壞的版本最讓人困惑，而實測報告釘出了常見的元兇。design catalog 是**存在 NSF 內的持久 state**（機制在 [DQL 正式環境筆記](/domino-news/zh-TW/posts/dql-production)裡）。當你同步了 view 設計變更，一個 `updall -d` 刷新可能*失敗*——實測裡它丟了 `DesignCatalog::LoadColumnData ... Named Object corrupt`——把 catalog 留在半殘狀態。那個半殘狀態的症狀正是「有時會動」：**有的 view 報錯、有的默默回 0 筆文件**，沒有一致性。修復是一次完整的 `updall -e` 重建（那個損毀會跨伺服器重啟持續存在，所以重啟沒用）。

在程式裡，用 refresh/rebuild 模式勝過手動 SOP——跟正式環境筆記用的同一套：

```lotusscript
' catalog 是最新時很便宜：
query.RefreshDesignCatalog = True
' ... 跑查詢 ...
' 如果它以 "needs to be cataloged via updall -e" 失敗，用力重試：
query.RebuildDesignCatalog = True
' ... 重跑 ...
```

一個限制：`RefreshDesignCatalog` 沒辦法在一個全新的 NSF 裡把還不存在的 catalog 生出來——第一次建立需要 `RebuildDesignCatalog`（或 `updall -e`）。

## 「0 筆且無錯誤」：五步排查

*沒有*訊息的失敗模式是它自己的問題——查詢跑得乾淨、卻什麼都沒回。照順序走：

1. **資料到底存在嗎？** 跑一個不碰 view 的對照查詢（或一個純搜尋），確認符合的文件真的在那裡。
2. **view index 新嗎？** 在查詢上設 `RefreshViews = True`，這樣過期的 index 不會把新文件藏起來。
3. **catalog 過期或半殘嗎？** 見上一節——這是「有時會動」的成因。
4. **是選取公式把它們篩掉了嗎？** 如果 view 的選取不是 `@All`，被排除的文件不在 view 裡可找（[@All 踩坑篇](/domino-news/zh-TW/posts/dql-pitfalls)講這個）。
5. **是型別或時區不符嗎？** 錯的查詢詞型別、或漏帶 `+08:00` 的 `@dt`，會無聲回 0（或錯的列）——整個是[日期直欄篇](/domino-news/zh-TW/posts/dql-view-date-column)的主題。

## 判讀 Explain 輸出

當你需要知道一個查詢*為什麼*慢、或哪個節點中了什麼，`Explain`（或帶 explain 的 `RunQuery`）會印出一個計畫。值得認識的欄位：

- **`ScannedDocs`**——`0` 代表查詢純走 index（沒有全資料庫掃描）；高值是你的效能紅旗。
- **`Entries` / `FoundDocs`**——一個節點檢視的 index entry 數、以及在那裡中的文件數。
- **`estimated cost`**——最佳化器驅動執行順序的成本*估計*；它是估計、不是量測的時間（`Prep`/`Exec` 毫秒才是真正的牆上時間）。
- 一個 `@dt('...+08:00')` 詞在計畫裡會顯示成正規化到 UTC（例如 `2023-12-31T16:00:00Z`）——那是正常、不是 bug。

## 同類別在其他語言

| 語言 | DQL 進入點 |
|---|---|
| LotusScript | `NotesDominoQuery`（失敗時 `Err = 4854`）|
| Java | `lotus.domino.DominoQuery`（失敗丟 `NotesException`）|
| SSJS / XPages | 透過 Java 後端的 `DominoQuery` |

引擎與它的訊息在各語言都相同——四段文字、三層階梯、catalog 行為全是引擎層級的。唯一的差別是包裝：LotusScript 把每個失敗壓平成 `Err = 4854`（所以你讀 `Error$`），而 Java 浮現一個 `NotesException`、它的訊息帶著同樣的「詳細原因」那一行。無論哪種情況，診斷都在文字裡。
