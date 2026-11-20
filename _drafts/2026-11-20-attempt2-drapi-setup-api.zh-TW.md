---
title: "使用 Domino REST API 的 Setup API 進行資料庫配置"
description: "深入探討如何使用 Domino REST API 的 Setup API 來配置 Domino 資料庫，涵蓋建立 Schema、啟用表單和視圖，以及管理範圍等步驟。"
pubDate: "2026-11-20T11:53:46+08:00"
lang: "zh-TW"
slug: "drapi-setup-api"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Setup API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html"
  - title: "Extensibility - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/extensibility/index.html"
  - title: "Overview of using Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: drapi-setup-api
-->

## 介紹

Domino REST API 提供了一個強大的 Setup API，允許開發者透過程式化方式配置 Domino 資料庫。這包括建立 Schema、啟用表單和視圖，以及管理範圍等操作。本文將引導您如何使用 Setup API 來配置您的 Domino 資料庫。

## 前置條件

在開始之前，請確保您已經安裝並配置了 Domino REST API。詳細的安裝指南可參考 [下載 Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html)。

## 建立 Schema

Schema 是對 Domino 資料庫的結構描述，定義了哪些表單、視圖和欄位可透過 REST API 存取。要建立 Schema，您需要發送一個 POST 請求至 `/setup/schema` 端點，並在請求體中提供必要的資訊。

```json
{
  "name": "MySchema",
  "database": "mydatabase.nsf",
  "forms": ["Form1", "Form2"],
  "views": ["View1", "View2"]
}
```

這將為名為 `mydatabase.nsf` 的資料庫建立一個名為 `MySchema` 的 Schema，並啟用指定的表單和視圖。

## 啟用表單和視圖

在建立 Schema 後，您可以透過 PATCH 請求來啟用或停用特定的表單和視圖。例如，要在現有的 Schema 中啟用一個新的表單，您可以發送以下請求：

```json
{
  "forms": ["NewForm"]
}
```

這將在現有的 Schema 中新增並啟用 `NewForm` 表單。

## 管理範圍（Scope）

範圍定義了哪些使用者或應用程式可以存取特定的 Schema。要建立範圍，請發送一個 POST 請求至 `/setup/scope` 端點，並在請求體中提供必要的資訊。

```json
{
  "name": "MyScope",
  "schema": "MySchema",
  "clients": ["client_id_1", "client_id_2"]
}
```

這將為 `MySchema` 建立一個名為 `MyScope` 的範圍，並允許指定的客戶端存取。

## 結論

透過使用 Domino REST API 的 Setup API，您可以以程式化的方式配置 Domino 資料庫，從而提高開發效率並確保配置的一致性。更多詳細資訊，請參考 [Setup API - HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html)。
