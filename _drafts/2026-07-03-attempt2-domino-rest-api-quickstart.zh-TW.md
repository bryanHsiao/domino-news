---
title: "Domino REST API 快速入門指南"
description: "本指南將引導您安裝、配置並開始使用 HCL Domino REST API，讓您能夠透過現代化的 RESTful 介面存取 Domino 伺服器和資料庫。"
pubDate: "2026-07-03T08:08:35+08:00"
lang: "zh-TW"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
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
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-v1-1-7] on 2026-06-24. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/index.html" appears 6/14 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: domino-rest-api-quickstart
-->

## 介紹

HCL Domino REST API 提供了一個安全的 RESTful 介面，讓開發者能夠以現代化的方式存取 Domino 伺服器和資料庫。透過此 API，您可以使用各種程式語言和工具與 Domino 進行互動，擴展其應用範圍。

## 步驟 1：下載 Domino REST API

首先，請登入 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 並下載最新版本的 Domino REST API 安裝程式或 Docker 映像檔。

## 步驟 2：安裝並運行 Domino REST API

根據您的作業系統，按照以下步驟進行安裝：

- **Windows/Linux/Mac**：
  - 執行下載的安裝程式，按照提示完成安裝。
  - 安裝完成後，啟動 Domino 伺服器，並在伺服器控制台輸入 `load restapi` 以啟動 REST API。

- **Docker**：
  - 使用以下命令拉取最新的 Docker 映像檔：
    ```
    docker pull hclcom/domino-rest-api:latest
    ```
  - 使用以下命令運行容器：
    ```
    docker run -d -p 8880:8880 -p 8889:8889 -p 8890:8890 --name domino-rest-api hclcom/domino-rest-api:latest
    ```

## 步驟 3：了解 Domino REST API 工具

Domino REST API 提供了多種工具供您測試和互動：

- **Swagger UI**：
  - 在瀏覽器中開啟 `http://localhost:8880/swagger-ui/`，您可以在此處查看並測試所有可用的 API 端點。

- **Postman**：
  - 匯入 API 的 OpenAPI 規範，然後使用 Postman 發送請求以測試 API。

- **curl**：
  - 使用命令列工具發送 HTTP 請求，例如：
    ```
    curl -X GET http://localhost:8880/api/v1/data
    ```

## 步驟 4：配置您的第一個資料庫

要透過 REST API 存取 Domino 資料庫，您需要進行以下配置：

1. **建立 Schema**：
   - 在管理 UI 中，導航至 `Schemas`，點擊 `Create`，選擇您要存取的資料庫，並定義可存取的表單、視圖、文件等。

2. **建立 Scope**：
   - 在管理 UI 中，導航至 `Scopes`，點擊 `Create`，選擇先前建立的 Schema，並定義存取範圍。

3. **建立應用程式**：
   - 在管理 UI 中，導航至 `Applications`，點擊 `Create`，設定應用程式名稱，並獲取 `client_id` 和 `client_secret`，以供 OAuth 認證使用。

## 步驟 5：測試 API

完成上述配置後，您可以使用以下方法測試 API：

- **Swagger UI**：
  - 在瀏覽器中開啟 `http://localhost:8880/swagger-ui/`，選擇您配置的 Scope，並測試相關的端點。

- **Postman**：
  - 使用先前獲取的 `client_id` 和 `client_secret` 進行 OAuth 認證，然後發送請求測試 API。

- **curl**：
  - 使用以下命令發送請求：
    ```
    curl -X GET http://localhost:8880/api/v1/data?dataSource=您的Scope名稱 -H "Authorization: Bearer 您的訪問令牌"
    ```

## 進一步學習

- **深入了解安裝和配置**：
  - [安裝和配置指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)

- **學習如何使用 Domino REST API**：
  - [使用指南](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html)

- **探索內部工作原理和安全層 Barbican**：
  - [安全指南](https://opensource.hcltechsw.com/Domino-rest-api/references/security/securingKEEPEndpoints.html)

## 加入社群並提供反饋

您的反饋對我們非常重要。請加入以下社群進行討論和獲取幫助：

- **HCLSoftware 數位解決方案社群論壇**：
  - [社群論壇](https://opensource.hcltechsw.com/Domino-rest-api/index.html)

- **OpenNTF Discord 頻道**：
  - [Discord 頻道](https://opensource.hcltechsw.com/Domino-rest-api/index.html)

- **客戶支援資訊**：
  - [聯絡支援](https://opensource.hcltechsw.com/Domino-rest-api/index.html)
