---
title: "DQL 踩雷集：寫 query 時 6 個官方文件不會明說的細節"
description: "Domino Query Language（DQL）的語法表面像 SQL，但實戰起來有一整套 Notes 特有的踩雷點 —— view selection 會默默限縮結果範圍、`'view'.column` 的 column 不是文件欄位名而是直欄程式名稱、比較運算子兩邊要空白、view 名稱含反斜線要 escape、`@formula` 內是獨立的 Formula Language parser、字串日期欄位要 `@TextToTime`。本篇用實測錯誤訊息對照逐個說明。"
pubDate: 2026-05-01T08:30:00+08:00
lang: zh-TW
slug: dql-pitfalls
tags:
  - "DQL"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "View column requirements — HCL Domino 12.0.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_view_column.html"
  - title: "DQL syntax reference — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_syntax.html"
  - title: "Formula Language in DQL — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html"
cover: "/covers/dql-pitfalls.png"
coverStyle: "collage"
---

> 📚 **「DQL 三部曲」系列**
> - **Part 1**：[DQL 實戰指南：類 SQL 語法表面熟悉，Notes 慣例遍地是雷](/domino-news/zh-TW/posts/dql-getting-started)
> - **Part 2**：DQL 踩雷集（你在這裡）
> - **Part 3**：[DQL Production-Ready：Catalog 維運、權限、與 sessionAsSigner](/domino-news/zh-TW/posts/dql-production)

寫過幾個 DQL 查詢之後，你會發現「類 SQL 語法」這個賣點是真的很表面 —— 底下是 Notes 引擎，自帶一整套**官方文件不會明說、SQL 直覺也救不了**的細節。

本文整理 6 個從實戰累積出來的踩雷案例，每個都附**真實錯誤訊息原文**跟可用的解法。建議寫 DQL 之前先掃過一遍，省你 debug 半天的時間。

如果你還沒看過基本語法跟怎麼從程式呼叫，先看 [Part 1 DQL 入門](/domino-news/zh-TW/posts/dql-getting-started)；如果你要把 DQL 上 production 處理 catalog 跟權限問題，請看 [Part 3 Production-Ready](/domino-news/zh-TW/posts/dql-production)。

## 用 view 做基底時：view selection 會限縮結果範圍

