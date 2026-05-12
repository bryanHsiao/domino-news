---
title: "HCL Domino AppDev Pack 1.0.8: Node.js Support and Configuration Guide"
description: "HCL Domino AppDev Pack 1.0.8 introduces Node.js support to the Domino server. This article provides an overview of its key components and configuration steps to help developers leverage Node.js for extending Domino applications."
pubDate: "2026-05-13T07:28:14+08:00"
lang: "en"
slug: "hcl-domino-appdev-pack-1-0-8"
tags:
  - "Domino Server"
  - "AppDev Pack"
  - "Tutorial"
sources:
  - title: "Configuring Domino AppDev Pack trial"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/trial_configuring_appdevpack.html"
  - title: "Domino AppDev Pack Documentation"
    url: "https://doc.cwpcollaboration.com/appdevpack/docs/en/1.0.6/homepage.html"
  - title: "Domino trial"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/trial_over.html"
draft: true
---
<!--
REJECTED DRAFT — URL gate FAILED — 1 source URL(s) are not reachable:
  - 404 https://doc.cwpcollaboration.com/appdevpack/docs/en/1.0.6/homepage.html
attempt: 1
slug: hcl-domino-appdev-pack-1-0-8
-->

## HCL Domino AppDev Pack 1.0.8: Node.js Support and Configuration Guide

HCL Domino AppDev Pack 1.0.8 introduces Node.js support to the Domino server, enabling developers to extend and integrate Domino applications using modern JavaScript technologies. This article provides an overview of the AppDev Pack's key components and outlines the configuration steps to get started.

### Key Components

The AppDev Pack comprises the following essential components:

- **Proton**: A Domino server add-in task that handles requests from external applications. Administrators need to install and configure Proton on one or more Domino servers.

- **@domino/domino-db**: A Node.js module that developers can use within their Node.js applications to perform operations on Domino databases via Proton.

- **IAM (Identity and Access Management) Service**: A Node.js-based service that provides standard OAuth 2.0 authorization flows, allowing remote applications to securely access Domino resources.

### Configuration Steps

To configure the AppDev Pack, refer to the [Domino AppDev Pack trial configuration guide](https://help.hcl-software.com/domino/12.0.0/admin/trial_configuring_appdevpack.html) for step-by-step instructions. The main steps include:

1. **Deploy the Domino Trial Server**:
   - Download and deploy the Docker image containing Domino 12.0. Detailed steps are available in the [Domino trial deployment guide](https://help.hcl-software.com/domino/12.0.0/admin/trial_over.html).

2. **Prepare the Domino Server**:
   - Complete basic configurations such as setting the server name and domain.

3. **Configure the AppDev Pack**:
   - Download and install the AppDev Pack kit, which includes Proton and the IAM service.
   - Configure Proton to handle requests from Node.js applications.
   - Deploy and configure the IAM service to set up OAuth 2.0 authorization flows for secure access to Domino resources.

### Developer Resources

Once configured, developers can utilize the [@domino/domino-db](https://doc.cwpcollaboration.com/appdevpack/docs/en/1.0.6/homepage.html) module within their Node.js applications to interact with Domino databases. This module offers a rich API, enabling operations such as reading and writing documents, executing queries, and more.

By leveraging HCL Domino AppDev Pack 1.0.8, developers can extend and integrate existing Domino applications using modern JavaScript technologies, enhancing development efficiency and application flexibility.
