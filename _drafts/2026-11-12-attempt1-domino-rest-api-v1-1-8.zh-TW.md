---
title: "Domino REST API v1.1.8 發布：新功能與改進"
description: "HCL Domino REST API v1.1.8 於 2026 年 9 月 14 日發布，帶來了多項新功能與改進，包括實驗性 API、增強的附件管理以及用戶體驗提升。"
pubDate: "2026-11-12T11:39:39+08:00"
lang: "zh-TW"
slug: "domino-rest-api-v1-1-8"
tags:
  - "Release Notes"
  - "Domino REST API"
sources:
  - title: "Domino REST API v1.1.8 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html"
  - title: "What's new - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html"
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html" appears 4/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-8
-->

HCL 於 2026 年 9 月 14 日發布了 Domino REST API v1.1.8，為開發者和管理員帶來了多項新功能與改進。以下是本次更新的重點內容：

## 實驗性功能

此次更新引入了三個實驗性 API，旨在擴展 Domino 應用程式與資料的整合能力：

- **CalDAV 擴展 API**：允許客戶端使用 CalDAV 協議存取和管理 Domino 日曆資料。
- **CardDAV 擴展 API**：提供基於標準的方式存取 Domino 聯絡人和地址簿資訊。
- **DXL 擴展 API**：透過 DXL 操作，實現對 Domino 設計元素的程式化存取。

請注意，這些 API 目前為實驗性質，預設為關閉狀態，僅供評估和測試使用。要啟用這些功能，請參閱 [啟用 CalDAV、CardDAV 和 DXL 擴展 API](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html)。

## 新功能

- **新增 `GET pim-v1/attachmentnames/{unid}` 端點**：此端點可檢索郵件文件上的所有附件列表，並支援查詢參數，以返回特定檔案類型的協議 URL、包含附件元資料，以及發現富文本欄位中的嵌入檔案。

- **新增 `POST pim-v1/calendarprofile` 端點**：允許建立或更新已驗證用戶的日曆設定檔文件。

- **新增 `PATCH pim-v1/calendarprofile` 端點**：可更新已驗證用戶日曆設定檔文件中的個別設定。

## 改進

- **管理 UI 的主題切換**：在登入頁面和側邊導航面板新增了亮色、暗色和系統模式的主題切換功能，提供更舒適和可自訂的用戶體驗。

- **Schema 管理的 Diff View 模式**：在管理 UI 的 Schema 管理頁面的 Source 標籤中新增了 Diff View 模式，允許用戶在修改 Schema 時比較當前儲存的資料庫 Schema 與正在進行的編輯。

## 已解決的問題

- **Scope 與 Schema 連接的視覺問題**：在管理 UI 中，連接到 Schema 的 Scope 可能顯示紅點，而非綠點，錯誤地指示 Scope 與 Schema 的連接未正常運作。這僅為視覺問題，實際 API 和連接的 Scope 與 Schema 功能正常。詳細資訊和建議的解決方法，請參閱 [技術說明](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html)。

## 更新建議

為了利用最新的功能和改進，建議將您的 Domino REST API 更新至 v1.1.8。詳細的更新步驟，請參閱 [更新 Domino REST API 至最新版本](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html)。

透過此次更新，HCL 持續致力於提升 Domino REST API 的功能性和用戶體驗，為開發者和管理員提供更強大的工具來管理和整合 Domino 應用程式與資料。
