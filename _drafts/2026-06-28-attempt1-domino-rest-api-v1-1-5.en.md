---
title: "Domino REST API v1.1.5: New Features and Improvements"
description: "HCL released Domino REST API v1.1.5 on September 3, 2025, introducing new features and improvements, including installers and Docker containers for Domino 14.5, error notifications in the Admin UI, and enhancements to DQL processing."
pubDate: "2026-06-28T07:26:57+08:00"
lang: "en"
slug: "domino-rest-api-v1-1-5"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Domino Server"
sources:
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
  - title: "New Domino REST APIs Are Now Available"
    url: "https://www.hcl-software.com/blog/domino/new-domino-rest-apis-are-now-available"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html" was already cited by [domino-rest-api-update] on 2026-06-17. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html" appears 12/12 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-5
-->

On September 3, 2025, HCL released Domino REST API v1.1.5, bringing several new features and improvements for developers and administrators. Here are the key updates in this version:

## New Features

- **Installers and Docker Containers for Domino 14.5**:
  - Dedicated installers and Docker containers for Domino 14.5 are now available for download on the [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html) and HCL Container Repository.

## Improvements

- **Error Notifications in the Admin UI**:
  - A pop-up notification now appears on the Admin UI login page to inform users of any login or network errors encountered during the login attempt, including the associated status code and message for detailed error identification.

- **Enhancements to DQL Processing**:
  - The `GET v1/odata/{dataSource}/{name}` endpoint has been updated to use the maximum allowable NSF documents scanned, index entries scanned, and scanning time in milliseconds as set in the `notes.ini` file. For more information, see [DQL Processing Scanning Limits](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html).

## Resolved Issues

- **Timeout Issues in Admin UI and Multiple API Endpoints**:
  - Fixed an issue introduced in v1.1.4 that caused various timeouts in the Admin UI and multiple API endpoints.

- **Temporary Files in Authentication Process**:
  - Resolved an issue where temporary files created during the authentication process were not removed, leading to slowed authentication processing. For more details, refer to the [Domino REST API v1.1.5 Release Notes](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html).

## Others

- **New How-to Guide for WOPI with Collabora Container**:
  - Added a guide for running Domino REST API WOPI with Collabora container. See the [Domino REST API v1.1.5 Release Notes](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html) for details.

- **Installer and Docker Image Versions**:
  - Provided installer JAR files and Docker image versions for different Domino versions. For more information, see the [Domino REST API v1.1.5 Release Notes](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html).

These updates aim to enhance the functionality and stability of the Domino REST API, providing a better experience for developers and administrators. For more detailed information, refer to the [Domino REST API v1.1.5 Release Notes](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html).
