---
title: "Domino REST API v1.1.7: New Features and Enhancements"
description: "HCL released Domino REST API v1.1.7 on April 7, 2026, introducing new endpoints and improved calendar management capabilities."
pubDate: "2026-06-24T07:28:31+08:00"
lang: "en"
slug: "domino-rest-api-v1-1-7"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.7 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html"
  - title: "What's new - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html"
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html" appears 8/10 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-7
-->

On April 7, 2026, HCL released Domino REST API v1.1.7, bringing several new features and enhancements for developers and administrators. Here are the key highlights of this release:

## New Features

- **Retrieve User's Calendar Profile**:
  A new endpoint, `GET pim-v1/calendar/profile`, allows developers to access an authenticated user's calendar profile document. This document contains personal calendar and scheduling settings, such as work hours, default meeting duration, time zone, automatic processing options, free time display settings, and other scheduling defaults. For more details, refer to the [Domino REST API v1.1.7 documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html).

- **Check and Update PIM Items' Unread Status**:
  The `POST pim-v1/pimitems/unread` endpoint has been added to check and optionally update the unread status of PIM items. This endpoint accepts a request object containing a required `unids` array of UNIDs and optional `markRead: true` or `markUnread: true` flags. It returns an object mapping each UNID to a boolean value, where `true` indicates unread status and `false` indicates read status. More information is available in the [Domino REST API v1.1.7 documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html).

- **Update Email Document Fields**:
  The `PUT pim-v1/message/{unid}` endpoint has been implemented to support updating fields on an email document identified by its UNID. Details can be found in the [Domino REST API v1.1.7 documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html).

## Enhancements

- **Enhanced Calendar Management**:
  The new endpoints provide developers with more efficient tools to manage and manipulate users' calendar settings and PIM items, offering greater flexibility in application development.

- **Security and Performance Improvements**:
  This release includes multiple security and performance enhancements to ensure the API's stability and reliability.

## Upgrade Considerations

If you are upgrading from v1.1.2 or earlier versions, note that CORS configuration has changed from simple string matching to using regular expressions. This may require updating your existing CORS settings to ensure compatibility with the new version. For more information, see the [Domino REST API v1.1.3.1 documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.3.html).

## Conclusion

The release of Domino REST API v1.1.7 provides developers with more powerful tools to integrate and manage data on Domino servers. It is recommended that all users upgrade to this version to take advantage of the latest features and improvements. For more information, refer to the [Domino REST API v1.1.7 documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html).
