---
title: "Updating HCL Domino REST API: A Comprehensive Guide"
description: "This article provides detailed steps to update the HCL Domino REST API across various platforms, ensuring you can upgrade smoothly and leverage the latest features."
pubDate: "2026-07-11T08:00:19+08:00"
lang: "en"
slug: "hcl-domino-rest-api-update"
tags:
  - "Domino REST API"
  - "Admin"
  - "Tutorial"
sources:
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
  - title: "Using Postman and curl - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html" was already cited by [domino-rest-api-v1-1-5] on 2026-06-28. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
attempt: 1
slug: hcl-domino-rest-api-update
-->

## Introduction

The HCL Domino REST API offers a secure REST interface to access HCL Domino servers and databases. To take advantage of the latest features and improvements, it's recommended to regularly update to the latest version. This guide will walk you through the update process across different platforms.

## Preparation Before Updating

Before initiating the update, ensure you've downloaded the latest version of the Domino REST API installer. Depending on your installation method, download the appropriate installer or Docker image.

## Update Procedures

### Using Docker

1. **Remove the Existing Docker Container**:

   ```bash
   docker rm -f [container_name]
   ```

2. **Load the Latest Docker Image**:

   If you've downloaded the Docker image from the My HCLSoftware portal, execute:

   ```bash
   docker load -i [image_name].tar
   ```

   Ensure you've extracted the `.tar.gz` file beforehand.

3. **Update the `.env` File**:

   In your `.env` file, update the `CONTAINER_IMAGE` variable to reflect the new Docker image name.

4. **Start the New Container**:

   Navigate to the directory containing your `server.id` and `docker-compose.yml` files, then run:

   ```bash
   docker-compose up
   ```

   If prompted for access to the HCL Container Repository, use your HCL Container Repository credentials and execute `docker login hclcr.io` to log in.

5. **Verify the Container's Status**:

   Ensure the new container is running successfully.

### Updating on Linux

1. **Execute the Update Command**:

   ```bash
   sudo java -jar restapiInstall.jar \
     -d="/local/notesdata" \
     -i="/local/notesdata/notes.ini" \
     -r="/opt/hcl/restapi" \
     -p="/opt/hcl/domino/notes/latest/linux" \
     -u \
     -a
   ```

   Note that starting from version 1.0.7, the installer filename includes the Domino version, e.g., `restapiInstall-r12.jar`. From version 1.1.5 onwards, three installer files are available:

   - For Domino 14.5: `restapiInstall-r145.jar`
   - For Domino 14: `restapiInstall-r14.jar`
   - For Domino 12: `restapiInstall-r12.jar`

### Updating on Mac

1. **Execute the Update Command**:

   ```bash
   java -jar restapiInstall.jar \
     -d="/Users/[your_username]/Library/Application Support/HCL Notes Data" \
     -i="/Users/[your_username]/Library/Preferences/Notes Preferences" \
     -r="/Users/[your_username]/Applications/restapi" \
     -p="/Applications/HCL Notes.app" \
     -u \
     -a
   ```

   Similarly, choose the appropriate installer file based on your Domino version.

### Updating on Windows

1. **Run the Update Command as Administrator**:

   ```bash
   java -jar restapiInstall.jar ^
     -d="C:\Program Files\HCL\Domino\Data" ^
     -i="C:\Program Files\HCL\Domino\notes.ini" ^
     -p="C:\Program Files\HCL\Domino" ^
     -r="C:\Program Files\HCL\Domino\restapi" ^
     -u ^
     -a
   ```

   If updating on the Notes Client, adjust the paths accordingly.

## Verifying the Update

After completing the update, it's advisable to verify that the Domino REST API is functioning correctly using Postman or curl. Refer to the [Using Postman and curl](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/postmancurl.html) tutorial for detailed instructions.

## Conclusion

Regularly updating the HCL Domino REST API ensures access to the latest features and improvements. Follow the steps outlined above based on your platform and installation method to maintain system stability and security.

---

*This article references the official documentation on [Updating Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html) and [Domino REST API v1.1.5](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html).*
