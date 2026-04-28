---
title: "HCL Domino REST API Quickstart Guide"
description: "This guide walks you through installing, configuring, and starting with the HCL Domino REST API, enabling access to Domino databases via a modern RESTful interface."
pubDate: "2026-04-28"
lang: "en"
slug: "hcl-domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
  - title: "Overview of using Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino REST API walkthrough - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/walkthrough/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html" appears 4/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: hcl-domino-rest-api-quickstart
-->

## Introduction

The HCL Domino REST API provides a secure and modern way for developers to access Domino servers and databases through a RESTful interface. With this API, you can use your preferred programming language to extend and modernize existing Domino applications.

## Step 1: Download the Domino REST API

First, log in to the [HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) and download the latest version of the Domino REST API installer or Docker image.

## Step 2: Install and Run the Domino REST API

Follow the [installation and configuration guide](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) to install and start the REST API on your Domino server or Notes client. After installation, complete the necessary post-installation steps to ensure proper operation.

## Step 3: Familiarize Yourself with Domino REST API Tools

- **Admin UI**: Use the web interface to manage API configurations.
- **Postman and curl**: These tools help in testing and debugging API requests.
- **Swagger UI**: Provides interactive API documentation, allowing you to explore available endpoints.

## Step 4: Configure Your First Database

1. **Choose a Database**: Select an existing Domino database or use a sample database like demo.nsf.
2. **Create a Schema**: Define the data structure you want to expose via the REST API, including forms, views, and fields.
3. **Create a Scope**: Through the Admin UI, create a scope that serves as an externally visible alias for your database.

## Step 5: Test the API

Use one of the following methods to test your API:

- **Swagger UI**: Interactively explore and test endpoints in your browser.
- **Postman**: Send API requests and view responses.
- **curl**: Use the command-line tool to send requests.

## Further Learning

- **Dive Deeper into Installation and Configuration**: Learn more about the installation and configuration details.
- **Using Admin UI**: Understand how to manage your API through the Admin UI.
- **Using Postman and curl**: Master how to test APIs using these tools.

By following this guide, you'll be able to quickly get started with the HCL Domino REST API and begin integrating it into your applications.
