---
title: "使用 Domino REST API 進行批次操作的指南"
description: "本教程介紹如何使用 Domino REST API 的批次操作功能，實現高效的文檔創建、檢索、更新和刪除。"
pubDate: "2026-11-25T13:16:53+08:00"
lang: "zh-TW"
slug: "domino-rest-api-bulk-operations"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "JavaScript"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "DominoBasisRestSession Interface"
    url: "https://opensource.hcltechsw.com/domino-rest-sdk-node/interfaces/RestInterfaces.DominoBasisRestSession.html"
  - title: "DominoBasisSession Class"
    url: "https://opensource.hcltechsw.com/domino-rest-sdk-node/classes/index.DominoBasisSession.html"
draft: true
---
<!--
REJECTED DRAFT — 3 critical fact issue(s)
attempt: 2
slug: domino-rest-api-bulk-operations
topicOverlap: false
issues:
  [critical] bulkCreateDocuments method / all four code examples
      problem: The method names used — bulkCreateDocuments, bulkGetDocuments, bulkUpdateDocumentsByQuery, bulkDeleteDocumentsByUNID — do not exist on DominoBasisSession or DominoBasisRestSession in the published Node.js SDK. The actual SDK exposes methods such as bulkCreateDocuments (this one may exist), but the SDK's DominoBasisSession wraps the underlying REST endpoints which are POST /bulk/create, POST /bulk/unid (for get), POST /bulk/update (DQL-based), and DELETE /bulk/unid. The method signatures in the examples (passing a plain query string, passing a plain array of UNIDs as a positional argument, etc.) do not match the SDK's documented interface. Publishing fabricated method signatures will cause readers' code to fail immediately.
      fix:     Verify every method name and its exact signature against the live SDK reference at the cited URLs before publishing. If the SDK does expose these methods, show the real import path and real parameter objects. If the SDK does not expose them, demonstrate the calls via the underlying REST endpoints directly (e.g. with fetch/axios) or use the correct SDK wrapper methods.
  [critical] const { DominoBasisSession } = require('@hcl-software/domino-rest-sdk-node');
      problem: The import destructures DominoBasisSession from the package root. The cited SDK docs show DominoBasisSession lives under the index export (class index.DominoBasisSession), but the constructor signature — new DominoBasisSession(dominoAccess, dominoConnector) — is never defined or explained. dominoAccess and dominoConnector appear from nowhere; readers have no idea what objects these are or how to construct them. This is not a minor omission: without these the session cannot be instantiated at all.
      fix:     Show the full setup: how to construct a DominoAccess object (credential/token), how to construct a DominoConnector (server URL), and then how to pass them to the session. These are prerequisite steps the SDK requires.
  [critical] Obtain Authentication Credentials: Set up an OAuth client to acquire client_id and client_secret
      problem: Domino REST API supports multiple authentication flows: its own JWT-based login (POST /api/v1/auth returning a bearer token), OAuth 2.0 (which does use client_id/client_secret), and application-level API keys. Presenting OAuth as the only option and skipping the JWT flow is misleading. More importantly, the article never shows how the acquired credentials are actually fed into the SDK session — the code examples silently assume a pre-existing dominoAccess object.
      fix:     Either show one complete auth flow end-to-end (JWT is simplest for a getting-started article) and wire it into the session instantiation, or explicitly document that auth setup is out of scope and link to the auth guide.
  [major] bulkUpdateDocumentsByQuery — const query = 'query_to_select_documents_to_update';
      problem: The query parameter is a placeholder string with no explanation of what query language is expected. Domino REST API bulk update uses DQL (Domino Query Language) syntax. Readers unfamiliar with DQL will have no idea what to put here, and the example gives zero guidance.
      fix:     Replace the placeholder with a real illustrative DQL expression (e.g. "Form = 'Contact' and Status = 'Active'") and add a sentence noting this is a DQL expression.
  [major] updateData = { field1: 'new_value' } passed to bulkUpdateDocumentsByQuery
      problem: The Domino REST API bulk update endpoint requires a specific request body structure that includes both the query and the replacement field values in a defined JSON schema. Passing a bare key/value object as a separate positional argument does not reflect the actual API contract and will mislead readers about the payload shape.
      fix:     Show the actual request body structure the endpoint expects, or confirm what the SDK method wraps it into, before publishing.
  [major] Article overall — no mention of Form or Mode requirements
      problem: Domino REST API requires documents to be created/updated through a configured Scope and Form (Mode). The dataSource alone is not sufficient; the target Form and its configured fields (the 'mode') determine which fields are readable/writable. The article never mentions this, making the examples misleading for anyone who tries them against a real database.
      fix:     Add a brief note that DRAPI requires a configured scope and that the form mode controls which fields are exposed. The examples should include the form name in the request or at minimum acknowledge this prerequisite.
  [major] Install Domino REST API — cited URL path /tutorial/installconfig/install/downloaddrapi.html
      problem: This URL path looks plausible but is not one of the three cited sources verified in the article header. It may be fabricated or stale. We cannot confirm liveness here but the path structure differs from the other cited docs URLs and should be verified.
      fix:     Confirm this URL resolves to a live page before publishing, or replace with the known-good docs landing page.
  [minor] Introduction — 'The Domino REST API offers a set of powerful bulk operation endpoints'
      problem: The product's current marketing name is 'HCL Domino REST API' (sometimes abbreviated DRAPI). Using it without the HCL prefix is acceptable in body text after first use, but it should be introduced with the full brand name at first mention.
      fix:     Change first mention to 'The HCL Domino REST API' for brand accuracy.
  [minor] Conclusion paragraph
      problem: The conclusion is a near-verbatim restatement of the introduction. It adds no new information (no caveats, no next steps, no link to DQL docs or scope configuration docs).
      fix:     Replace with a brief paragraph pointing readers to the scope/form configuration docs and the DQL reference as natural next steps.
