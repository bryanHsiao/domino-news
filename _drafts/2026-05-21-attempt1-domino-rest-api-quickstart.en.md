---
title: "Domino REST API Quickstart Guide"
description: "This article provides a quickstart guide to the HCL Domino REST API, covering installation, configuration, and basic usage to help you get started and interact with your Domino server."
pubDate: "2026-05-21T07:32:44+08:00"
lang: "en"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [notesdocument-rest-api] on 2026-05-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 14/14 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-quickstart
-->

## Domino REST API Quickstart Guide

The HCL Domino REST API offers secure RESTful access to Domino servers and databases, enabling developers to interact with Domino using their preferred programming languages. This guide will walk you through the steps to quickly install, configure, and start using the Domino REST API.

### 1. Download the Domino REST API

Begin by logging into the [HCL Software Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) and downloading the latest version of the Domino REST API installer or Docker image.

### 2. Install and Run the Domino REST API

Follow the [installation and configuration guide](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) to install and start the REST API on your Domino server or Notes client. After installation, complete the post-installation steps to ensure proper operation.

### 3. Utilize Domino REST API Tools

- **Admin UI**: Learn to manage the API through the [Admin UI tutorial](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html).

- **Swagger UI**: Use the built-in Swagger UI to interactively explore available endpoints.

- **Postman and curl**: Familiarize yourself with these tools for testing and debugging REST API calls.

### 4. Configure Your First Database

- **Select a Database**: Choose an existing Domino database, such as `demo.nsf`.

- **Create a Schema**: Define the data structure and fields to expose via REST using Domino Designer.

- **Select Views**: Choose the views you want to expose through REST.

- **Configure Agents**: Optionally, configure agents to be accessible via REST.

- **Create a Scope**: Use the Admin UI to create a scope that links your database to the API.

### 5. Test the API

- **Swagger UI**: Interactively test endpoints using the built-in Swagger UI.

- **Postman**: Send API requests via Postman.

- **curl**: Use the curl command-line tool to test API calls.

### 6. Further Learning

- **Deepen Installation and Configuration Knowledge**: Refer to the [installation and configuration guide](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) for more details.

- **Understand Core Concepts**: Familiarize yourself with core concepts like [Schemas and Scopes](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html).

- **Join the Community**: Engage with the [HCL Domino forum](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) or the [OpenNTF Discord channel](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) for support and feedback.

By following these steps, you'll be well-equipped to start using the HCL Domino REST API, extending the functionality and accessibility of your Domino applications.
