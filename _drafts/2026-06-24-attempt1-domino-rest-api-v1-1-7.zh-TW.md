---
title: "Domino REST API v1.1.7：最新功能與改進"
description: "HCL Domino REST API v1.1.7 於 2026 年 4 月 7 日發布，新增了多項功能與改進，包括新的端點和增強的日曆管理功能。"
pubDate: "2026-06-24T07:28:31+08:00"
lang: "zh-TW"
slug: "domino-rest-api-v1-1-7"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.7 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html"
  - title: "What's new - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html" appears 8/10 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-7
-->

HCL 於 2026 年 4 月 7 日發布了 Domino REST API v1.1.7，為開發者和管理員帶來了多項新功能與改進。以下是本次更新的重點內容：

## 新功能

- **取得使用者的行事曆設定**：
  新增了 `GET pim-v1/calendar/profile` 端點，允許開發者檢索已驗證使用者的行事曆設定文件。該文件包含個人行事曆和排程設定，如工作時間、預設會議時長、時區、自動處理選項、空閒時間顯示設定等。詳細資訊請參閱 [Domino REST API v1.1.7 - HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html)。

- **檢查和更新 PIM 項目的未讀狀態**：
  新增了 `POST pim-v1/pimitems/unread` 端點，允許檢查並選擇性地更新 PIM 項目的未讀狀態。該端點接受包含必要的 `unids` 陣列和可選的 `markRead: true` 或 `markUnread: true` 標誌的請求對象，返回一個將每個 UNID 映射到布林值的對象，其中 `true` 表示未讀狀態，`false` 表示已讀狀態。更多資訊請參閱 [Domino REST API v1.1.7 - HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html)。

- **更新電子郵件文件的欄位**：
  實現了 `PUT pim-v1/message/{unid}` 端點，支持更新由其 UNID 識別的電子郵件文件的欄位。詳情請參閱 [Domino REST API v1.1.7 - HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html)。

## 改進

- **增強的日曆管理功能**：
  新增的端點使開發者能夠更有效地管理和操作使用者的行事曆設定和 PIM 項目，提供更靈活的應用程式開發可能性。

- **安全性與效能提升**：
  本次更新還包括多項安全性和效能的改進，確保 API 的穩定性和可靠性。

## 升級注意事項

如果您從 v1.1.2 或更早版本升級，請注意 CORS 配置已從簡單字串匹配更改為使用正則表達式。這可能需要您更新現有的 CORS 設定，以確保與新版本的兼容性。詳細資訊請參閱 [Domino REST API v1.1.3.1 - HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.3.html)。

## 總結

Domino REST API v1.1.7 的發布為開發者提供了更強大的工具，以整合和管理 Domino 伺服器上的資料。建議所有使用者升級至此版本，以利用最新的功能和改進。更多資訊請參閱 [Domino REST API v1.1.7 - HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html)。
