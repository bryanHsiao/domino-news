---
title: "HCL Domino REST API：現代化應用程式開發的橋樑"
description: "HCL Domino REST API 提供安全的 RESTful 介面，讓開發者能夠使用各種程式語言存取 Domino 伺服器和資料庫，實現應用程式的現代化和擴展。"
pubDate: "2026-11-23T11:34:30+08:00"
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
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html" appears 4/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-introduction
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 為 Domino 伺服器和資料庫提供了一個安全的 RESTful 介面，允許開發者使用各種程式語言存取和操作 Domino 資料。這使得 Domino 成為一個現代化、符合標準、雲端原生的企業級協作平台，並透過 REST API 擴展其功能，讓開發者能夠使用自己偏好的工具進行開發。

## 主要特點

- **跨平台支援**：Domino REST API 可在 Windows、Linux 和 macOS 上運行，並支援 Docker 容器，提供靈活的部署選項。

- **安全性**：該 API 繼承了 Notes 和 Domino 的安全模型，使用 JSON Web Token（JWT）和範圍（Scopes）進行身份驗證，並可整合企業身份提供者（IdP）如 Keycloak 或 Active Directory。

- **現代化的 Java API**：採用重新設計的 Java API（Domino JNX），遵循業界標準和最佳實踐，提供更高效的開發體驗。

- **基於 OpenAPI 3.0 的公開 API**：提供完整的互動式文件，確保 API 規格始終與伺服器上的實際運行狀態一致。

- **可擴展的架構**：支援多個 API 版本，並提供管理界面，方便管理結構、範圍和應用程式。

## 安裝與配置

要在 Domino 伺服器上安裝 Domino REST API，請按照以下步驟進行：

1. **下載安裝檔案**：從 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) 下載適用於您平台的安裝檔案。

2. **執行安裝程式**：將安裝檔案複製到 Domino 伺服器的程式目錄，並以管理員身份運行命令提示字元，執行以下命令：

   ```
   java -jar restapiinstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
   ```

   請根據您的伺服器配置調整路徑。

3. **啟動 REST API**：在 Domino 伺服器控制台輸入 `load restapi`，即可啟動 REST API。為確保在伺服器啟動時自動加載，請在 `notes.ini` 文件的 `ServerTasks` 條目中添加 `restapi`。

更多詳細資訊，請參閱 [Domino REST API 任務](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html)。

## 管理與監控

安裝後，Domino REST API 作為 Domino 伺服器的一個任務運行。您可以使用以下命令在伺服器控制台進行管理和監控：

- **啟動 REST API**：

  ```
  load restapi
  ```

- **停止 REST API**：

  ```
  tell restapi quit
  ```

- **查看狀態和配置**：

  ```
  tell restapi status
  tell restapi config
  ```

- **刷新配置**：

  ```
  tell restapi refresh
  ```

更多管理命令和詳細資訊，請參閱 [Domino REST API 任務](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html)。

## 結論

HCL Domino REST API 為開發者提供了一個強大且靈活的工具，允許他們使用各種程式語言存取和操作 Domino 資料，從而實現應用程式的現代化和擴展。透過遵循上述步驟，您可以成功安裝、配置和管理 Domino REST API，充分發揮其潛力。
