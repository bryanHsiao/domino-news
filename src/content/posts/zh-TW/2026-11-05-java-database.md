---
title: "Java 開 Notes Database:路有很多條,陷阱只有一個"
description: "LotusScript 裡 session.GetDatabase 開不到會回 Nothing,你習慣性 Is Nothing 一擋就沒事。同一行搬到 Java,getDatabase 卻**不會**回 null —— 它照樣給你一個 Database 物件,只是 isOpen 是 false,一個指向不存在的庫的空殼。這篇講 Java 怎麼取得並持有一個 Database handle:它從 Session 來、開庫有哪幾條路(getCurrentDatabase / getDatabase / DbDirectory)、那個「回了物件不代表庫開了」的陷阱怎麼擋,以及 Database 在 recycle 父子鏈的位置 —— recycle 早了,你手上開著的 View 和 Document 會一起死。"
pubDate: 2026-11-05T07:30:00+08:00
lang: zh-TW
slug: java-database
tags:
  - "Java"
sources:
  - title: "Database class (Java) — HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS_JAVA.html"
  - title: "getDatabase (Session - Java)（createonfail 與 isOpen 語意）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDATABASE_METHOD_JAVA.html"
  - title: "recycle (Java)（父子鏈與同執行緒回收規則）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "Database"
apiLang: "java"
---

你在 LotusScript 裡開一個庫,開不到就回 `Nothing`,你習慣性 `If db Is Nothing Then` 一擋,後面就安心用。這個反射動作,搬到 Java 會害你。

