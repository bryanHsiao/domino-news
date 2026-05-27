---
title: "Introduction to HCL Domino REST API"
description: "Learn about the features, installation steps, and how to access Domino databases using the HCL Domino REST API."
pubDate: "2026-05-28T07:32:03+08:00"
lang: "en"
slug: "hcl-domino-rest-api-introduction"
tags:
  - "Domino REST API"
  - "Tutorial"
  - "Domino Server"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai" appears 6/10 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-domino-rest-api-introduction
-->

## What is HCL Domino REST API?

The HCL Domino REST API provides a secure RESTful interface, allowing developers to interact with HCL Domino servers and databases in a modern way. With this API, developers can use their preferred programming languages to read, write, and manage data within the Domino platform.

## Key Features

- **Security**: The Domino REST API inherits the security model of Notes and Domino. All database access requires authentication, utilizing JSON Web Token (JWT) and scopes for permission control. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **Modern Java API**: The API is built on modern Java 8+, adhering to industry standards and best practices, offering a stable and efficient development experience. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **OpenAPI 3.0 Based Public API**: The API follows the OpenAPI 3.0 specification, providing interactive documentation for developers to understand and use the API effectively. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/openapidefinitions.html?utm_source=openai))

- **Extensible Architecture**: The API's architecture supports multiple API versions and can be extended as needed. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## Installation and Configuration

1. **Download the Installer**: Obtain the appropriate Domino REST API installer from the HCL Software Portal for your platform.

2. **Install**: Extract the installer package and copy the `restapiInstall-r12.jar` file to the Domino server's program directory.

3. **Run the Installation Command**: In the command prompt, run the following command with administrative privileges, replacing the paths with those specific to your server:

   ```
   java -jar c:\domino\restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
   ```

   ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api?utm_source=openai))

4. **Verify Installation**: After installation, the Domino REST API runs as a server task. You can check its status by entering `tell restapi status` in the Domino server console.

## Usage Example

Once installed, you can start using the Domino REST API by following these steps:

1. **Create a Schema**: Define the database structure you wish to expose via the API, including forms, views, and agents.

2. **Set Up a Scope**: Create a scope corresponding to the schema, specifying which users or applications can access it and setting the maximum allowed access permissions.

3. **Create an OAuth Application**: If needed, configure an OAuth application for external applications, generating an application ID and secret for secure API access.

4. **Test the API**: Use tools like Postman or curl to test the API using the generated JWT access token, ensuring it operates correctly.

By following these steps, you can successfully install, configure, and begin using the HCL Domino REST API to interact with Domino databases in a modern and efficient manner.
