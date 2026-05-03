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
cover: "/covers/hcl-domino-rest-api-quickstart.png"
---

## 簡介

HCL Domino REST API 提供了一個安全且現代化的方式，讓開發者能夠透過 RESTful 介面存取 Domino 伺服器和資料庫。透過此 API，您可以使用自己熟悉的程式語言，擴展和現代化現有的 Domino 應用程式。

## 步驟 1：下載 Domino REST API

請至 [Domino REST API 專案首頁](https://opensource.hcltechsw.com/Domino-rest-api/) 取得最新版本的安裝程式或 Docker 映像檔。

## 步驟 2：安裝並運行 Domino REST API

按照 [快速入門安裝指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) 在您的 Domino 伺服器或 Notes 用戶端上安裝並啟動 REST API。安裝完成後，請執行必要的後續配置步驟，以確保其正常運作。

## 步驟 3：熟悉 Domino REST API 工具

- **Admin UI**：使用網頁介面管理 API 的配置。
- **[Postman](https://www.postman.com/)** 與 **[curl](https://curl.se/)**：用於測試和調試 API 請求。
- **[Swagger UI](https://swagger.io/tools/swagger-ui/)**：提供互動式的 API 文件，方便您探索可用的端點。

## 步驟 4：配置您的第一個資料庫

1. **選擇資料庫**：選擇一個現有的 Domino 資料庫，或使用範例資料庫（如 `demo.nsf`）。
2. **建立 Schema**：透過 Admin UI 定義您希望透過 REST API 暴露的資料結構，包括表單、視圖和欄位。Schema 是 REST API 的概念，由 Admin UI 或管理 API 呼叫管理；底層 NSF 的表單與視圖仍透過 HCL Domino Designer 設計。
3. **建立 Scope**：透過 Admin UI 創建一個範圍，作為資料庫的外部可見別名。

## 步驟 5：測試 API

使用以下方法之一測試您的 API：

- **Swagger UI**：在瀏覽器中互動式地探索和測試端點。
- **Postman**：發送 API 請求並檢視回應。
- **curl**：透過命令列工具發送請求。

## 進一步學習

完整教學請參考 [Domino REST API walkthrough](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/walkthrough/index.html)，深入了解配置、認證、資料庫操作等進階主題。
