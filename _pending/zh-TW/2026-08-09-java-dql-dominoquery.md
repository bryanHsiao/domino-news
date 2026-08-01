---
title: "在 Java 裡跑 DQL：DominoQuery 與 QueryResultsProcessor"
description: "站上的 DQL 三部曲教你寫查詢，但那是從 LotusScript 或 console 跑的。搬到 Java，DQL 走兩個類別：DominoQuery 負責編譯、調校、執行，QueryResultsProcessor 負責排序、彙總、跨庫 join、輸出 JSON。還有一個容易錯的地方——這兩個都從 Database 取得，不是 Session。這篇拆解 Java 端怎麼把 DQL 跑起來。"
pubDate: 2026-08-09T07:30:00+08:00
lang: zh-TW
slug: java-dql-dominoquery
tags:
  - "Java"
  - "DQL"
sources:
  - title: "DominoQuery class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOMINOQUERY_CLASS_JAVA.html"
  - title: "QueryResultsProcessor class (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html"
  - title: "recycle (Java) — HCL Domino Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
---

站上的 [DQL 三部曲](/domino-news/posts/dql-getting-started)把查詢語言本身講得很細——語法、踩過的雷、正式環境的調校。但那三篇跑 DQL 的方式，是 LotusScript 或 `domino` console。換到 Java，DQL 的入口長得不一樣，而且藏了一個很多人第一次會找錯地方的細節。

在 Java 裡，DQL 不是一個方法，而是**兩個類別**分工：`DominoQuery` 負責編譯、調校、執行一段查詢；`QueryResultsProcessor` 接手它的結果，做排序、彙總、跨資料庫 join、輸出 JSON。查詢字串本身跟你在三部曲學的完全一樣，變的只是「從 Java 怎麼把它跑起來、結果怎麼收」。

這篇就講 Java 這一端。

---

## 重點摘要

- **DQL 在 Java 走兩個類別**：`DominoQuery`（編譯／調校／執行）與 `QueryResultsProcessor`（排序／彙總／跨庫 join／輸出）。
- **兩個都從 `Database` 取得，不是 `Session`**——`db.createDominoQuery()`、`db.createQueryResultsProcessor()`。這是第一次寫最常找錯的地方。
- **`DominoQuery`**：官方定義是「a Java class to compile, tune, and run Domino Query Language (DQL) queries」。`parse()` 驗語法、`execute()` 執行並回傳一個 `DocumentCollection`。
- **調校靠屬性**：`MaxScanDocs`（預設 500,000）、`MaxScanEntries`（200,000）、`TimeoutSecs`（300 秒）、`NoViews`……這些就是[三部曲正式篇](/domino-news/posts/dql-production)講的「別讓一條查詢掃垮 server」在 Java 的旋鈕。
- **`execute()` 回傳的是 `DocumentCollection`**，所以你回到 [recycle() 那篇](/domino-news/posts/java-recycle-memory)的迴圈紀律：逐份處理、逐份 recycle。
- **`QueryResultsProcessor`** 才給你 SQL 那種「排序 + 彙總 + join + 輸出」——`DominoQuery` 只回答「哪些文件符合」。

---

## DominoQuery：從 Database 拿

在 Java 裡跑 DQL 的第一步，是跟 [`DominoQuery`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_DOMINOQUERY_CLASS_JAVA.html) 要一個實例——官方把它的職責寫成一句：

> A Java class to compile, tune, and run Domino Query Language (DQL) queries.

關鍵細節：它是從 **`Database`** 取得的，不是 `Session`。`db.createDominoQuery()`。很多從別的 API 過來的人會直覺去 `session` 上找，找不到。DQL 是針對某個資料庫跑的，入口自然掛在 `Database` 上。

拿到之後兩個主要動作：

- **`parse()`**：驗證 DQL 語法。語法錯在這裡就會擋下來，不必等到掃資料。
- **`execute()`**：真的去跑，回傳一個 `DocumentCollection`，裝著符合條件的文件。

## 調校：別讓一條查詢掃垮 server

[三部曲正式篇](/domino-news/posts/dql-production)反覆講的「一條沒調好的 DQL 會把 server 掃到跪」，在 Java 端是一組 `DominoQuery` 的屬性，各有預設值：

