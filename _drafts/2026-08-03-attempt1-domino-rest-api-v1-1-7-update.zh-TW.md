---
title: "Domino REST API v1.1.7 更新概覽"
description: "HCL Domino REST API v1.1.7 於 2026 年 4 月 7 日發布，新增了日曆設定文件檢索和未讀狀態更新等功能，並修復了多項問題。"
pubDate: "2026-08-03T08:00:02+08:00"
lang: "zh-TW"
slug: "domino-rest-api-v1-1-7-update"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.7 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html"
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-7-update
-->

HCL 於 2026 年 4 月 7 日發布了 Domino REST API v1.1.7，為開發者和管理員帶來了多項新功能和改進。以下是此版本的主要更新內容：

## 新功能

- **檢索日曆設定文件**：
  新增了 `GET pim-v1/calendar/profile` 端點，允許開發者檢索已驗證用戶的日曆設定文件。該文件包含個人日曆和排程設定，如工作時間、預設會議時長、時區、自動處理選項、空閒時間顯示設定等。詳細資訊請參閱 [Domino REST API v1.1.7 說明文件](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html)。

- **更新 PIM 項目的未讀狀態**：
  新增了 `POST pim-v1/pimitems/unread` 端點，允許檢查並選擇性地更新 PIM 項目的未讀狀態。該端點接受包含必要的 `unids` 陣列和可選的 `markRead: true` 或 `markUnread: true` 標誌的請求物件。

## 改進與修復

- **修復日曆條目描述的 HTML 格式問題**：
  修復了使用日曆 API 更新日曆條目時，HTML 格式的描述被保存為純文字，導致 HTML 元素顯示不正確的問題。更多資訊請參閱 [Domino REST API v1.1.5 說明文件](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html)。

- **改進管理 UI 的錯誤通知**：
  在管理 UI 登入頁面新增了彈出通知，當登入或網路錯誤發生時，通知將顯示相關的狀態碼和狀態訊息，以便詳細識別錯誤。

## 更新建議

為了利用最新的功能和改進，建議用戶將 Domino REST API 更新至 v1.1.7。更新步驟如下：

1. **下載最新版本**：
   從 [HCL 官方網站](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html)下載適用於您作業系統的最新版本安裝包。

2. **執行更新**：
   根據您的作業系統，按照以下指示進行更新：

   - **Docker**：
     - 移除現有的 Docker 容器。
     - 載入新的 Docker 映像檔。
     - 更新 `.env` 文件中的 `CONTAINER_IMAGE` 變數。
     - 在包含 `server.id` 和 `docker-compose.yml` 文件的目錄中執行 `docker-compose up`。

   - **Linux**：
     - 使用以下指令執行更新：
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
     - 使用以下指令執行更新：
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
     - 使用以下指令執行更新：
       ```
       java -jar restapiInstall.jar ^
        -d="C:\Program Files\HCL\Domino\Data" ^
        -i="C:\Program Files\HCL\Domino\notes.ini" ^
        -p="C:\Program Files\HCL\Domino" ^
        -r="C:\Program Files\HCL\Domino\restapi" ^
        -u ^
        -a
       ```

   詳細的更新步驟和注意事項請參閱 [Domino REST API 更新指南](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html)。

透過更新至最新版本，您將能夠利用最新的功能和改進，提升應用程式的效能和安全性。
