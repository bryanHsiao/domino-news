---
title: "Java 的 QueryResultsProcessor:多來源結果跨庫合併排序,輸出 view 或 JSON"
description: "你手上有來自三個不同資料庫的文件集合,要合成一份、照同一個欄位排序、算個小計,最後給前端一段 JSON 或存成一個 view。土法是把三批都拉進記憶體、自己 merge、自己 sort——跨庫、資料量一大就撐不住。QueryResultsProcessor(R12 之後)把這件事做在 server 端:官方一句話是「Aggregates, computes, sorts, and formats collections of documents across any set of Domino databases.」。你用 addCollection / addDominoQuery 把多個來源(各給一個唯一名稱)餵進去、用 addColumn 定義要回哪些欄與怎麼排,再 executeToView 存成一個會自動過期的 results view、或 executeToJSON 直接拿 JSON。這篇講這個「多輸入、一輸出」的形狀、兩種輸出的差別與坑,以及建立它的方法名(官方頁自己寫錯的那個)。"
pubDate: 2026-11-18T07:30:00+08:00
lang: zh-TW
slug: java-queryresultsprocessor
tags:
  - "Java"
sources:
  - title: "QueryResultsProcessor class (Java)（跨庫合併排序、addColumn/executeToView、Release 12）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html"
  - title: "addCollection (QueryResultsProcessor - Java)（加入 DocumentCollection/ViewEntryCollection + 唯一 referencename）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADDCOLLECTION_METHOD_JAVA.html"
  - title: "executeToJSON (QueryResultsProcessor - Java)（輸出 JSON、@nid / @DbPath 特殊 key）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXECUTETOJSON_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "QueryResultsProcessor"
apiLang: "java"
---

你手上有三批文件,來自三個不同的資料庫——今年的訂單、去年歸檔的訂單、另一台 server 上某部門的訂單。你要把它們合成一份、照「金額」排序、算個總計,最後給前端一段 JSON,或存成一個 view 讓人點進去看。

土法是把三批都 `getAllDocuments()` 拉進記憶體,自己 merge 成一個 list,再自己寫 comparator 排序。跨三個庫、資料量一大,這個做法在記憶體和時間上都撐不住。

[`QueryResultsProcessor`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html)(R12 之後,簡稱 QRP)把這件事搬到 server 端做。官方一句話說完它的價值:「Aggregates, computes, sorts, and formats collections of documents across any set of Domino databases.」——跨任意一組 Domino 資料庫,把文件集合聚合、計算、排序、格式化。這篇講它「多輸入、一輸出」的形狀、兩種輸出,以及一個連官方頁都寫錯的建立方法名。

---

## 多輸入、一輸出的形狀

QRP 的用法是三段:建一個 processor、把多個來源餵進去、定義輸出欄位、執行。

先注意**建立的方法名**:class 頁的 Creation 段寫的是 `createQueryProcessor`,但那是官方頁的 typo——範例碼和實際可用的是 `db.createQueryResultsProcessor()`,而且它在 **Database** 上,不是 session:

```java
QueryResultsProcessor qrp = db.createQueryResultsProcessor();
```

接著把來源餵進去。[`addCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_ADDCOLLECTION_METHOD_JAVA.html) 官方是「Adds a pre-created DocumentCollection or ViewEntryCollection of documents」——你事先用任何方式(FTSearch、getAllDocuments、view 的 entries)建好的集合都能加,每個要給一個**在這個 processor 裡唯一**的 referencename:

```java
qrp.addCollection(thisYearOrders, "cur");
qrp.addCollection(archivedOrders, "arc");   // 可以來自另一個 db
qrp.addDominoQuery(dq, "Status = 'Open'", "dql");   // 也能直接餵一個 DQL 查詢
```

這個 referencename 不只是標籤——它在輸出裡標識每一列來自哪個來源,也是 `addFormula` 指定「對哪個來源套公式」的依據。然後用 `addColumn` 定義要回傳哪些欄、怎麼排序與分類(官方:「Creates a single column of values to be returned when QueryResultsProcessor is executed.」)。

## 兩種輸出:executeToView 與 executeToJSON

來源和欄位都定好之後,執行有兩條路:

- **`executeToView`**——官方「Saves QueryResultsProcesser results to a "results view" in a database.」。把合併排序後的結果**實體化成一個 view**,人可以點進去看、別的程式也能讀。要注意這個 results view 是暫時的:**預設 24 小時後過期**(可自己指定存活時間),別把它當永久 view 用。
- **[`executeToJSON`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_EXECUTETOJSON_METHOD_JAVA.html)**——回一段 JSON 字串(`public String executeToJSON()`)。適合直接餵給前端或 REST 回應。結果放在頂層 key `StreamedResults` 底下,每一列還有兩個特殊 key:`@nid`(NoteID)和 `@DbPath`——有了這兩個,前端拿到某一列就能回頭對那份文件做事(它可能在另一個 db 裡)。

## 幾個會咬人的點

- **referencename 要唯一**:同一個 processor 裡兩個來源給同名,後面對不上。
- **results view 會過期**:executeToView 的產物預設 24h 消失,需要常駐就自己設存活時間,或改用程式每次重算。
- **防爆**:跨大庫合併可能很重,用 `setMaxEntries` / `setTimeoutSec` 設上限,別讓一個失控的查詢把 server 拖垮。
- QRP、餵進去的 collection、DominoQuery 都是後端 handle,用完 `recycle()`;紀律見 [改寫成 Java 後記憶體爆掉](/domino-news/posts/java-recycle-memory/)。

## 同類別在其他語言

同一個 `QueryResultsProcessor`:

- **LotusScript**:`NotesQueryResultsProcessor`,`AddCollection` / `AddColumn` / `ExecuteToView` / `ExecuteToJSON` 都在,行為一致;完整用法見 [NotesQueryResultsProcessor 那篇](/domino-news/posts/notes-query-results-processor/)。
- **SSJS / XPages**:**沒有**直接的 QueryResultsProcessor——跟 DQL 一樣,XPages 要用 QRP 得透過一個 Java bean 來跑(DQL 在 XPages 的做法見 [DQL 上線實務](/domino-news/posts/dql-production/))。
- **Java 專屬的**除了 API,就是這個「跨庫合併做在 server 端」的能力最適合用強型別的 Java 包成一個可重用的服務——輸入多個 collection、輸出 JSON 給前端,是 Domino 當資料後端時很實用的一塊。
