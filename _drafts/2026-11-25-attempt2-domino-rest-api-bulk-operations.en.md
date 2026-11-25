---
title: "Guide to Bulk Operations with Domino REST API"
description: "This tutorial introduces how to use the bulk operations feature of the Domino REST API to efficiently create, retrieve, update, and delete documents."
pubDate: "2026-11-25T13:16:53+08:00"
lang: "en"
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

## Introduction

The Domino REST API offers a set of powerful bulk operation endpoints that allow developers to perform create, retrieve, update, and delete actions on multiple documents simultaneously. These bulk operations enhance application performance and efficiency, especially when handling large datasets.

## Setting Up the Environment

Before utilizing bulk operations, ensure your environment is properly configured:

1. **Install Domino REST API**: Follow the official [installation guide](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) for setup.

2. **Configure Access Permissions**: Ensure your application has appropriate access permissions to the target database.

3. **Obtain Authentication Credentials**: Set up an OAuth client to acquire `client_id` and `client_secret` for authentication.

## Using Bulk Operations

The following examples demonstrate how to use the Domino REST API's bulk operations to create, retrieve, update, and delete documents.

### 1. Bulk Create Documents

To create multiple documents at once, use the `bulkCreateDocuments` method. Here's an example using the Node.js SDK:

```javascript
const { DominoBasisSession } = require('@hcl-software/domino-rest-sdk-node');

async function bulkCreateDocuments() {
  const session = new DominoBasisSession(dominoAccess, dominoConnector);
  const dataSource = 'your_data_source_name';
  const documents = [
    { field1: 'value1', field2: 'value2' },
    { field1: 'value3', field2: 'value4' }
  ];

  try {
    const createdDocs = await session.bulkCreateDocuments(dataSource, documents);
    console.log('Created documents:', createdDocs);
  } catch (error) {
    console.error('Error creating documents:', error);
  }
}

bulkCreateDocuments();
```

In this example, we create a `DominoBasisSession` instance and use the `bulkCreateDocuments` method to create multiple documents in the specified data source.

### 2. Bulk Retrieve Documents

To retrieve multiple documents, use the `bulkGetDocuments` method:

```javascript
async function bulkGetDocuments() {
  const session = new DominoBasisSession(dominoAccess, dominoConnector);
  const dataSource = 'your_data_source_name';
  const unids = ['documentUNID1', 'documentUNID2'];

  try {
    const documents = await session.bulkGetDocuments(dataSource, unids);
    console.log('Retrieved documents:', documents);
  } catch (error) {
    console.error('Error retrieving documents:', error);
  }
}

bulkGetDocuments();
```

This function retrieves multiple documents by providing a list of their UNIDs.

### 3. Bulk Update Documents

To update multiple documents, use the `bulkUpdateDocumentsByQuery` method:

```javascript
async function bulkUpdateDocuments() {
  const session = new DominoBasisSession(dominoAccess, dominoConnector);
  const dataSource = 'your_data_source_name';
  const query = 'query_to_select_documents_to_update';
  const updateData = { field1: 'new_value' };

  try {
    const updateResponse = await session.bulkUpdateDocumentsByQuery(dataSource, query, updateData);
    console.log('Update response:', updateResponse);
  } catch (error) {
    console.error('Error updating documents:', error);
  }
}

bulkUpdateDocuments();
```

This example demonstrates how to update specific fields in multiple documents based on a query condition.

### 4. Bulk Delete Documents

To delete multiple documents, use the `bulkDeleteDocumentsByUNID` method:

```javascript
async function bulkDeleteDocuments() {
  const session = new DominoBasisSession(dominoAccess, dominoConnector);
  const dataSource = 'your_data_source_name';
  const unids = ['documentUNID1', 'documentUNID2'];

  try {
    const deleteResponse = await session.bulkDeleteDocumentsByUNID(dataSource, unids);
    console.log('Delete response:', deleteResponse);
  } catch (error) {
    console.error('Error deleting documents:', error);
  }
}

bulkDeleteDocuments();
```

This function deletes multiple documents by providing a list of their UNIDs.

## Conclusion

By leveraging the bulk operations of the Domino REST API, developers can efficiently perform create, retrieve, update, and delete actions on multiple documents, thereby enhancing application performance and scalability. For more detailed information, refer to the official documentation on the [DominoBasisRestSession Interface](https://opensource.hcltechsw.com/domino-rest-sdk-node/interfaces/RestInterfaces.DominoBasisRestSession.html) and the [DominoBasisSession Class](https://opensource.hcltechsw.com/domino-rest-sdk-node/classes/index.DominoBasisSession.html).
