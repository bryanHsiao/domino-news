---
title: "DQL 明明沒寫錯，卻一筆都查不到？因為那個 form 少了 dql mode"
description: "上一篇是用 unid 拿單一份文件。真正常見的是「符合條件的一批」——所有未完成的 todo、某區的所有客戶。DRAPI 給兩條路：GET /lists/{view} 讀一個 view/folder，或 POST /query 跑 DQL。DQL 還支援參數化查詢（?VAR + variables，防注入）。但有個接續上一篇的坑：一個 form 若沒有 dql mode，DQL 就完全看不到它。這篇把兩條查詢路徑、分頁、mode 陷阱與 DQL 存取控制講清楚。DRAPI 系列第五篇。"
pubDate: 2026-08-23T07:30:00+08:00
lang: zh-TW
slug: domino-rest-api-query-dql
tags:
  - "Domino REST API"
  - "DQL"
  - "Tutorial"
sources:
  - title: "Domino REST API — Reserved Form Mode names"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/modenames.html"
  - title: "Domino REST API — Enable a database (query & lists)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/database/enablingadb.html"
  - title: "Domino REST API — DQL query tutorial"
    url: "https://opensource.hcltechsw.com/domino-keep-tutorials/pages/todo/dataAccess/query.html"
---

[上一篇](/domino-news/posts/domino-rest-api-document-crud)是拿著 `unid` 讀單一份文件。但你多數時候要的不是某一份，而是**符合條件的一批**——所有未完成的 todo、某個區的所有客戶、這個月建立的所有訂單。

DRAPI 給你兩條路拿一批：讀一個現成的 **view/folder**（`/lists`），或直接跑 **DQL**（`/query`）。這一篇把兩條都走一遍，並補上一個接續上一篇 mode 概念的坑——**一個 form 沒有 `dql` mode，DQL 就完全看不到它**。

---

## 重點摘要

- **讀 view / folder**：`GET /api/v1/lists/{viewname}?dataSource=<scope>`，用 `count` 和 `start` 分頁。
- **跑 DQL**：`POST /api/v1/query?action=execute&dataSource=<scope>`，body 帶一個 `query` 字串。
- **DQL 支援參數化**：query 裡用 `?VAR` 佔位、再用 `variables` 物件帶值——別把使用者輸入字串拼進 DQL。
- **mode 陷阱**：DQL 只看得到「有 `dql` mode」的 form——一個 form 沒有 `dql` mode，DQL 就一筆都查不到它。
- **DQL 要另外開**：schema 要設 `dqlAccess: true`，還能用 `dqlFormula`（一段要 evaluate 成 `@True` 的 Notes formula）限制誰能用。

---

## 讀一個 view：/lists

如果你要的資料剛好有一個現成的 view 或 folder，最省事的就是直接讀它：

```bash
curl "http://localhost:8880/api/v1/lists/Customers?dataSource=demo&count=25&start=0" \
  -H "Authorization: Bearer <token>"
```

`Customers` 是 view 名，`dataSource` 一樣是你的 [scope 名](/domino-news/posts/domino-rest-api-document-crud)（這個 `/lists/{view}` 端點也接受 `db=` 當 `dataSource` 的別名——官方教學就是用 `db=` 寫的，兩個都通）。回來的是這個 view 裡的一批項目。要分頁就用 `count`（一次幾筆）和 `start`（從第幾筆開始）——大 view 一定要分頁，不要一次全撈。

這條路的好處是快、而且沿用 view 既有的排序與選取條件；限制是你只能拿到 view 有的欄位、也受限於有沒有現成的 view。

## 跑 DQL：/query

要更靈活的條件查詢，就走 [DQL](https://opensource.hcltechsw.com/domino-keep-tutorials/pages/todo/dataAccess/query.html)。它是一個 `POST`，把查詢放進 body：

```bash
curl -X POST "http://localhost:8880/api/v1/query?action=execute&dataSource=todorest" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "query": "form = '\''todo'\'' and completed = ?STATUS",
        "variables": { "STATUS": "false" },
        "maxScanDocs": 500000,
        "timeoutSecs": 300,
        "noViews": false
      }'
```

回來的是「符合這個 DQL 的一批文件」。幾個值得記的欄位：

- **`query`**：DQL 字串本身。
- **`variables`**：這是重點——DQL 支援**參數化查詢**。query 裡用 `?STATUS` 這種佔位符，實際的值放進 `variables` 物件。**別把使用者輸入直接字串拼進 `query`**，用 `?VAR` + `variables` 才安全，道理跟 SQL 的 prepared statement 一樣。
- **`maxScanDocs` / `timeoutSecs`**：DQL 掃描與逾時的護欄，防一個爛查詢把 server 拖垮。
- **`noViews`**：控制 DQL 要不要動用 view 索引來加速。

`/query` 也吃 `count` / `start` 做分頁，跟 `/lists` 一樣。

## 那個坑：DQL 只看得到有 dql mode 的 form

這是接續[上一篇 mode 概念](/domino-news/posts/domino-rest-api-document-crud)、最容易踩的一顆雷。你可能已經為某個 form 開了 `default` mode（所以 CRUD 都通），然後跑 DQL 卻**一筆都查不到那個 form 的文件**——不是 DQL 寫錯，是那個 form **沒有 `dql` mode**。

官方講得毫不含糊：

> If a form does not include a `dql` mode, no data for that form will be returned in DQL queries.

`dql` 是 DRAPI 的[五個保留 mode](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/modenames.html)之一（`default` / `dql` / `odata` / `raw` / `vsheet`），而且它不只是開關——**`dql` mode 還決定 DQL 查詢回傳哪些欄位**。所以要讓一個 form 能被 DQL 查、又要控制它回什麼，你得在 schema 裡替它加一個 `dql` mode。

## DQL 要另外開，還能用 formula 限制

就算 form 有了 `dql` mode，DQL 這個能力本身還要在 schema 層級開：設 `dqlAccess: true`。而且你可以再加一道 `dqlFormula`——一段 Notes formula，它必須 evaluate 成 `@True`，DQL 才被允許（[官方](https://opensource.hcltechsw.com/Domino-rest-api/howto/database/enablingadb.html)的預設就是 `@True`、不限制）。這給你一個用熟悉的 @formula 去限制「誰、在什麼條件下能跑 DQL」的閘門。

## 兩條路怎麼選

- **有現成 view、只要它的欄位** → `/lists/{view}`。最快、最省，沿用 view 的排序與選取。
- **要靈活條件、跨欄位、動態查** → `/query` 跑 DQL，記得參數化。
- 兩條都要分頁（`count` / `start`），也都要記得：**form 要有對應的 mode**——`/lists` 走 `default`（或你讀取時指定的）、`/query` 一定要 `dql`。

下一篇是系列收尾：**錯誤處理與安全**——REST 這端的錯誤長怎樣、Readers 欄位在 DQL 與 lists 上還算不算數、以及上線前該收的幾個口。
