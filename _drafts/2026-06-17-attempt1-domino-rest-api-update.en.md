---
title: "Updating HCL Domino REST API: A Comprehensive Guide"
description: "This article provides detailed steps for updating the HCL Domino REST API across various platforms, including Docker, Linux, Mac, and Windows, ensuring a smooth upgrade to the latest version."
pubDate: "2026-06-17T07:36:05+08:00"
lang: "en"
slug: "domino-rest-api-update"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - zh body must have >= 2 inline links, got 1.
  - en body must have >= 2 inline links, got 1.
attempt: 1
slug: domino-rest-api-update
-->

## Introduction

The HCL Domino REST API offers a secure REST interface, enabling external systems to access HCL Domino servers and databases. To leverage the latest features and improvements, it's recommended to regularly update to the newest version. This article outlines the steps to update the Domino REST API across different platforms.

## Preparation Before Updating

Before initiating the update, ensure you've downloaded the latest version of the Domino REST API installer appropriate for your installation method:

- **Docker**: Download the latest Docker image.
- **Linux, Mac, or Windows**: Download the multi-platform installer suitable for your operating system.

## Update Procedures

### Docker

1. **Remove the Existing Docker Container**:

   ```bash
   docker rm -f [container_name]
   ```

2. **Load the New Docker Image** (if downloaded from My HCLSoftware portal):

   ```bash
   docker load -i [image_name].tar
   ```

   > **Note**: Ensure you extract the `.tar.gz` file first.

3. **Update the `.env` File**:

   - Note the loaded image name and update the `CONTAINER_IMAGE` variable in your existing `.env` file accordingly.

4. **Start the New Container**:

   In the directory containing your `server.id` and `docker-compose.yml` files, execute:

   ```bash
   docker-compose up
   ```

   > **Note**: If prompted for access to the HCL Container Repository, use the `docker login hclcr.io` command with your credentials.

5. **Verify the Container is Running**:

   Ensure the new container is running successfully.

### Linux

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

   > **Note**:
   >
   > - Do not use the Java executable located in `/opt/hcl/domino/bin/`.
   > - If Java is not installed on your system, you can use the Java executable in `/opt/hcl/domino/notes/latest/linux/jvm/bin/`.

### Mac

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

   > **Note**:
   >
   > - Adjust the paths according to your username and installation directories.

### Windows

1. **Run Command Prompt as Administrator**.

2. **Execute the Update Command**:

   ```bash
   java -jar restapiInstall.jar ^
     -d="C:\Program Files\HCL\Domino\Data" ^
     -i="C:\Program Files\HCL\Domino\notes.ini" ^
     -p="C:\Program Files\HCL\Domino" ^
     -r="C:\Program Files\HCL\Domino\restapi" ^
     -u ^
     -a
   ```

   > **Note**:
   >
   > - Adjust the paths according to your installation directories.
   > - The installer will create a `runrestapi.cmd` script in the Domino REST API installation directory. Run this script to launch the Domino REST API.

## Post-Update Considerations

- **Verify Installation**:

  - Ensure the Domino REST API service is running correctly.
  - Check relevant log files for any errors or warnings.

- **Update Configurations**:

  - Update configuration files like `cors.json` as needed to ensure the new version functions properly.

- **Backup**:

  - It's advisable to back up existing configurations and data before updating to prevent potential issues.

By following these steps, you can successfully update the HCL Domino REST API across various platforms, ensuring your system remains up-to-date and benefits from the latest features and improvements. For more detailed information, refer to the [HCL Domino REST API official documentation](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html).
