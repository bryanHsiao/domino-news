---
title: "Domino REST API 最新更新與升級指南"
description: "本文介紹了 HCL Domino REST API 的最新更新，包括對 Domino 14 的完整支援，以及如何升級現有的 REST API 安裝。"
pubDate: "2026-06-13T07:36:24+08:00"
lang: "zh-TW"
slug: "domino-rest-api-updates"
tags:
  - "Domino REST API"
  - "Release Notes"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.2 and earlier - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/whatisnew.html"
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [hcl-domino-rest-api-introduction] on 2026-06-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 1
slug: domino-rest-api-updates
-->

## Domino REST API 最新更新與升級指南

HCL Domino REST API 最近發布了多項更新，旨在增強與 Domino 14 的整合，並提供新的功能和改進。以下是這些更新的重點內容，以及如何升級現有的 REST API 安裝。

### 對 Domino 14 的完整支援

在 v1.0.9 版本中，Domino REST API 現已完全支援 Domino 14。為了利用 Domino 14 提供的最新 JVM 功能，提供了適用於 Domino 12 和 Domino 14 的安裝程式，以及兩個平台的 Docker 映像檔。雖然舊版本的 REST API 可以在 Domino 14 上運行，但某些端點可能會出現問題。建議按照以下步驟升級您的 Domino 12 伺服器及 REST API 至 Domino 14：

1. 停止您的 Domino 12 伺服器。
2. 在 `notes.ini` 中移除 `ServerTasks` 行中的 `restapi`。
3. 將您的 Domino 12 伺服器升級至 Domino 14。
4. 啟動您的 Domino 14 伺服器。
5. 停止您的 Domino 14 伺服器。
6. 安裝適用於 Domino 14 的 REST API 版本。
7. 啟動 Domino 伺服器。

詳細資訊請參閱 [Domino REST API v1.1.2 及更早版本的更新說明](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/whatisnew.html)。

### 新增功能與改進

- **新增端點**：
  - `POST v1/query/qrp/json`：執行 DQL 查詢並獲取 QueryResultsProcessor 的 JSON 結果。使用範例請參閱 Swagger UI。

- **改進**：
  - 在 `GET v1/lists` 端點中新增了 `filter` 參數，允許返回包含不區分大小寫的過濾文字的可用視圖列表。

### 升級現有的 REST API 安裝

為了確保您的 REST API 安裝保持最新，建議定期更新至最新版本。以下是升級的步驟：

1. **下載最新版本**：
   - 對於 Linux、Mac 或 Windows，用戶，下載最新版本的多平台安裝程式。
   - 對於使用 Docker 的用戶，下載最新版本的 Docker 映像檔。

2. **執行升級**：
   - **Docker**：
     - 移除現有的 Docker 容器。
     - 加載新的 Docker 映像檔。
     - 更新 `.env` 文件中的 `CONTAINER_IMAGE` 變數。
     - 在存放 `server.id` 和 `docker-compose.yml` 文件的目錄中運行 `docker-compose up`。
   - **Linux**：
     - 運行以下命令：
       ```
       sudo java -jar restapiInstall.jar \
        -d="/local/notesdata" \
        -i="/local/notesdata/notes.ini" \
        -r="/opt/hcl/restapi" \
        -p="/opt/hcl/domino/notes/latest/linux" \
        -u \
        -a
       ```
   - **Mac**：
     - 運行以下命令：
       ```
       java -jar restapiInstall.jar \
        -d="/Users/[您的用戶名]/Library/Application Support/HCL Notes Data" \
        -i="/Users/[您的用戶名]/Library/Preferences/Notes Preferences" \
        -r="/Users/[您的用戶名]/Applications/restapi" \
        -p="/Applications/HCL Notes.app" \
        -u \
        -a
       ```
   - **Windows**：
     - 以管理員身份運行以下命令：
       ```
       java -jar restapiInstall.jar ^
        -d="C:\Program Files\HCL\Domino\Data" ^
        -i="C:\Program Files\HCL\Domino\notes.ini" ^
        -p="C:\Program Files\HCL\Domino" ^
        -r="C:\Program Files\HCL\Domino\restapi" ^
        -u ^
        -a
       ```

詳細的升級指南請參閱 [更新 Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html)。

### 管理員需知

Domino REST API 提供了安全的 REST API，允許外部系統安全地訪問 Domino 應用程式數據。作為管理員，了解如何正確安裝、配置和監控此服務至關重要。更多資訊請參閱 [Domino 管理員需知](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api)。

透過遵循上述步驟，您可以確保您的 Domino REST API 安裝保持最新，並充分利用其提供的最新功能和改進。
