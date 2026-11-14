---
title: "Domino REST API 快速入門指南"
description: "本指南將引導您安裝、配置並開始使用 HCL Domino REST API，實現安全且現代化的應用程式開發。"
pubDate: "2026-11-14T10:56:41+08:00"
lang: "zh-TW"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Download Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html"
  - title: "Domino REST API task"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "domino-rest-api-quickstart" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
attempt: 2
slug: domino-rest-api-quickstart
-->

## 什麼是 Domino REST API？

Domino REST API 提供了一組安全的 RESTful API，允許開發者以現代化的方式存取 HCL Domino 伺服器和資料庫。透過這些 API，您可以使用自己偏好的程式語言，與 Domino 平台進行互動，從而擴展和現代化現有的 Domino 應用程式。

## 安裝 Domino REST API

### 下載安裝檔案

1. 前往 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html)。
2. 登入您的帳戶，導航至 HCL Domino 部分。
3. 在「工具、連接器和整合器」區域，選擇 Domino REST API。
4. 選擇適合您 Domino 版本的安裝檔案，並下載對應的安裝程式。

### 執行安裝

1. 解壓縮下載的安裝檔案，獲取安裝程式（例如 `restapiInstall-r12.jar`）。
2. 將安裝程式複製到 Domino 伺服器的程式目錄。
3. 打開命令提示字元，導航至該目錄，執行以下命令以開始安裝：

   ```
   java -jar restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
   ```

   請根據您的伺服器配置調整路徑。

## 配置與啟動 Domino REST API

### 配置

安裝完成後，Domino REST API 會在 `notes.ini` 中新增以下設置：

- `ServerTasks=restapi`
- `KeepInstallDir=C:\Domino\restapi`
- `KeepManagementURL=http://localhost:8889`

確保這些設置正確無誤。

### 啟動與管理

1. 在 Domino 伺服器控制台中，輸入以下命令以啟動 REST API：

   ```
   load restapi
   ```

2. 若要停止 REST API，輸入：

   ```
   tell restapi quit
   ```

3. 查看 REST API 狀態：

   ```
   tell restapi status
   ```

   更多管理命令請參考 [Domino REST API 任務](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html)。

## 初始配置與測試

1. 使用管理者 UI 或 API，為現有的 Domino 資料庫創建一個 Schema 配置。
2. 啟用您希望透過 API 存取的表單、視圖、資料夾、代理程式和文件項目。
3. 創建一個 Scope（REST 映射）以激活該 Schema。
4. 使用如 `curl` 或 Postman 等工具測試 API。
5. 在管理者 UI 中配置應用程式，以生成 `client_id` 和 `client_secret`，供您的應用程式使用 OAuth 進行身份驗證。

透過上述步驟，您已成功安裝並配置了 Domino REST API，現在可以開始開發與 Domino 互動的現代化應用程式了。更多詳細資訊，請參閱 [Domino REST API 文檔](https://opensource.hcltechsw.com/Domino-rest-api/index.html)。
