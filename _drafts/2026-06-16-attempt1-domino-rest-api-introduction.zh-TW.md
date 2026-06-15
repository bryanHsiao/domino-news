---
title: "HCL Domino REST API：現代化應用程式開發的橋樑"
description: "HCL Domino REST API 提供安全的 RESTful 介面，讓開發者能夠使用各種程式語言存取 Domino 伺服器和資料庫，實現應用程式的現代化和擴展。"
pubDate: "2026-06-16T07:39:04+08:00"
lang: "zh-TW"
slug: "domino-rest-api-introduction"
tags:
  - "Domino REST API"
  - "Tutorial"
  - "Domino Server"
sources:
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Domino REST API Tutorials | Tutorial for HCL Domino REST API"
    url: "https://opensource.hcltechsw.com/domino-keep-tutorials/pages/domino-new/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai" appears 10/16 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-introduction
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API（先前稱為 HCL Project KEEP）為 HCL Domino 伺服器和資料庫提供安全的 RESTful 介面。透過此 API，開發者可以使用各種程式語言（如 Java、C#、Python 等）存取 Domino 資料，從而實現應用程式的現代化和擴展。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 主要特點

- **跨平台支援**：Domino REST API 可在 Windows、Linux 和 macOS 上運行，並支援 Docker 和 Kubernetes 容器，提供靈活的部署選項。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **安全性**：API 繼承了 Domino 的安全模型，使用 JSON Web Token（JWT）和範圍（Scopes）進行身份驗證，確保資料存取的安全性。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **現代化的 Java API**：採用現代化的 Java API（Java 8 以上），遵循業界標準和最佳實踐，提升開發效率。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **基於 OpenAPI 3.0 的公共 API**：提供符合 OpenAPI 3.0 標準的公共 API，並附有互動式文件，方便開發者理解和使用。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 安裝與配置

要在 Domino 伺服器上安裝 Domino REST API，請按照以下步驟進行：

1. **下載安裝檔案**：從 HCL 的官方網站下載適用於您平台的安裝檔案。

2. **解壓縮檔案**：使用適當的工具解壓縮下載的檔案，獲取安裝程式（如 `restapiInstall-r12.jar`）。 ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api?utm_source=openai))

3. **執行安裝程式**：將安裝程式複製到 Domino 伺服器的程式目錄，然後在該目錄中執行安裝命令。

4. **啟動 REST API 服務**：安裝完成後，Domino REST API 會作為 Domino 伺服器的任務運行。您可以在伺服器控制台輸入 `load restapi` 來啟動服務。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## 配置與管理

安裝後，建議進行以下配置以確保服務的安全性和功能性：

- **配置 CORS**：設定跨來源資源共享（CORS）以允許特定的網域存取 API。

- **設定 JWT**：配置 JSON Web Token 以進行安全的身份驗證。

- **管理資料庫存取**：定義哪些資料庫和設計元素可透過 API 存取，並設定相應的權限。 ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api-part-two?utm_source=openai))

## 結論

HCL Domino REST API 為開發者提供了一個強大且靈活的工具，讓他們能夠使用現代化的程式語言和框架存取 Domino 資料，從而實現應用程式的現代化和擴展。透過正確的安裝和配置，您可以充分利用此 API 的功能，提升應用程式的效能和安全性。
