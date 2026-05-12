---
title: "Domino REST API 快速入門指南"
description: "本指南旨在協助具有 HCL Notes 和 Domino 經驗的使用者快速安裝、配置並開始使用 Domino REST API，涵蓋從下載、安裝到執行基本 API 請求的步驟。"
pubDate: "2026-05-13T07:29:09+08:00"
lang: "zh-TW"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Overview of using Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-v1-1-6-release] on 2026-05-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 14/18 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: domino-rest-api-quickstart
-->

## 介紹

Domino REST API 為 HCL Domino 伺服器和資料庫提供安全的 REST API 存取，允許開發者使用其偏好的程式語言與 Domino 互動。本文將引導您快速安裝、配置並開始使用 Domino REST API。

## 步驟 1：下載 Domino REST API

首先，登入 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 並下載最新版本的 Domino REST API 安裝程式或 Docker 映像檔。

## 步驟 2：安裝和運行 Domino REST API

按照 [安裝和配置指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 在您的 Domino 伺服器或 Notes 用戶端上安裝並啟動 REST API。完成安裝後，請執行必要的後續步驟以確保其正常運作。

## 步驟 3：熟悉 Domino REST API 工具

- 探索 [Admin UI 教學](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 以進行網頁式的 API 管理。
- 理解如 [schemas 和 scopes](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html) 等核心概念。
- 熟悉如 Postman 和 curl 等 API 測試工具，這些工具對於處理 REST API 非常有用。

## 步驟 4：開始使用您的第一個資料庫

- 選擇一個要使用的資料庫，例如範例的 demo.nsf。
- 創建一個定義資料結構和要透過 REST 暴露的欄位/表單的 schema。這需要使用 Domino Designer 並具有適當的開發者存取權限。
- 選擇要透過 REST 暴露的視圖。
- 可選地，配置要透過 REST 存取的代理程式。
- 透過 Domino REST API 管理工具，由 Domino 管理員創建一個 scope（即資料庫/API 暴露的外部可見別名）。

**注意**：Scopes 應為小寫，並且是您 API URL 的一部分（`?dataSource=[scopename]`）。

## 步驟 5：嘗試使用

- 使用以下方法之一測試您的 API：
  - 內建的 Swagger UI，以互動方式探索可用的端點。
  - 透過 Postman 發送 API 請求。
  - 使用 curl 命令或提供的 Domino REST API shell 腳本進行命令列測試。

## 進一步了解

- 深入了解 [安裝和配置](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)
- 更多關於 [使用 Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html)
- 探索內部運作和安全層 Barbican

## 加入社群並提供反饋

您的反饋非常寶貴。加入以下平台的討論並獲取幫助：

- [HCLSoftware 數位解決方案社群論壇](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)
- [OpenNTF Discord 頻道](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)
- 客戶支援資訊：[聯絡支援](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)
