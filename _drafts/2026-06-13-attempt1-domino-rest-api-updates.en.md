---
title: "Domino REST API: Latest Updates and Upgrade Guide"
description: "This article covers the latest updates to the HCL Domino REST API, including full support for Domino 14, and provides a guide on upgrading existing REST API installations."
pubDate: "2026-06-13T07:36:24+08:00"
lang: "en"
slug: "domino-rest-api-updates"
tags:
  - "Domino REST API"
  - "Release Notes"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.2 and earlier - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/whatisnew.html"
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [hcl-domino-rest-api-introduction] on 2026-06-08. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 1
slug: domino-rest-api-updates
-->

## Domino REST API: Latest Updates and Upgrade Guide

HCL Domino REST API has recently released several updates aimed at enhancing integration with Domino 14 and introducing new features and improvements. Below are the key highlights of these updates and a guide on upgrading your existing REST API installation.

### Full Support for Domino 14

In version 1.0.9, the Domino REST API now fully supports Domino 14. To leverage the new JVM functionalities provided by Domino 14, installers are available for both Domino 12 and Domino 14, along with Docker images for both platforms. While older versions of the REST API can run on Domino 14, certain endpoints may encounter issues. It is recommended to follow these steps to upgrade your Domino 12 server and REST API to Domino 14:

1. Stop your Domino 12 server.
2. Remove `restapi` from the `ServerTasks` line in `notes.ini`.
3. Upgrade your Domino 12 server to Domino 14.
4. Start your Domino 14 server.
5. Stop your Domino 14 server.
6. Install the Domino 14 version of the REST API.
7. Start the Domino server.

For more details, refer to the [Domino REST API v1.1.2 and earlier release notes](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/whatisnew.html).

### New Features and Improvements

- **New Endpoint**:
  - `POST v1/query/qrp/json`: Executes a DQL query and returns QueryResultsProcessor JSON results. For usage examples, see the Swagger UI.

- **Improvements**:
  - Added a `filter` parameter to the `GET v1/lists` endpoint, allowing the return of available views containing the case-insensitive filter text.

### Upgrading Existing REST API Installations

To ensure your REST API installation remains up-to-date, it is recommended to regularly update to the latest release. Here are the steps to upgrade:

1. **Download the Latest Version**:
   - For Linux, Mac, or Windows users, download the latest release version of the multi-platform installer.
   - For Docker users, download the latest Docker image version of the REST API.

2. **Perform the Upgrade**:
   - **Docker**:
     - Remove the existing Docker container.
     - Load the new Docker image.
     - Update the `CONTAINER_IMAGE` variable in your existing `.env` file.
     - Run `docker-compose up` in the directory where you stored the `server.id` and `docker-compose.yml` files.
   - **Linux**:
     - Run the following command:
       ```
       sudo java -jar restapiInstall.jar \
        -d="/local/notesdata" \
        -i="/local/notesdata/notes.ini" \
        -r="/opt/hcl/restapi" \
        -p="/opt/hcl/domino/notes/latest/linux" \
        -u \
        -a
       ```
   - **Mac**:
     - Run the following command:
       ```
       java -jar restapiInstall.jar \
        -d="/Users/[your user name]/Library/Application Support/HCL Notes Data" \
        -i="/Users/[your user name]/Library/Preferences/Notes Preferences" \
        -r="/Users/[your user name]/Applications/restapi" \
        -p="/Applications/HCL Notes.app" \
        -u \
        -a
       ```
   - **Windows**:
     - Run the following command as an administrator:
       ```
       java -jar restapiInstall.jar ^
        -d="C:\Program Files\HCL\Domino\Data" ^
        -i="C:\Program Files\HCL\Domino\notes.ini" ^
        -p="C:\Program Files\HCL\Domino" ^
        -r="C:\Program Files\HCL\Domino\restapi" ^
        -u ^
        -a
       ```

For detailed upgrade instructions, refer to the [Update Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html) guide.

### Administrator Considerations

The Domino REST API provides a secure REST API, allowing external systems to access Domino application data securely. As an administrator, it is crucial to ensure proper installation, configuration, and monitoring of this service. For more information, see [Domino Administrators - What You Need to Know About the Domino REST API](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api).

By following the steps outlined above, you can ensure your Domino REST API installation remains current and fully utilizes the latest features and improvements.
