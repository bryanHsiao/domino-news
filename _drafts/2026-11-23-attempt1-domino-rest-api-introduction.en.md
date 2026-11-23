---
title: "HCL Domino REST API: Bridging Modern Application Development"
description: "The HCL Domino REST API offers a secure RESTful interface, enabling developers to access Domino servers and databases using various programming languages, facilitating application modernization and expansion."
pubDate: "2026-11-23T11:34:30+08:00"
lang: "en"
slug: "domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino REST API task"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html" appears 4/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-introduction
-->

## What is the HCL Domino REST API?

The HCL Domino REST API provides a secure RESTful interface to Domino servers and databases, allowing developers to access and manipulate Domino data using various programming languages. This positions Domino as a modern, standards-compliant, cloud-native, enterprise-level collaboration platform, extending its capabilities through REST APIs and enabling developers to work with their preferred tools.

## Key Features

- **Cross-Platform Support**: The Domino REST API operates on Windows, Linux, and macOS, and supports Docker containers, offering flexible deployment options.

- **Security**: It inherits the security model of Notes and Domino, utilizing JSON Web Token (JWT) and Scopes for authentication, and can integrate with enterprise Identity Providers (IdP) like Keycloak or Active Directory.

- **Modern Java API**: Employs redesigned Java APIs (Domino JNX) that adhere to industry standards and best practices, providing a more efficient development experience.

- **OpenAPI 3.0-Based Public API**: Offers comprehensive interactive documentation, ensuring that API specifications are always in sync with the server's actual running state.

- **Extensible Architecture**: Supports multiple API versions and provides a management interface for schemas, scopes, and applications.

## Installation and Configuration

To install the Domino REST API on a Domino server, follow these steps:

1. **Download the Installation File**: Obtain the appropriate installation file for your platform from the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html).

2. **Run the Installer**: Copy the installation file to the Domino server's program directory and execute the following command in an administrator command prompt:

   ```
   java -jar restapiinstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
   ```

   Adjust the paths according to your server configuration.

3. **Start the REST API**: Enter `load restapi` in the Domino server console to start the REST API. To ensure it loads automatically upon server startup, add `restapi` to the `ServerTasks` entry in the `notes.ini` file.

For more detailed information, refer to the [Domino REST API task](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html).

## Management and Monitoring

Once installed, the Domino REST API runs as a task on the Domino server. You can manage and monitor it using the following commands in the server console:

- **Start the REST API**:

  ```
  load restapi
  ```

- **Stop the REST API**:

  ```
  tell restapi quit
  ```

- **View Status and Configuration**:

  ```
  tell restapi status
  tell restapi config
  ```

- **Refresh Configuration**:

  ```
  tell restapi refresh
  ```

For additional management commands and detailed information, see the [Domino REST API task](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html).

## Conclusion

The HCL Domino REST API provides developers with a powerful and flexible tool to access and manipulate Domino data using various programming languages, facilitating application modernization and expansion. By following the steps outlined above, you can successfully install, configure, and manage the Domino REST API to fully leverage its capabilities.
