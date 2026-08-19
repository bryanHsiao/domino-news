---
slug: domino-rest-api-query-dql
title: "Your DQL Is Correct but Returns Nothing? The Form Is Missing a dql Mode"
lang: [zh-TW, en]
pubDate: 2026-08-23
status: staged
tags: [Domino REST API, DQL, Tutorial]
requester: 使用者 (bryan，DRAPI 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；1 optional（db= 別名）已補"
created: 2026-08-19
updated: 2026-08-19
---

# 研究軌跡 — domino-rest-api-query-dql

DRAPI 系列第 5 篇（8/23，DQL 與查詢）。承 [[domino-rest-api-document-crud]]（mode/dataSource）。

## 研究來源 (Research trail)

### NotebookLM — 沿用系列判斷，走 WebFetch/WebSearch 官方文件

### WebFetch / WebSearch — 官方 DRAPI 文件
- `references/usingdominorestapi/modenames.html` — ✅ 5 個保留 mode（default/dql/odata/
  raw/vsheet）；逐字「If a form does not include a `dql` mode, no data for that form will
  be returned in DQL queries」；「The `dql` mode specifies what fields are returned when
  querying documents using DQL」。
- `howto/database/enablingadb.html` — ✅ `POST /api/v1/query?dataSource=`；
  `GET /api/v1/lists/{viewname}?dataSource=`；count/start；`dqlAccess: true` +
  `dqlFormula`（`@True` 預設）。
- `domino-keep-tutorials/.../dataAccess/query.html` — ✅ `POST {{HOST}}/query?action=execute&dataSource=todorest`；
  body `{query, variables, maxScanDocs, timeoutSecs, viewRefresh, noViews}`；參數化
  `?STATUS` + `variables`。

### 矛盾檢查
各頁一致。DQL mode 陷阱與 [[domino-rest-api-document-crud]] 的 mode 概念一貫。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch/WebSearch + OpenAPI，核對 /lists 與 /query 端點、`action=execute`、
body 欄位、參數化、逐字引用、5 mode、`dqlAccess`/`dqlFormula`、count/start。

**VERDICT：PASS**（零必修；全部查證正確）。
- `GET /api/v1/lists/{name}?dataSource=` + count/start ✅（OpenAPI 確認）
- `POST /api/v1/query?action=execute&dataSource=` + body `{query, variables, maxScanDocs,
  timeoutSecs, noViews}` ✅（tutorial + OpenAPI QueryRequest schema）
- 參數化 `?VAR` + `variables`、injection-safe 框架 ✅
- 逐字引用 word-for-word ✅；5 保留 mode 正確完整；`dql` mode 也決定回傳欄位 ✅
- `dqlAccess: true` + `dqlFormula`（`@True` 預設）✅
- 套 1 optional：官方 `/lists` 教學用 `db=`（dataSource 別名）→ 內文補一句「`db=` 亦通」。

## 標題候選
走標題優化 loop：

- [汰除] 資訊·好搜：`Domino REST API 查詢：讀 view 用 /lists、跑 DQL 用 /query（而且 form 要有 dql mode）` — 端點齊、好搜，但偏長。
- [選定] 問題先行：`DQL 明明沒寫錯，卻一筆都查不到？因為那個 form 少了 dql mode`
  — 使用者拍板。直接把最會踩、最難自己想通的坑（DQL 沒錯卻查不到＝缺 dql mode）當標題。
  en 鏡像：`Your DQL Is Correct but Returns Nothing? The Form Is Missing a dql Mode`。
- [汰除] 概念 hook：`在 Domino REST API 拿一批文件的兩條路：/lists 讀 view、/query 跑 DQL` — 點出兩路，但沒帶痛點。

## 查證 checklist
- [x] 研究鏈：WebFetch/WebSearch 官方 DRAPI 文件為主
- [x] 官方三頁 + OpenAPI 驗證非 404
- [x] 矛盾檢查（各頁一致、mode 概念一貫）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 modenames 67% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-19 WebFetch/WebSearch 官方文件、雙語草稿、修 diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-19 獨立 fact-check（subagent）→ PASS；補 db= 別名一句（Opus 4.8）
