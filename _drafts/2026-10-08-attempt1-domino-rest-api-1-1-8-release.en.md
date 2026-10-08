---
title: "Domino REST API 1.1.8 Released"
description: "HCL has released Domino REST API 1.1.8, introducing CalDAV, CardDAV, and DXL extension APIs, along with a new mail attachment retrieval endpoint."
pubDate: "2026-10-08T10:36:02+08:00"
lang: "en"
slug: "domino-rest-api-1-1-8-release"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Domino Server"
sources:
  - title: "Domino REST API v1.1.8 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-1-1-8-release
-->

On September 14, 2026, HCL released version 1.1.8 of the Domino REST API, offering developers a suite of new features and enhancements.

## New Features

### Experimental Extension APIs

This release introduces the following experimental extension APIs aimed at enhancing integration capabilities with Domino applications and data:

- **CalDAV Extension API**: Allows clients to access and manage Domino calendar data using the CalDAV protocol.
- **CardDAV Extension API**: Provides standards-based access to Domino contacts and address book information.
- **DXL Extension API**: Enables programmatic access to Domino design elements through DXL-based operations.

These APIs are disabled by default and are provided for users to try and evaluate. They are not yet supported for production use. To enable any or all of them, refer to the official documentation.

### New Mail Attachment Retrieval Endpoint

A new endpoint, `GET pim-v1/attachmentnames/{unid}`, has been added to retrieve a list of all attachments on a mail document. This endpoint supports query parameters that allow applications to return protocol URLs for attachments with supported file extensions, include attachment metadata, and discover embedded files in Rich Text fields by returning their paths.

## Upgrade Recommendations

Users are encouraged to upgrade their existing Domino REST API installations to the latest version to take advantage of the new features and improvements. Detailed upgrade instructions can be found in the official documentation's update guide.

For more information, refer to the [Domino REST API v1.1.8 Release Notes](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.8.html) and the [Introduction to Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html).
