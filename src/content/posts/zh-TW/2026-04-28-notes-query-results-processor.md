---
title: "NotesQueryResultsProcessor 入門：DQL 之後的下一步"
description: "NQRP 是 Domino V12 引入的 LotusScript 類別，讓你把 DQL（或任何 NotesDocumentCollection）的結果重新排序、分類、加欄位、輸出成 JSON 或暫存 view。本文整理建立流程、所有方法簽名、官方範例與安全用法。"
pubDate: 2026-04-28T17:25:00+08:00
lang: zh-TW
slug: notes-query-results-processor
tags:
  - "Tutorial"
  - "LotusScript"
  - "DQL"
  - "Performance"
sources:
  - title: "NotesQueryResultsProcessor (LotusScript) — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESQUERYRESULTSPROCESSOR_CLASS.html"
  - title: "AddColumn method — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_ADDCOLUMN_METHOD.html"
  - title: "ExecuteToView method — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EXECUTETOVIEW_METHOD.html"
  - title: "ExecuteToJSON method — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/12.0.2/basic/H_EXECUTETOJSON_METHOD.html"
  - title: "NotesJSONNavigator class — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESJSONNAVIGATOR_CLASS.html"
  - title: "QueryResultsProcessor (Java) — HCL official docs"
    url: "https://help.hcl-software.com/dom_designer/12.0.0/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html"
cover: "/covers/notes-query-results-processor.png"
coverStyle: "bw-grain"
---

## 為什麼需要 NQRP

[DQL](/domino-news/posts/dql-getting-started) 解決了「如何用接近 SQL 的語法找文件」，但回傳的是 `NotesDocumentCollection`，本身不負責**排序、分類、欄位投影、JSON 化**。如果你還想：

- 對結果按某欄位排序（DQL 本身不保證順序）
- 把結果分類（categorized）
- 套用 `@Formula` 計算或覆蓋欄位值
- 直接吐 JSON 給前端 / API
- 把結果存成一個暫存視圖給使用者瀏覽

過去都得自己迴圈處理，或乾脆建一個專用視圖。**NotesQueryResultsProcessor（NQRP）** 是 Domino V12 引入的 LotusScript 類別，把這些後處理動作收進一個流式 API。

## 建立 NQRP 物件

NQRP 從 `NotesDatabase.CreateQueryResultsProcessor()` 取得：

```vb
Dim s As New NotesSession
Dim db As NotesDatabase
Set db = s.GetDatabase("myserver", "mydb.nsf")

Dim qrp As NotesQueryResultsProcessor
Set qrp = db.CreateQueryResultsProcessor()
```

之後的流程一律是「加入輸入 → 定義欄位 → 執行」。

## 加入輸入：三種來源

### 1. AddCollection — 既有的文件集合

```vb
Dim view As NotesView
Set view = db.GetView("Customers")
Dim col As NotesDocumentCollection
Set col = db.UnprocessedDocuments  ' 或 view.GetAllDocumentsByKey(...) 等
Call qrp.AddCollection(col)
```

接受 `NotesDocumentCollection` 或 `NotesViewEntryCollection`。

### 2. AddDominoQuery — 直接把 DQL 接進來

```vb
Dim dq As NotesDominoQuery
Set dq = db.CreateDominoQuery()
Call qrp.AddDominoQuery(dq, "Form = 'Order' and Total > 10000", "")
```

NQRP 會在內部執行 DQL 並把結果納入處理。

### 3. AddFormula — 覆蓋輸入欄位值

當輸入文件有欄位需要計算或標準化時：

```vb
Call qrp.AddFormula("@LowerCase(CustomerName)", "CustomerName", "*")
```

第三個參數 `"*"` 代表套用到所有輸入；指定特定 collection 名稱可以只套到那一支。

## 定義輸出欄位：AddColumn

```vb
Call qrp.AddColumn(String Name, _
                   Optional String Title, _
                   Optional String Formula, _
                   Optional Integer SortOrder, _
                   Optional Boolean Hidden, _
                   Optional Boolean Categorized)
```

