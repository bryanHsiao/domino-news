---
title: "Domino REST API v1.1.6 Released: New Features and Improvements"
description: "HCL released Domino REST API v1.1.6 on November 18, 2025, introducing new features such as a formula-based query endpoint, support package commands, and enhancements to the Admin UI."
pubDate: "2026-05-08T07:23:06+08:00"
lang: "en"
slug: "domino-rest-api-v1-1-6-release"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.6 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai" appears 7/14 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-6-release
-->

On November 18, 2025, HCL released Domino REST API v1.1.6, bringing several new features and improvements for developers and administrators. Here are the key highlights of this release:

## New Features

- **New `POST v1/queryformula` Endpoint**:
  This endpoint allows users to send formula-based queries to retrieve Domino documents, optionally starting from a specified point in time. [Source](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html)

- **Support Package Commands**:
  Introduced the `tell restapi support -includedumps` command to create a support package that includes the Java Dump file, the dump file of the active Java heap, and the full dump file of the active JVM. [Source](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html)

- **Admin UI Enhancements**:
  Added a "Show Active" toggle to the Database Forms, Database Views, and Database Agents tabs in the Admin UI, allowing users to quickly filter and display only active items. [Source](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html)

## Improvements

- **Performance Enhancements**:
  The Domino REST API has been optimized for better performance, with faster response times achieved through more efficient processing. Request handling has also been improved to provide greater reliability. [Source](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html)

- **`GET v1/lists/{name}` Endpoint Improvement**:
  Added the `includeEmptyRows` query parameter; when set to true, this parameter includes rows without any column data in the returned result array. [Source](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html)

- **Admin UI Notifications**:
  A toast notification now appears in the upper-right corner of the Admin UI to inform users of non-JSON errors that occur when an action, such as activating a view, fails. Users can dismiss the notification by clicking the close icon. [Source](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html)

- **Invalid Credentials Notification**:
  A pop-up notification now alerts users of invalid credentials when Domino or the Domino REST API is restarted while the user is logged into the Admin UI, or when the user logs out from the Admin UI in another tab or window. [Source](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html)

These updates further enhance the functionality and user experience of the Domino REST API, providing developers and administrators with more powerful tools to manage and access Domino data.
