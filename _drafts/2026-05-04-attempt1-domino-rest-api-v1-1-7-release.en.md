---
title: "Domino REST API v1.1.7 Released"
description: "HCL released Domino REST API v1.1.7 on April 7, 2026, introducing new features and fixes that enhance calendar and email management capabilities."
pubDate: "2026-05-04T07:20:47+08:00"
lang: "en"
slug: "domino-rest-api-v1-1-7-release"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.7 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html"
  - title: "What's new - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 1
slug: domino-rest-api-v1-1-7-release
-->

HCL released Domino REST API v1.1.7 on April 7, 2026, bringing several new features and improvements for developers and administrators, particularly in calendar and email management.

## New Features

- **Retrieve Calendar Profile**:
  Added the `GET pim-v1/calendar/profile` endpoint, allowing developers to retrieve an authenticated user's calendar profile document. This document stores personal calendar and scheduling settings, such as work hours, default meeting duration, time zone, automatic processing options, free time display settings, and other scheduling defaults.

- **Manage Unread Status of PIM Items**:
  Introduced the `POST pim-v1/pimitems/unread` endpoint to check and optionally update the unread status of PIM items. The endpoint accepts a request object containing a required `unids` array of UNIDs and optional `markRead: true` or `markUnread: true` flags. It returns an object that maps each UNID to a boolean value, where `true` indicates unread status and `false` indicates read status.

- **Update Email Documents**:
  Implemented the `PUT pim-v1/message/{unid}` endpoint to support updating fields on an email document identified by its UNID.

## Resolved Issues

- **Attachment Download Issue**:
  Fixed an issue where attachments with special characters in the filename could not be downloaded using the `GET v1/attachments/{unid}/{attachmentname}` endpoint.

- **Microsoft Entra ID Authentication Issue**:
  Resolved an issue where authentication using Microsoft Entra ID as an external identity provider (IdP) for the Admin UI and Office Round Trip Experience redirected users to an error page.

- **Meeting Invitation Issue**:
  Addressed an issue where newly created meetings with participants were treated as broadcast calendar entries, preventing invitees from accepting or declining meetings and organizers from receiving attendee responses.

## Additional Information

- **Installer JAR Files**:
  - For Domino 14.5: `restapiInstall-r145.jar`
  - For Domino 14: `restapiInstall-r14.jar`
  - For Domino 12: `restapiInstall-r12.jar`

- **Docker Image Versions**:
  - For Domino 14.5: `domino-rest-api:1.1.7-r145`
  - For Domino 14: `domino-rest-api:1.1.7-r14`
  - For Domino 12: `domino-rest-api:1.1.7-r12`

For the complete release notes and detailed information, please refer to the [Domino REST API v1.1.7 Release Notes](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html).
