---
title: "Domino REST API v1.1.6 Released: New Features and Improvements"
description: "HCL released Domino REST API v1.1.6 on November 18, 2025, introducing new features and enhancements to improve developer interactions with Domino servers and databases."
pubDate: "2026-05-16T07:24:02+08:00"
lang: "en"
slug: "domino-rest-api-v1-1-6-release"
tags:
  - "Release Notes"
  - "Domino REST API"
sources:
  - title: "Domino REST API v1.1.6 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html"
  - title: "What's new - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html" was already cited by [domino-rest-api-v1-1-7-release] on 2026-05-04. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [notesdocument-rest-api] on 2026-05-11. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai" appears 14/14 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-6-release
-->

On November 18, 2025, HCL released Domino REST API v1.1.6, bringing several new features and improvements to enhance developer interactions with Domino servers and databases.

## New Features

- **New `POST v1/queryformula` Endpoint**:
  This endpoint allows developers to send formula-based queries to retrieve Domino documents, optionally starting from a specified point in time. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **Support Package Creation Commands**:
  Added the `tell restapi support -includedumps` command to create a support package, including the Java Dump file, the dump file of the active Java heap, and the full dump file of the active JVM. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **Admin UI Enhancements**:
  Introduced a "Show Active" toggle in the Database Forms, Database Views, and Database Agents tabs of the Admin UI, allowing users to quickly filter and display only active items. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

## Improvements

- **Performance Enhancements**:
  The Domino REST API has been optimized for better performance, with faster response times achieved through more efficient processing. Request handling has also been improved to provide greater reliability. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **`GET v1/lists/{name}` Endpoint Improvement**:
  Added the `includeEmptyRows` query parameter; when set to true, the returned result array includes rows without any column data. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **Admin UI Notifications**:
  A toast notification now appears in the upper-right corner of the Admin UI to inform users of non-JSON errors that occur when an action, such as activating a view, fails. Users can dismiss the notification by clicking the close icon. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

- **Invalid Credentials Notification**:
  A pop-up notification now alerts users of invalid credentials when Domino or the Domino REST API is restarted while the user is logged into the Admin UI, or when the user logs out from the Admin UI in another tab or window. ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.6.html?utm_source=openai))

These updates further strengthen the capabilities and user experience of the Domino REST API, providing developers with more flexible and efficient tools to integrate and extend Domino applications.
