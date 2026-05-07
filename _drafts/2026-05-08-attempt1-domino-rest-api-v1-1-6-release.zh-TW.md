---
title: "Domino REST API v1.1.6 發布：新功能與改進"
description: "HCL Domino REST API v1.1.6 於 2025 年 11 月 18 日發布，新增了多項功能與改進，包括新的查詢端點、支援套件指令，以及管理介面的增強。"
pubDate: "2026-05-08T07:23:06+08:00"
lang: "zh-TW"
slug: "domino-rest-api-v1-1-6-release"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.6 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai" appears 7/14 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-6-release
-->

HCL 於 2025 年 11 月 18 日發布了 Domino REST API v1.1.6，為開發者和管理員帶來多項新功能與改進。以下是本次更新的重點內容：

## 新功能

- **新增 `POST v1/queryformula` 端點**：
  此端點允許使用者發送基於公式的查詢，以檢索 Domino 文件，並可選擇從指定的時間點開始。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **新增支援套件指令**：
  引入了 `tell restapi support -includedumps` 指令，可建立包含 Java Dump 檔案、活動 Java 堆的轉儲檔案，以及活動 JVM 的完整轉儲檔案的支援套件。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **管理介面增強**：
  在管理介面的資料庫表單、視圖和代理程式標籤中，新增了「顯示活動」切換開關，方便使用者快速篩選並顯示僅有的活動項目。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

## 改進

- **效能提升**：
  透過更高效的處理方式，Domino REST API 提升了回應速度，並優化了請求處理，提供更可靠的使用者體驗。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **`GET v1/lists/{name}` 端點改進**：
  新增了 `includeEmptyRows` 查詢參數，當設為 true 時，返回結果陣列將包含沒有任何欄位資料的行。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **管理介面通知增強**：
  在管理介面中，當操作（如啟用視圖）失敗且出現非 JSON 錯誤時，右上角將顯示通知，使用者可點擊關閉圖示來關閉通知。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **憑證無效通知**：
  當 Domino 或 Domino REST API 在使用者登入管理介面時重新啟動，或使用者在其他標籤或視窗中登出管理介面時，將彈出通知提醒憑證無效。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

這些更新進一步增強了 Domino REST API 的功能性和使用者體驗，為開發者和管理員提供了更強大的工具來管理和存取 Domino 資料。
