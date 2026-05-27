---
title: "HCL Domino REST API 入門指南"
description: "了解 HCL Domino REST API 的功能、安裝步驟，以及如何透過 RESTful 介面存取 Domino 資料庫。"
pubDate: "2026-05-28T07:32:03+08:00"
lang: "zh-TW"
slug: "hcl-domino-rest-api-introduction"
tags:
  - "Domino REST API"
  - "Tutorial"
  - "Domino Server"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai" appears 6/10 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-domino-rest-api-introduction
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 提供了一個安全的 RESTful 介面，允許開發者以現代化的方式存取 HCL Domino 伺服器和資料庫。透過此 API，開發者可以使用自己偏好的程式語言，與 Domino 平台進行互動，實現資料的讀取、寫入和管理。

## 主要功能

- **安全性**：Domino REST API 繼承了 Notes 和 Domino 的安全模型，所有對資料庫的存取都需經過身份驗證，並使用 JSON Web Token（JWT）和範圍（Scopes）進行權限控制。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **現代化的 Java API**：API 採用現代化的 Java 8+，遵循業界標準和最佳實踐，提供穩定且高效的開發體驗。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **基於 OpenAPI 3.0 的公共 API**：API 採用 OpenAPI 3.0 規範，提供互動式的文件，方便開發者理解和使用。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html?utm_source=openai))

- **可擴展的架構**：API 的架構設計允許支援多個 API 版本，並可根據需求進行擴展。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 安裝與配置

1. **下載安裝包**：從 HCL 軟體門戶下載適用於您平台的 Domino REST API 安裝包。

2. **安裝**：將安裝包解壓縮，並將 `restapiInstall-r12.jar` 文件複製到 Domino 伺服器的程式目錄。

3. **執行安裝命令**：在命令提示字元中，以管理員身份執行以下命令，替換路徑為您伺服器的實際路徑：

   ```
   java -jar c:\domino\restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
   ```

   ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api?utm_source=openai))

4. **驗證安裝**：安裝完成後，Domino REST API 將作為伺服器任務運行，您可以透過 Domino 伺服器控制台輸入 `tell restapi status` 來檢查其狀態。

## 使用範例

安裝完成後，您可以透過以下步驟開始使用 Domino REST API：

1. **建立 Schema**：定義您希望透過 API 存取的資料庫結構，包括表單、視圖和代理程式等。

2. **設定 Scope**：為 Schema 建立對應的 Scope，定義哪些使用者或應用程式可以存取該 Schema，並設定其最大允許的存取權限。

3. **建立 OAuth 應用程式**：根據需求，為外部應用程式設定 OAuth 應用程式，生成應用程式 ID 和密鑰，以便進行安全的 API 存取。

4. **測試 API**：使用工具如 Postman 或 curl，透過生成的 JWT 存取令牌，對 API 進行測試，確保其正常運作。

透過以上步驟，您可以成功地安裝、配置並開始使用 HCL Domino REST API，實現與 Domino 資料庫的現代化互動。
