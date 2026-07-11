---
title: "更新 HCL Domino REST API：完整指南"
description: "本文提供了在不同平台上更新 HCL Domino REST API 的詳細步驟，確保您能順利升級並利用最新功能。"
pubDate: "2026-07-11T08:00:19+08:00"
lang: "zh-TW"
slug: "hcl-domino-rest-api-update"
tags:
  - "Domino REST API"
  - "Admin"
  - "Tutorial"
sources:
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
  - title: "Using Postman and curl - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html" was already cited by [domino-rest-api-v1-1-5] on 2026-06-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 1
slug: hcl-domino-rest-api-update
-->

## 簡介

HCL Domino REST API 提供安全的 REST API，允許存取 HCL Domino 伺服器和資料庫。為了確保您能利用最新功能和改進，建議定期更新至最新版本。本文將指導您如何在不同平台上更新 Domino REST API。

## 更新前的準備

在開始更新之前，請確保您已下載最新版本的 Domino REST API 安裝檔案。根據您的安裝方式，下載相應的安裝檔案或 Docker 映像檔。

## 更新步驟

### 使用 Docker

1. **移除現有的 Docker 容器**：

   ```bash
   docker rm -f [容器名稱]
   ```

2. **載入最新的 Docker 映像檔**：

   如果您從 My HCLSoftware 入口網站下載了 Docker 映像檔，請執行以下命令：

   ```bash
   docker load -i [映像檔名稱].tar
   ```

   請注意，您需要先解壓縮 `.tar.gz` 檔案。

3. **更新 `.env` 檔案**：

   在 `.env` 檔案中，更新 `CONTAINER_IMAGE` 變數的值為新的 Docker 映像檔名稱。

4. **啟動新的容器**：

   在存放 `server.id` 和 `docker-compose.yml` 檔案的目錄中，執行以下命令：

   ```bash
   docker-compose up
   ```

   如果系統要求存取 HCL Container Repository，請使用您的 HCL Container Repository 用戶名和密碼，並執行 `docker login hclcr.io` 命令進行登入。

5. **驗證容器運行狀態**：

   確保新的容器已成功運行。

### 在 Linux 上更新

1. **執行更新命令**：

   ```bash
   sudo java -jar restapiInstall.jar \
     -d="/local/notesdata" \
     -i="/local/notesdata/notes.ini" \
     -r="/opt/hcl/restapi" \
     -p="/opt/hcl/domino/notes/latest/linux" \
     -u \
     -a
   ```

   請注意，從版本 1.0.7 開始，安裝程式的檔案名稱包含 Domino 版本，例如 `restapiInstall-r12.jar`。從版本 1.1.5 開始，提供三個安裝程式檔案：

   - Domino 14.5：`restapiInstall-r145.jar`
   - Domino 14：`restapiInstall-r14.jar`
   - Domino 12：`restapiInstall-r12.jar`

### 在 Mac 上更新

1. **執行更新命令**：

   ```bash
   java -jar restapiInstall.jar \
     -d="/Users/[您的用戶名]/Library/Application Support/HCL Notes Data" \
     -i="/Users/[您的用戶名]/Library/Preferences/Notes Preferences" \
     -r="/Users/[您的用戶名]/Applications/restapi" \
     -p="/Applications/HCL Notes.app" \
     -u \
     -a
   ```

   同樣，請根據您的 Domino 版本選擇相應的安裝程式檔案。

### 在 Windows 上更新

1. **以管理員身份執行更新命令**：

   ```bash
   java -jar restapiInstall.jar ^
     -d="C:\Program Files\HCL\Domino\Data" ^
     -i="C:\Program Files\HCL\Domino\notes.ini" ^
     -p="C:\Program Files\HCL\Domino" ^
     -r="C:\Program Files\HCL\Domino\restapi" ^
     -u ^
     -a
   ```

   如果您在 Notes Client 上更新，請使用相應的路徑。

## 驗證更新

更新完成後，建議使用 Postman 或 curl 驗證 Domino REST API 是否正常運行。您可以參考 [使用 Postman 和 curl](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html) 教程，了解如何進行驗證。

## 結論

定期更新 HCL Domino REST API 可確保您獲得最新的功能和改進。根據您的平台和安裝方式，按照上述步驟進行更新，確保系統的穩定性和安全性。

---

*本文參考了 [更新 Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html) 和 [Domino REST API v1.1.5](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html) 的官方文檔。*
