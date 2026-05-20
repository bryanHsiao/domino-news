---
title: "Domino REST API 快速入門指南"
description: "本文提供 HCL Domino REST API 的快速入門指南，涵蓋安裝、配置和基本使用，幫助您快速上手並開始與 Domino 伺服器進行互動。"
pubDate: "2026-05-21T07:32:44+08:00"
lang: "zh-TW"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [notesdocument-rest-api] on 2026-05-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 14/14 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-quickstart
-->

## Domino REST API 快速入門指南

HCL Domino REST API 為 Domino 伺服器提供安全的 REST API 存取，允許開發者使用其偏好的程式語言與 Domino 互動。本文將引導您快速安裝、配置並開始使用 Domino REST API。

### 1. 下載 Domino REST API

首先，登入 [HCL 軟體門戶](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 並下載最新版本的 Domino REST API 安裝程式或 Docker 映像檔。

### 2. 安裝與執行 Domino REST API

按照 [安裝與配置指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 在您的 Domino 伺服器或 Notes 用戶端上安裝並啟動 REST API。安裝完成後，請執行後續配置步驟以確保其正常運作。

### 3. 使用 Domino REST API 工具

- **Admin UI**：透過 [Admin UI 教學](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 了解如何管理 API。

- **Swagger UI**：使用內建的 Swagger UI 互動式探索可用的端點。

- **Postman 和 curl**：熟悉這些工具以測試和調試 REST API。

### 4. 配置您的第一個資料庫

- **選擇資料庫**：選擇一個現有的 Domino 資料庫，例如 `demo.nsf`。

- **建立 Schema**：使用 Domino Designer 定義要透過 REST 暴露的資料結構和欄位。

- **選擇視圖**：選擇要透過 REST 暴露的視圖。

- **配置代理程式**：選擇性地配置要透過 REST 存取的代理程式。

- **建立 Scope**：透過 Admin UI 建立一個範圍（scope），將您的資料庫與 API 連結。

### 5. 測試 API

- **Swagger UI**：使用內建的 Swagger UI 互動式測試端點。

- **Postman**：透過 Postman 發送 API 請求。

- **curl**：使用 curl 命令行工具測試 API。

### 6. 進一步學習

- **深入安裝與配置**：參考 [安裝與配置指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 了解更多細節。

- **了解核心概念**：熟悉 [Schema 和 Scope](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 等核心概念。

- **加入社群**：參與 [HCL Domino 討論區](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 或 [OpenNTF Discord 頻道](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 以獲取支援和反饋。

透過以上步驟，您將能夠快速上手並開始使用 HCL Domino REST API，擴展您的 Domino 應用程式的功能與可及性。
