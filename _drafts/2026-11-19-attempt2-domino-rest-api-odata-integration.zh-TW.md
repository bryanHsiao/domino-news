---
title: "使用 HCL Domino REST API 整合 OData：從設定到應用"
description: "本教程將指導您如何設定 HCL Domino REST API，以支援 OData 協議，並展示如何在 Microsoft Excel 中存取 Domino 資料庫。"
pubDate: "2026-11-19T12:01:01+08:00"
lang: "zh-TW"
slug: "domino-rest-api-odata-integration"
tags:
  - "Tutorial"
  - "Domino REST API"
sources:
  - title: "OData - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/odata/index.html"
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "OpenAPI - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/odata/index.html?utm_source=openai" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: domino-rest-api-odata-integration
-->

## 介紹

HCL Domino REST API 提供了一個安全且現代化的方式，讓開發者能夠透過 RESTful 服務存取 Domino 伺服器和資料庫。其中，OData（Open Data Protocol）是一種開放標準的協議，允許應用程式以統一的方式查詢和更新資料。透過將 Domino REST API 配置為支援 OData，您可以在各種支援 OData 的應用程式中存取 Domino 資料，例如 Microsoft Excel、Salesforce 和 Power BI。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/odata/index.html?utm_source=openai))

## 設定 Domino REST API 支援 OData

要在 Domino REST API 中啟用 OData 支援，請按照以下步驟進行：

1. **建立資料庫配置（Schema）**：
   - 進入 Domino REST API 的管理界面。
   - 為您希望透過 OData 存取的現有 Domino 資料庫建立新的 Schema。

2. **啟用表單（Form）**：
   - 在剛建立的 Schema 中，選擇您希望透過 OData 存取的表單。
   - 將該表單的模式（Mode）設置為 `odata`。

3. **建立範圍（Scope）**：
   - 為該 Schema 建立一個新的 Scope，以啟用對應的 OData 存取。

完成上述步驟後，您的 Domino REST API 就已經配置好支援 OData，並可以被支援 OData 的應用程式存取。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/odata/index.html?utm_source=openai))

## 在 Microsoft Excel 中存取 Domino 資料庫

以下示範如何在 Microsoft Excel 中透過 OData 存取 Domino 資料庫：

1. **開啟 Excel 並連接到 OData 源**：
   - 在 Excel 中，選擇「資料」選項卡，然後點擊「取得資料」>「從其他來源」>「從 OData 提要」。

2. **輸入 OData 連接資訊**：
   - 在彈出的對話框中，輸入您的 Domino REST API 的 OData 端點 URL。
   - 例如，`https://your-domino-server.com/odata/`。

3. **驗證並選擇資料**：
   - 根據您的 Domino REST API 配置，可能需要輸入驗證資訊。
   - 成功連接後，您將看到可用的表單列表。選擇您希望在 Excel 中載入的表單，然後點擊「載入」。

4. **處理和分析資料**：
   - 資料載入後，您可以使用 Excel 的各種工具進行分析、製圖和報告。

## 注意事項

- **安全性**：確保您的 Domino REST API 已正確配置安全性設定，包括身份驗證和授權，以保護您的資料。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/security/securingKEEPEndpoints.html?utm_source=openai))

- **API 文件**：Domino REST API 提供了基於 OpenAPI 3.0 的詳細文件，您可以透過 Swagger UI 存取，了解所有可用的端點和操作。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html?utm_source=openai))

透過上述步驟，您可以成功地將 HCL Domino REST API 配置為支援 OData，並在各種支援 OData 的應用程式中存取和操作 Domino 資料庫，從而提升資料的可用性和靈活性。
