---
title: "HCL Domino REST API: Bridging Modern Application Development"
description: "The HCL Domino REST API offers a secure RESTful interface, enabling developers to access Domino servers and databases using various programming languages, facilitating application modernization and expansion."
pubDate: "2026-06-16T07:39:04+08:00"
lang: "en"
slug: "domino-rest-api-introduction"
tags:
  - "Domino REST API"
  - "Tutorial"
  - "Domino Server"
sources:
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Domino REST API Tutorials | Tutorial for HCL Domino REST API"
    url: "https://opensource.hcltechsw.com/domino-keep-tutorials/pages/domino-new/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai" appears 10/16 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-introduction
-->

## What is the HCL Domino REST API?

The HCL Domino REST API (formerly known as HCL Project KEEP) provides a secure RESTful interface to HCL Domino servers and databases. This API allows developers to access Domino data using various programming languages such as Java, C#, and Python, facilitating the modernization and expansion of applications. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## Key Features

- **Cross-Platform Support**: The Domino REST API operates on Windows, Linux, and macOS, and supports Docker and Kubernetes containers, offering flexible deployment options. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **Security**: The API inherits Domino's security model, utilizing JSON Web Token (JWT) and scopes for authentication, ensuring secure data access. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **Modern Java API**: It employs modern Java APIs (Java 8 and above), adhering to industry standards and best practices to enhance development efficiency. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

- **OpenAPI 3.0-Based Public API**: The API provides public interfaces compliant with OpenAPI 3.0 standards, accompanied by interactive documentation to assist developers. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## Installation and Configuration

To install the Domino REST API on a Domino server, follow these steps:

1. **Download the Installation File**: Obtain the appropriate installation file for your platform from HCL's official website.

2. **Extract the Files**: Use suitable tools to extract the downloaded file to access the installer (e.g., `restapiInstall-r12.jar`). ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api?utm_source=openai))

3. **Run the Installer**: Copy the installer to the Domino server's program directory and execute the installation command within that directory.

4. **Start the REST API Service**: After installation, the Domino REST API runs as a task on the Domino server. You can start the service by entering `load restapi` in the server console. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## Configuration and Management

Post-installation, it's recommended to perform the following configurations to ensure the service's functionality and security:

- **Configure CORS**: Set up Cross-Origin Resource Sharing (CORS) to allow specific domains to access the API.

- **Set Up JWT**: Configure JSON Web Token (JWT) for secure authentication.

- **Manage Database Access**: Define which databases and design elements are accessible through the API and set appropriate permissions. ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api-part-two?utm_source=openai))

## Conclusion

The HCL Domino REST API provides developers with a powerful and flexible tool to access Domino data using modern programming languages and frameworks, facilitating application modernization and expansion. With proper installation and configuration, you can fully leverage the capabilities of this API to enhance your application's performance and security.
