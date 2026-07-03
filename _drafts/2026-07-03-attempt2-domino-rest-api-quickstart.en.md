---
title: "Domino REST API Quickstart Guide"
description: "This guide walks you through installing, configuring, and starting with the HCL Domino REST API, enabling you to access Domino servers and databases via a modern RESTful interface."
pubDate: "2026-07-03T08:08:35+08:00"
lang: "en"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
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
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-v1-1-7] on 2026-06-24. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/index.html" appears 6/14 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: domino-rest-api-quickstart
-->

## Introduction

The HCL Domino REST API provides a secure RESTful interface, allowing developers to access Domino servers and databases in a modern way. With this API, you can interact with Domino using various programming languages and tools, expanding its application scope.

## Step 1: Download the Domino REST API

First, log in to the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html) and download the latest version of the Domino REST API installer or Docker image.

## Step 2: Install and Run the Domino REST API

Depending on your operating system, follow these steps to install:

- **Windows/Linux/Mac**:
  - Run the downloaded installer and follow the prompts to complete the installation.
  - After installation, start the Domino server and enter `load restapi` in the server console to start the REST API.

- **Docker**:
  - Pull the latest Docker image using the following command:
    ```
    docker pull hclcom/domino-rest-api:latest
    ```
  - Run the container using:
    ```
    docker run -d -p 8880:8880 -p 8889:8889 -p 8890:8890 --name domino-rest-api hclcom/domino-rest-api:latest
    ```

## Step 3: Understand Domino REST API Tools

The Domino REST API offers several tools for testing and interaction:

- **Swagger UI**:
  - Open `http://localhost:8880/swagger-ui/` in your browser to view and test all available API endpoints.

- **Postman**:
  - Import the API's OpenAPI specification and use Postman to send requests and test the API.

- **curl**:
  - Use command-line tools to send HTTP requests, for example:
    ```
    curl -X GET http://localhost:8880/api/v1/data
    ```

## Step 4: Configure Your First Database

To access a Domino database via the REST API, perform the following configurations:

1. **Create a Schema**:
   - In the Admin UI, navigate to `Schemas`, click `Create`, select the database you want to access, and define accessible forms, views, documents, etc.

2. **Create a Scope**:
   - In the Admin UI, navigate to `Scopes`, click `Create`, select the previously created Schema, and define the access scope.

3. **Create an Application**:
   - In the Admin UI, navigate to `Applications`, click `Create`, set the application name, and obtain the `client_id` and `client_secret` for OAuth authentication.

## Step 5: Test the API

After completing the above configurations, you can test the API using the following methods:

- **Swagger UI**:
  - Open `http://localhost:8880/swagger-ui/` in your browser, select your configured Scope, and test the related endpoints.

- **Postman**:
  - Use the previously obtained `client_id` and `client_secret` for OAuth authentication, then send requests to test the API.

- **curl**:
  - Send requests using the following command:
    ```
    curl -X GET http://localhost:8880/api/v1/data?dataSource=YourScopeName -H "Authorization: Bearer YourAccessToken"
    ```

## Further Learning

- **Deep Dive into Installation and Configuration**:
  - [Installation and Configuration Guide](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)

- **Learn How to Use the Domino REST API**:
  - [Usage Guide](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html)

- **Explore Internal Workings and the Security Layer Barbican**:
  - [Security Guide](https://opensource.hcltechsw.com/Domino-rest-api/references/security/securingKEEPEndpoints.html)

## Join the Community and Provide Feedback

Your feedback is valuable. Join the conversation and get help via:

- **HCLSoftware Digital Solutions Community Forum**:
  - [Community Forum](https://opensource.hcltechsw.com/Domino-rest-api/index.html)

- **OpenNTF Discord Channel**:
  - [Discord Channel](https://opensource.hcltechsw.com/Domino-rest-api/index.html)

- **Customer Support Information**:
  - [Contact Support](https://opensource.hcltechsw.com/Domino-rest-api/index.html)
