---
title: "DQL 入門：用熟悉的查詢語法操作 Notes 文件"
description: "Domino Query Language（DQL）讓你用近 SQL 的語法直接查詢 Notes 文件，免再寫視圖、@Formula。本文介紹 DQL 的語法、執行方式與效能要點，附 LotusScript / Java / REST API 範例。"
pubDate: 2026-04-28T08:30:00+08:00
lang: zh-TW
slug: dql-getting-started
tags:
  - "Tutorial"
  - "DQL"
  - "LotusScript"
  - "Domino REST API"
sources:
  - title: "Domino Query Language overview — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_overview.html"
  - title: "DQL syntax reference — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_syntax.html"
  - title: "Examples of simple DQL queries — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/dql_simple_examples.html"
  - title: "DQL Explorer — OpenNTF community project"
    url: "https://www.openntf.org/main.nsf/project.xsp?r=project/DQL+Explorer"
  - title: "NotesDominoQuery class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDOMINOQUERY_CLASS.html"
cover: "/covers/dql-getting-started.png"
---

## 為什麼需要 DQL

長期寫 Notes 應用的開發者，過去主要靠以下三種方式找文件：

1. **視圖查詢**（`NotesView.GetDocumentByKey`、`GetAllDocumentsByKey`、`GetAllEntriesByKey`）
   — 最快、最直覺：先建好視圖並設定排序鍵欄位（sort key column），按鍵值直接取。缺點是每種查詢條件幾乎都要建一個對應視圖，設計會越長越多。
2. **`NotesDatabase.Search`（公式全檔掃描）**
   — 用 `@Formula` 表達選取條件，整個 NSF 文件逐一比對。不用視圖，但每次都掃完整資料庫，文件多就慢；適合一次性管理任務。
3. **`NotesDatabase.FTSearch`（全文索引搜尋）**
   — 走全文索引（full-text index）、支援詞綴與布林關鍵字。適合「找含某幾個字的文件」這種需求；缺點是需要先建全文索引，而且對結構化欄位（數值、範圍、邏輯組合）的支援不如視圖。

**Domino Query Language（DQL）** 是 HCL 從 V10 引入、在 V12 之後穩定的**第四種選擇**：用接近 SQL 的語法直接查詢文件，**底層會自動利用 design catalog（設計目錄）與既有的視圖索引**，找不到時改採全檔掃描。優勢是不必為每種查詢條件預先設計新視圖，且查詢語法可組合、可從 LotusScript / Java / REST API 統一呼叫。

## DQL 範例：第一個查詢

最簡單的 DQL 表達式長這樣：

```sql
Form = 'Customer' and Country = 'Taiwan'
```

注意三點：
- 欄位名稱**不加引號**
- 字串值用**單引號**
- 比較運算子是 `=`、`<`、`<=`、`>`、`>=`、`in`、`contains`、`like`

更多範例：

```sql
Form = 'Order' and OrderDate >= @dt('2026-01-01') and Total > 10000
```

```sql
Form in ('Invoice', 'CreditNote') and Status = 'Open'
```

```sql
Subject contains 'Domino' and Author like 'Bryan%'
```

## 啟用 DQL：建立 Design Catalog（設計目錄）—— 用到 view 名稱就一定要

這一節先把「Design Catalog 到底什麼時候非要不可」釐清，再講怎麼建。

**結論先講**：

| 你的 query 形式 | 需要 Design Catalog 嗎？ |
|---|---|
| `Form = 'Customer'`（裸欄位查詢） | ❌ 不需要。DQL 會直接掃整個 NSF，效能差但能跑 |
| `'Customers'.Country = 'Taiwan'`（view 名稱 + 欄位） | ✅ 必須有，否則噴錯 |
| `in ('Customers') and Country = 'Taiwan'`（用 view 限縮範圍） | ✅ 必須有，否則噴錯 |

