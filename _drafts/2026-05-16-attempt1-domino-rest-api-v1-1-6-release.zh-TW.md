---
title: "Domino REST API v1.1.6 發布：新功能與改進"
description: "HCL Domino REST API v1.1.6 於 2025 年 11 月 18 日發布，新增了多項功能與改進，提升了開發者的使用體驗。"
pubDate: "2026-05-16T07:24:02+08:00"
lang: "zh-TW"
slug: "domino-rest-api-v1-1-6-release"
tags:
  - "Release Notes"
  - "Domino REST API"
sources:
  - title: "Domino REST API v1.1.6 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html"
  - title: "What's new - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html" was already cited by [domino-rest-api-v1-1-7-release] on 2026-05-04. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [notesdocument-rest-api] on 2026-05-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai" appears 14/14 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-6-release
-->

HCL 於 2025 年 11 月 18 日發布了 Domino REST API v1.1.6，為開發者帶來了多項新功能與改進，進一步提升了與 Domino 伺服器和資料庫的互動能力。

## 新功能

- **新增 `POST v1/queryformula` 端點**：
  此端點允許開發者發送基於公式的查詢，以檢索 Domino 文件，並可選擇從指定的時間點開始。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **支援包建立指令**：
  新增了 `tell restapi support -includedumps` 指令，可建立包含 Java Dump 檔案、活動 Java 堆積的轉儲檔案，以及活動 JVM 的完整轉儲檔案的支援包。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **管理介面增強**：
  在管理介面的「資料庫表單」、「資料庫視圖」和「資料庫代理程式」標籤中，新增了「顯示活動」切換開關，方便使用者快速篩選並顯示僅有的活動項目。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

## 改進

- **效能提升**：
  Domino REST API 的效能已獲得提升，透過更高效的處理方式，縮短了回應時間，並優化了請求處理，提供更可靠的使用體驗。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **`GET v1/lists/{name}` 端點改進**：
  新增了 `includeEmptyRows` 查詢參數，當設為 true 時，返回的結果陣列將包含沒有任何欄位資料的行。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **管理介面通知增強**：
  當在管理介面執行操作（如啟用視圖）失敗時，現在會在右上角顯示通知，告知使用者非 JSON 格式的錯誤，使用者可點擊關閉圖示來關閉通知。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **憑證無效通知**：
  當 Domino 或 Domino REST API 在使用者登入管理介面時重新啟動，或使用者在其他標籤或視窗中登出管理介面時，現在會彈出通知，提醒使用者憑證無效。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

這些更新進一步強化了 Domino REST API 的功能與使用者體驗，為開發者提供了更靈活且高效的工具，以整合和擴展 Domino 應用程式。
