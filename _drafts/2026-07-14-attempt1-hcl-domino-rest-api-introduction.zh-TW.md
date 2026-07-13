---
title: "HCL Domino REST API：現代化應用程式開發的橋樑"
description: "HCL Domino REST API 提供安全的 RESTful 介面，讓開發者能夠使用各種程式語言存取 Domino 伺服器和資料庫，實現應用程式的現代化和擴展。"
pubDate: "2026-07-14T07:55:51+08:00"
lang: "zh-TW"
slug: "hcl-domino-rest-api-introduction"
tags:
  - "Domino REST API"
  - "Tutorial"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Overview of using Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-quickstart] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html" was already cited by [domino-rest-api-quickstart] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 1
slug: hcl-domino-rest-api-introduction
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 提供了一個安全的 RESTful 介面，允許開發者使用各種程式語言存取 HCL Domino 伺服器和資料庫。這使得開發者能夠利用現代的開發工具和框架，擴展和現代化現有的 Domino 應用程式。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 主要功能

- **安全性**：Domino REST API 繼承了 Notes 和 Domino 的安全模型，使用 JSON Web Token（JWT）和範圍（Scopes）進行身份驗證，確保資料的安全存取。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **標準化**：API 基於 OpenAPI 3.0 規範，提供互動式文件，方便開發者理解和使用。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html?utm_source=openai))

- **可擴展性**：API 的架構允許支援多個 API 版本，並可根據需求擴展功能。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html?utm_source=openai))

## 安裝與配置

1. **下載**：從 HCL 軟體門戶下載最新的 Domino REST API 安裝程式或 Docker 映像檔。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai))

2. **安裝**：按照安裝指南，在 Domino 伺服器或 Notes 客戶端上安裝並啟動 REST API。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai))

3. **配置**：使用管理者 UI 或 API，創建資料庫的 Schema 和 Scope，定義可存取的設計元素和操作。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai))

## 使用案例

- **網頁應用程式**：在公司網站上顯示存儲於 Domino 資料庫中的職缺資訊，無需 Java 或 JavaScript 技能。 ([hcl-software.com](https://www.hcl-software.com/blog/domino/new-domino-rest-apis-are-now-available?utm_source=openai))

- **行動應用程式**：使用 Volt MX 創建前端行動應用程式，讓員工提交差旅申請，管理者可進行審批。 ([hcl-software.com](https://www.hcl-software.com/blog/domino/new-domino-rest-apis-are-now-available?utm_source=openai))

- **應用程式整合**：將存儲於 Domino 的合同和客戶資料與 Salesforce CRM 整合，提供銷售代表完整的資訊視圖。 ([hcl-software.com](https://www.hcl-software.com/blog/domino/new-domino-rest-apis-are-now-available?utm_source=openai))

## 結論

HCL Domino REST API 為開發者提供了一個強大且安全的工具，允許他們使用現代的開發語言和框架，存取和擴展 Domino 應用程式。透過遵循標準化的 API 規範和繼承 Domino 的安全模型，開發者可以自信地將現有的 Domino 應用程式帶入現代化的開發環境。
