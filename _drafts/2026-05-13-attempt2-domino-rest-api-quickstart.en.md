---
title: "Domino REST API Quickstart Guide"
description: "This guide aims to help users with experience in HCL Notes and Domino quickly install, configure, and start using the Domino REST API, covering steps from downloading and installation to executing basic API requests."
pubDate: "2026-05-13T07:29:09+08:00"
lang: "en"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Overview of using Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-v1-1-6-release] on 2026-05-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 14/18 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: domino-rest-api-quickstart
-->

## Introduction

The Domino REST API provides secure RESTful access to HCL Domino servers and databases, allowing developers to interact with Domino using their preferred programming languages. This guide will walk you through the process of quickly installing, configuring, and starting to use the Domino REST API.

## Step 1: Download the Domino REST API

First, log in to the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) and download the latest version of the Domino REST API installer or Docker image.

## Step 2: Install and Run the Domino REST API

Follow the [installation and configuration guide](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) to install and start the REST API on your Domino server or Notes client. After installation, complete the necessary post-installation steps to ensure proper operation.

## Step 3: Familiarize Yourself with Domino REST API Tools

- Explore the [Admin UI tutorial](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) for web-based API management.
- Understand core concepts such as [schemas and scopes](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html).
- Familiarize yourself with API testing tools like Postman and curl, which are invaluable for working with REST APIs.

## Step 4: Get Started with Your First Database

- Choose a database to work with, such as the sample demo.nsf.
- Create a schema that defines the data structure and which fields/forms you want to expose via REST. This requires using Domino Designer with appropriate developer access.
- Select views you want to expose through REST.
- Optionally, configure agents to be REST accessible.
- Create a scope (an externally visible alias for your database/API exposure) via the Domino REST API admin tools by a Domino administrator.

**Note**: Scopes should be lowercase and are part of your API URLs (`?dataSource=[scopename]`).

## Step 5: Try It Out

- Use one or more of the following methods to test your API:
  - The built-in Swagger UI for exploring available endpoints interactively.
  - Send API requests via Postman.
  - Use curl commands or the provided Domino REST API shell script for command-line testing.

## Learn More

- Dive deeper into [installation and configuration](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)
- Learn more about [using Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html)
- Explore internal workings and the security layer Barbican

## Join the Community and Provide Feedback

Your feedback is valuable. Join the conversation and get help via:

- [HCLSoftware Digital Solutions Community Forum](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)
- [OpenNTF Discord channel](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)
- Customer support information: [Contact Support](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)