| 參數 | 用途 |
|---|---|
| `Name` | 欄位的程式名稱（必須唯一） |
| `Title` | 產生視圖時顯示的欄位標題 |
| `Formula` | 預設值的 `@Formula`（不指定就直接讀同名欄位） |
| `SortOrder` | `SORT_UNORDERED` / `SORT_ASCENDING` / `SORT_DESCENDING` |
| `Hidden` | true = 只用來排序、不輸出 |
| `Categorized` | true = 該值相同的結果歸成一類 |

官方範例：

```vb
Set qrp = db.CreateQueryResultsProcessor()
Call qrp.AddColumn("sales_person", "", "", SORT_ASCENDING, False, True)
Call qrp.AddColumn("ordno",        "", "", SORT_DESCENDING, False, False)
Call qrp.AddColumn("order_origin", "", "", SORT_UNORDERED, False, False)
Call qrp.AddColumn("partno")
```

上面定義 4 個欄位：依 `sales_person` **分類**升冪 → 同一類內依 `ordno` 降冪 → 顯示 `order_origin` 和 `partno`。

## 執行：兩種輸出

### A. ExecuteToJSON — 給 API / 前端用

```vb
Dim json As NotesJSONNavigator
Set json = qrp.ExecuteToJSON()
```

回傳 `NotesJSONNavigator` 物件，輸出格式遵循 RFC 8259。所有結果統一掛在 `StreamResults` 之下：

```json
{
  "StreamResults": [
    {
      "@nid": "NT0000A572",
      "@DbPath": "dev\\ordwrkqrp.nsf",
      "sales_person": "Alice",
      "ordno": "PO-1042",
      "order_origin": "Web",
      "partno": "X-99"
    }
  ]
}
```

特殊 key：

- `@nid` — 文件 NoteID
- `@DbPath` — 來源 DB 路徑
- `documents` — 分類結果中的子文件陣列
- 多值欄位會輸出為 JSON array
- 聚合函式（`@@sum()`、`@@avg()`、`@@count()`）會以特殊 key 出現

### B. ExecuteToView — 變成可瀏覽的暫存視圖

```vb
Set myview = qrp.ExecuteToView(ByVal Name As String, _
                               Optional ByVal ExpireHours As Long, _
                               Optional Readers As Variant, _
                               Optional DesignSrcDB As NotesDatabase, _
                               Optional ByVal DesignSrcViewName As String) As NotesView
```

| 參數 | 用途 |
|---|---|
| `Name` | 要建立的視圖名稱 |
| `ExpireHours` | 多少小時後自動刪除（預設 24） |
| `Readers` | 單一名稱或名稱陣列（標準格式 canonical），限制可讀對象 |
| `DesignSrcDB` / `DesignSrcViewName` | 用既有視圖的設計當模板 |

官方範例：

```vb
Dim theReaders(1 To 4) As String
theReaders(1) = "CN=User1 UserLN1/O=MYORG"
theReaders(2) = "CN=User2 UserLN2/O=MYORG"
theReaders(3) = "PrivilegedGroup"
theReaders(4) = "CN=User3 UserLN3/O=MYORG"

Dim s As New NotesSession
Dim db As NotesDatabase
Dim qrp As NotesQueryResultsProcessor
Dim myview As NotesView
Set db = s.GetDatabase("myserver", "mydb.nsf")
Set qrp = db.CreateQueryResultsProcessor()
Set myview = qrp.ExecuteToView("MyNewResultsView", 2, theReaders)
```

這支視圖由系統自動清掉，不會把 NSF 設計越塞越大。

## 安全屬性：別讓查詢跑不停

```vb
qrp.MaxEntries = 50000      ' 輸入文件數上限，超過直接拋錯
qrp.TimeOutSec = 30         ' 執行秒數上限，超過直接拋錯
```

公開 API 一定要設這兩個屬性，避免使用者送進來的查詢把伺服器拖垮。

## Java 版的 QRP

