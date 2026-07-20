---
title: "HCL Domino REST API：現代化應用程式開發的橋樑"
description: "HCL Domino REST API 提供安全且現代化的方式，讓開發者能夠使用各種程式語言存取 Domino 伺服器和資料庫，擴展應用程式的可能性。"
pubDate: "2026-07-20T08:00:23+08:00"
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
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [notes-jsonnavigator-lotusscript-tutorial] on 2026-07-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [notes-jsonnavigator-lotusscript-tutorial] on 2026-07-18. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" was already cited by [notes-jsonnavigator-lotusscript-tutorial] on 2026-07-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai" appears 10/20 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-domino-rest-api-introduction
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 為開發者提供了一個安全且現代化的方式，透過 RESTful 介面存取 HCL Domino 伺服器和資料庫。這使得開發者能夠使用自己熟悉的程式語言，擴展和現代化現有的 Domino 應用程式。

## 主要特點

- **安全性**：Domino REST API 繼承了 Notes 和 Domino 的安全模型，使用 JSON Web Token（JWT）和範圍（Scopes）進行身份驗證，確保資料的安全存取。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **現代化的 Java API**：採用符合業界標準的 Java 8+ API，提供更直觀且易於使用的開發體驗。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **基於 OpenAPI 3.0**：提供完整的互動式文件，方便開發者理解和使用 API。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html?utm_source=openai))

- **可擴展的架構**：支援多個 API 版本，並可根據需求擴展功能。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **Web GUI 管理**：提供網頁介面，方便管理結構、範圍和應用程式。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 安裝與配置

要開始使用 Domino REST API，請按照以下步驟進行：

1. **下載**：從 HCL 軟體門戶下載適用於您平台的 Domino REST API 安裝程式或 Docker 映像檔。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai))

2. **安裝與運行**：根據安裝指南，在您的 Domino 伺服器或 Notes 客戶端上安裝並啟動 REST API。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai))

3. **學習使用工具**：熟悉 Admin UI、Postman 和 curl 等工具，以便與 API 互動。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai))

4. **配置資料庫**：選擇要使用的資料庫，創建結構，並定義要透過 REST 暴露的表單、視圖和代理程式。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai))

5. **測試**：使用 Swagger UI、Postman 或 curl 測試您的 API，確保其正常運作。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html?utm_source=openai))

## 結論

HCL Domino REST API 為開發者提供了一個強大且靈活的工具，讓他們能夠使用現代化的開發技術，擴展和現代化 Domino 應用程式。透過遵循上述步驟，您可以快速上手，開始利用這些新功能來提升您的應用程式開發體驗。
