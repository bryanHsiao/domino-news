---
title: "Overview of Domino REST API v1.1.7 Update"
description: "HCL released Domino REST API v1.1.7 on April 7, 2026, introducing features like calendar profile retrieval and unread status updates, along with multiple issue fixes."
pubDate: "2026-08-03T08:00:02+08:00"
lang: "en"
slug: "domino-rest-api-v1-1-7-update"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.7 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html"
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-7-update
-->

On April 7, 2026, HCL released Domino REST API v1.1.7, bringing several new features and improvements for developers and administrators. Below is an overview of the key updates in this version:

## New Features

- **Retrieve Calendar Profile Document**:
  The new `GET pim-v1/calendar/profile` endpoint allows developers to retrieve an authenticated user's calendar profile document. This document stores personal calendar and scheduling settings, such as work hours, default meeting duration, time zone, automatic processing options, free time display settings, and other scheduling defaults. For more details, refer to the [Domino REST API v1.1.7 documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html).

- **Update Unread Status of PIM Items**:
  The `POST pim-v1/pimitems/unread` endpoint enables checking and optionally updating the unread status of PIM items. This endpoint accepts a request object containing a required `unids` array and optional `markRead: true` or `markUnread: true` flags.

## Improvements and Fixes

- **Fix for Calendar Entry Description HTML Formatting**:
  Resolved an issue where updating calendar entries using the calendar API caused HTML-formatted descriptions to be saved as plain text, leading to incorrect display of HTML elements. More information can be found in the [Domino REST API v1.1.5 documentation](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html).

- **Enhanced Admin UI Error Notifications**:
  Added pop-up notifications on the Admin UI login page to inform users of any login or network errors encountered during the login attempt. The notification includes the associated status code and status message for detailed error identification.

## Update Recommendations

To take advantage of the latest features and improvements, users are encouraged to update to Domino REST API v1.1.7. The update process involves the following steps:

1. **Download the Latest Version**:
   Obtain the appropriate installer for your operating system from the [HCL official website](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html).

2. **Perform the Update**:
   Follow the instructions specific to your operating system:

   - **Docker**:
     - Remove the existing Docker container.
     - Load the new Docker image.
     - Update the `CONTAINER_IMAGE` variable in your `.env` file.
     - Run `docker-compose up` in the directory containing your `server.id` and `docker-compose.yml` files.

   - **Linux**:
     - Execute the following command:
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
     - Execute the following command:
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
     - Execute the following command:
       ```
       java -jar restapiInstall.jar ^
        -d="C:\Program Files\HCL\Domino\Data" ^
        -i="C:\Program Files\HCL\Domino\notes.ini" ^
        -p="C:\Program Files\HCL\Domino" ^
        -r="C:\Program Files\HCL\Domino\restapi" ^
        -u ^
        -a
       ```

   Detailed update instructions and considerations are available in the [Domino REST API update guide](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html).

By updating to the latest version, you can leverage the newest features and improvements, enhancing the performance and security of your applications.
