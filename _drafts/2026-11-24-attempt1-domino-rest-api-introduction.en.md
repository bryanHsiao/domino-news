---
title: "Introduction to HCL Domino REST API"
description: "Learn how to install, configure, and utilize the HCL Domino REST API to integrate Domino applications with modern development tools and extend their capabilities."
pubDate: "2026-11-24T14:49:42+08:00"
lang: "en"
slug: "domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Download Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 1
slug: domino-rest-api-introduction
topicOverlap: false
issues:
  [critical] Download the Installation Files — link text 'My HCLSoftware Portal' points to 'opensource.hcltechsw.com/…/downloaddrapi.html'
      problem: The My HCLSoftware Portal (formerly FlexNet / HCL License & Delivery Portal) is a completely different site at my.hcltechsw.com. The URL given is the Domino REST API open-source documentation page about how to download, not the portal itself. The link text directly contradicts the destination URL, which will confuse readers trying to actually obtain the software.
      fix:     Either link to my.hcltechsw.com with the text 'My HCLSoftware Portal', or link to the documentation page with accurate text such as 'Download instructions in the Domino REST API docs'.
  [critical] restapiInstall-r12.jar
      problem: The installer filename 'restapiInstall-r12.jar' embeds a specific version number ('r12') presented as a concrete example. The current Domino REST API (also known as KEEP/Project KEEP in earlier marketing, now officially 'HCL Domino REST API') has shipped well past v1.0 and its installers do not use that filename pattern. Fabricated or outdated filenames in install instructions will cause readers to look for a file that does not exist.
      fix:     Replace the hardcoded filename with a placeholder such as 'restapiInstall-<version>.jar' and note that the exact filename depends on the version downloaded from the portal.
  [major] Run the Installer — command-line example uses Windows paths exclusively
      problem: The article presents a single Windows command-line example as the installation method, with no acknowledgment that the Domino REST API also supports Linux (the dominant Domino server platform) and Docker/container deployments. The official documentation lists at minimum Windows, Linux, and container installation paths. Presenting only Windows as 'the' way to install is seriously misleading for the majority of Domino administrators.
      fix:     Either add Linux and Docker installation examples, or explicitly state 'The example below is for Windows; see the official documentation for Linux and container installation' and link accordingly.
  [major] Extract the Files — 'extract the downloaded .tar.gz file'
      problem: The Windows installer is typically distributed as a .zip or as the .jar directly, not a .tar.gz. The .tar.gz format is the Linux distribution archive. Telling Windows administrators to extract a .tar.gz is inconsistent with the Windows-only command that follows and will cause confusion.
      fix:     Align the archive format with the platform being described, or explain that the archive format differs by platform (.tar.gz on Linux, .zip on Windows) and handle them separately.
  [major] Activate the Schema — 'Activate the schema by creating a scope.'
      problem: This glosses over a critical and commonly misunderstood two-object model. In the Domino REST API, a Schema defines what is exposed (forms, views, fields, modes) and a Scope makes that schema addressable via a URL scope name and controls whether it is active. They are distinct objects; creating a scope does not simply 'activate' a schema — you associate the schema with a scope and set the scope to active. Collapsing these two concepts misleads readers into thinking they are one step.
      fix:     Explain that you create a Scope that references the Schema and give the scope a URL-safe name; enabling the scope is what makes the schema reachable via the API.
  [major] Configure Applications — 'configure applications to create a client_id and client_secret, allowing your applications to use OAuth for authentication'
      problem: OAuth (Authorization Code flow with client_id/client_secret) is only one of the authentication mechanisms supported. The Domino REST API also supports JWT-based authentication with its own /auth endpoint (issuing a bearer token directly with username/password) and integration with external IdPs (e.g., Keycloak, Microsoft Entra ID). Presenting OAuth application credentials as the authentication story gives the impression that setting up an OAuth app is always required, which it is not for simple API exploration or server-to-server JWT flows.
      fix:     Note that the API supports multiple auth methods (Domino-issued JWT via /api/v1/auth, OAuth 2.0 Authorization Code via registered applications, and external IdP integration) and that the OAuth app registration step is specifically needed for the Authorization Code / PKCE flows.
  [minor] What is HCL Domino REST API?
      problem: The article never mentions that the product was previously known during development/early release as 'Project KEEP' or 'KEEP'. Many existing Domino administrators still search for it under that name, and omitting it means readers may not recognize that existing KEEP documentation applies to them.
      fix:     Add a brief note: 'Previously known during development and early releases as Project KEEP, the product is now officially named HCL Domino REST API.'
  [minor] Start the REST API — 'add restapi to the ServerTasks entry in the notes.ini file'
      problem: The cited URL for this step (references/usingdominorestapi/restapitask.html) has '?utm_source=openai' appended, which reveals the article was drafted with AI assistance. All three cited URLs carry this utm parameter. This is a credibility and editorial-policy concern for publication.
      fix:     Remove all '?utm_source=openai' query-string parameters from the cited URLs before publishing.
  [minor] Overall article
      problem: The article contains no version information at all — not which Domino server version is required as a minimum, not which version of the REST API the installation steps apply to. The REST API has minimum Domino version requirements (Domino 12 at initial GA) and installation details differ between major releases.
      fix:     Add a prerequisites section stating the minimum supported Domino server version and the REST API release the instructions target.
-->

## What is HCL Domino REST API?

The HCL Domino REST API provides a secure REST interface, allowing external systems to access HCL Domino servers and databases. This enables developers to use their preferred programming languages to extend and modernize Domino applications. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## Installation and Configuration

To install the Domino REST API on a Domino server, follow these steps:

1. **Download the Installation Files**:
   - Visit the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) to download the installer appropriate for your platform.

2. **Extract the Files**:
   - Use a suitable tool to extract the downloaded `.tar.gz` file.

3. **Run the Installer**:
   - Copy the extracted installer (e.g., `restapiInstall-r12.jar`) to the Domino server's program directory.
   - In the command prompt, run the following command as an administrator:
     ```
     java -jar c:\domino\restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
     ```
     Adjust the paths in the command according to your server's configuration. ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api?utm_source=openai))

4. **Start the REST API**:
   - In the Domino server console, enter the following command to start the REST API:
     ```
     load restapi
     ```
   - To ensure the REST API starts automatically with the server, add `restapi` to the `ServerTasks` entry in the `notes.ini` file. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## Using the REST API

Once installed and configured, you can access Domino databases through the REST API. Here are the basic steps:

1. **Create a Database Configuration (Schema)**:
   - Use the Admin UI or API to create a schema for an existing Domino database.

2. **Enable Forms, Views, and Document Items**:
   - Specify which forms, views, and document items are accessible through the API.

3. **Activate the Schema**:
   - Activate the schema by creating a scope.

4. **Test the API**:
   - Use tools like `curl` or Postman to test API calls.

5. **Configure Applications**:
   - In the Admin UI, configure applications to create a `client_id` and `client_secret`, allowing your applications to use OAuth for authentication. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html?utm_source=openai))

## Conclusion

The HCL Domino REST API offers a modern development experience for Domino applications, enabling developers to use various programming languages and tools to extend and integrate Domino's capabilities. With proper installation and configuration, you can leverage the REST API to enhance your application's flexibility and scalability.
