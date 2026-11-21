---
title: "Domino REST API 快速入門指南"
description: "本指南將引導您安裝、配置並開始使用 HCL Domino REST API，實現安全且現代化的應用程式開發。"
pubDate: "2026-11-21T11:49:37+08:00"
lang: "zh-TW"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Welcome - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/index.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Overview of using Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: domino-rest-api-quickstart
-->

## 介紹 Domino REST API

HCL Domino REST API 為 Domino 伺服器和資料庫提供安全的 REST API 存取，支援 Windows、Linux 和 macOS 平台。它旨在將 Domino 打造成現代化、符合標準的企業級協作平台，讓開發者能夠使用各種工具進行開發。

## 安裝與配置

### 下載安裝檔案

1. 前往 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html)。
2. 登入後，導航至 HCL Domino 部分，選擇適合您平台的 Domino REST API 版本。
3. 下載對應的安裝檔案。

### 安裝步驟

1. 解壓縮下載的檔案，獲取安裝程式（例如 `restapiInstall-r12.jar`）。
2. 將安裝程式複製到 Domino 伺服器的程式目錄。
3. 打開命令提示字元，導航至該目錄，執行以下命令進行安裝：

   ```
   java -jar restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
   ```

   請根據您的實際路徑進行調整。

### 配置與啟動

1. 安裝完成後，Domino REST API 將作為伺服器任務運行。您可以在 Domino 伺服器控制台輸入以下命令啟動：

   ```
   load restapi
   ```

2. 為確保每次伺服器啟動時自動啟動 REST API，請在 `notes.ini` 文件的 `ServerTasks` 條目中添加 `restapi`。

3. 若您配置了 HTTPS，請修改 `notes.ini` 中的 `KeepManagementURL` 為 `https`，以確保 REST API 正常啟動。

## 快速開始

### 創建 Schema

1. 訪問 Domino REST API 的管理界面。
2. 創建一個新的 Schema，對應於現有的 Domino 資料庫。
3. 啟用您希望通過 API 訪問的表單、視圖、文件夾、代理和文檔項目。

### 創建 Scope

1. 在管理界面中，為您的 Schema 創建一個 Scope。
2. 配置 Scope，以定義哪些資源可供 API 訪問。

### 測試 API

1. 使用工具如 `curl` 或 Postman 測試 API。
2. 發送請求以驗證您的配置是否正確。

### 配置應用程式

1. 在管理界面中，創建一個應用程式，以獲取 `client_id` 和 `client_secret`。
2. 使用這些憑證，您的應用程式可以通過 OAuth 進行身份驗證，安全地訪問 Domino 資料。

通過上述步驟，您已成功安裝並配置了 HCL Domino REST API，並準備好開始開發現代化的應用程式。更多詳細資訊，請參閱 [Domino REST API 官方文檔](https://opensource.hcltechsw.com/Domino-rest-api/index.html)。
