---
title: "Guide to Manipulating NotesDocument Using HCL Domino REST API"
description: "This tutorial introduces how to use the HCL Domino REST API with JavaScript to perform CRUD operations on NotesDocument within a Domino database."
pubDate: "2026-05-11T07:23:03+08:00"
lang: "en"
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

## Introduction

The HCL Domino REST API provides a secure RESTful interface that allows developers to interact with HCL Domino servers and databases using modern programming languages and tools. Through this API, developers can perform Create, Read, Update, and Delete (CRUD) operations on NotesDocument, thereby extending and modernizing existing Domino applications.

## Prerequisites

Before you begin, ensure that you have:

- Installed and configured the HCL Domino REST API. Detailed installation and configuration guides can be found in the [HCL Domino REST API Tutorials](https://opensource.hcltechsw.com/domino-keep-tutorials/pages/domino-new/).

- Appropriate access permissions to the target Domino database.

- Installed Postman or a similar API testing tool to test API requests.

## Manipulating NotesDocument

### 1. Creating a New Document

To create a new document in a Domino database, send a `POST` request to the `/databases/{dbid}/documents` endpoint. The request body should include the fields and corresponding values for the new document.

**Example Request:**

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

In the above request, replace `{dbid}` with your database ID and `{your_access_token}` with your authorization token. The request body includes fields such as `Form`, `FirstName`, `LastName`, and `Email` for the new document.

### 2. Reading an Existing Document

To read an existing NotesDocument, send a `GET` request to the `/databases/{dbid}/documents/{unid}` endpoint, where `{unid}` is the unique identifier of the target document.

**Example Request:**

```http
GET /databases/{dbid}/documents/{unid}
Authorization: Bearer {your_access_token}
```

This request will return detailed information about the specified document, including all fields and their values.

### 3. Updating an Existing Document

To update an existing NotesDocument, send a `PATCH` request to the `/databases/{dbid}/documents/{unid}` endpoint, including the fields to be updated and their new values in the request body.

**Example Request:**

```http
PATCH /databases/{dbid}/documents/{unid}
Content-Type: application/json
Authorization: Bearer {your_access_token}

{
  "Email": "john.new@example.com"
}
```

This request will update the `Email` field of the specified document to the new value.

### 4. Deleting an Existing Document

To delete an existing NotesDocument, send a `DELETE` request to the `/databases/{dbid}/documents/{unid}` endpoint.

**Example Request:**

```http
DELETE /databases/{dbid}/documents/{unid}
Authorization: Bearer {your_access_token}
```

This request will delete the specified document.

## Conclusion

By leveraging the HCL Domino REST API, developers can conveniently perform CRUD operations on NotesDocument within Domino databases using modern programming languages and tools. This provides a pathway to extend and modernize existing Domino applications. For more detailed information, refer to the [HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html) and [NotesDocument (JavaScript)](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Document.html).
