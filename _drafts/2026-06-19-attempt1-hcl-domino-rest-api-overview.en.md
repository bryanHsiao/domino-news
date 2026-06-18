---
title: "HCL Domino REST API: Bridging Modern Application Development"
description: "The HCL Domino REST API offers a secure RESTful interface, enabling developers to access Domino servers and databases using modern tools, thereby expanding application possibilities."
pubDate: "2026-06-19T07:37:57+08:00"
lang: "en"
slug: "hcl-domino-rest-api-overview"
tags:
  - "Domino REST API"
  - "Tutorial"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 4/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-domino-rest-api-overview
-->

## What is the HCL Domino REST API?

The HCL Domino REST API provides a secure RESTful interface to HCL Domino servers and databases, allowing developers to access Domino data using modern development tools and languages. This functionality aims to reposition Domino as a modern, standards-compliant, cloud-native, enterprise-level collaboration platform. Through this API, developers can extend and modernize existing Domino applications and seamlessly integrate with other systems.

## Key Features

- **Security**: The Domino REST API inherits the security model of Notes and Domino. All access to databases is authenticated using JSON Web Token (JWT) and scopes, ensuring data security.

- **Modern Java API**: Utilizes modern Java APIs (Java 8 and above), adhering to industry standards and best practices, providing a more flexible development experience.

- **OpenAPI 3.0-Based Public API**: The API follows the OpenAPI 3.0 specification, offering interactive documentation that facilitates understanding and usage for developers.

- **Extensible Architecture**: Supports multiple API versions and can be extended as needed to meet various application scenarios.

- **Web GUI Management**: Provides a web interface for managing schemas, scopes, and applications, simplifying the configuration process.

## Installation and Configuration

To get started with the Domino REST API, follow these steps:

1. **Download the Installation Package**: Obtain the latest Domino REST API installer or Docker image from the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html).

2. **Install and Run**: Install the API on your operating system (Windows, Linux, or macOS) and start the Domino REST API.

3. **Utilize Tools**: Familiarize yourself with and use the provided tools, such as Swagger UI, Postman, or curl, for testing and interaction.

4. **Configure Databases**: Create schemas defining accessible design elements like forms, views, and agents.

5. **Create Scopes**: Establish scopes for the schemas, defining accessible users and maximum allowed access levels.

6. **Test and Verify**: Use the provided tools to test the API, ensuring correct configuration and functionality.

## Further Learning

- **Official Documentation**: For detailed installation and configuration guides, refer to the [Domino REST API Quickstart](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html).

- **Administrator Guide**: Understand the roles and responsibilities of administrators during the installation and configuration process by reading [Domino Administrators - What You Need to Know About the Domino REST API](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api).

By leveraging the Domino REST API, developers can securely access and manipulate Domino data using modern tools and languages, facilitating the modernization and expansion of applications.
