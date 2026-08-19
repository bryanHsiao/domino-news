---
slug: domino-rest-api-getting-started
title: "Getting Started with the Domino REST API: Turn NSF Data into Endpoints Any Language Can Call"
lang: [zh-TW, en]
pubDate: 2026-08-19
status: staged
tags: [Domino REST API, DevOps]
requester: 使用者 (bryan，選定 DRAPI 系列方向)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) ISSUES→已修（KEEP 開源誤述、DIIOP 退場語氣）"
created: 2026-08-19
updated: 2026-08-19
---

# 研究軌跡 — domino-rest-api-getting-started

DRAPI（Domino REST API / KEEP）系列第 1 篇（8/19，概觀與上手）。系列共 6 篇
（8/19–8/24）：概觀 → 認證/token → scope/schema → 文件 CRUD → DQL/查詢 → 錯誤與安全。

## 研究來源 (Research trail)

### NotebookLM — ⚠️ chat 乾淨但腳本捕捉太早
- Notebook：Domino REST API，
  `https://notebooklm.google.com/notebook/ba6f849d-c040-4f59-ad51-7fb145065180`
- 這個 notebook 的 chat **是乾淨的**（`Existing chat pairs: 0`，非 Java notebook 的
  污染狀態）——但 `ask_question.py` 這次**捕捉太早**，抓到 Gemini 還在生成的
  「Thoughts」佔位、不是最終答案（與 Java notebook 的「拒答」是不同的失敗模式）。
- DRAPI 官方文件本就是一手來源，直接 WebFetch 更準；未反覆重試以免徒增 chat。

### WebFetch — 官方 DRAPI 文件（opensource.hcltechsw.com，逐一驗證非 404）
- `Domino-rest-api/index.html`（overview）— ✅ 逐字 "provides a secure REST API with
  access to HCL Domino servers and databases while running on HCL Domino"（Win/Linux/Mac）。
- `Domino-rest-api/tutorial/index.html`（getting started）— ✅ Installation and
  configuration / Quickstart / Capability Walkthrough（Lab 01 - Log in）/ Swagger UI /
  Postman/curl/Admin UI。
- `Domino-rest-api/topicguides/index.html`（concepts）— ✅ 逐字 "functions as
  middleware, connecting Notes and Domino to a contemporary REST like API consuming
  and producing mostly JSON data"；scope/schema、security/JWT、extensibility、
  auxiliary services（IdP/WebDAV/OData/iCal）。
- `Domino-rest-api/connect.html` — ✅ 佐證 API 基底路徑 `/api/v1`、JWT、Swagger UI。
- 站上 curated 來源清單：`data/notebook-urls-rest-api.txt`。

### 矛盾檢查
各 DRAPI 官方頁彼此一致。DIIOP「老、退場中」為公認事實（CORBA/DIIOP 在近版
Domino 逐步退場），非可引用官方原句、文中未當引用呈現（待 reviewer 確認合理性）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch DRAPI 官方頁，核對兩處逐字引用、`/api/v1`、OpenAPI 3.0.x、
scope/schema/JWT/Swagger 概念、以及「跟傳統存取差在哪」（XPages/DIIOP/agent）的
公允性。

**VERDICT：ISSUES**（1 必修 + 1 建議；核心逐字引用、`/api/v1`、OpenAPI 3.0.x、
scope/schema、JWT、Swagger 全部查證通過）。已處置：

- ✅ **必修：KEEP 開源誤述**——初稿寫「開源代號 KEEP」，暗示產品開源。實情：KEEP 是
  **原專案代號**；DRAPI 是**商用 Domino add-on**，只有**文件**（domino-keep-docs）是
  Apache 2.0。改為「原專案代號 KEEP」並補一句「商用附加元件、要另外安裝、只有文件開源」。
- ✅ **建議：DIIOP「退場」語氣**——DIIOP/CORBA 仍出貨、未正式棄用。把「也在退場」降級
  為 practitioner 觀點「愈來愈少人走的舊路」，不讓它讀成官方 deprecation。
- 佐證細節（reviewer 另查）：login 端點 `POST http://localhost:8880/api/v1/auth`
  → 預設 port **8880**（後續篇會用到）；"All actions in Domino REST API are secured
  with JWT"；OpenAPI 3.0.2（"3.0.x" 正確）；scope/schema 需先「Enable a database」。

## 標題候選
走標題優化 loop：

- [選定] 資訊·好搜：`Domino REST API 上手：把 NSF 資料變成任何語言都能呼叫的 REST 端點`
  — 使用者拍板。產品名 +「上手」好搜（搜 Domino REST API getting started 直接接住），
  後半一句講清好處。系列 opener 合適。
  en 鏡像：`Getting Started with the Domino REST API: Turn NSF Data into Endpoints Any Language Can Call`。
- [汰除] 問題先行：`想讓現代前端讀寫 Domino 資料？Domino REST API 讓你不必再手刻 agent` — 痛點好，但沒帶「上手/getting started」這個系列 opener 該有的搜尋詞。
- [汰除] 概念 hook：`Domino REST API：在你的 NSF 之上，開一扇任何語言都能進的標準 REST 門` — 點題漂亮，但搜尋性弱、少了「上手」定位。

## 查證 checklist
- [x] 研究鏈：NotebookLM（捕捉太早）→ WebFetch 官方 DRAPI 文件為主
- [x] 官方 DRAPI 四頁 WebFetch 驗證非 404
- [x] 矛盾檢查（各官方頁一致）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ ISSUES→已修

## 異動日誌
- 2026-08-19 NotebookLM（捕捉太早）→ WebFetch 官方 DRAPI 文件、雙語草稿、標題 loop、sidecar（Opus 4.8）
- 2026-08-19 獨立 fact-check（subagent）→ ISSUES；修 KEEP 開源誤述 + DIIOP 退場語氣（Opus 4.8）