因為 Java 的 [`session.getDatabase(server, file)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETDATABASE_METHOD_JAVA.html) **不會**回 `null`。庫不在、路徑打錯、權限不夠 —— 它照樣遞給你一個 `Database` 物件。你 null-check 過了、心裡覺得沒事,往下一行 `db.getView(...)` 才整個炸開。那個物件是真的,但它指向的庫根本沒開。

這篇講在 Java 裡怎麼**取得並持有**一個 `Database` handle:它從哪來、開庫有哪幾條路、上面那個陷阱怎麼擋,還有它在記憶體回收鏈的位置。recycle、執行緒、DQL 這些各自有專文,這裡只在碰到時點一下、把連結留給你。

---

## 重點摘要

- **`Database` 是 `Session` 的小孩**。先有 Session 才生得出 Database;Session 怎麼拿見[在 Java 裡取得 Session](/domino-news/posts/java-session-notesfactory/),這裡假設你已經有一個。
- **開庫有三條主要路**:agent 裡用 `agentContext.getCurrentDatabase()` 拿當前庫;指名開別的庫用 `session.getDatabase(server, file)`;要逐一掃一台伺服器上的庫用 `DbDirectory`。
- **最大的陷阱:`getDatabase` 不回 null**。兩參數版的 `createonfail` 預設是 `true`,官方原文:庫開不到時「creates a Database object even if the specified database cannot be opened」,而且「isOpen is false for the Database object」。所以要擋的不是 `null`,是 `db.isOpen()`。
- **要乾淨的 null**:改用三參數版、`createonfail` 傳 `false` —— 官方原文「If false, returns null if the database cannot be opened」。這時才能回去用你熟悉的 null-check。
- **recycle 鏈有方向**:recycle 掉 `Session`,它底下的 `Database` 一起死;recycle 掉 `Database`,你從它拿的每個 `View` / `Document` 一起死。回收早了,等於把自己正在用的 handle 抽掉。

## Database 從哪來:它是 Session 的小孩

Java 的 [`Database`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDATABASE_CLASS_JAVA.html) 官方定義很短 ——「Represents a Notes database.」 —— 重點在它的**身世**:這個類別 `extends Base`,而且官方寫明它被 `AgentContext`、`DbDirectory`、`Session` 這三者所「contained」。

換句話說,你**不會**憑空 `new` 一個 `Database`。它一定是從上面某個父物件生出來的。這跟 LotusScript 很不一樣 —— LS 可以 `Dim db As New NotesDatabase("", "")` 先生一個空的再 `db.Open`。Java 沒有這條路,一律從 Session(或 agent 的 context、或 DbDirectory)要。

先有 Session 這件事本身在 Java 就不是理所當然:LS 的 `session` 是你從不建立的全域,Java 得自己拿。那是另一個故事,見[在 Java 裡取得 Session:NotesFactory、local 與 remote](/domino-news/posts/java-session-notesfactory/)。這裡假設你手上已經有一個 `session`。

## 開庫的幾條路

**(1) 在 agent 裡,拿「當前這個庫」** —— 最常見,你的 Java agent 就掛在某個庫上:

```java
Database db = agentContext.getCurrentDatabase();
```

`agentContext` 從 `session.getAgentContext()` 來。這條路拿到的就是 agent 所在的庫,不用指名、也不會遇到下面的 isOpen 陷阱(它本來就開著)。

**(2) 指名開另一個庫** —— 跨庫查表、寫 log 到別的庫:

```java
Database db = session.getDatabase("Mail01/ACME", "app/orders.nsf");
```

第一個參數是伺服器(本機傳空字串 `""`),第二個是相對於 data 目錄的路徑。**這條路就是陷阱所在**,下一節細講。

**(3) 掃一台伺服器上的庫** —— 不知道確切檔名、要逐一列舉時,用 `DbDirectory`:

```java
DbDirectory dir = session.getDbDirectory("Mail01/ACME");
Database db = dir.openDatabase("app/orders.nsf");
// 或用 replica ID 開:dir.openDatabaseByReplicaID(...)
// 或開郵件庫:dir.openMailDatabase()
```

`DbDirectory` 還有 `openDatabaseIfModified`(只在庫比某時間新才開)、`createDatabase`(從零建新庫)等。它的概念和 LotusScript 的 `NotesDbDirectory` 一樣,見 [DbDirectory 那篇](/domino-news/posts/notes-db-directory/) —— 但 Java 多一條鐵律:**`DbDirectory` 不能跨執行緒用**(官方原文「do not use DbDirectory across threads」),背景執行緒要自己的那一份,詳見 [NotesThread 那篇](/domino-news/posts/java-notesthread/)。

## 不報錯的那個陷阱:回了物件 ≠ 庫開了

回到第 (2) 條路。`getDatabase` 官方有兩個 overload:

```java
public Database getDatabase(String server, String db)
public Database getDatabase(String server, String db, boolean createonfail)
```

差別全在第三個參數 `createonfail`,而**兩參數版等於把它當成 `true`**。官方逐字說明:

> 「If true or omitted, creates a Database object even if the specified database cannot be opened.」
>
> 「If the database cannot be opened and createonfail is true or omitted, isOpen is false for the Database object.」
>
> 「It will create the in-memory object that refers to the non-existent database.」

翻成白話:你平常寫的 `session.getDatabase(server, file)`,庫開不到時**不回 null**,而是回一個 `isOpen()` 為 `false` 的「空殼」—— 一個指向不存在的庫的記憶體物件。你的 `if (db != null)` 永遠成立,然後下一個 `db.getView(...)` 就丟 `NotesException`。

所以在 Java,擋法有兩種,挑一種守住:

```java
// 擋法 A:收兩參數版的空殼,改問 isOpen
Database db = session.getDatabase("", "app/orders.nsf");
if (db != null && db.isOpen()) {
    // 真的開成了,往下用
}

// 擋法 B:要乾淨的 null,就用三參數版傳 false
Database db = session.getDatabase("", "app/orders.nsf", false);
if (db != null) {          // 官方:「If false, returns null if the database cannot be opened」
    // 這時 null-check 才等於「有開成」
}
```

我個人偏好擋法 B —— 它讓 null-check 回到你從 LotusScript 帶來的直覺。但看過太多舊 code 是擋法 A(甚至兩個都沒擋),所以讀別人的 Java agent 時,看到 `getDatabase` 後面只有 null-check、沒有 isOpen,那行就是潛在的空殼漏接。

(另一個相關事實:Database class 頁說大多數時候「the class library opens a database automatically」,少數例外才要自己管 —— `isOpen` 就是那個「例外」的判斷點。)

## 拿到 Database 之後

handle 拿穩了,後面就是你熟悉的那些入口,方法名幾乎和 LotusScript 一樣、只差大小寫:

- `db.getView("vwOrders")` —— 取視圖或資料夾。
- `db.getDocumentByUNID(unid)` —— 用 UNID 直接開文件。
- `db.createDocument()` —— 建新文件。
- `db.search(formula, null, 0)` —— 用 `@formula` 掃全庫符合條件的文件。
- `db.FTSearch(query, 0)` —— 全文檢索。
- `db.createDominoQuery()` —— 開 DQL 查詢物件。DQL 在 Java 的用法見 [Java 的 DominoQuery 那篇](/domino-news/posts/java-dql-dominoquery/)。

要注意的不是這些方法本身,而是**你用它們拿回來的東西也是 handle**,一樣要管回收。尤其是「掃一堆文件」的迴圈 —— 在 Java 那是記憶體洩漏的頭號來源,正確的迭代與回收順序(先用當前文件取下一個、再 recycle 當前)自成一題,見 [在 Java 裡迴圈 DocumentCollection](/domino-news/posts/java-collection-iteration/)。

## recycle 鏈:誰先死、誰連帶死

這是 Java 比 LotusScript 多出來、而且和 `Database` 直接相關的一件事。[`recycle()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_RECYCLE_METHOD_JAVA.html) 官方原文:「The recycle method unconditionally destroys an object and returns its memory to the system.」為什麼非做不可?因為「Garbage collection has no effect on Domino Objects unless you first explicitly recycle them」—— JVM 的 GC 看不到背後那個 native handle。完整機制(以及四條官方規則、迴圈洩漏)見 [改寫成 Java 後記憶體爆掉?你忘了 recycle()](/domino-news/posts/java-recycle-memory/)。

