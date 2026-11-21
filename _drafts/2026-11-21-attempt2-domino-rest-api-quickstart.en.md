---
title: "Domino REST API Quickstart Guide"
description: "This guide walks you through installing, configuring, and getting started with the HCL Domino REST API for secure and modern application development."
pubDate: "2026-11-21T11:49:37+08:00"
lang: "en"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Welcome - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/index.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Overview of using Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: domino-rest-api-quickstart
-->

## Introduction to Domino REST API

The HCL Domino REST API provides secure RESTful access to Domino servers and databases across Windows, Linux, and macOS platforms. It aims to modernize Domino as a standards-compliant, enterprise-level collaboration platform, enabling developers to use various tools for application development.

## Installation and Configuration

### Download Installation Files

1. Navigate to the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html).
2. After logging in, go to the HCL Domino section and select the appropriate Domino REST API version for your platform.
3. Download the corresponding installation file.

### Installation Steps

1. Extract the downloaded file to obtain the installer (e.g., `restapiInstall-r12.jar`).
2. Copy the installer to the Domino server's program directory.
3. Open a command prompt, navigate to that directory, and run the following command to install:

   ```
   java -jar restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
   ```

   Adjust the paths according to your actual setup.

### Configuration and Startup

1. After installation, the Domino REST API runs as a server task. Start it by entering the following command in the Domino server console:

   ```
   load restapi
   ```

2. To ensure the REST API starts automatically with the server, add `restapi` to the `ServerTasks` entry in the `notes.ini` file.

3. If you've configured HTTPS, modify the `KeepManagementURL` in `notes.ini` to `https` to ensure the REST API starts correctly.

## Quickstart

### Create a Schema

1. Access the Domino REST API Admin UI.
2. Create a new Schema corresponding to an existing Domino database.
3. Enable the forms, views, folders, agents, and document items you want to expose through the API.

### Create a Scope

1. In the Admin UI, create a Scope for your Schema.
2. Configure the Scope to define which resources are accessible via the API.

### Test the API

1. Use tools like `curl` or Postman to test the API.
2. Send requests to verify that your configuration is correct.

### Configure Applications

1. In the Admin UI, create an application to obtain a `client_id` and `client_secret`.
2. Use these credentials to authenticate your application via OAuth, allowing secure access to Domino data.

By following these steps, you've successfully installed and configured the HCL Domino REST API and are ready to develop modern applications. For more detailed information, refer to the [Domino REST API official documentation](https://opensource.hcltechsw.com/Domino-rest-api/index.html).
