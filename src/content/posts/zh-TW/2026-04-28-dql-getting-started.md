---
title: "DQL 入門：用熟悉的查詢語法操作 Notes 文件"
description: "Domino Query Language（DQL）讓你用近 SQL 的語法直接查詢 Notes 文件，免再寫 view、@Formula。本文介紹 DQL 的語法、執行方式與效能要點，附 LotusScript / Java / REST API 範例。"
pubDate: 2026-04-28
lang: zh-TW
slug: dql-getting-started
tags:
  - "Domino"
  - "REST API"
  - "Java"
  - "LotusScript"
  - "Tutorial"
sources:
cover: "/covers/dql-getting-started.png"
  - title: "HCL Domino Query Language (DQL) — official documentation"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/conf_dql.html"
  - title: "Domino Query Language Syntax Reference"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/conf_dql_syntax.html"
  - title: "OpenNTF: DQL examples and patterns"
    url: "https://www.openntf.org/main.nsf/project.xsp?r=project/Domino%20Query%20Language%20Examples"
---

## 為什麼需要 DQL

長期寫 Notes 應用的開發者都熟悉兩種查詢方式：

1. **View + getEntryByKey / getAllEntriesByKey** — 快但要先建好 view 索引
2. **@Formula 全資料庫搜尋** — 不用 view 但慢、不容易組合條件

**Domino Query Language（DQL）** 是 HCL 從 V10 引入、在 V12 之後逐步穩定的第三種選擇：用接近 SQL 的語法直接查詢文件，**底層自動利用 design catalog 與 view 索引**，不用每次都自己寫 view。

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

## 啟用 DQL：建立 design catalog

DQL 在沒有任何索引時也能跑（會掃整個 NSF），但效能差。要讓 DQL 用上索引，必須先建立 **design catalog**（`GQFDsgn.cat`）：

```text
load updall -e
```

或者在 server console 執行：

```text
load design
```

之後每加一個 view，DQL 引擎都能自動考慮使用。如果你有特定欄位想被 DQL 用，可以在 view 的 selection formula 加上：

```text
SELECT @IsAvailable($DQLField)
```

讓 view 變成 DQL 可用的索引來源。

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
| 用 view 做基底 | `'Customers'.Country = 'Taiwan'`（單引號中是 view 名） |

## 效能要點

1. **盡量用 view 索引**：`'ViewName'.Field = ...` 比裸欄位快
2. **避免 leading wildcard**：`like '%abc'` 無法用索引
3. **打開 explain 觀察**：`dq.Explain = True` 印出實際執行路徑
4. **first hits 模式**：要少量結果用 `Execute(query, "", 0, 10)` 限制筆數
5. **大查詢開 thread pool**：透過 notes.ini `QUERY_MAX_NUMBER_THREADS=4` 平行掃 NSF

## 常見錯誤

- **"No design catalog found"** — 跑 `load updall -e` 建 catalog
- **"Field is not selectable in any view"** — DQL 找不到對應的 view，會 fallback 整檔掃，加 view 或加 `$DQLField` 標記
- **中文欄位值要 case-sensitive 比對**：DQL 預設大小寫敏感，視需要先轉小寫存

## 延伸閱讀

DQL 還支援 substitution variables、JOIN（透過 view link）、AGGREGATE 函式等進階功能，建議搭配官方 syntax reference 查表使用。