HCL 官方 [View column requirements](https://help.hcl-software.com/dom_designer/12.0.0/basic/dql_view_column.html) 對 `'view'.column` 語法的要求是：view 必須使用 `Select @All`。

實際上如果 view selection 不是 @All 會怎樣？我們在 Domino 12 上實測 ——

view `Vtest` 的 selection（很常見的 Notes 寫法，不是 `Select @All`）：

```text
SELECT Form="Ftest" & deleteFlag !="1"
```

DB 裡建 3 筆 doc：

| Doc | 欄位 | 是否在 view 內 |
|---|---|---|
| A | `Form="Ftest"`, `deleteFlag=""` | ✅ |
| B | `Form="Ftest"`, `deleteFlag="1"` | ❌ |
| C | `Form="Other"` | ❌ |

跑兩個查詢：

| 查詢 | 全 DB 語意上應回傳 | 實測 Count |
|---|---|---|
| `'Vtest'.Form = 'Ftest'` | A + B = 2 | **1**（只含 A） |
| `'Vtest'.Form = 'Other'` | C = 1 | **0** |

**結論**：runtime 不會擋下「view 不是 Select @All」的查詢，沒有錯誤訊息 —— 但 **DQL 會以該 view selection 篩出來的 doc 為範圍**做查詢。被 selection 排除的 doc 不會出現在結果裡。

### 為什麼

DQL 在底層**直接使用 Notes view 既有的 column index**，而 view 的 column index 從建立的那一刻就只包含符合 selection 的 doc。所以「結果以 view selection 為範圍」是底層 Notes 架構的必然 —— HCL 選擇複用既有 view index（拿到 Notes 引擎現成的速度），代價是繼承 view selection 的範圍。

官方文件那句「require Select @All」實際上比較像「強烈建議」—— 確保 view 涵蓋整個 DB，column index 的語意才乾淨。

### 實務做法

- **view 設計可控**：把 selection 改成 `Select @All`，符合官方建議
- **view 設計不可控**（例如 view 是別人寫的、不能改）：改用 `in ('viewname') and field = value` 語法，這個語法不受 view selection 限制（代價是查詢規劃器可能退化成全表掃）
- **完全不想動**：裸欄位 `field = value`，讓 DQL 自己找有 collated 欄位的 view 來用

或更乾淨的長期解法：為 DQL 查詢另外建立**專屬 index view**（命名用 `dql` 前綴或放進 `($DQL)` 類別），selection 寫 `Select @All`，跟給 UI 看的 view 分開。這樣 `'dqlVtest'.Form = 'Ftest'` 就能既快速又語意乾淨。

### 順便：欄位 collation 是另一條規則

除了 selection 之外，引用的欄位必須是 **collated**（任一條件成立即可）：

- View 的最左欄勾了「Sort order: Ascending」
- 該欄位本身勾了「Click on column header to sort: Ascending」

這條規則 DQL 會強制 —— 欄位不是 collated 會直接噴錯，不像 selection 是默默限縮範圍。

## `'view'.column` 的 column 指的是直欄程式名稱，不是文件欄位名

這個是踩雷頻率很高的概念誤解。`'vwMyJob'.wdocAuthor` 看起來像「在 vwMyJob 這個 view 裡查 `wdocAuthor` 欄位」—— 但 DQL 實際上**不是**用文件欄位名稱去找，而是用 **view 直欄的「程式設計時使用 → 名稱」**。

兩者很多時候**剛好同名**，你會以為是查欄位 —— 但下面任一情況就會直接噴錯：

1. **直欄是 Designer 自動產生的名稱**（像 `$55`、`$3`）—— 你建直欄時沒手動設名稱，Designer 會自動編號
2. **直欄是公式而不是單純顯示某個欄位**，例如 `WDocAuthor:WDocAuthorAgent` 把兩個欄位串起來
3. **直欄程式名稱跟欄位名故意取不一樣**

實際錯誤訊息（直欄 `簽核者` 在 Designer 裡程式名稱是 `$55`，公式是 `WDocAuthor:WDocAuthorAgent`，被誤用 `'vwMyJob'.wdocAuthor` 查詢）：

```text
Domino Query execution error:
Entry not found in index -  驗證錯誤

Error validating view column name - ['vwMyJob'.wdocAuthor]
 ..  incorrect column name or no valid sorted column (bad position, collation or categorized)

'vwMyJob'.wdocAuthor = 'CN=user01/O=TheNet'

(Call hint: NSFCalls::NSFItemInfo, Core call #0)
```

「incorrect column name」就是 DQL 在說「我在 `vwMyJob` 找不到叫 `wdocAuthor` 的直欄」—— 因為那個直欄的程式名稱是 `$55`，不是 `wdocAuthor`。

### 怎麼找直欄的程式名稱

Designer 開啟 view → 點選那個直欄 → 右側屬性面板 → 切到「**程式設計時使用**」分頁 → 「**名稱**」欄位就是 DQL 認得的名字。

如果是 `$N` 這種自動編號，建議手動改成有意義的名字（例如 `wdocAuthor`），DQL 才能直接用。

### 兩個解法

1. **改直欄程式名稱**：在 Designer 把「程式設計時使用 → 名稱」改成你想用的名字，存檔後 refresh catalog
2. **用 `in()` 語法繞開**：

   ```sql
   in ('vwMyJob') and wdocAuthor = 'CN=user01/O=TheNet'
   ```

   `in()` 語法**不靠直欄程式名稱**，DQL 會直接用文件欄位 `wdocAuthor` 比對 —— view 內部直欄怎麼設都不影響。

## 比較運算子兩邊一定要有空白

DQL parser 對 token 之間的空白比 SQL parser 嚴格 ——

| 寫法 | 結果 |
|---|---|
| `wdocAuthor='CN=user01/O=TheNet'` | ❌ Parser 報錯 |
| `wdocAuthor = 'CN=user01/O=TheNet'` | ✅ 正常 |

不加空白時的實際錯誤訊息（看起來會讓人很困惑）：

```text
Domino Query execution error:
Query is not understandable -  語法錯誤   - 必須有至少一個運算子

'(個人\待簽核文件)'.wdocAuthor='CN=user01/O=TheNet'

(Call hint: OSCalls::OSLocalAllc, Core call #0)
```

「必須有至少一個運算子」這句訊息誤導性很強 —— `=` 明明就在那裡，但 DQL tokenizer 用空白切 token，沒有空白就把 `wdocAuthor='CN=user01/O=TheNet'` 整段當成一個身分不明的 token，找不到運算子。**訊息看起來不像在說空白，但解法就是加空白**。

**`=`、`<`、`>`、`<=`、`>=`、`!=`** 都建議當作「兩邊各留一個空白」處理。

從 SQL 背景過來的人最容易踩這個 —— SQL 的 `Form='Customer'` 跟 `Form = 'Customer'` parser 都收，DQL 不收。

## View 名稱含反斜線（`\`）要 escape

Notes view 名稱可以有反斜線做階層分類，例如**隱藏視圖** `(個人\待簽核文件)`（括號開頭代表隱藏，反斜線代表階層）。直接寫進 DQL，反斜線會在某一層 escape 處理掉，**錯誤訊息會跟「Design Catalog 沒建好」長得一模一樣**：

```text
Domino Query execution error:
Entry not found in index -  語法錯誤

Error validating view column name - ['(個人待簽核文件)'.wdocAuthor]
 ..  invalid view name or database needs to be cataloged via updall -e

'(個人待簽核文件)'.wdocAuthor = 'CN=user01/O=TheNet'

(Call hint: NSFCalls::NSFDbGetNamedObjectID, Core call #0)
```

注意錯誤訊息裡的 view 名稱變成了 `(個人待簽核文件)` —— **反斜線被吃掉了**！訊息建議「請跑 `updall -e`」會把人帶進岔路，因為真正的問題不是 catalog，是 escape。

寫法對照：

| 寫法 | DQL 收到的 view 名稱 | 結果 |
|---|---|---|
| `'(個人\待簽核文件)'.wdocAuthor` | `(個人待簽核文件)`（`\` 被吃掉）| ❌ view 找不到 |
| `'(個人\\待簽核文件)'.wdocAuthor` | `(個人\待簽核文件)`（正確）| ✅ 正常 |

`in()` 語法也一樣：

```sql
in ('(個人\\待簽核文件)') and wdocAuthor = 'CN=user01/O=TheNet'
```

### 為什麼要寫雙反斜線？

**DQL parser 本身就把 `\\` 視為單一 `\`**（DQL 字串裡 `\` 是 escape 字元）。所以你想要 view 名稱裡有一個真正的 `\`，傳給 DQL parser 的查詢字串裡就要有兩個 `\`。

但「源碼寫幾個 `\`」會被你用的語言放大或縮小：

| 來源語言 / 格式 | 源碼寫幾個 `\` | 字串值 | DQL 收到 | DQL parse 後 |
|---|---|---|---|---|
| LotusScript（不 escape `\`）| `"\\"` | `\\` | `\\` | `\` ✅ |
| Java / Node.js / JSON（`\` 是 escape 字元）| `"\\\\"` | `\\` | `\\` | `\` ✅ |

LotusScript 字串 literal 不對 `\` 做 escape（要轉義引號是 `""` 雙引號），所以源碼寫兩個就是兩個。Java / Node.js / JSON 字串 literal 會把 `\\` 縮成一個 `\`，所以源碼要寫四個 `\` 才能讓字串值有兩個 `\`。

實際工程師回報的踩雷情境：他在 Node.js / JSON 環境下源碼只寫一個 `\`，結果 JSON 解析就把它吃掉了，DQL 完全沒收到 `\`，view 名稱直接變成 `(個人待簽核文件)`。

## DQL 是大小寫無關（而且 accent 無關）—— 這個是好消息

HCL 官方 [DQL syntax](https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_syntax.html) 文件明寫：

> "Text string evaluation is **case insensitive** and **accent insensitive**."

實務行為整理：

| 項目 | 行為 | 出處 |
|---|---|---|
| 字串值比對（accent 也無關） | 大小寫無關 | 官方文件 |
| `'view'.column` 中的 view 名稱 | 大小寫無關 | 實測 |
| `'view'.column` 中的直欄程式名稱 | 大小寫無關 | 實測 |
| Keyword（`and` / `or` / `in` / `contains` / `like`） | 大小寫無關 | 實測（沿用 Notes/SQL 慣例）|

也就是說，下面這幾個查詢結果**完全相同**：

```sql
'vwMyJob'.wdocAuthor = 'CN=user01/O=TheNet'
'VWMYJOB'.WDOCAUTHOR = 'cn=USER01/o=thenet'
'vwmyjob'.WdocAuthor = 'cn=user01/o=thenet'
```

view 名稱、直欄程式名稱、字串值比對 —— 三個都不分大小寫。

`accent insensitive` 是 bonus —— `'café'` 跟 `'cafe'` 也會比中。對歐語系資料相當好用。

⚠️ **如果你真的需要 case-sensitive 比對**，DQL 的 `=` 操作子沒有提供 case-sensitive 版本 —— 必須在程式端拿到結果後再用 `StrCompare`（LotusScript）/ Java string 比對之類自己過濾。

## `@formula(...)` 是獨立的 Formula Language parser

Notes 開發者最常問的問題之一：「DQL 能不能用我熟悉的 `@Function`？」可以 —— DQL 提供 `@formula(...)`（也可以寫 `@fl()` 或 `@FORMULA()`，大小寫皆可）讓你**嵌一段 Formula Language 進去**。

### 案例：找前 3 碼是 `056` 的文件

假設 `docno` 格式長這樣：`"056123456789"`，要找所有前 3 碼是 `056` 的 doc。

兩種寫法：

```sql
-- 寫法 A：用 @formula 嵌 @Left
@formula('@Left(docno;3) = "056"')

-- 寫法 B：用 DQL 原生 like + 萬用字元（推薦）
docno like '056%'
```

兩個結果一樣，**但效能差很多**：

| 寫法 | 能用 view 索引？ | 效能 |
|---|---|---|
| `docno like '056%'` | ✅ 能（如果有 collated `docno` 直欄） | 快 |
| `@formula('@Left(docno;3) = "056"')` | ❌ 一定走 NSF summary scan | 慢 |

**`@formula` 的條件 DQL 不會用 view 索引最佳化**。能用原生 `like` / `contains` / `=` / `in` / `between` 表達的就先用，`@formula` 是「**原生語法表達不出來才動用**」的最後手段。

### `@formula` 的語法細節

```sql
@formula('@Left(docno;3) = "056"')
```

三個容易踩的細節：

1. 整段 Formula 用**單引號**包起來
2. Formula 內部的字串用**雙引號**（避開跟外面單引號衝突）
3. 函式參數分隔符是 **`;`**（Formula Language 的慣例，不是逗號）

### 重要：DQL 原生 `@` vs Formula Language 的 `@Function` 是兩套東西

DQL 其實有**兩個解析環境**，互相不認得對方的 `@` 函式：

| Parser 環境 | 寫在哪 | 認得哪些 `@` |
|---|---|---|
| **DQL 原生** | query 主體 | `@dt`、`@all`、`@formula` / `@fl` / `@FORMULA`、`@ftsearch` / `@fts`、`@Created`、`@DocumentUniqueID`、`@ModifiedInThisFile` |
| **Formula Language** | `@formula('...')` 引號內部 | Formula Language 的 `@Function` 子集（`@Year`、`@Left`、`@Contains`、`@Length`、`@Matches`、`@Modulo`、`@Lowercase`...） |

**`@formula` 內部 _不認得_ DQL 原生的 `@dt` / `@all` / `@ftsearch`**，反過來 DQL 主體也不認 Formula Language 的 `@Year` / `@Left`（必須包在 `@formula` 裡）。兩個 parser 是隔開的。

#### 實際踩雷案例：`@dt` 寫進 `@formula` 裡

```sql
'vwMyJob'.wdocAuthor = 'CN=USER05/O=thenet'
  and @formula('@Year(@dt(ApplyDate)) = "2021"')
```

DQL 把 `@formula('...')` 引號內整段交給 Formula compiler 處理，Formula compiler 看到 `@dt` 不認，於是噴：

```text
Formula Error -  規劃及產生樹狀結構時發生錯誤
Error filling node for @Year(@dt(ApplyDate)) = "2021"

(Call hint: NSFCalls::NSFFormulaCompile, Core call #0)
```

正確寫法看兩件事：**意圖**（取年份 vs 區間比對）跟**`ApplyDate` 是哪種欄位**（真正的 date 還是字串）。

**意圖 A：取 `ApplyDate` 的年份是不是 2021** —— 用 Formula Language

如果 `ApplyDate` 是真正的 date 欄位：

```sql
@formula('@Year(ApplyDate) = 2021')
```

如果 `ApplyDate` **是用字串存的**（舊 Notes app 很常這樣），要先用 Formula Language 的 `@TextToTime` 轉成日期再取年份：

```sql
@formula('@Year(@TextToTime(ApplyDate)) = 2021')
```

> 💡 **實測 tip（讀者回報）**：很多現場的 Notes 應用 `ApplyDate` 都是字串型別，直接 `@Year(ApplyDate)` 會失敗 —— `@TextToTime` 是必經的一步。字串格式要是 Notes 認得的（例如 `"2021/05/15"` 或 `"2021-05-15"`）`@TextToTime` 才能 parse 成功。

兩種寫法的比較值都用**數字 `2021`** 而不是字串 `"2021"`（`@Year` 回傳數字，跟字串比會失敗）。

**意圖 B：日期區間比對 + 用得上 view 索引** —— 改用 DQL 原生 `@dt`

```sql
ApplyDate >= @dt('2021-01-01') and ApplyDate < @dt('2022-01-01')
```

這個寫法**比 `@formula` 版快**，因為 DQL 原生條件能用 view 索引最佳化 —— **但前提是 `ApplyDate` 是真的 date 型別**。如果是字串欄位，DQL 原生比較會做字串比對而不是日期比對，結果可能不正確（除非你的字串剛好是 ISO 8601 這種 sortable 格式，字串排序才會等同日期排序）。

能不用 `@formula` 就不用是常見原則（呼應後面的「原生粗篩、@formula 細篩」）。但對字串日期，現實上你可能只剩 `@formula('@Year(@TextToTime(...))') = 2021)` 這條路 —— **要走原生最佳化，欄位型別也得乾淨**。

#### DQL 原生 `@` 函式速查

| 函式 | 用途 |
|---|---|
| `@dt('YYYY-MM-DD[Thh:mm:ss]')` | 日期/時間字面值（ISO8601 格式） |
| `@all` | 所有文件 |
| `@formula(...)` / `@fl(...)` | 嵌入 Formula Language |
| `@ftsearch(...)` / `@fts(...)` | 全文檢索（Domino 14+） |
| `@Created` | 文件建立時間（特殊欄位） |
| `@DocumentUniqueID` | 文件 UNID |
| `@ModifiedInThisFile` | 本檔最後修改時間 |

這些**只能寫在 DQL 主體**，塞進 `@formula(...)` 內就會噴 Formula compile 錯誤。

### 什麼時候真的需要 `@formula`

當條件複雜到原生 DQL 寫不出來：

```sql
@formula('@Year(orderDate) = 2026')              -- 日期函式
@formula('@Length(content) > 1000')              -- 字串長度
@formula('@Modulo(amount; 100) = 0')             -- 數值運算
@formula('@Matches(title; "[A-Z]??-2026-*")')    -- 樣式比對
```

### 最佳化模式：原生條件粗篩 + `@formula` 細篩

`@formula` 跟原生 DQL 條件可以 `and` / `or` 串起來。推薦寫法：**先讓原生條件做粗篩、@formula 做細篩**。

```sql
Form = 'Order' and @formula('@Year(orderDate) = 2026')
```

DQL 規劃器會先用 `Form = 'Order'`（如果有 view 索引就走索引）縮小範圍，再對縮小後的子集跑 `@formula` 過濾。比起單純丟一個 `@formula` 整檔掃要快很多。

### 限制（HCL 官方 [Formula Language in DQL](https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_formulalanguage.html)）

- 單個 `@formula` 字串上限 **256 bytes**
- 不是所有 `@Function` 都支援，HCL 文件列了 130+ 個的支援子集（`@Left`、`@Year`、`@Contains`、`@Matches`、`@Length`、`@Modulo`、`@Lowercase`... 常用的都在）
- DQL 不會在執行前驗證 Formula 語法 —— 寫錯了會在 runtime 才噴錯
- `@formula` 內無法用 DQL 的 substitution variable（`?varname`），但可以在外面用：`@fl('@doclength') > ?doclengthval`

## 雷區錯誤訊息對照表

把上面的錯誤訊息收齊，遇到時可以快速對照解法：

| 訊息片段 | 真正原因 | 解法 |
|---|---|---|
| `必須有至少一個運算子` | 比較運算子兩邊沒空白 | `=` 兩側各加一個空白 |
| `incorrect column name or no valid sorted column` | 引用的直欄程式名稱不存在 | 看 Designer 屬性面板的「程式設計時使用 → 名稱」改 query，或改用 `in()` 語法 |
| `invalid view name or database needs to be cataloged via updall -e` | （A）catalog 不存在 →（B）view 名稱含反斜線沒 escape | 先看 view 名稱有沒有 `\`，有就 escape 成 `\\`；確定不是反斜線問題再看 [Part 3 catalog 維運](/domino-news/zh-TW/posts/dql-production) |
| `Formula Error - 規劃及產生樹狀結構時發生錯誤` / `Error filling node` | `@formula` 內用了 DQL 原生 `@` 函式（`@dt` 等） | 換成 Formula Language 的對應函式（`@TextToTime` 等），或拉出 `@formula` 改用 DQL 原生語法 |
| 結果 count 比預期少（不噴錯） | view selection 不是 `Select @All`，被默默限縮範圍 | 改 view 為 `Select @All`、改用 `in()` 語法、或建專屬 DQL view |

---

> 📚 **下一篇：[DQL Production-Ready：Catalog 維運、權限、與 sessionAsSigner](/domino-news/zh-TW/posts/dql-production)**
>
> 寫得出能跑的 query 後，下一個 hurdle 是**怎麼 ship 到 production**：catalog 怎麼自動維護、設計變更怎麼自動處理、為什麼一般使用者跑會噴權限錯。Part 3 會把實戰 pattern 完整講完。
>
> 想複習基礎語法或從 LotusScript / Java / REST API 呼叫的細節，回到 [Part 1 DQL 入門](/domino-news/zh-TW/posts/dql-getting-started)。