`Database` 在這條鏈上要記兩件事:

1. **recycle 有父子方向**。官方原文「Recycling a parent recycles all the children.」`Session` 是 `Database` 的父、`Database` 是 `View` / `Document` 的父。所以你 recycle 掉 `Session`,底下的 `db` 跟著死;你 recycle 掉 `db`,從它拿的每個 `View`、`Document` 也跟著死。**反過來講就是陷阱**:在迴圈還在用那些文件時就把 `db` recycle 掉,等於把自己腳下的地板抽走。順序永遠是「先收小孩、留著父母,最後才收父母」。

2. **在哪個執行緒建的,就在哪個執行緒收**。官方原文「Recycle an object in the same thread in which it is created.」你在背景執行緒開的 `Database`,不要丟回主執行緒去 recycle。背景執行緒該有自己的 Session、自己的庫、自己的回收,那套規則見 [NotesThread 那篇](/domino-news/posts/java-notesthread/)。

好消息是:如果你的 agent 就一條執行緒、跑完就結束,通常 recycle 掉最上層的 `Session` 一次,整條鏈連 `db` 一起清掉就夠了。要逐一手動 recycle 的,是那種「長時間跑、迴圈幾萬份文件」的場景。

## 同類別在其他語言

同一個「庫」的概念,三種語言長得不太一樣:

- **LotusScript**:`NotesDatabase`。可以 `Dim db As New NotesDatabase(server, file)` 先生再 `db.Open`,開不到回 `Nothing`(所以 `Is Nothing` 擋得住);**完全不用 recycle**,離開 scope 自動清。這是搬到 Java 最容易回不來的兩個習慣。
- **SSJS(XPages)**:`database` 是現成的全域變數,指向目前這個 NSF,你不用取得它(跟 LS 的 `session` 一樣是給好的);要開別的庫才走 `session.getDatabase(...)`。SSJS 底層就是這套 Java API,但在 XPages 的 request scope 裡,recycle 的責任通常交給框架,你少煩惱很多。SSJS 怎麼碰後端文件見 [XPages 裡其實有兩個 document](/domino-news/posts/ssjs-backend-document/)。
- **一句話對照**:LS 給你 `Nothing` 和自動回收;Java 給你一個**可能沒開成的非 null 物件**、外加**要自己數的 recycle 鏈**。同一行 `getDatabase`,心態要換兩個。
