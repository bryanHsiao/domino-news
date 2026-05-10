---
title: "使用 HCL Domino REST API 操作 NotesDocument 的指南"
description: "本教程介紹如何透過 HCL Domino REST API，使用 JavaScript 操作 NotesDocument，實現對 Domino 資料庫中文件的 CRUD 操作。"
pubDate: "2026-05-11T07:23:03+08:00"
lang: "zh-TW"
slug: "notesdocument-rest-api"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "JavaScript"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "NotesDocument (JavaScript)"
    url: "https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Document.html"
  - title: "HCL Domino REST API Tutorials"
    url: "https://opensource.hcltechsw.com/domino-keep-tutorials/pages/domino-new/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-v1-1-6-release] on 2026-05-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 2
slug: notesdocument-rest-api
-->

## 簡介

HCL Domino REST API 提供了一個安全的 RESTful 介面，允許開發者使用現代的編程語言和工具，與 HCL Domino 伺服器和資料庫進行互動。透過該 API，開發者可以執行對 NotesDocument 的建立、讀取、更新和刪除（CRUD）操作，從而擴展和現代化現有的 Domino 應用程式。

## 前置條件

在開始之前，請確保您已經：

- 安裝並配置了 HCL Domino REST API。詳細的安裝和配置指南可參考 [HCL Domino REST API 教程](https://opensource.hcltechsw.com/domino-keep-tutorials/pages/domino-new/)。

- 擁有對目標 Domino 資料庫的適當訪問權限。

- 安裝了 Postman 或其他類似的 API 測試工具，以便測試 API 請求。

## 操作 NotesDocument

### 1. 建立新文件

要在 Domino 資料庫中建立新文件，您需要向 `/databases/{dbid}/documents` 端點發送 `POST` 請求。請求的主體應包含新文件的字段和對應的值。

**範例請求：**

```http
POST /databases/{dbid}/documents
Content-Type: application/json
Authorization: Bearer {your_access_token}

{
  "Form": "Contact",
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "john.doe@example.com"
}
```

在上述請求中，`{dbid}` 應替換為您的資料庫 ID，`{your_access_token}` 應替換為您的授權令牌。請求的主體包含了新文件的字段，如 `Form`、`FirstName`、`LastName` 和 `Email`。

### 2. 讀取現有文件

要讀取現有的 NotesDocument，您可以向 `/databases/{dbid}/documents/{unid}` 端點發送 `GET` 請求，其中 `{unid}` 是目標文件的唯一標識符。

**範例請求：**

```http
GET /databases/{dbid}/documents/{unid}
Authorization: Bearer {your_access_token}
```

該請求將返回指定文件的詳細資訊，包括所有字段及其值。

### 3. 更新現有文件

要更新現有的 NotesDocument，您需要向 `/databases/{dbid}/documents/{unid}` 端點發送 `PATCH` 請求，並在請求的主體中包含要更新的字段及其新值。

**範例請求：**

```http
PATCH /databases/{dbid}/documents/{unid}
Content-Type: application/json
Authorization: Bearer {your_access_token}

{
  "Email": "john.new@example.com"
}
```

該請求將更新指定文件的 `Email` 字段為新的值。

### 4. 刪除現有文件

要刪除現有的 NotesDocument，您可以向 `/databases/{dbid}/documents/{unid}` 端點發送 `DELETE` 請求。

**範例請求：**

```http
DELETE /databases/{dbid}/documents/{unid}
Authorization: Bearer {your_access_token}
```

該請求將刪除指定的文件。

## 結論

透過 HCL Domino REST API，開發者可以使用現代的編程語言和工具，方便地對 Domino 資料庫中的 NotesDocument 進行 CRUD 操作。這為現有的 Domino 應用程式提供了擴展和現代化的途徑。更多詳細資訊，請參考 [HCL Domino REST API 文檔](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html) 和 [NotesDocument（JavaScript）](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Document.html)。
