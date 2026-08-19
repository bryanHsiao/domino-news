---
slug: domino-rest-api-scope-schema
title: "Scopes and Schemas in the Domino REST API: How an NSF Becomes REST Endpoints (Exposing Nothing by Default)"
lang: [zh-TW, en]
pubDate: 2026-08-21
status: staged
tags: [Domino REST API, Security]
requester: 使用者 (bryan，DRAPI 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；2 精確化（$DATA 萬用值、Admin UI 名稱）已套"
created: 2026-08-19
updated: 2026-08-19
---

# 研究軌跡 — domino-rest-api-scope-schema

DRAPI 系列第 3 篇（8/21，scope 與 schema）。承 [[domino-rest-api-getting-started]]、
[[domino-rest-api-auth]]（JWT scopes claim）。

## 研究來源 (Research trail)

### NotebookLM — 沿用系列判斷（腳本捕捉時機），走 WebFetch 官方文件

### WebFetch — 官方 DRAPI 文件（逐一驗證非 404）
- `references/schemacomponents/index.html` — ✅ schema components「essential for
  developers to configure and customize the API exposure of Domino applications」；
  schema/scope「two key concepts for managing API access to Domino databases」；
  scope「specify and limit the resources an API can access… based on the authenticated
  user's requirements and database access control」。
- `references/usingdominorestapi/index.html` — ✅ 逐字「Activate the schema by creating
  a scope (Rest mapping)」；可開的元件 forms/views/folders/agents/document items；
  流程（建 schema → enable 元件 → 建 scope 活化 → 測 → OAuth）。
- `howto/index.html` — ✅ Enable a database；schema JSON（Edit / Export as JSON file）；
  Admin UI Design tab；Schema Management。config DB 名稱這頁未明講（未寫死 keepconfig.nsf）。

### 矛盾檢查
各頁一致。「scope 疊在 Domino ACL/Readers 之上、底層安全仍算」由 scope 定義的
「database access control」一句支撐（待 reviewer 確認）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
核對三處逐字引用、schema=白名單/scope=活化的模型是否顛倒、scope 名 ↔ JWT scopes
claim、「ACL/Readers 仍算」是否過度、secure-by-default、流程。

**VERDICT：PASS**（零必修；三處逐字引用全 word-for-word、schema=白名單/scope=活化模型未顛倒、secure-by-default、ACL/Readers 仍算 全部通過）。套用 2 精確化：
- ✅ **$DATA 萬用值**：scope 名↔JWT claim 非嚴格 1:1——`$DATA` 是萬用值（使用者有權限的所有應用），補一句說明 token 不必逐一列 scope 名。
- ✅ **Admin UI 名稱**：初稿「Design tab」官方查無此 tab；官方稱「Schema and Scope Management UI」、schema 存在 DB 的 design 資源裡。已改正。

## 標題候選
走標題優化 loop：

- [選定] 資訊·好搜：`Domino REST API 的 scope 與 schema：一個 NSF 怎麼變成 REST 端點（而且預設什麼都不開）`
  — 使用者拍板。關鍵詞（scope/schema）好搜 + secure-by-default 的鉤子（預設什麼都不開）。
  en 鏡像：`Scopes and Schemas in the Domino REST API: How an NSF Becomes REST Endpoints (Exposing Nothing by Default)`。
- [汰除] 問題先行：`DRAPI 裝好、token 也拿了，卻打不到資料？因為還沒建 schema 和 scope` — 痛點好，但比較適合放進內文。
- [汰除] 概念 hook：`schema 決定露什麼、scope 決定門叫什麼：DRAPI 怎麼把 NSF 開成 REST` — 點題準，但少了搜尋詞。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 DRAPI schema/scope 文件為主
- [x] 官方三頁 WebFetch 驗證非 404
- [x] 矛盾檢查（各頁一致）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS（2 精確化已套）

## 異動日誌
- 2026-08-19 WebFetch 官方 schema/scope 文件、雙語草稿、標題 loop、sidecar（Opus 4.8）
- 2026-08-19 獨立 fact-check（subagent）→ PASS；套 2 精確化（$DATA 萬用值 / Admin UI 名稱）（Opus 4.8）