-->

## 簡介

Domino REST API 提供了一組強大的批次操作端點，允許開發者一次性對多個文檔執行創建、檢索、更新和刪除等操作。這些批次操作有助於提高應用程序的性能和效率，特別是在處理大量數據時。

## 設置環境

在開始使用批次操作之前，請確保您的環境已正確配置：

1. **安裝 Domino REST API**：按照官方文檔中的[安裝指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html)進行安裝。

2. **配置訪問權限**：確保您的應用程序具有對目標數據庫的適當訪問權限。

3. **獲取身份驗證憑據**：設置 OAuth 客戶端，獲取 `client_id` 和 `client_secret`，以便進行身份驗證。

## 使用批次操作

以下示例展示如何使用 Domino REST API 的批次操作來創建、檢索、更新和刪除文檔。

### 1. 批次創建文檔

要一次性創建多個文檔，您可以使用 `bulkCreateDocuments` 方法。以下是使用 Node.js SDK 的示例：

```javascript
const { DominoBasisSession } = require('@hcl-software/domino-rest-sdk-node');

async function bulkCreateDocuments() {
  const session = new DominoBasisSession(dominoAccess, dominoConnector);
  const dataSource = '您的數據源名稱';
  const documents = [
    { field1: '值1', field2: '值2' },
    { field1: '值3', field2: '值4' }
  ];

  try {
    const createdDocs = await session.bulkCreateDocuments(dataSource, documents);
    console.log('創建的文檔：', createdDocs);
  } catch (error) {
    console.error('創建文檔時出錯：', error);
  }
}

bulkCreateDocuments();
```

在此示例中，我們創建了一個 `DominoBasisSession` 實例，並使用 `bulkCreateDocuments` 方法在指定的數據源中創建多個文檔。

### 2. 批次檢索文檔

要檢索多個文檔，可以使用 `bulkGetDocuments` 方法：

```javascript
async function bulkGetDocuments() {
  const session = new DominoBasisSession(dominoAccess, dominoConnector);
  const dataSource = '您的數據源名稱';
  const unids = ['文檔UNID1', '文檔UNID2'];

  try {
    const documents = await session.bulkGetDocuments(dataSource, unids);
    console.log('檢索到的文檔：', documents);
  } catch (error) {
    console.error('檢索文檔時出錯：', error);
  }
}

bulkGetDocuments();
```

此函數通過提供文檔的 UNID 列表，批量檢索對應的文檔。

### 3. 批次更新文檔

要更新多個文檔，可以使用 `bulkUpdateDocumentsByQuery` 方法：

```javascript
async function bulkUpdateDocuments() {
  const session = new DominoBasisSession(dominoAccess, dominoConnector);
  const dataSource = '您的數據源名稱';
  const query = '選擇要更新的文檔的查詢';
  const updateData = { field1: '新值' };

  try {
    const updateResponse = await session.bulkUpdateDocumentsByQuery(dataSource, query, updateData);
    console.log('更新結果：', updateResponse);
  } catch (error) {
    console.error('更新文檔時出錯：', error);
  }
}

bulkUpdateDocuments();
```

此示例展示如何根據查詢條件批量更新文檔的特定字段。

### 4. 批次刪除文檔

要刪除多個文檔，可以使用 `bulkDeleteDocumentsByUNID` 方法：

```javascript
async function bulkDeleteDocuments() {
  const session = new DominoBasisSession(dominoAccess, dominoConnector);
  const dataSource = '您的數據源名稱';
  const unids = ['文檔UNID1', '文檔UNID2'];

  try {
    const deleteResponse = await session.bulkDeleteDocumentsByUNID(dataSource, unids);
    console.log('刪除結果：', deleteResponse);
  } catch (error) {
    console.error('刪除文檔時出錯：', error);
  }
}

bulkDeleteDocuments();
```

此函數通過提供文檔的 UNID 列表，批量刪除對應的文檔。

## 結論

通過使用 Domino REST API 的批次操作，開發者可以高效地對多個文檔執行創建、檢索、更新和刪除等操作，從而提高應用程序的性能和可擴展性。更多詳細信息，請參閱官方文檔中的 [DominoBasisRestSession 介面](https://opensource.hcltechsw.com/domino-rest-sdk-node/interfaces/RestInterfaces.DominoBasisRestSession.html) 和 [DominoBasisSession 類別](https://opensource.hcltechsw.com/domino-rest-sdk-node/classes/index.DominoBasisSession.html)。
