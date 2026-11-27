---
title: "HCL Domino REST API：現代化應用程式開發的橋樑"
description: "HCL Domino REST API 為 Domino 伺服器提供安全的 RESTful 介面，讓開發者能夠使用各種程式語言存取 Domino 資料庫，實現應用程式的現代化與擴展。"
pubDate: "2026-11-27T12:51:17+08:00"
lang: "zh-TW"
slug: "domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino REST API task"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 1
slug: domino-rest-api-introduction
topicOverlap: false
issues:
  [critical] Key Features — Cross-Platform Support
      problem: The URL cited for cross-platform support (https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html?utm_source=openai) is not one of the three cited sources submitted for review, and the ?utm_source=openai parameter strongly indicates this was fabricated by an AI. Several other inline links carry the same ?utm_source=openai suffix, which is a reliable signal that the URLs were hallucinated rather than sourced. These must be verified before publication.
      fix:     Remove all ?utm_source=openai parameters and verify every URL is live and points to the correct page. Use only the three submitted cited sources or add new ones that have been manually confirmed.
  [critical] Security — 'utilizes JSON Web Token (JWT) and Scopes for authentication'
      problem: This is incomplete to the point of being misleading. The Domino REST API's authentication layer also supports OAuth 2.0 flows (authorization code, client credentials) and application-level secrets/API keys, not merely JWT + Scopes. Describing the model as just 'JWT and Scopes' gives readers a false picture of what they need to implement.
      fix:     Expand to: 'The API uses an OAuth 2.0-based model, issuing JWTs as bearer tokens. Scopes control which databases and forms a token may access. Both user-facing (authorization code) and service-to-service (client credentials) flows are supported.'
  [major] Key Features — entire section
      problem: Several important features of the Domino REST API are absent, making the feature list materially incomplete for a reader evaluating adoption: (1) the Scope/Schema configuration layer (admins must explicitly expose a database, its forms, and fields before any REST call works — this is architecturally central and surprises every new user); (2) the Admin UI (Domino REST API ships with a browser-based admin console for managing scopes and schemas, not just server console commands); (3) the Barbican/Keep identity service and its role; (4) support for creating, reading, updating, and deleting documents, running agents, and accessing views — without naming these, the article says nothing about what the API actually does.
      fix:     Add a 'Schema and Scope Configuration' subsection explaining that databases must be explicitly enabled and their forms/fields configured before they are accessible via the REST API. Briefly mention the Admin UI and the available REST operation categories (documents, views, agents, etc.).
  [major] Installation and Configuration — Step 1 'Download the Installation Files'
      problem: The article directs readers to the HCL open-source documentation site for the download, but the actual download location is the My HCLSoftware Portal (formerly FlexNet/HCL License & Delivery Portal), which requires an entitlement. Sending readers to the documentation page for the binary itself is incorrect.
      fix:     Correct to: 'Download the installer from the My HCLSoftware Portal (my.hcltechsw.com) using your HCL entitlement credentials. The documentation page lists supported platforms and version history.'
  [major] Management and Monitoring — 'tell restapi config'
      problem: The command 'tell restapi config' is not documented in the referenced source page (https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html). The documented console commands are 'load restapi', 'tell restapi quit', 'tell restapi status', and 'tell restapi reload' (or 'refresh' depending on version). Presenting 'tell restapi config' as a valid command risks readers hitting an error at the console.
      fix:     Remove 'tell restapi config' unless it can be verified in the current release documentation. Replace with the confirmed commands from the cited reference page.
  [major] Key Features — 'Based on the OpenAPI 3.0 specification'
      problem: While technically true, stating only OpenAPI 3.0 omits that the Domino REST API also exposes endpoints and integration points for AsyncAPI (for event-driven scenarios) and that the interactive documentation is served directly by the running DRAPI instance (at /openapi/index.html by default) — a practically important point for developers trying to find it.
      fix:     Add that the interactive Swagger/OpenAPI UI is served by the DRAPI instance itself, accessible at the server's DRAPI port, so developers can explore and test endpoints without any third-party tool.
  [minor] Article title — 'HCL Domino REST API: Bridging Modern Application Development'
      problem: The article is extremely high-level — it covers only installation, three console commands, and a brief feature list. The title implies a broader architectural or strategic piece. Reader expectations will not be met.
      fix:     Either narrow the title (e.g., 'Getting Started with the HCL Domino REST API: Installation and First Commands') or substantially expand the body to justify the current title.
  [minor] Conclusion — 'developers can interact with Domino databases using various programming languages'
      problem: This is true of any HTTP-based API and says nothing specific about Domino REST API. The conclusion adds no value and reads as filler.
      fix:     Replace with a concrete next-step pointer: link to the Scope/Schema configuration guide or the tutorial that walks through the first API call, so readers know where to go after installation.
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 為 Domino 伺服器提供了一個安全的 RESTful 介面，允許開發者使用各種程式語言存取 Domino 資料庫。這使得 Domino 應用程式的現代化與擴展變得更加容易，並且能夠與其他平台無縫整合。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 主要特點

- **跨平台支援**：Domino REST API 可在 Windows、Linux 和 macOS 上運行，並支援 Docker 容器，提供靈活的部署選項。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html?utm_source=openai))

- **安全性**：該 API 繼承了 Notes 和 Domino 的安全模型，使用 JSON Web Token（JWT）和範圍（Scopes）進行身份驗證，確保資料的安全存取。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **現代化的 API 設計**：基於 OpenAPI 3.0 規範，提供互動式文件，方便開發者理解和使用。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html?utm_source=openai))

## 安裝與配置

要在 Domino 伺服器上安裝 Domino REST API，請按照以下步驟進行：

1. **下載安裝檔案**：從 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) 下載適用於您平台的安裝檔案。

2. **執行安裝程式**：將下載的安裝檔案解壓縮，並根據您的作業系統執行相應的安裝指令。

3. **啟動 REST API 服務**：在 Domino 伺服器控制台中，輸入 `load restapi` 命令以啟動服務。為確保服務在伺服器啟動時自動運行，請在 `notes.ini` 文件的 `ServerTasks` 條目中添加 `restapi`。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## 管理與監控

安裝完成後，Domino REST API 作為 Domino 伺服器的一個任務運行。您可以使用以下命令進行管理和監控：

- **查看狀態**：`tell restapi status` 顯示當前運行狀態和版本資訊。

- **查看配置**：`tell restapi config` 顯示當前的配置設定。

- **重新整理配置**：`tell restapi refresh` 重新載入配置，應用新的設定。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## 結論

HCL Domino REST API 為 Domino 應用程式的現代化和擴展提供了強大的工具。透過提供安全且標準化的 RESTful 介面，開發者可以使用各種程式語言與 Domino 資料庫互動，實現更靈活和高效的應用程式開發。