**只要 query 裡出現 view 名稱**（單引號包起來的那種），就一定要 Design Catalog —— 因為 catalog 是 DQL **唯一**認得 view 名稱、view 裡有哪些欄位的管道。沒 catalog，DQL 不知道你寫的 `'Customers'` 是什麼鬼。

如果你的 query 完全不引用 view 名稱、純粹寫 `Form = 'X' and Total > 100` 這種裸欄位條件，DQL 還是能跑 —— 只是退化成 NSF 全表掃描，效能差而已，不會噴錯。

最常見的踩雷情境：開發者新增了一個叫 `Vtest` 的 view，想用下面這段官方範例語法把查詢限定在這個 view：

```sql
in ('Vtest') and Form = 'Ftest'
```

執行下去就是這個錯誤訊息：

```text
Domino Query 執行錯誤: Unexpected internal error - 驗證錯誤
Error opening view name or named document set - [Vtest] does not exist or open failed
(Call hint: NSFCalls::NSFDbGetNamedObjectID, Core call #0)
```

訊息看起來像「view 不存在」，但 view 明明在 Designer 裡看得到、也能正常開啟 —— 真正的原因是 **這個 NSF 的 Design Catalog 還沒建立 / 還沒更新**。

### 兩個必須記住的 Server Console 指令

| 時機 | 指令 |
|---|---|
| 第一次啟用 DQL（為這個 NSF 建立 Design Catalog） | `load updall <db路徑> -e` |
| 設計變更後（新增/修改/刪除 view、改 view 名稱、改欄位）| `load updall <db路徑> -d` |

`<db路徑>` 是相對於 `Domino\Data` 的路徑，例如 `apps\crm.nsf`。

### 重點警告：Design Catalog 不會自動更新

這是最容易忘記的地方。情境長這樣：

1. 你已經跑過 `load updall apps\crm.nsf -e`，DQL 一切正常
2. 開發者在 Designer 新增了一個 view 叫 `Vtest`
3. 你用 `in ('Vtest')` 查詢 → 噴 `does not exist or open failed`
4. 卡半天才想起：忘了下 `load updall apps\crm.nsf -d`

### 更務實的解法：從程式面同步 catalog（推薦）

現實世界裡，**靠管理員手動下 `load updall -d` 通常不可行**：DB 數量多、應用部署頻繁、寫程式的人跟有 server console 權限的人通常還不是同一個。把同步 catalog 的責任丟回給管理員，就是把雷埋在交接縫隙裡。

`NotesDominoQuery` 物件提供了一個屬性，讓 app 端自己觸發 catalog 同步：

```vb
Private gDqlBootstrapped As Boolean    ' module-level

Function RunDql(db As NotesDatabase, query As String) As NotesDocumentCollection
    Dim dq As NotesDominoQuery
    Set dq = db.CreateDominoQuery()

    ' 這個 process 第一次跑 DQL：先同步一次 catalog
    ' （catalog 不存在會自動建立，存在就做增量更新）
    If Not gDqlBootstrapped Then
        dq.RefreshDesignCatalog = True
        gDqlBootstrapped = True
    End If

    Set RunDql = dq.Execute(query)
End Function
```

關鍵在 `dq.RefreshDesignCatalog = True` 這一行 —— 設成 `True` 之後，下一次 `Execute` 或 `Explain` 之前會自動先同步 catalog（對應 `load updall -d`）。**catalog 不存在的 NSF，第一次呼叫會自動 bootstrap 建立**，所以這一段邏輯涵蓋了「全新 DB」跟「設計剛改過」兩種情境，不需要寫 try-catch fallback。

> ⚠️ **不要每次查詢都把這個屬性開起來**。每設一次 `True`，下一次 `Execute` 都要先付一次 catalog 同步成本，會把 DQL 的速度優勢吃掉。Module-level flag 確保每個 process 只付一次。
>
> 進一步保險：如果你有 CI/CD pipeline，部署完設計變更後直接呼叫一次帶 `RefreshDesignCatalog = True` 的暖機查詢，把同步成本擠到部署階段，正式請求就完全免成本。

