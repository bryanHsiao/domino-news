---
title: "Java 列舉 Domino 資料庫:getFirstDatabase 給你的是「關著」的 Database"
description: "一個 Java agent 要掃一台 server 上的所有資料庫——盤點、報表、找出某個 template 的所有實例、依修改日期篩。你用 DbDirectory:getDbDirectory 拿到目錄、getFirstDatabase/getNextDatabase 一個一個走。但有個坑:getFirstDatabase 回給你的 Database 是「關著」的,不先 db.open() 大部分方法都不能用。相對地,openDatabase / openDatabaseByReplicaID 那一系列回的才是「開好」的。這篇講怎麼拿 DbDirectory、四個 type 常數、關著 vs 開好的差別、依 replica ID / 修改日期開庫,以及 createDatabase 建出來的是張白紙。"
pubDate: 2026-11-26T07:30:00+08:00
lang: zh-TW
slug: java-dbdirectory
tags:
  - "Java"
sources:
  - title: "DbDirectory class (Java)（getDbDirectory、getFirstDatabase/getNextDatabase、open* 系列）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDBDIRECTORY_CLASS_JAVA.html"
  - title: "getFirstDatabase (DbDirectory - Java)（回傳的 database 是關著的）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTDATABASE_METHOD_JAVA.html"
  - title: "openDatabaseByReplicaID (DbDirectory - Java)（依 replica ID 開庫）— HCL Domino 14.5 Designer Help（官方）"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENBYREPLICAID_METHOD_JAVA.html"
relatedJava: []
relatedSsjs: []
coversClass: "DbDirectory"
apiLang: "java"
cover: "/covers/java-dbdirectory.webp"
coverStyle: "oil-chiaroscuro"
---

一個 Java agent 要掃一台 server 上的資料庫:盤點有哪些庫、哪些是某個 template 生出來的、哪些最近有改。你找到 `DbDirectory`,`getDbDirectory` 拿到目錄、`getFirstDatabase` / `getNextDatabase` 一個一個走。

你拿到第一個 `Database`,想讀它的標題、view 數、最後修改時間 —— 結果大部分方法回空的或炸掉。因為 [`getFirstDatabase`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_GETFIRSTDATABASE_METHOD_JAVA.html) 回給你的 `Database` 是**關著的**。不先 `db.open()`,官方說「only a subset of its methods are available」。

這篇講怎麼拿 `DbDirectory`、四個 type 常數、「關著 vs 開好」的差別(這是最容易中的坑)、依 replica ID / 修改日期開庫,還有 `createDatabase` 建出來是張白紙。

---

## 拿到 DbDirectory

[`DbDirectory`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESDBDIRECTORY_CLASS_JAVA.html) 官方定義「Represents the Domino databases on a server or the local computer.」。從 Session 建:

```java
DbDirectory dir = session.getDbDirectory(null);   // null = 這個 session 的環境（本機）
// session.getDbDirectory("Mail/Acme") → 指定 server
```

- **本機是 `null`,不是空字串** —— 官方:「Use null to indicate the session's environment.」。
- 遠端有硬規定:「Must be null for remote (IIOP) operations.」—— IIOP 連線只能 null、不能指定別台 server。

## 列舉:getFirstDatabase(type) + getNextDatabase

`getFirstDatabase(int type)` 配 `getNextDatabase()` 走訪。`type` 是四個常數(官方 constants 頁):

| 常數 | 值 | 官方意義 |
|---|---|---|
| `DbDirectory.DATABASE` | 1247 | any database (NSF, NSG, or NSH file) |
| `DbDirectory.TEMPLATE` | 1248 | any template (NTF file) |
| `DbDirectory.REPLICA_CANDIDATE` | 1245 | any database or template not disabled for replication |
| `DbDirectory.TEMPLATE_CANDIDATE` | 1246 | any database or template |

一個細節:「Each time you call this method, the database directory is reset and a new search is conducted.」—— 每次 `getFirstDatabase` 都會**重設**目錄、重新搜一次。所以**別在迴圈中途又呼叫 `getFirstDatabase`**,會從頭開始。

## 招牌坑:getFirstDatabase 回的 Database 是「關著」的

這是用這個類別最容易中的一刀。官方 Usage 寫得很白:「The returned database is closed. If you do not open the database, only a subset of its methods are available. See isOpen in Database.」

所以走訪時,**每一個 database 要先 `db.open()` 才能用大部分方法**:

```java
DbDirectory dir = session.getDbDirectory(null);
Database db = dir.getFirstDatabase(DbDirectory.TEMPLATE);   // 關著的
while (db != null) {
  System.out.println(db.getTemplateName());   // 少數屬性關著也能讀
  db.open();                                   // ← 沒這行，下面讀不到
  System.out.println("最後修改：" + db.getLastModified().getLocalTime());
  db = dir.getNextDatabase();                  // 下一個，一樣是關著的
}
```

像 `getTemplateName()`、檔名這類少數屬性關著就能讀;但 `getLastModified()`、`getViews()`、開文件這些,**沒 open 就拿不到**。症狀是「迴圈跑得動、但該有的資料全空」—— 八成就是漏了 `db.open()`。

## open* 系列:這些回的是「開好」的

跟 `getFirstDatabase` 相反,`open*` 那一組**回傳的 Database 已經開好**(或 `null`),不用再 open:

- `openDatabase(dbfile)` / `openDatabase(dbfile, failover)` —— 開一個庫。`failover` 給 `true` 時,本機開不成會試叢集裡別台(官方:「if there is a cluster」);但「For remote (IIOP) access, failover is always false.」。
- [`openDatabaseByReplicaID(rid)`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_OPENBYREPLICAID_METHOD_JAVA.html) —— 依 replica ID 開(不管檔名 / 路徑搬到哪,replica ID 不變,最穩)。
- `openDatabaseIfModified(dbfile, date)` —— 只在「自 date 後有文件被改過」才開,否則不開;`date` 不能 null。適合「有變才處理」的排程。
- `openMailDatabase()` —— 開目前使用者的 mail 庫。

記法很簡單:**「列舉」(getFirstDatabase)回關著的、「開」(open*)回開好的。** 搞混就會到處漏 open 或重複 open。

## createDatabase:一張白紙

`createDatabase(dbfile)` / `createDatabase(dbfile, open)` 建新庫,`open` 決定建完開不開。官方提醒:「Because the new database is not based on a template, it's blank and does not contain any forms or views.」—— 這樣建出來**沒有任何 form / view**,要設計得自己補(或改用 template 複製的方式)。

## 同類別在其他語言

同一個 `DbDirectory`:

- **LotusScript**:`NotesDbDirectory`,`GetFirstDatabase` / `GetNextDatabase` / `OpenDatabase` 都在,一樣「GetFirstDatabase 回關著的庫、要先 `.Open`」,不用 recycle。
- **SSJS / XPages**:一樣 `session.getDbDirectory()`,在 XPages 做管理工具(列庫、依 replica 開)時會用到。
- **Java 專屬的**不是 API(方法共用),而是場景:後端 / 排程的 Java agent 做 server 層盤點、維護、報表時,`DbDirectory` 是入口;只要記得 `getFirstDatabase` 回的是關著的、`open*` 回的是開好的,這兩種別搞混。
