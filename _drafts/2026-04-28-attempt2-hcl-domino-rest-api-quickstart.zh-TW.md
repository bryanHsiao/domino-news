---
title: "HCL Domino REST API 快速入門指南"
description: "本指南將引導您安裝、配置並開始使用 HCL Domino REST API，讓您能夠透過現代化的 RESTful 介面存取 Domino 資料庫。"
pubDate: "2026-04-28"
lang: "zh-TW"
slug: "hcl-domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
  - title: "Overview of using Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino REST API walkthrough - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/walkthrough/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 4/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: hcl-domino-rest-api-quickstart
-->

## 簡介

HCL Domino REST API 提供了一個安全且現代化的方式，讓開發者能夠透過 RESTful 介面存取 Domino 伺服器和資料庫。透過此 API，您可以使用自己熟悉的程式語言，擴展和現代化現有的 Domino 應用程式。

## 步驟 1：下載 Domino REST API

首先，請登入 [HCLSoftware 入口網站](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 並下載最新版本的 Domino REST API 安裝程式或 Docker 映像檔。

## 步驟 2：安裝並運行 Domino REST API

按照 [安裝和配置指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 在您的 Domino 伺服器或 Notes 用戶端上安裝並啟動 REST API。安裝完成後，請執行必要的後續配置步驟，以確保其正常運作。

## 步驟 3：熟悉 Domino REST API 工具

- **Admin UI**：使用網頁介面管理 API 的配置。
- **Postman 和 curl**：這些工具有助於測試和調試 API 請求。
- **Swagger UI**：提供互動式的 API 文件，方便您探索可用的端點。

## 步驟 4：配置您的第一個資料庫

1. **選擇資料庫**：選擇一個現有的 Domino 資料庫，或使用範例資料庫（如 demo.nsf）。
2. **建立 Schema**：定義您希望透過 REST API 暴露的資料結構，包括表單、視圖和欄位。
3. **創建 Scope**：透過 Admin UI 創建一個範圍，作為資料庫的外部可見別名。

## 步驟 5：測試 API

使用以下方法之一測試您的 API：

- **Swagger UI**：在瀏覽器中互動式地探索和測試端點。
- **Postman**：發送 API 請求並檢視回應。
- **curl**：透過命令列工具發送請求。

## 進一步學習

- **深入安裝和配置**：了解更多關於安裝和配置的細節。
- **使用 Admin UI**：學習如何透過 Admin UI 管理您的 API。
- **使用 Postman 和 curl**：掌握如何使用這些工具進行 API 測試。

透過本指南，您將能夠快速上手 HCL Domino REST API，並開始將其整合到您的應用程式中。
