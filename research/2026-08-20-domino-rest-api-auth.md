---
slug: domino-rest-api-auth
title: "Getting 401s from the Domino REST API? Understand Its JWT Authentication and Scopes First"
lang: [zh-TW, en]
pubDate: 2026-08-20
status: staged
tags: [Domino REST API, Security, OIDC]
requester: 使用者 (bryan，DRAPI 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；2 建議修正（functional accounts 範圍、三來源語氣）已套"
created: 2026-08-19
updated: 2026-08-19
---

# 研究軌跡 — domino-rest-api-auth

DRAPI 系列第 2 篇（8/20，認證與 token）。承 [[domino-rest-api-getting-started]]。

## 研究來源 (Research trail)

### NotebookLM — 沿用 #1 判斷（腳本捕捉時機問題），走 WebFetch 官方文件

### WebFetch — 官方 DRAPI 文件（逐一驗證非 404）
- `references/security/authentication.html` — ✅ 「All actions in Domino REST API
  are secured with JWT」；JWT claim（iss/sub/scopes/iat/exp/aud）；aud 必為 "Domino"；
  scopes 空格分隔；三來源：Domino 自簽（隨機對稱金鑰、每次重啟變；或 RSA
  `JwtPrivateKeyFile`/`JwtPublicKeyFile`）、外部 OIDC（Entra/Keycloak、clientId/
  clientSecret、.well-known discovery）、idpcat.nsf OIDC（推薦、Domino 14+）。
- `tutorial/walkthrough/lab-01.html` — ✅ 登入 `POST http://localhost:8880/api/v1/auth`
  body `{"username":"KEEP Admin","password":"passw0rd"}`、Content-Type application/json；
  回 JSON 含 bearer token（可貼 jwt.io）。
- `references/functionalUsers.html` — ✅ functional accounts（服務對服務）。

### 矛盾檢查
各 auth 頁一致。「不用 session/LTPA、改 JWT」為 DRAPI 設計事實（待 reviewer 確認公允）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
核對 `/api/v1/auth` 端點/body、JWT claims（aud 必為 Domino、scopes 空格分隔）、
`Authorization: Bearer`、兩處逐字引用、三來源、functional accounts、「不用 session/LTPA」。

**VERDICT：PASS**（2 建議修正、無 blocker；核心機制全部查證通過：`/api/v1/auth`、port 8880、body、curl、`Authorization: Bearer`、JWT claims、aud=Domino、scopes 空格分隔、兩處逐字引用、重啟換金鑰、RSA 穩定、idpcat 推薦 D14+）。已處置：
- ✅ **functional accounts 範圍**：初稿講成一般服務對服務資料帳號；官方限定它給管理／監控端點（Management console 8889 / Metrics 8890 / Health check 8886）、明講「不需存取一般端點」。已改為正確範圍、去掉資料 API 服務帳號的暗示。
- ✅ **「三種來源」語氣**：官方實際 taxonomy 是 `jwt`/`oidc`/`oidc-idpcat`（自簽另計）；把「官方文件列三種」軟化為「大致有三種路子」。

## 標題候選
走標題優化 loop：

- [汰除] 資訊·好搜：`Domino REST API 認證：拿一個 JWT，把 Bearer token 帶在每個請求上` — 好搜、講清機制，但沒帶讀者的實際痛點。
- [選定] 問題先行：`呼叫 Domino REST API 一直 401？先搞懂它的 JWT 認證與 scope`
  — 使用者拍板。401 是呼叫者最常撞的痛點（token 過期/重啟換金鑰/scope 對不上），
  文中「兩個實務提醒」正好呼應。en 鏡像：`Getting 401s from the Domino REST API?
  Understand Its JWT Authentication and Scopes First`。
- [汰除] 概念 hook：`Domino REST API 不用 session、不用 LTPA：身分封進一個 JWT` — 點出與傳統的差別，但搜尋性弱。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 DRAPI auth 文件為主
- [x] 官方三頁 WebFetch 驗證非 404
- [x] 矛盾檢查（各 auth 頁一致）
- [x] inline-link diversity 通過（4 個相異 URL 各 2 次 = 各 25%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS（2 建議修正已套）

## 異動日誌
- 2026-08-19 WebFetch 官方 auth 文件、雙語草稿、標題 loop、sidecar（Opus 4.8）
- 2026-08-19 獨立 fact-check（subagent）→ PASS；套 2 修正（functional accounts 範圍 / 三來源語氣）（Opus 4.8）