| 屬性 | 預設 | 作用 |
|---|---|---|
| `MaxScanDocs` | 500,000 | 掃描文件數上限，超過就中止 |
| `MaxScanEntries` | 200,000 | 掃描 view entry 數上限 |
| `TimeoutSecs` | 300 | 查詢逾時秒數 |
| `NoViews` | false | 禁止 DQL 動用 view 索引（強制走文件掃描） |

正式環境跑批次 DQL，這幾個是你的安全網——寧可讓一條失控查詢撞上限中止，也不要它把整台 server 拖著陪葬。

## execute() 回傳 DocumentCollection——回到 recycle 紀律

`execute()` 給你的是一個 [`DocumentCollection`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html)，接下來就是標準的 Java 迴圈——也就是 [recycle() 那篇](/domino-news/posts/java-recycle-memory)的「兩變數迴圈」：先握住下一份、處理當份、recycle 當份、再前進。DQL 常常一撈就是上萬份，這裡不 recycle，就是那篇講的後端 handle 洩漏。

```java
Database db = session.getDatabase(null, "sales.nsf");
DominoQuery dq = db.createDominoQuery();
dq.setMaxScanDocs(100000);                    // 調校：設好安全上限
DocumentCollection col = dq.execute(
    "Form = 'Order' and OrderDate >= @dt('2026-01-01')");

Document doc = col.getFirstDocument();
Document next = null;
while (doc != null) {
    next = col.getNextDocument(doc);
    // ...處理當份 doc...
    doc.recycle();                            // 逐份收，別讓結果集把記憶體塞爆
    doc = next;
}
dq.recycle();
```

## QueryResultsProcessor：排序、彙總、跨庫 join

`DominoQuery` 只回答一件事：「哪些文件符合」。它不排序、不彙總、也不跨庫。這些是 [`QueryResultsProcessor`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html)（常簡稱 QRP）的工作——官方定義：

> Aggregates, computes, sorts, and formats collections of documents across any set of Domino databases.

它一樣**從 `Database` 取得**（`db.createQueryResultsProcessor()`），然後：

- `addDominoQuery()` / `addCollection()`：把一個或多個 `DominoQuery`、`DocumentCollection` 餵進來——這就是**跨資料庫、跨結果集 join** 的做法。
- `addColumn()`：指定要哪些欄位、怎麼排序。
- `addFormula()`：用 formula 把不同資料庫、不同設計的欄位正規化成同一個輸出欄。
- `executeToJSON()`：輸出 JSON（餵前端 / API 特別好用）；`executeToView()`：把結果寫成一個 view。

換句話說，`DominoQuery` 是「篩」，`QueryResultsProcessor` 是「排 + 併 + 出」。要「把三個資料庫的訂單合起來、依金額排序、輸出成 JSON」，就是 `addDominoQuery` 三次 + `addColumn` + `executeToJSON`。它也有自己的 `setTimeoutSec()` / `setMaxEntries()` 防失控。

## 同類別在其他語言

DQL 語言本身跨語言完全一樣——你在[三部曲](/domino-news/posts/dql-getting-started)學的語法，Java、LotusScript、SSJS 寫的是同一串。差別只在「怎麼把它跑起來」：

| 語言 | 怎麼跑 DQL |
|---|---|
| **LotusScript** | `NotesDominoQuery` + [`NotesQueryResultsProcessor`](/domino-news/posts/notes-query-results-processor)，runtime 幫你收物件 |
| **SSJS / XPages** | 同一組類別，容器代管記憶體；實務上 DQL 較常從 Java/LS 跑 |
| **Java（`lotus.domino`）** | `DominoQuery` + `QueryResultsProcessor`，都從 `Database` 取得，而且結果 `DocumentCollection` 要自己 recycle |

從 LotusScript 過來的話，Java 版的 DQL 邏輯一模一樣，只是多了兩件事要記：入口在 `Database`（不是 `Session`），以及結果集的 recycle 是你的責任。想看這些類別彼此怎麼串，可參考站上的[類別地圖](/domino-news/map)。
