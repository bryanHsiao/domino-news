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

## 啟用 DQL：建立 Design Catalog（設計目錄）—— 不做就會炸

這一節是踩雷重災區，先講結論：**DQL 要解析 view 名稱、欄位名稱（`'viewname'.column` 或 `in ('view1', 'view2')` 語法），完全靠每個 NSF 內部的 Design Catalog（設計目錄）。沒有 catalog，DQL 就不知道這個 NSF 裡有哪些 view、view 叫什麼名字、view 裡有哪些欄位。**

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

正式環境可以考慮把 `-d` 排進每天的維護排程；開發環境就請養成「改完設計手動跑一次」的習慣。

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
| 用視圖做基底 | `'Customers'.Country = 'Taiwan'`（單引號中是視圖名稱） |

## 效能要點

1. **盡量用視圖索引**：`'ViewName'.Field = ...` 比裸欄位快
2. **避免前置萬用字元（leading wildcard）**：`like '%abc'` 無法用索引
3. **打開執行計畫觀察**：`dq.Explain = True` 印出實際執行路徑
4. **取少量結果模式**：要少量結果用 `Execute(query, "", 0, 10)` 限制筆數
5. **大查詢開執行緒池（thread pool）**：透過 notes.ini `QUERY_MAX_NUMBER_THREADS=4` 平行掃 NSF

## 常見錯誤

- **「No design catalog found」** — 跑 `load updall -e` 建立設計目錄
- **「Field is not selectable in any view」** — DQL 找不到對應的視圖，會改採整檔掃描，請補建視圖或加上 `$DQLField` 標記
- **中文欄位值需區分大小寫比對**：DQL 預設大小寫敏感，視需要先轉小寫存

## 延伸閱讀

DQL 還支援代換變數（substitution variables）、JOIN（透過視圖連結）、聚合函式（AGGREGATE）等進階功能，建議搭配官方語法參考（syntax reference）查表使用。
