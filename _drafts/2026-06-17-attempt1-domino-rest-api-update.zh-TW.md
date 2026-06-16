---
title: "更新 HCL Domino REST API：完整指南"
description: "本文提供了在不同平台上更新 HCL Domino REST API 的詳細步驟，包括 Docker、Linux、Mac 和 Windows，確保您能順利升級至最新版本。"
pubDate: "2026-06-17T07:36:05+08:00"
lang: "zh-TW"
slug: "domino-rest-api-update"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 1
slug: domino-rest-api-update
-->

## 簡介

HCL Domino REST API 提供安全的 REST API，允許外部系統存取 HCL Domino 伺服器和資料庫。為了利用最新功能和改進，建議定期更新至最新版本。本文將詳細說明在不同平台上更新 Domino REST API 的步驟。

## 更新前的準備

在開始更新之前，請確保您已下載最新版本的 Domino REST API 安裝檔案。根據您的安裝方式，下載適當的安裝檔案：

- **Docker**：下載最新版本的 Docker 映像檔。
- **Linux、Mac 或 Windows**：下載對應平台的多平台安裝程式。

## 更新步驟

### Docker

1. **移除現有的 Docker 容器**：

   ```bash
   docker rm -f [容器名稱]
   ```

2. **載入新的 Docker 映像檔**（如果從 My HCLSoftware 入口網站下載）：

   ```bash
   docker load -i [映像檔名稱].tar
   ```

   > **注意**：請先解壓縮 `.tar.gz` 檔案。

3. **更新 `.env` 檔案**：

   - 記下載入後的映像檔名稱，並在 `.env` 檔案中更新 `CONTAINER_IMAGE` 變數的值。

4. **啟動新的容器**：

   在存放 `server.id` 和 `docker-compose.yml` 檔案的目錄中執行：

   ```bash
   docker-compose up
   ```

   > **注意**：如果需要存取 HCL 容器儲存庫，請使用 `docker login hclcr.io` 命令登入。

5. **驗證容器運行狀態**：

   確保新的容器成功運行。

### Linux

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

   > **注意**：
   >
   > - 請勿使用 `/opt/hcl/domino/bin/` 目錄下的 Java 執行檔。
   > - 如果系統未安裝 Java，可使用 `/opt/hcl/domino/notes/latest/linux/jvm/bin/` 目錄下的 Java 執行檔。

### Mac

1. **執行更新命令**：

   ```bash
   java -jar restapiInstall.jar \
     -d="/Users/[您的使用者名稱]/Library/Application Support/HCL Notes Data" \
     -i="/Users/[您的使用者名稱]/Library/Preferences/Notes Preferences" \
     -r="/Users/[您的使用者名稱]/Applications/restapi" \
     -p="/Applications/HCL Notes.app" \
     -u \
     -a
   ```

   > **注意**：
   >
   > - 請根據您的使用者名稱和安裝路徑調整命令中的路徑。

### Windows

1. **以管理員身份執行命令提示字元**。

2. **執行更新命令**：

   ```bash
   java -jar restapiInstall.jar ^
     -d="C:\Program Files\HCL\Domino\Data" ^
     -i="C:\Program Files\HCL\Domino\notes.ini" ^
     -p="C:\Program Files\HCL\Domino" ^
     -r="C:\Program Files\HCL\Domino\restapi" ^
     -u ^
     -a
   ```

   > **注意**：
   >
   > - 根據您的安裝路徑調整命令中的路徑。
   > - 安裝程式會在 Domino REST API 安裝目錄中建立 `runrestapi.cmd` 腳本，執行該腳本以啟動 Domino REST API。

## 更新後的注意事項

- **驗證安裝**：

  - 確保 Domino REST API 服務正常運行。
  - 檢查相關的日誌檔案以確認是否有錯誤或警告。

- **更新配置**：

  - 根據需要更新 `cors.json` 等配置檔案，以確保新版本的功能正常運作。

- **備份**：

  - 在更新之前，建議備份現有的配置和資料，以防止意外情況發生。

透過遵循上述步驟，您可以在不同平台上成功更新 HCL Domino REST API，確保系統保持最新狀態，並享受最新的功能和改進。更多詳細資訊，請參閱 [HCL Domino REST API 官方文件](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html)。
