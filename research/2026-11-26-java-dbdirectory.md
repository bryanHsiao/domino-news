---
slug: java-dbdirectory
title: "Java 列舉 Domino 資料庫:getFirstDatabase 給你的是「關著」的 Database"
lang: zh-TW · en
pubDate: 2026-11-26T07:30:00+08:00
tags: ["Java"]
status: staged
requester: 使用者（排 11/24-30 Java/SSJS 續寫）
author_model: Opus 4.8
review_model:
review_result:
created: 2026-11-24
updated: 2026-11-24
---

# Research trail — java-dbdirectory (2026-11-26)

**Topic**: `lotus.domino.DbDirectory`（Java）—— 列舉/開啟 server 上的 database。
招牌坑:getFirstDatabase 回「關著」的 Database(要 db.open()),open* 回「開好」的。
插旗 `coversClass: DbDirectory` ＋ `apiLang: java`。排程 #3（11/26）。

## 為什麼是這題

- map 缺口:DbDirectory 在 Java gap 清單、無對應文。
- Java 側實用:後端 server 層盤點/維護/報表的入口。

## 研究來源

- **NotebookLM**：未用，走官方文件。
- **WebFetch（web-fetch agent，含 404 校正 3 處）**：
  - `H_NOTESDBDIRECTORY_CLASS_JAVA.html`（class）→「Represents the Domino databases
    on a server or the local computer.」
  - `H_GETDBDIRECTORY_METHOD_JAVA.html` → `getDbDirectory(String server)`;「Use null
    to indicate the session's environment. Must be null for remote (IIOP) operations.」
  - `H_GETFIRSTDATABASE_METHOD_JAVA.html` →「The returned database is closed. If you do
    not open the database, only a subset of its methods are available.」/「Each time you
    call this method, the database directory is reset and a new search is conducted.」
  - `H_CONSTANTS_JAVA_DATABASEDIRECTORY.html` → DATABASE(1247)/TEMPLATE(1248)/
    REPLICA_CANDIDATE(1245)/TEMPLATE_CANDIDATE(1246) + 各自意義。
  - `H_OPENBYREPLICAID_METHOD_JAVA.html`、`H_OPEN_METHOD_JAVA.html`（openDatabase +
    failover「always false」for IIOP）、`H_OPENIFMODIFIED_METHOD_JAVA.html`（date 不可
    null）、`H_CREATE_METHOD_JAVA.html`（「blank ... does not contain any forms or views」）。
  - 範例（H_EXAMPLES_GETFIRSTDATABASE…）：掃 local templates、迴圈內 db.open() 後讀
    getLastModified —— 正好佐證「關著要先 open」。
- **矛盾檢查**：無。404 校正：DBDIRECTORY→NOTESDBDIRECTORY、OPENDATABASEBYREPLICAID→
  OPENBYREPLICAID、CREATEDATABASE→CREATE。

## 獨立審查 (review)

本篇未跑獨立審查模型;官方逐條查證 + 自我驗證清單。review 欄留空。

## 查證 checklist

- [x] map 缺口（DbDirectory 無 Java 旗）、不重疊
- [x] 官方逐字（web-fetch agent 9 URL 確認、校正 3 個錯檔名）
- [x] 關著 vs 開好、四常數值、getFirstDatabase reset、IIOP null、createDatabase 白紙 查準
- [x] 矛盾檢查:無
- [ ] coversClass: DbDirectory + apiLang java（map-lang-report 待驗）
- [ ] inline-link diversity（每語言 3 URL 各 33%）
- [ ] build / humanizer

## 標題候選

- [汰除] 純功能：`Java 的 DbDirectory:列資料庫` — 目錄。
- [選定] 招牌坑：`Java 列舉 Domino 資料庫:getFirstDatabase 給你的是「關著」的 Database`
  — 點出最容易中的「關著」坑，好搜、不過度承諾。
  en 鏡像：`Iterating Domino Databases in Java: getFirstDatabase Hands You a Closed Database`

## 異動日誌

- 2026-11-24 建檔 / web-fetch agent 研究官方文件（含 404 校正）/ 寫雙語草稿 / 進 _pending
