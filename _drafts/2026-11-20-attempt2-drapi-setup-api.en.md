---
title: "Configuring Domino Databases Using the Domino REST API's Setup API"
description: "A comprehensive guide on utilizing the Domino REST API's Setup API to configure Domino databases, including creating schemas, enabling forms and views, and managing scopes."
pubDate: "2026-11-20T11:53:46+08:00"
lang: "en"
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

## Introduction

The Domino REST API offers a robust Setup API that allows developers to programmatically configure Domino databases. This includes creating schemas, enabling forms and views, and managing scopes. This article will guide you through the process of using the Setup API to configure your Domino databases.

## Prerequisites

Before you begin, ensure that you have installed and configured the Domino REST API. Detailed installation instructions can be found in the [Download Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) documentation.

## Creating a Schema

A schema defines the structure of a Domino database, specifying which forms, views, and fields are accessible via the REST API. To create a schema, send a POST request to the `/setup/schema` endpoint with the necessary information in the request body.

```json
{
  "name": "MySchema",
  "database": "mydatabase.nsf",
  "forms": ["Form1", "Form2"],
  "views": ["View1", "View2"]
}
```

This will create a schema named `MySchema` for the `mydatabase.nsf` database, enabling the specified forms and views.

## Enabling Forms and Views

After creating a schema, you can enable or disable specific forms and views by sending a PATCH request. For example, to enable a new form in an existing schema, send the following request:

```json
{
  "forms": ["NewForm"]
}
```

This will add and enable the `NewForm` in the existing schema.

## Managing Scopes

Scopes define which users or applications can access a particular schema. To create a scope, send a POST request to the `/setup/scope` endpoint with the necessary information in the request body.

```json
{
  "name": "MyScope",
  "schema": "MySchema",
  "clients": ["client_id_1", "client_id_2"]
}
```

This will create a scope named `MyScope` for the `MySchema` schema, allowing the specified clients to access it.

## Conclusion

By utilizing the Domino REST API's Setup API, you can programmatically configure Domino databases, enhancing development efficiency and ensuring consistent configurations. For more detailed information, refer to the [Setup API - HCL Domino REST API Documentation](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html).
