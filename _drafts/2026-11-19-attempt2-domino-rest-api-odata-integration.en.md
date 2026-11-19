---
title: "Integrating OData with HCL Domino REST API: From Setup to Application"
description: "This tutorial guides you through configuring HCL Domino REST API to support OData protocol and demonstrates how to access Domino databases in Microsoft Excel."
pubDate: "2026-11-19T12:01:01+08:00"
lang: "en"
slug: "domino-rest-api-odata-integration"
tags:
  - "Tutorial"
  - "Domino REST API"
sources:
  - title: "OData - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/odata/index.html"
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "OpenAPI - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/odata/index.html?utm_source=openai" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: domino-rest-api-odata-integration
-->

## Introduction

The HCL Domino REST API offers a secure and modern way for developers to access Domino servers and databases through RESTful services. OData (Open Data Protocol) is an open standard protocol that allows applications to query and update data uniformly. By configuring the Domino REST API to support OData, you can access Domino data in various OData-compliant applications such as Microsoft Excel, Salesforce, and Power BI. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/odata/index.html?utm_source=openai))

## Configuring Domino REST API to Support OData

To enable OData support in the Domino REST API, follow these steps:

1. **Create a Database Schema**:
   - Access the Domino REST API administration interface.
   - Create a new schema for the existing Domino database you wish to access via OData.

2. **Enable Forms**:
   - Within the newly created schema, select the forms you want to expose through OData.
   - Set the mode of these forms to `odata`.

3. **Create a Scope**:
   - Establish a new scope for the schema to activate the corresponding OData access.

After completing these steps, your Domino REST API will be configured to support OData, allowing access from OData-compliant applications. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/odata/index.html?utm_source=openai))

## Accessing Domino Databases in Microsoft Excel

Here's how to access Domino databases in Microsoft Excel using OData:

1. **Open Excel and Connect to OData Feed**:
   - In Excel, navigate to the "Data" tab and click on "Get Data" > "From Other Sources" > "From OData Feed".

2. **Enter OData Connection Information**:
   - In the dialog box, input the OData endpoint URL of your Domino REST API.
   - For example, `https://your-domino-server.com/odata/`.

3. **Authenticate and Select Data**:
   - Depending on your Domino REST API configuration, you may need to provide authentication credentials.
   - Once connected, you'll see a list of available forms. Select the form you wish to load into Excel and click "Load".

4. **Process and Analyze Data**:
   - After loading, you can utilize Excel's tools to analyze, chart, and report on the data.

## Considerations

- **Security**: Ensure that your Domino REST API is properly configured with security settings, including authentication and authorization, to protect your data. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/security/securingKEEPEndpoints.html?utm_source=openai))

- **API Documentation**: The Domino REST API provides detailed documentation based on OpenAPI 3.0, accessible via Swagger UI, to understand all available endpoints and operations. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html?utm_source=openai))

By following these steps, you can successfully configure the HCL Domino REST API to support OData and access Domino databases in various OData-compliant applications, enhancing data accessibility and flexibility.