Java 端類別叫 `lotus.domino.QueryResultsProcessor`。命名跟 LotusScript 完全對應，只是去掉 `Notes` 前綴、改成 camelCase，且方法名沿用大寫 `JSON`：

| LotusScript | Java |
|---|---|
| `db.CreateQueryResultsProcessor()` | `db.createQueryResultsProcessor()` |
| `qrp.AddCollection(col)` | `qrp.addCollection(col)` |
| `qrp.AddDominoQuery(dq, q, "")` | `qrp.addDominoQuery(dq, q, "")` |
| `qrp.AddColumn(...)` | `qrp.addColumn(...)` |
| `qrp.ExecuteToJSON()` | `qrp.executeToJSON()` |
| `qrp.ExecuteToView(name, ...)` | `qrp.executeToView(name, ...)` |
| `qrp.MaxEntries = 50000` | `qrp.setMaxEntries(50000)` |
| `qrp.TimeOutSec = 30` | `qrp.setTimeoutSec(30)` |

Java 對應的端到端範例：

```java
import lotus.domino.*;

Session session = NotesFactory.createSession();
Database db = session.getDatabase("", "orders.nsf");

QueryResultsProcessor qrp = db.createQueryResultsProcessor();
qrp.setMaxEntries(10000);
qrp.setTimeoutSec(20);

DominoQuery dq = db.createDominoQuery();
qrp.addDominoQuery(dq,
    "Form = 'Order' and OrderDate >= @dt('2026-01-01')", "");

qrp.addColumn("region",  "",          "", QueryResultsProcessor.SORT_ASCENDING,  false, true);
qrp.addColumn("total",   "Total NTD", "", QueryResultsProcessor.SORT_DESCENDING, false, false);
qrp.addColumn("orderNo", "Order No",  "", QueryResultsProcessor.SORT_UNORDERED,  false, false);

JSONNavigator json = qrp.executeToJSON();
// 走訪 JSONNavigator API ...

qrp.recycle();   // 跟所有 lotus.domino 物件一樣，記得 recycle
```

`recycle()` 是 `lotus.domino.Base` 的標準動作，避免 JVM 端持有 native handle 太久。

## 完整範例：DQL + 排序 + JSON（LotusScript）

```vb
Sub TopOrdersToJSON
  Dim s As New NotesSession
  Dim db As NotesDatabase
  Set db = s.GetDatabase("", "orders.nsf")

  Dim qrp As NotesQueryResultsProcessor
  Set qrp = db.CreateQueryResultsProcessor()
  qrp.MaxEntries = 10000
  qrp.TimeOutSec = 20

  Dim dq As NotesDominoQuery
  Set dq = db.CreateDominoQuery()
  Call qrp.AddDominoQuery(dq, _
    "Form = 'Order' and OrderDate >= @dt('2026-01-01')", "")

  Call qrp.AddColumn("region",  "",          "", SORT_ASCENDING,  False, True)
  Call qrp.AddColumn("total",   "Total NTD", "", SORT_DESCENDING, False, False)
  Call qrp.AddColumn("orderNo", "Order No",  "", SORT_UNORDERED,  False, False)

  Dim json As NotesJSONNavigator
  Set json = qrp.ExecuteToJSON()
  ' 後續可用 NotesJSONNavigator 的 API 走訪節點
End Sub
```

## 何時用 NQRP，何時不用

| 需求 | 建議 |
|---|---|
| 單純用鍵取單筆文件 | 直接 `view.GetDocumentByKey()` |
| 全文搜尋關鍵字 | `db.FTSearch()` |
| 結構化條件查詢 | DQL（`NotesDominoQuery`） |
| DQL 結果還要排序 / 分類 / 投影 / JSON | **NQRP** |
| API 介面、需要分類視圖 | **NQRP + ExecuteToJSON** |
| 給使用者瀏覽的暫存表格 | **NQRP + ExecuteToView** |

NQRP 從 V12 起穩定，是寫 Domino-as-API、Domino REST API 後端、報表批次的好幫手。
