---
title: "Getting Started with HCL Domino REST API"
description: "This article introduces the basics of HCL Domino REST API, including installation, configuration steps, and how to begin using it, helping you quickly integrate it into your existing Domino environment."
pubDate: "2026-11-20T11:53:35+08:00"
lang: "en"
slug: "domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Overview of using Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai" appears 4/10 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-introduction
-->

## What is HCL Domino REST API?

The HCL Domino REST API provides a secure REST interface, allowing external systems to access HCL Domino servers and databases. It aims to modernize Domino into a standards-compliant, enterprise-level collaboration platform, enabling developers to interact with Domino using their preferred programming languages. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## Installation and Configuration

To install the Domino REST API on your Domino server, follow these steps:

1. **Download the Installation Files**:
   - Visit the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) to download the installer appropriate for your Domino version.

2. **Run the Installer**:
   - Extract the downloaded installation file and copy `restapiInstall-r12.jar` to your Domino server's program directory.
   - Open a command prompt as an administrator and execute the following command (adjust paths as per your environment):
     ```
     java -jar c:\domino\restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
     ```

3. **Start the REST API Service**:
   - In the Domino server console, enter the following command to start the REST API:
     ```
     load restapi
     ```
   - To ensure the REST API starts automatically with the server, add `restapi` to the `ServerTasks` entry in the `notes.ini` file. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## Initial Setup

After installation, perform the following configurations to begin using the Domino REST API:

1. **Create a Database Configuration (Schema)**:
   - Use the Admin UI or API to create a schema for an existing Domino database.

2. **Enable Forms, Views, and Document Items**:
   - Specify which forms, views, folders, agents, and document items are accessible through the API.

3. **Create a Scope**:
   - Establish a scope corresponding to the schema to activate the configuration.

4. **Configure an Application**:
   - In the Admin UI, create an application to generate a `client_id` and `client_secret`, enabling your applications to authenticate using OAuth. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html?utm_source=openai))

## Security Considerations

The Domino REST API inherits the security model of Notes and Domino. All access to the database requires authentication using JSON Web Token (JWT) and scopes. You can authenticate using Domino credentials or enterprise identity providers like Keycloak or Active Directory, ensuring data security. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## Conclusion

By leveraging the Domino REST API, you can integrate Domino databases with various modern applications and services, extending their functionality and accessibility. Following the steps outlined above for installation and configuration will enable you to harness the powerful features offered by the REST API, enhancing the flexibility and modernization of your Domino environment.