#### `RebuildDesignCatalog` 屬性 vs `RefreshDesignCatalog`

`NotesDominoQuery` 還有一個對應 `load updall -e` 的 `RebuildDesignCatalog` 屬性 —— **完整清掉重建**，比 Refresh 昂貴很多。實務上 app 程式幾乎用不到，留給以下異常維運場景：

- 懷疑 catalog 損壞（資料怪、查詢結果不一致）
- 從 10.x 升級到 11+ 後，要把 catalog 從檔案搬進 NSF
- 排程式維運（例如每週做一次完整重建作為防呆）

日常一律 Refresh，Rebuild 只在「刻意整個重來」時才動。

#### 鄰居屬性

同個物件還有兩個查詢前同步用的屬性可以一併認識：`RefreshFullText`（查詢前 refresh FT index）、`RefreshViews`（refresh 查詢會用到的 view）。一樣是「設 `True`，下一次 `Execute` 前同步」的 pattern。

### 版本差異：catalog 存在哪裡

- **Domino 10.x**：Design Catalog 是一個獨立檔案 `GQFdsgn.cat`，跟 NSF 平行擺在資料目錄裡
- **Domino 11 之後**：Design Catalog 移到 NSF 內部，存在隱藏的設計元素裡（Designer 預設看不到）。檔案層級不會再多出 `.cat` 檔，但 `load updall -e` / `-d` 的操作方式完全一樣

升級到 11+ 之後的舊 NSF，第一次仍然要手動跑一次 `load updall <db路徑> -e`，把 catalog 灌進 NSF 內部。

### 進階：把欄位明確標成 DQL 可用

如果你有特定欄位想被 DQL 直接用作查詢條件、走 view 索引，可以在 view 的選取公式（selection formula）加上：

```text
SELECT @IsAvailable($DQLField)
```

這個 view 就會成為 DQL 可用的索引來源，查詢規劃器會優先考慮走這個 view 而不是全表掃描。

## 從 LotusScript 呼叫 DQL

DQL 在 LotusScript 用 `NotesDominoQuery` 物件：

```vb
Sub QueryCustomers
  Dim session As New NotesSession
  Dim db As NotesDatabase
  Set db = session.GetDatabase("", "crm.nsf")

  Dim dq As NotesDominoQuery
  Set dq = db.CreateDominoQuery()
  dq.UseViewRefreshing = False  ' 快但可能略過剛改的文件

  Dim result As NotesDocumentCollection
  Set result = dq.Execute("Form = 'Customer' and Country = 'Taiwan'")

  Print "Found " & result.Count & " documents"

  Dim doc As NotesDocument
  Set doc = result.GetFirstDocument()
  Do While Not doc Is Nothing
    Print doc.GetItemValue("CustomerName")(0)
    Set doc = result.GetNextDocument(doc)
  Loop
End Sub
```

如果想看 DQL 引擎挑了哪條索引、花了多久，加上 explain：

```vb
dq.Explain = True
Print dq.ExplainResult  ' 印出查詢計畫與時間
```

## 從 Java 呼叫 DQL

Java API 形狀類似：

```java
import lotus.domino.*;

Session session = NotesFactory.createSession();
Database db = session.getDatabase("", "crm.nsf");

DominoQuery dq = db.createDominoQuery();
dq.setExplain(true);

DocumentCollection result = dq.execute(
    "Form = 'Order' and OrderDate >= @dt('2026-01-01')"
);

System.out.println("Hits: " + result.getCount());
System.out.println(dq.getExplainResult());

Document doc = result.getFirstDocument();
while (doc != null) {
    System.out.println(doc.getItemValueString("OrderNo"));
    Document next = result.getNextDocument(doc);
    doc.recycle();
    doc = next;
}
```

## 從 Domino REST API 呼叫 DQL

Domino REST API（DRAPI、原 Project Keep）內建 `/query` endpoint：

