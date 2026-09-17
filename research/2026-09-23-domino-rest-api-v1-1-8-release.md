---
slug: domino-rest-api-v1-1-8-release
title: "DRAPI 1.1.8 發布重點"
lang: [zh-TW, en]
pubDate: 2026-09-23
status: staged（_pending）
tags: [Domino REST API, Release Notes]
requester: 使用者 (bryan，指定寫 DRAPI 1.1.8 whatsnew；entitlement 篇順延)
author_model: claude-opus-4-8
review_model: (待 fact-check)
created: 2026-09-18
updated: 2026-09-18
---

# 研究軌跡 — domino-rest-api-v1-1-8-release

release-notes 型。承 domino-rest-api-v1-1-7-release（站上已有 1.1.7 篇）。TYPE=Release Notes。

## 來源（單一官方 whatsnew 頁，WebFetch 第一手）

- **v1.1.8 whatsnew**（[官方](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html)，release 2026-09-14）——全文 WebFetch，逐項擷取（不摘掉細節）。
- 內容組織成「**行為改變（會咬人）→ 新端點/功能 → 韌性/Admin UI → 修正**」，非流水帳。
- **行為改變（重點先講）**：`richTextAs` 預設改 HTML；`POST v1/query/qrp/json` 現在強制要 `forms`；`GET pim-v1/calendar/profile`→`calendarprofile` 改名；calendar entry 建/改必須 date/timezone/duration（時區改用 Windows Time Zone Index）。
- **新**：`GET pim-v1/attachmentnames/{unid}`、`POST`/`PATCH pim-v1/calendarprofile`、CalDAV/CardDAV/DXL Extension（實驗、預設關）、`computeTotalCount`（lists，預設 true）、`GET v1/info` +canonical name、nsfPath 正斜線、setup-v1/dxl 略過損毀元素、POST v1/query soft-deleted 處理。
- **韌性/UI**：PIM 讀 mail cluster failover；Admin UI 主題切換/Schema Diff View/Consents 卡/未存提示/ERROR-FATAL console。
- **修正**：全 PIM calendar 端點；Keycloak/OIDC key rotation → 交叉連 [[drapi-keycloak-oidc]]（使用者 OIDC 實測）。
- 交叉連內部 domino-rest-api-v1-1-7-release + drapi-keycloak-oidc。

## 查證 checklist

- [x] 所有列出的功能/改變逐項對照官方 whatsnew v1.1.8（WebFetch）
- [x] 破壞性/行為改變明確標為「行為改變」非新功能（richTextAs 預設、qrp/json forms 必填、calendarprofile 改名、calendar 必填欄位）
- [x] CalDAV/CardDAV/DXL 標「experimental、預設關」
- [x] inline-link diversity：3 相異官方 URL（1.1.8 / docs home / 1.1.7 whatsnew）+ 內部交叉連
- [ ] 雙語 build 驗證
- [ ] fact-check（比對 whatsnew 頁，防誤述功能）

## 異動日誌

- 2026-09-18 WebFetch v1.1.8 whatsnew、雙語按「行為改變優先」組織、sidecar；stage _pending 排 9/23（Opus 4.8）
