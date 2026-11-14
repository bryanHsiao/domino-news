---
title: "Domino REST API Quickstart Guide"
description: "This guide walks you through installing, configuring, and getting started with the HCL Domino REST API for secure and modern application development."
pubDate: "2026-11-14T10:56:41+08:00"
lang: "en"
slug: "domino-rest-api-quickstart"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Download Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html"
  - title: "Domino REST API task"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Slug collision: "domino-rest-api-quickstart" already exists. The model ignored the FORBIDDEN SLUGS list — refusing to overwrite an existing post.
attempt: 2
slug: domino-rest-api-quickstart
-->

## What is the Domino REST API?

The Domino REST API provides a secure set of RESTful APIs that allow developers to interact with HCL Domino servers and databases in a modern way. These APIs enable you to use your preferred programming language to work with the Domino platform, facilitating the extension and modernization of existing Domino applications.

## Installing the Domino REST API

### Download the Installation Files

1. Navigate to the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html).
2. Log in to your account and go to the HCL Domino section.
3. In the "Tools, Connectors, and Integrators" area, select Domino REST API.
4. Choose the installation file appropriate for your Domino version and download the corresponding installer.

### Perform the Installation

1. Extract the downloaded installation file to obtain the installer (e.g., `restapiInstall-r12.jar`).
2. Copy the installer to the Domino server's program directory.
3. Open a command prompt, navigate to that directory, and execute the following command to start the installation:

   ```
   java -jar restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
   ```

   Adjust the paths according to your server configuration.

## Configuring and Starting the Domino REST API

### Configuration

After installation, the Domino REST API adds the following settings to `notes.ini`:

- `ServerTasks=restapi`
- `KeepInstallDir=C:\Domino\restapi`
- `KeepManagementURL=http://localhost:8889`

Ensure these settings are correct.

### Starting and Managing

1. In the Domino server console, enter the following command to start the REST API:

   ```
   load restapi
   ```

2. To stop the REST API, enter:

   ```
   tell restapi quit
   ```

3. To check the REST API status:

   ```
   tell restapi status
   ```

   For more management commands, refer to the [Domino REST API task](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html).

## Initial Configuration and Testing

1. Using the Admin UI or API, create a Schema configuration for an existing Domino database.
2. Enable the forms, views, folders, agents, and document items you want to access through the API.
3. Create a Scope (REST mapping) to activate the Schema.
4. Test the API using tools like `curl` or Postman.
5. In the Admin UI, configure an application to generate a `client_id` and `client_secret` for your application to use OAuth for authentication.

By following these steps, you have successfully installed and configured the Domino REST API and are now ready to develop modern applications that interact with Domino. For more detailed information, refer to the [Domino REST API documentation](https://opensource.hcltechsw.com/Domino-rest-api/index.html).
