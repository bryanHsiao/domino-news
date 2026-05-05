---
title: "HCL Domino REST API：現代化應用程式開發的橋樑"
description: "HCL Domino REST API 為 Domino 伺服器提供安全的 RESTful 介面，讓開發者能夠使用各種程式語言存取 Domino 資料庫，擴展應用程式的可能性。"
pubDate: "2026-05-06T07:23:18+08:00"
lang: "zh-TW"
slug: "hcl-domino-rest-api-introduction"
tags:
  - "Domino REST API"
  - "Tutorial"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" was already cited by [hcl-domino-rest-api-quickstart] on 2026-04-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 6/10 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-domino-rest-api-introduction
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 為 HCL Domino 伺服器提供安全的 RESTful 介面，允許開發者使用各種程式語言存取 Domino 資料庫。這使得開發者能夠利用現代的開發工具和框架，擴展和現代化現有的 Domino 應用程式。

## 主要特點

- **安全性**：Domino REST API 繼承了 Notes 和 Domino 的安全模型，使用 JSON Web Token（JWT）和範圍（Scopes）進行身份驗證，確保資料的安全存取。

- **現代化的 Java API**：採用符合業界標準的 Java 8+ API，提供更直觀和高效的開發體驗。

- **基於 OpenAPI 3.0 的公共 API**：遵循 OpenAPI 3.0 標準，提供互動式的 API 文件，方便開發者理解和使用。

- **可擴展的架構**：支援多個 API 版本，並可根據需求擴展功能。

- **Web GUI 管理**：提供網頁介面，方便管理結構描述（Schema）、範圍（Scope）和應用程式。

## 安裝與配置

要開始使用 Domino REST API，請按照以下步驟進行：

1. **下載安裝程式**：從 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 下載最新的 Domino REST API 安裝程式或 Docker 映像檔。

2. **安裝與運行**：根據 [安裝與配置指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 在 Domino 伺服器或 Notes 用戶端上安裝並啟動 REST API。

3. **學習使用工具**：熟悉 Admin UI、Postman 和 curl 等工具，以便測試和管理 API。

4. **配置資料庫**：選擇一個資料庫，創建結構描述，定義要通過 REST 暴露的表單和視圖，並創建範圍以啟用 API 存取。

## 進一步學習

- **官方文件**：詳細了解 [Domino REST API 的功能和使用方法](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html)。

- **管理員指南**：閱讀 [Domino 管理員需要了解的 REST API 資訊](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api)，以確保正確的安裝和配置。

- **快速入門**：參考 [快速入門指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)，快速上手並開始使用 API。

透過 Domino REST API，開發者可以利用現代的開發工具和框架，擴展和現代化現有的 Domino 應用程式，實現更高效和靈活的應用程式開發。
