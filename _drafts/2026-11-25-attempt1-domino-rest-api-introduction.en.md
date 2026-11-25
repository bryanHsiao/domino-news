---
title: "Getting Started with HCL Domino REST API"
description: "Learn how to install, configure, and use the HCL Domino REST API to integrate Domino applications with modern web technologies and extend their capabilities."
pubDate: "2026-11-25T13:16:00+08:00"
lang: "en"
slug: "domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "JavaScript"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Overview of using Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino REST API task"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-introduction
-->

## What is HCL Domino REST API?

The HCL Domino REST API provides a secure RESTful interface that allows developers to access HCL Domino servers and databases using various programming languages. This enables Domino applications to integrate with modern web technologies and extend their functionalities.

## Installation and Configuration

To begin using the Domino REST API, follow these steps for installation and configuration:

1. **Download the Installer**:

   Obtain the appropriate installation file for your Domino version from the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html).

2. **Install**:

   Execute the installation steps corresponding to your operating system. Detailed installation guides are available on the [Installation and Configuration](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) page.

3. **Start the REST API Service**:

   In the Domino server console, enter the following command to start the REST API:

   ```
   load restapi
   ```

   To ensure the REST API loads automatically upon server startup, add `restapi` to the `ServerTasks` entry in the `notes.ini` file.

## Configuration and Usage

After installation, configure the REST API as follows:

1. **Create a Database Configuration (Schema)**:

   Use the Admin UI or API to create a schema for an existing Domino database, specifying the forms, views, folders, agents, and document items accessible through the API.

2. **Activate the Schema**:

   Create a scope to activate the schema, allowing applications to access the database through this scope.

3. **Test the API**:

   Utilize tools like `curl` or Postman to test the REST API functionalities and ensure proper configuration.

4. **Configure Applications**:

   In the Admin UI, create an application to generate a `client_id` and `client_secret`, enabling your application to authenticate using OAuth.

## Further Learning

To delve deeper into the functionalities and usage of the Domino REST API, refer to the following resources:

- [Domino REST API Documentation Home](https://opensource.hcltechsw.com/Domino-rest-api/)

- [Overview of Using Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html)

These resources will guide you in integrating Domino applications with modern web technologies, extending their capabilities, and enhancing development efficiency.
