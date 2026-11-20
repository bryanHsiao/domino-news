---
title: "HCL Domino REST API 入門指南"
description: "本文介紹 HCL Domino REST API 的基本概念、安裝與配置步驟，以及如何開始使用，幫助您快速上手並整合到現有的 Domino 環境中。"
pubDate: "2026-11-20T11:53:35+08:00"
lang: "zh-TW"
slug: "domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Overview of using Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai" appears 4/10 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-introduction
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 提供了一個安全的 REST API，允許外部系統存取 HCL Domino 伺服器和資料庫。它旨在將 Domino 打造成現代化、符合標準的企業級協作平台，讓開發者能夠使用自己偏好的程式語言與 Domino 互動。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 安裝與配置

要在 Domino 伺服器上安裝 Domino REST API，請按照以下步驟進行：

1. **下載安裝檔案**：
   - 前往 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) 下載適用於您 Domino 版本的安裝檔案。

2. **執行安裝程式**：
   - 將下載的安裝檔案解壓縮，並將 `restapiInstall-r12.jar` 複製到 Domino 伺服器的程式目錄。
   - 在命令提示字元中，以管理員身份執行以下命令（請根據您的環境調整路徑）：
     ```
     java -jar c:\domino\restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
     ```

3. **啟動 REST API 服務**：
   - 在 Domino 伺服器控制台中，輸入以下命令以啟動 REST API：
     ```
     load restapi
     ```
   - 若要確保伺服器啟動時自動載入 REST API，請在 `notes.ini` 文件的 `ServerTasks` 條目中添加 `restapi`。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## 初始設定

安裝完成後，您需要進行以下設定以開始使用 Domino REST API：

1. **建立資料庫配置（Schema）**：
   - 使用管理界面或 API，為現有的 Domino 資料庫建立 Schema。

2. **啟用表單、視圖和文件項目**：
   - 指定哪些表單、視圖、資料夾、代理程式和文件項目可透過 API 存取。

3. **建立範圍（Scope）**：
   - 為 Schema 建立對應的 Scope，以啟用該配置。

4. **配置應用程式**：
   - 在管理界面中，建立應用程式以生成 `client_id` 和 `client_secret`，使您的應用程式能夠使用 OAuth 進行身份驗證。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html?utm_source=openai))

## 安全性考量

Domino REST API 繼承了 Notes 和 Domino 的安全模型，所有對資料庫的存取都需要透過 JSON Web Token（JWT）和範圍（Scopes）進行身份驗證。您可以使用 Domino 認證資訊或企業身份提供者（如 Keycloak 或 Active Directory）進行身份驗證，確保資料的安全性。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 結論

透過 Domino REST API，您可以將 Domino 資料庫與各種現代應用程式和服務整合，擴展其功能和可及性。按照上述步驟安裝和配置後，您將能夠利用 REST API 提供的強大功能，提升 Domino 環境的靈活性和現代化程度。
