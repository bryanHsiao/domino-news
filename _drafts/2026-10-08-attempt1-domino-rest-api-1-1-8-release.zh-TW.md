---
title: "Domino REST API 1.1.8 版本發布"
description: "HCL 發布了 Domino REST API 1.1.8 版本，新增了 CalDAV、CardDAV 和 DXL 擴展 API，並引入了新的郵件附件檢索端點。"
pubDate: "2026-10-08T10:36:02+08:00"
lang: "zh-TW"
slug: "domino-rest-api-1-1-8-release"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Domino Server"
sources:
  - title: "Domino REST API v1.1.8 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-1-1-8-release
-->

HCL 於 2026 年 9 月 14 日發布了 Domino REST API 1.1.8 版本，為開發者提供了多項新功能和改進。

## 新增功能

### 實驗性擴展 API

此版本引入了以下實驗性擴展 API，旨在增強與 Domino 應用程序和數據的集成能力：

- **CalDAV 擴展 API**：允許客戶端使用 CalDAV 協議訪問和管理 Domino 日曆數據。
- **CardDAV 擴展 API**：提供基於標準的方式訪問 Domino 聯絡人和地址簿信息。
- **DXL 擴展 API**：通過 DXL 操作，實現對 Domino 設計元素的程序化訪問。

這些 API 預設為禁用狀態，僅供用戶試用和評估，尚不建議在生產環境中使用。如需啟用，請參閱官方文檔中的相關說明。

### 新的郵件附件檢索端點

新增了 `GET pim-v1/attachmentnames/{unid}` 端點，允許檢索郵件文檔中的所有附件列表。該端點支持查詢參數，可返回特定文件擴展名的附件協議 URL，包含附件元數據，並發現富文本字段中的嵌入文件。

## 升級建議

建議用戶將現有的 Domino REST API 升級至最新版本，以利用新功能和改進。詳細的升級步驟可參閱官方文檔中的更新指南。

有關更多信息，請參閱 [Domino REST API v1.1.8 發布說明](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html) 和 [Domino REST API 介紹](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html)。
