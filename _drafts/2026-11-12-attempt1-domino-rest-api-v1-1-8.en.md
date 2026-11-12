---
title: "Domino REST API v1.1.8 Released: New Features and Enhancements"
description: "HCL released Domino REST API v1.1.8 on September 14, 2026, introducing experimental APIs, enhanced attachment management, and user experience improvements."
pubDate: "2026-11-12T11:39:39+08:00"
lang: "en"
slug: "domino-rest-api-v1-1-8"
tags:
  - "Release Notes"
  - "Domino REST API"
sources:
  - title: "Domino REST API v1.1.8 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html"
  - title: "What's new - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html"
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html" appears 4/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-8
-->

On September 14, 2026, HCL released Domino REST API v1.1.8, bringing several new features and enhancements for developers and administrators. Here are the key highlights of this release:

## Experimental Features

This update introduces three experimental APIs aimed at extending integration capabilities with Domino applications and data:

- **CalDAV Extension API**: Allows clients to access and manage Domino calendar data using the CalDAV protocol.
- **CardDAV Extension API**: Provides standards-based access to Domino contacts and address book information.
- **DXL Extension API**: Enables programmatic access to Domino design elements through DXL-based operations.

Please note that these APIs are currently experimental and disabled by default, intended for evaluation and testing purposes only. To enable these features, refer to [Enable CalDAV, CardDAV, and DXL extension APIs](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html).

## New Features

- **Added `GET pim-v1/attachmentnames/{unid}` Endpoint**: This endpoint retrieves a list of all attachments on a mail document and supports query parameters to return protocol URLs for attachments with supported file extensions, include attachment metadata, and discover embedded files in Rich Text fields.

- **Added `POST pim-v1/calendarprofile` Endpoint**: Allows creating or updating an authenticated user's calendar profile document.

- **Added `PATCH pim-v1/calendarprofile` Endpoint**: Enables updating individual settings in the authenticated user's calendar profile document.

## Improvements

- **Theme Switch in Admin UI**: A light/dark/system mode theme switch has been added to the login page and side navigation pane of the Admin UI, providing a more comfortable and customizable user experience.

- **Diff View Mode in Schema Management**: The Diff View mode has been added to the Source tab of the Schema Management page in the Admin UI, allowing users to compare the current saved database schema with their in-progress edits while modifying the schema.

## Resolved Issues

- **Visual Issue with Scope and Schema Connection**: In the Admin UI, a Scope connected to a Schema may display a red dot instead of a green dot, incorrectly indicating that the Scope-to-Schema connection is not functioning correctly. This is a visual-only issue; the underlying APIs and the connected Scope and Schema continue to function correctly. For more details and the recommended workaround, refer to the [technical note](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html).

## Update Recommendation

To take advantage of the latest features and improvements, it is recommended to update your Domino REST API to v1.1.8. Detailed update procedures can be found in [Update Domino REST API to the latest release version](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html).

With this release, HCL continues to enhance the functionality and user experience of the Domino REST API, providing developers and administrators with more powerful tools to manage and integrate Domino applications and data.
