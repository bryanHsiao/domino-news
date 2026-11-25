---
title: "HCL Domino REST API 入門指南"
description: "了解如何安裝、配置並使用 HCL Domino REST API，將 Domino 應用程式與現代 Web 技術整合，擴展其功能。"
pubDate: "2026-11-25T13:16:00+08:00"
lang: "zh-TW"
slug: "domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "JavaScript"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Overview of using Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino REST API task"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-introduction
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 提供了一個安全的 RESTful 介面，允許開發者使用各種編程語言存取 HCL Domino 伺服器和資料庫。這使得 Domino 應用程式能夠與現代 Web 技術整合，擴展其功能。

## 安裝與配置

要開始使用 Domino REST API，請按照以下步驟進行安裝與配置：

1. **下載安裝程式**：

   從 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) 下載適用於您 Domino 版本的安裝檔案。

2. **安裝**：

   根據您的作業系統，執行相應的安裝步驟。詳細的安裝指南可參考 [安裝與配置](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) 頁面。

3. **啟動 REST API 服務**：

   在 Domino 伺服器控制台中，輸入以下命令以啟動 REST API：

   ```
   load restapi
   ```

   若要確保伺服器啟動時自動載入 REST API，請在 `notes.ini` 文件的 `ServerTasks` 條目中添加 `restapi`。

## 配置與使用

安裝完成後，您需要進行以下配置以開始使用 REST API：

1. **創建資料庫配置（Schema）**：

   使用管理 UI 或 API，為現有的 Domino 資料庫創建 Schema，指定可透過 API 存取的表單、視圖、資料夾、代理程式和文件項目。

2. **啟用 Schema**：

   創建一個範圍（Scope）來激活 Schema，允許應用程式透過該範圍存取資料庫。

3. **測試 API**：

   使用如 `curl` 或 Postman 等工具，測試 REST API 的功能，確保配置正確。

4. **配置應用程式**：

   在管理 UI 中創建應用程式，以生成 `client_id` 和 `client_secret`，使您的應用程式能夠使用 OAuth 進行身份驗證。

## 進一步學習

要深入了解 Domino REST API 的功能和使用方法，請參考以下資源：

- [Domino REST API 文檔首頁](https://opensource.hcltechsw.com/Domino-rest-api/)

- [使用 Domino REST API 的概述](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html)

透過這些資源，您可以學習如何將 Domino 應用程式與現代 Web 技術整合，擴展其功能，並提升開發效率。
