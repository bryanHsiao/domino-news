---
title: "Domino REST API 1.1.8 發布：CalDAV／CardDAV 實驗登場、PIM 新端點與 cluster failover"
description: "DRAPI 1.1.8（2026-09-14）發布。這版帶來實驗性的 CalDAV／CardDAV／DXL Extension API（預設關）、撈 mail 附件清單與 calendar profile 的 PIM 新端點、PIM 在 primary 不可用時改讀 cluster member，以及 Keycloak／OIDC 金鑰輪替修正。升級前也有幾個行為改變要注意——richTextAs 預設改 HTML、qrp/json 強制 forms、calendar profile 端點改名、行事曆項目必填時間欄位——內文一併說明。"
pubDate: 2026-09-18T01:00:00+08:00
lang: zh-TW
slug: domino-rest-api-v1-1-8-release
tags:
  - "Domino REST API"
  - "Release Notes"
sources:
  - title: "What's new in Domino REST API v1.1.8 — HCL（官方）"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html"
  - title: "Domino REST API 文件首頁 — HCL（官方）"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/"
  - title: "What's new in Domino REST API v1.1.7（前一版）— HCL（官方）"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-rest-api-v1-1-8-release.webp"
coverStyle: "low-poly-3d"
---

[Domino REST API（DRAPI）1.1.8](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html) 在 2026-09-14 發布。這版新東西不少，最有看頭的是**實驗性的 CalDAV／CardDAV 進場**，另外還有幾個 PIM 新端點與一個實用的 cluster failover。升級前也有幾個**行為改變**值得留意，這篇放在後面一節說明。

## 重點摘要

- **實驗性登場**：**CalDAV、CardDAV、DXL Extension API**（預設關閉）。
- **新端點**：`GET pim-v1/attachmentnames/{unid}`（撈 mail 文件的附件清單）、`POST`／`PATCH pim-v1/calendarprofile`（建/改 calendar profile）。
- **韌性**：PIM API 在 primary 不可用時，能改從 **cluster member** 讀使用者 mail。
- **修正**：全 PIM 行事曆端點的問題；**Keycloak／OIDC 金鑰輪替**問題修好。
- **升級注意（行為改變）**：`richTextAs` 預設改 HTML、`POST v1/query/qrp/json` 強制要 `forms`、`GET pim-v1/calendar/profile` 改名 `calendarprofile`、行事曆項目建/改必須帶 date／timezone／duration——細節見下方〈升級前要注意的行為改變〉。

## 實驗性登場：CalDAV／CardDAV／DXL Extension API

這版最受矚目的是把三組 API 以**實驗性功能**引入（預設停用，想試要自己開）：**CalDAV／CardDAV** 是標準化的行事曆／通訊錄協定，**DXL Extension** 則走 Domino 的 DXL。正式用途前留意「experimental」定位——官方也註明 CalDAV／CardDAV **目前僅以 Mozilla Thunderbird 測試過**，別預設它跟所有用戶端都相容。

## 其他新端點與功能

- **`GET pim-v1/attachmentnames/{unid}`**：從 mail 文件撈附件清單，支援 protocol URL 與內嵌檔案探索。
- **`POST`／`PATCH pim-v1/calendarprofile`**：建立/更新登入使用者的行事曆 profile；`PATCH` 可只改個別設定。
- **`GET v1/lists/{name}` 加 `computeTotalCount`**（預設 `true`）：可控制要不要算總筆數；分類視圖的 `key` 參數與 `scope=documents` 也改進了。
- 其他：`GET v1/info` 多回 server 的 canonical name；`nsfPath` 跨平台統一用正斜線；表單欄位撈取變快；`GET setup-v1/dxl` 會略過損毀/無法存取的元素以提升可靠度；`POST v1/query` 改善對 view 索引裡 soft-deleted 文件的處理。

## 韌性與 Admin UI

- **PIM 讀 mail 支援 cluster failover**：PIM API 在使用者的 primary 郵箱不可用時，能改從 **cluster member** 取——對做 mail 整合的高可用性是實用改進。
- **Admin UI**：登入頁與導覽加了 **Light／Dark／System 主題切換**；Schema Management 加了 **Diff View**（比對已存 vs 編輯中）；Overview 加了 **Consents 管理**卡片；表單 Schema 有未存變更提示；ERROR／FATAL 訊息的 console 能見度也提升。

## 升級前要注意的行為改變

新功能之外，這版也改了幾個**既有行為**——升上去之前沒注意，原本好好的呼叫可能就回不一樣、或直接壞掉。四個最該確認你的程式有沒有踩到：

- **`richTextAs` 預設變 HTML**：這個查詢參數現在**預設輸出 HTML**。如果你之前靠「不帶參數時的預設格式」，升上去富文本回傳就變了——依賴預設格式的地方要明確指定。
- **`POST v1/query/qrp/json` 現在強制要 `forms`**：`forms` 陣列變成**必填**屬性。舊的呼叫沒帶 `forms` 會失敗——這是最容易讓既有 QRP（Query Results Processor）JSON 查詢直接壞掉的一項。
- **`GET pim-v1/calendar/profile` 改名成 `GET pim-v1/calendarprofile`**：端點路徑改了，舊路徑的呼叫要更新。
- **行事曆項目要帶齊 date／timezone／duration**：建立或更新行事曆項目現在**必須**指定日期、時區與持續時間。少帶會被擋——時區處理這版也改用 Windows Time Zone Index。

這幾個都不是新功能、是**既有行為的改變**，升級 checklist 記得掃過。

## 修正

- **全 PIM 行事曆端點的功能性問題**修正。
- **Keycloak 與 OIDC 供應商的金鑰輪替（key rotation）問題解決**——如果你在 DRAPI 前面接 Keycloak／OIDC 做認證，這個修正值得留意（我們在 [DRAPI 對外只吃 JVM truststore 那套 OIDC 實測](/domino-news/posts/drapi-keycloak-oidc)裡踩過相關的認證細節）。

## 小結

DRAPI 1.1.8 的看點在**新東西**——尤其 **CalDAV／CardDAV／DXL 實驗性 API**（標準協定進場，但預設關、還在實驗），加上 PIM 的附件清單／calendar profile 端點與 cluster failover。升級時別忘了順手掃一遍那四個**行為改變**（`richTextAs` 預設 HTML、`qrp/json` 強制 `forms`、calendar profile 端點改名、行事曆項目要帶齊時間欄位）。想對照前一版做了什麼，見 [DRAPI 1.1.7 發布](/domino-news/posts/domino-rest-api-v1-1-7-release)。
