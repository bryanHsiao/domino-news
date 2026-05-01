---
title: "DQL 入門：用 SQL 風格的語法操作 Notes 文件"
description: "Domino Query Language（DQL）讓你用近 SQL 的語法直接查詢 Notes 文件，免再為每種查詢條件設計 view。本文是「DQL 三部曲」系列的 Part 1：介紹 DQL 的設計初衷、第一個 query 怎麼寫、從 LotusScript / Java / REST API 怎麼呼叫，以及常用語法速查。寫 query 結果不如預期的細節在 Part 2，上 production 的 catalog 維運與權限在 Part 3。"
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
cover: "/covers/dql-getting-started.png"
---

> 📚 **「DQL 三部曲」系列**
> - **Part 1**：DQL 入門（你在這裡）
> - **Part 2**：[DQL 踩雷集：寫 query 時 6 個官方文件不會明說的細節](/domino-news/zh-TW/posts/dql-pitfalls)
> - **Part 3**：[DQL Production-Ready：Catalog 維運、權限、與 sessionAsSigner](/domino-news/zh-TW/posts/dql-production)

## 為什麼需要 DQL

長期寫 Notes 應用的開發者，過去主要靠以下三種方式找文件：

1. **視圖查詢**（`NotesView.GetDocumentByKey`、`GetAllDocumentsByKey`、`GetAllEntriesByKey`）
   — 最快、最直覺：先建好視圖並設定排序鍵欄位（sort key column），按鍵值直接取。缺點是每種查詢條件幾乎都要建一個對應視圖，設計會越長越多。
2. **`NotesDatabase.Search`（公式全檔掃描）**
   — 用 `@Formula` 表達選取條件，整個 NSF 文件逐一比對。不用視圖，但每次都掃完整資料庫，文件多就慢；適合一次性管理任務。
3. **`NotesDatabase.FTSearch`（全文索引搜尋）**
   — 走全文索引（full-text index）、支援詞綴與布林關鍵字。適合「找含某幾個字的文件」這種需求；缺點是需要先建全文索引，而且對結構化欄位（數值、範圍、邏輯組合）的支援不如視圖。

**Domino Query Language（DQL）** 是 HCL 從 V10 引入、在 V12 之後穩定的**第四種選擇**：用接近 SQL 的語法直接查詢文件，**底層會自動利用 design catalog（設計目錄）與既有的視圖索引**，找不到時改採全檔掃描。優勢是不必為每種查詢條件預先設計新視圖，且查詢語法可組合、可從 LotusScript / Java / REST API 統一呼叫。

### 先講重話：DQL 不是 SQL，地雷有它自己的位置

剛接觸 DQL 的開發者很容易被「near-SQL 語法」這個賣點誤導，以為從 SQL / 傳統 Notes API 過來能無痛上手。**實際上不是** —— DQL 表面像 SQL，底下是 Notes 引擎，自帶一整套 Notes 特有的細節要注意：

- **寫 query 時的雷**：view selection 默默限縮範圍、`'view'.column` 的 column 不是文件欄位名（是直欄程式名稱）、比較運算子兩邊要空白、反斜線要 escape、`@formula` 是獨立 parser、字串日期欄位要 `@TextToTime` —— 全部詳見 [Part 2 踩雷集](/domino-news/zh-TW/posts/dql-pitfalls)
- **上 production 的雷**：Design Catalog 怎麼自動維護、為什麼一般使用者跑會撞權限、`sessionAsSigner` 怎麼配合 —— 全部詳見 [Part 3 Production-Ready](/domino-news/zh-TW/posts/dql-production)

本篇 Part 1 涵蓋基本款：DQL 是什麼、第一個 query 怎麼寫、怎麼從各語言呼叫、常用語法速查。看完這篇可以把 DQL 用起來；要 ship 到 production 之前，**務必把 Part 2 跟 Part 3 也看過**。

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

> 💡 **用到 view 名稱的 query 需要先建立 Design Catalog**。Catalog 怎麼自動維護、權限怎麼處理，詳見 [Part 3 Production-Ready](/domino-news/zh-TW/posts/dql-production)。裸欄位 query（不引用 view）不需要 catalog。

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
| 用視圖做基底（直接讀欄位） | `'Customers'.Country = 'Taiwan'`（[細節與雷點見 Part 2](/domino-news/zh-TW/posts/dql-pitfalls)） |
| 用視圖做基底（限縮範圍） | `in ('Customers') and Country = 'Taiwan'` |
| 嵌 Formula Language | `@formula('@Year(orderDate) = 2026')`（[語法與 parser context 見 Part 2](/domino-news/zh-TW/posts/dql-pitfalls)） |

## 效能要點

1. **盡量用視圖索引**：`'ViewName'.Field = ...` 比裸欄位快（[注意 view selection 限縮的細節](/domino-news/zh-TW/posts/dql-pitfalls)）
2. **避免前置萬用字元（leading wildcard）**：`like '%abc'` 無法用索引
3. **打開執行計畫觀察**：`dq.Explain = True` 印出實際執行路徑
4. **取少量結果模式**：要少量結果用 `Execute(query, "", 0, 10)` 限制筆數
5. **大查詢開執行緒池（thread pool）**：透過 notes.ini `QUERY_MAX_NUMBER_THREADS=4` 平行掃 NSF

## 常見錯誤

- **「No design catalog found」** — 跑 `load updall -e` 或用 `setRebuildDesignCatalog(true)` 觸發（[詳見 Part 3](/domino-news/zh-TW/posts/dql-production)）
- **「needs to be cataloged via updall -e」** — NSF 從沒 catalog 過（[Refresh vs Rebuild 差異見 Part 3](/domino-news/zh-TW/posts/dql-production)）
- **「您沒有權限執行此作業」** — catalog 操作需要 Designer ACL（[sessionAsSigner 解法見 Part 3](/domino-news/zh-TW/posts/dql-production)）
- **「必須有至少一個運算子」** — 比較運算子兩邊沒空白（[詳見 Part 2](/domino-news/zh-TW/posts/dql-pitfalls)）
- **「incorrect column name」** — 直欄程式名稱不對（[詳見 Part 2](/domino-news/zh-TW/posts/dql-pitfalls)）

---

> 📚 **下一篇**
>
> **[Part 2：DQL 踩雷集 — 寫 query 時 6 個官方文件不會明說的細節](/domino-news/zh-TW/posts/dql-pitfalls)**
>
> 寫完第一個 query 之後，你很快會遇到「結果不如預期」或「莫名噴錯」的情境。Part 2 用實測的錯誤訊息原文逐個拆解，附上可用的解法。
>
> **[Part 3：DQL Production-Ready — Catalog 維運、權限、與 sessionAsSigner](/domino-news/zh-TW/posts/dql-production)**
>
> 要上 production 之前的最後一哩路：Design Catalog 自動維護、權限問題的 sessionAsSigner 解法、production-ready Java helper。
