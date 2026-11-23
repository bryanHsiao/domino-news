---
title: "Guide to Bulk Operations with Domino REST API"
description: "This tutorial introduces how to use the bulk operations feature of the Domino REST API to efficiently create, retrieve, update, and delete documents."
pubDate: "2026-11-23T11:34:43+08:00"
lang: "en"
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

## Introduction

The Domino REST API offers a set of powerful bulk operation endpoints that allow developers to perform create, retrieve, update, and delete actions on multiple documents simultaneously. These features are crucial for applications that need to handle large volumes of data, as they can significantly enhance performance and simplify code structure.

## Key Bulk Operation Endpoints

The primary bulk operation endpoints provided by the Domino REST API include:

- **Bulk Create Documents**: Allows the creation of multiple documents in a single request.
- **Bulk Retrieve Documents**: Retrieves multiple documents based on their unique identifiers (UNIDs).
- **Bulk Update Documents**: Updates multiple documents based on specified query criteria.
- **Bulk Delete Documents**: Deletes multiple documents based on UNIDs or query criteria.

## Steps to Use Bulk Operations

1. **Set Up REST API Session**:

   Begin by establishing a session with the Domino REST API. This typically involves authentication and obtaining an access token.

2. **Perform Bulk Operations**:

   Utilize the appropriate endpoints and methods to execute the desired bulk operations. For instance, use the `bulkCreateDocuments` method to create multiple documents at once.

3. **Handle Responses**:

   Each bulk operation returns a response that should be processed accordingly, such as checking for successful or failed operations.

## Example Code

Below is an example of using Node.js and the `@hcl-software/domino-rest-sdk-node` library to perform a bulk create operation:

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

In this example, we first create a `DominoRestClient` instance and then use it to establish a session. We define an array of documents to be created and use the `bulkCreateDocuments` method to add them to the specified database in bulk.

## Considerations

- **Error Handling**: Ensure proper error handling mechanisms are in place when performing bulk operations to address potential failures.
- **Performance Considerations**: While bulk operations can improve performance, processing too many documents at once may lead to server overload. Adjust batch sizes according to your application's needs.

## Conclusion

The bulk operations feature of the Domino REST API provides developers with an efficient way to handle large numbers of documents. By implementing these operations correctly and handling errors appropriately, you can significantly enhance the performance and reliability of your applications.

For more detailed information, refer to the [Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html) and the [DominoBasisRestSession Interface Documentation](https://opensource.hcltechsw.com/domino-rest-sdk-node/interfaces/RestInterfaces.DominoBasisRestSession.html).