```http
POST /api/v1/lists/dql HTTP/1.1
Host: domino.example.com
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "query": "Form = 'Customer' and Country = 'Taiwan'",
  "max": 50
}
```

回傳：

```json
{
  "items": [
    {
      "@unid": "ABCD1234...",
      "CustomerName": "Acme Co.",
      "Country": "Taiwan"
    }
  ],
  "count": 1
}
```

## 常用語法速查

| 用途 | DQL 語法 |
|---|---|
| 等於 | `Form = 'Customer'` |
| 範圍 | `Total >= 1000 and Total < 5000` |
| 多值 | `Status in ('Open', 'Pending')` |
| 部分字串 | `Subject contains 'urgent'` |
| 萬用字元 | `Author like 'B%'` |
| 日期 | `Created >= @dt('2026-01-01')` |
| 用視圖做基底（直接讀欄位）¹ | `'Customers'.Country = 'Taiwan'` |
| 用視圖做基底（限縮範圍） | `in ('Customers') and Country = 'Taiwan'` |

¹ view selection 不是 `Select @All` 時，DQL 會以該 view 篩出來的 doc 為查詢範圍 —— 詳見下節。

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

## 語法上的兩個小雷（實測踩到才會發現）

### 1. 比較運算子兩邊一定要有空白

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

### 2. View 名稱含反斜線（`\`）要 escape

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

#### 為什麼要寫雙反斜線？

**DQL parser 本身就把 `\\` 視為單一 `\`**（DQL 字串裡 `\` 是 escape 字元）。所以你想要 view 名稱裡有一個真正的 `\`，傳給 DQL parser 的查詢字串裡就要有兩個 `\`。

但「源碼寫幾個 `\`」會被你用的語言放大或縮小：

| 來源語言 / 格式 | 源碼寫幾個 `\` | 字串值 | DQL 收到 | DQL parse 後 |
|---|---|---|---|---|
| LotusScript（不 escape `\`）| `"\\"` | `\\` | `\\` | `\` ✅ |
| Java / Node.js / JSON（`\` 是 escape 字元）| `"\\\\"` | `\\` | `\\` | `\` ✅ |

LotusScript 字串 literal 不對 `\` 做 escape（要轉義引號是 `""` 雙引號），所以源碼寫兩個就是兩個。Java / Node.js / JSON 字串 literal 會把 `\\` 縮成一個 `\`，所以源碼要寫四個 `\` 才能讓字串值有兩個 `\`。

實際工程師回報的踩雷情境：他在 Node.js / JSON 環境下源碼只寫一個 `\`，結果 JSON 解析就把它吃掉了，DQL 完全沒收到 `\`，view 名稱直接變成 `(個人待簽核文件)`。

## DQL 是大小寫無關（而且 accent 無關）

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

## 效能要點

1. **盡量用視圖索引**：`'ViewName'.Field = ...` 比裸欄位快 —— 但要注意 view 不是 `Select @All` 時，結果會以 view selection 為範圍（見前面那節）。view 設計不可控就改用 `in ('ViewName') and Field = ...`
2. **避免前置萬用字元（leading wildcard）**：`like '%abc'` 無法用索引
3. **打開執行計畫觀察**：`dq.Explain = True` 印出實際執行路徑
4. **取少量結果模式**：要少量結果用 `Execute(query, "", 0, 10)` 限制筆數
5. **大查詢開執行緒池（thread pool）**：透過 notes.ini `QUERY_MAX_NUMBER_THREADS=4` 平行掃 NSF

## 常見錯誤

- **「No design catalog found」** — 跑 `load updall -e` 建立設計目錄
- **「Field is not selectable in any view」** — DQL 找不到對應的視圖，會改採整檔掃描，請補建視圖或加上 `$DQLField` 標記

## 延伸閱讀

DQL 還支援代換變數（substitution variables）、JOIN（透過視圖連結）、聚合函式（AGGREGATE）等進階功能，建議搭配官方語法參考（syntax reference）查表使用。
