---
title: "HCL Domino REST API：現代化應用程式開發的橋樑"
description: "HCL Domino REST API 提供安全的 RESTful 介面，讓開發者能夠使用現代化工具存取 Domino 伺服器和資料庫，擴展應用程式的可能性。"
pubDate: "2026-06-19T07:37:57+08:00"
lang: "zh-TW"
slug: "hcl-domino-rest-api-overview"
tags:
  - "Domino REST API"
  - "Tutorial"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 4/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-domino-rest-api-overview
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 為 HCL Domino 伺服器和資料庫提供安全的 RESTful 介面，讓開發者能夠使用現代化的開發工具和語言存取 Domino 資料。這項功能旨在重新定位 Domino，成為現代、符合標準、雲端原生的企業級協作平台。透過這個 API，開發者可以擴展和現代化現有的 Domino 應用程式，並與其他系統無縫整合。

## 主要特點

- **安全性**：Domino REST API 繼承了 Notes 和 Domino 的安全模型，所有對資料庫的存取都經過 JSON Web Token（JWT）和範圍（Scopes）進行身份驗證，確保資料的安全性。

- **現代化的 Java API**：採用現代化的 Java API（Java 8 以上），遵循業界標準和最佳實踐，提供更靈活的開發體驗。

- **基於 OpenAPI 3.0 的公共 API**：API 採用 OpenAPI 3.0 規範，提供互動式文件，方便開發者理解和使用。

- **可擴展的架構**：支援多個 API 版本，並可根據需求擴展，滿足不同的應用場景。

- **Web GUI 管理**：提供網頁介面，方便管理結構、範圍和應用程式，簡化配置流程。

## 安裝與配置

要開始使用 Domino REST API，請按照以下步驟進行：

1. **下載安裝包**：從 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 下載最新的 Domino REST API 安裝包或 Docker 映像檔。

2. **安裝與運行**：根據您的作業系統（Windows、Linux 或 macOS）進行安裝，並啟動 Domino REST API。

3. **使用工具**：熟悉並使用提供的工具，如 Swagger UI、Postman 或 curl，來測試和互動。

4. **配置資料庫**：創建結構（Schema），定義可存取的設計元素，如表單、視圖和代理程式。

5. **創建範圍（Scope）**：為結構創建範圍，定義可存取的用戶和最大允許的存取權限。

6. **測試與驗證**：使用提供的工具測試 API，確保配置正確且功能正常。

## 進一步學習

- **官方文件**：詳細的安裝和配置指南，請參閱 [Domino REST API 快速入門](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)。

- **管理員指南**：了解管理員在安裝和配置過程中的角色和責任，請參閱 [Domino 管理員需知](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api)。

透過 Domino REST API，開發者可以使用現代化的工具和語言，安全地存取和操作 Domino 資料，實現應用程式的現代化和擴展。
