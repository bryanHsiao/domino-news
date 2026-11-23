---
title: "使用 Domino REST API 進行批次操作的指南"
description: "本教程介紹如何使用 Domino REST API 的批次操作功能，實現高效的文檔創建、檢索、更新和刪除。"
pubDate: "2026-11-23T11:34:43+08:00"
lang: "zh-TW"
slug: "drapi-bulk-operations"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "JavaScript"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "DominoBasisRestSession Interface Documentation"
    url: "https://opensource.hcltechsw.com/domino-rest-sdk-node/interfaces/RestInterfaces.DominoBasisRestSession.html"
  - title: "Overview of using Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: drapi-bulk-operations
-->

## 簡介

Domino REST API 提供了一組強大的批次操作端點，允許開發者一次性對多個文檔執行創建、檢索、更新和刪除等操作。這些功能對於需要處理大量數據的應用程序來說至關重要，因為它們可以顯著提高性能並簡化代碼結構。

## 批次操作的主要端點

以下是 Domino REST API 提供的主要批次操作端點：

- **批次創建文檔**：允許一次性創建多個文檔。
- **批次檢索文檔**：根據唯一標識符（UNID）一次性檢索多個文檔。
- **批次更新文檔**：根據查詢條件批量更新文檔。
- **批次刪除文檔**：根據 UNID 或查詢條件批量刪除文檔。

## 使用批次操作的步驟

1. **設置 REST API 會話**：

   首先，您需要設置與 Domino REST API 的會話。這通常涉及身份驗證和獲取訪問令牌。

2. **執行批次操作**：

   使用適當的端點和方法執行所需的批次操作。例如，使用 `bulkCreateDocuments` 方法批量創建文檔。

3. **處理響應**：

   每個批次操作都會返回一個響應，您需要根據響應處理結果，例如檢查成功或失敗的操作。

## 示例代碼

以下是使用 Node.js 和 `@hcl-software/domino-rest-sdk-node` 庫進行批次創建文檔的示例：

```javascript
const { DominoRestClient } = require('@hcl-software/domino-rest-sdk-node');

async function bulkCreateDocuments() {
  const client = new DominoRestClient({
    baseUrl: 'https://your-domino-server.com',
    auth: {
      username: 'your-username',
      password: 'your-password',
    },
  });

  const session = await client.createSession();

  const documents = [
    { Subject: 'Document 1', Body: 'Content for document 1' },
    { Subject: 'Document 2', Body: 'Content for document 2' },
  ];

  try {
    const createdDocs = await session.bulkCreateDocuments('your-database', documents);
    console.log('Documents created successfully:', createdDocs);
  } catch (error) {
    console.error('Error creating documents:', error);
  }
}

bulkCreateDocuments();
```

在此示例中，我們首先創建了一個 `DominoRestClient` 實例，然後使用該客戶端創建了一個會話。接著，我們定義了一組要創建的文檔，並使用 `bulkCreateDocuments` 方法將它們批量添加到指定的數據庫中。

## 注意事項

- **錯誤處理**：在執行批次操作時，請確保實現適當的錯誤處理機制，以應對可能的失敗情況。
- **性能考量**：雖然批次操作可以提高性能，但一次性處理過多的文檔可能會導致伺服器負載過高。請根據實際需求調整批次大小。

## 結論

Domino REST API 的批次操作功能為開發者提供了一種高效的方法來處理大量文檔。通過正確的實現和錯誤處理，您可以顯著提高應用程序的性能和可靠性。

有關更多詳細信息，請參閱 [Domino REST API 文檔](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html) 和 [DominoBasisRestSession 介面文檔](https://opensource.hcltechsw.com/domino-rest-sdk-node/interfaces/RestInterfaces.DominoBasisRestSession.html)。
