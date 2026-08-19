---
slug: domino-rest-api-document-crud
title: "Creating a Document in the Domino REST API: Why It Needs a Form Field and a dataSource"
lang: [zh-TW, en]
pubDate: 2026-08-22
status: staged
tags: [Domino REST API, Tutorial]
requester: 使用者 (bryan，DRAPI 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；UPDATE/DELETE 端點查證正確；3 polish 已套"
created: 2026-08-19
updated: 2026-08-19
---

# 研究軌跡 — domino-rest-api-document-crud

DRAPI 系列第 4 篇（8/22，文件 CRUD）。承 [[domino-rest-api-scope-schema]]（dataSource=scope）。

## 研究來源 (Research trail)

### NotebookLM — 沿用系列判斷，走 WebFetch/WebSearch 官方文件

### WebFetch / WebSearch — 官方 DRAPI 文件
- WebSearch（限 opensource.hcltechsw.com）— `dataSource` = scope name「used in all CRUD
  operations」；form 有 1:n **mode**、第一個 `default` 用於建立；OData 需 `odata` mode；
  formModes 定義欄位與存取；建立需 `Form` 欄位。
- `howto/database/enablingadb.html` — ✅ CREATE `POST /api/v1/document`（dataSource 必填、
  body 含 `Form`、回 `@meta` unid/noteid）；READ `GET /api/v1/document/{unid}/{mode}`
  （範例 `/$Unid/default?db=demo`）。
- `tutorial/quickstart.html` — ✅（環境/測試工具：Swagger/Postman/curl）。
- ⚠️ **UPDATE/DELETE 端點未在抓到的頁面直接確認**：文中依標準 REST 樣式寫 `PATCH`
  （局部）/`PUT`（取代）/`DELETE` `/document/{unid}` — **交給獨立 reviewer 查證 OpenAPI**，
  回報若有出入即修。

### 矛盾檢查
CREATE/READ 與官方一致。UPDATE/DELETE 待 reviewer 對 OpenAPI 確認。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
特別交代核對 CREATE/READ/UPDATE/DELETE 的**確切動詞與路徑**（mode 是 path 段還是
query？dataSource vs db？PATCH 是否局部、PUT 是否取代），以及 dataSource=scope 逐字、
mode 概念、Form 必填、items→JSON。

**VERDICT：PASS**（無 blocker；關鍵動詞/路徑全部查證正確）。重點確認：
- **CREATE** `POST /api/v1/document?dataSource=` + `Form` + 回 `@meta`(unid/noteid) ✅
- **READ** `GET /document/{unid}/{mode}` — **mode 是 path 段**（非 query）✅；`dataSource` 為正規、`db` 是別名
- **UPDATE** `PATCH`(局部)/`PUT`(整份取代、未帶的欄位會清空) `/document/{unid}` ✅（我原猜正確）
- **DELETE** `DELETE /document/{unid}?dataSource=` ✅
- mode 概念（default/odata/dql、formModes、建立用 default）、Form 必填、items→JSON、port 8880 ✅

套用 3 polish：
- ✅ **去假逐字引用**：「scope name used in all CRUD operations」原加引號當逐字，實為 paraphrase → 去引號改敘述。
- ✅ **mode 讀取可省略**：補「省略時用 default」。
- ✅ **noteid 為數字**：範例 `"1A2B"`（字串）→ `2458`（數字）。

## 標題候選
走標題優化 loop：

- [汰除] 資訊·好搜：`Domino REST API 文件 CRUD：用 JSON 對 NSF 文件增刪查改，dataSource 就是你的 scope` — CRUD 好搜、點破 dataSource，但偏長。
- [選定] 問題先行：`在 Domino REST API 建文件，為什麼一定要帶 Form 欄位和 dataSource？`
  — 使用者拍板。Form 必填 + dataSource 是 Domino 開發者最會愣的兩點，直接當標題。
  en 鏡像：`Creating a Document in the Domino REST API: Why It Needs a Form Field and a dataSource`。
- [汰除] 概念 hook：`一份 Domino 文件，在 REST 這端就是一包帶 @meta 的 JSON` — 點題好，但搜尋性弱。

## 查證 checklist
- [x] 研究鏈：WebFetch/WebSearch 官方 DRAPI 文件為主
- [x] CREATE/READ 端點官方確認
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 body 漏放外部連結已補）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS（UPDATE/DELETE 端點查證正確、3 polish 已套）

## 異動日誌
- 2026-08-19 WebFetch/WebSearch 官方文件、雙語草稿、補外部 inline 連結、標題 loop、sidecar（Opus 4.8）
- 2026-08-19 獨立 fact-check（subagent）→ PASS；套 3 polish（去假引用 / mode 可省略 / noteid 數字）（Opus 4.8）
