---
title: "Comprehensive Guide to Updating HCL Domino REST API"
description: "This article provides detailed steps for updating the HCL Domino REST API across various platforms and highlights improvements and fixes in the latest versions."
pubDate: "2026-05-23T07:29:52+08:00"
lang: "en"
slug: "domino-rest-api-update-guide"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Update Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html"
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
  - title: "REST API Log in problem after updating to 1.1.6 - Domino Forum - HCLSoftware Digital Solutions Community"
    url: "https://developer.ds.hcl-software.com/t/rest-api-log-in-problem-after-updating-to-1-1-6/172263"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 1
slug: domino-rest-api-update-guide
topicOverlap: false
issues:
  [critical] Post-Update Considerations — '403 errors when logging into the Admin UI … related to changes in CORS settings'
      problem: The article attributes the post-v1.1.6 login 403 error to CORS settings changes, but the linked community thread actually describes a JWT/authentication token or configuration issue, not a CORS misconfiguration. Telling readers to edit cors.json for a 403 login failure is incorrect and could send admins down the wrong troubleshooting path. CORS errors normally surface in the browser as network-level blocks and produce different symptoms than a 403 returned by the server authentication layer.
      fix:     Re-read the community thread carefully and describe the actual root cause. If the root cause is ambiguous, say so and link to the thread without prescribing a specific fix. Do not assert a CORS cause unless the thread explicitly confirms it.
  [critical] Improvements and Fixes in Recent Versions — 'latest Domino REST API v1.1.5 release … New installers and Docker containers specific to Domino 14.5'
      problem: The article calls v1.1.5 the 'latest' release but then discusses a post-update issue seen 'after updating to v1.1.6' in the very next section. This is internally contradictory: if v1.1.6 exists and users are upgrading to it, v1.1.5 is not the latest. The article appears to conflate what is new in v1.1.5 with a current-version claim, which will confuse readers about which version they should actually be running.
      fix:     Clarify the version timeline. If v1.1.6 is the current release, state that clearly and move the v1.1.5 release notes summary into a 'recent history' or 'what changed in v1.1.5' subsection. Do not label a superseded version as 'latest'.
  [major] Docker — Step 2 'Load the new Docker image' / Step 4 'docker-compose up -d'
      problem: The Docker update procedure describes loading a local tar image, but HCL Domino REST API Docker images are also distributed via HCL's container registry (hclcr.io). For users pulling from the registry the correct update path is 'docker pull' (or updating the image tag in the compose file and letting compose pull), not 'docker load'. Presenting only the tar-file path as the Docker update procedure omits the registry-pull path that many production deployments use.
      fix:     Add a second Docker sub-path covering the registry pull workflow: update the image tag in .env, run 'docker-compose pull', then 'docker-compose up -d'. Label the tar-file path as applicable to air-gapped or downloaded-installer deployments.
  [major] Update Procedures — Linux, macOS, Windows installer flags '-u -a'
      problem: The article uses '-u' (update) and '-a' (accept license) flags but does not mention the '-k' flag (keep existing configuration) or explain what happens to existing configuration files during an update. Omitting this is a significant operational gap: readers who have customised config.json, cors.json, or other files need to know whether the installer overwrites them.
      fix:     Add a note explaining which installer flags preserve existing configuration and recommend backing up the REST API configuration directory before running the update. Reference the official documentation's upgrade notes on file retention.
  [major] Preparation Before Updating — 'You can obtain the latest release from the HCL official documentation'
      problem: The linked URL goes to the version-update how-to page, not to the actual download location. The Domino REST API installer is downloaded from the HCL My HCLSoftware (MHS) portal (my.hcltechsw.com), not from the documentation site. Sending readers to docs for a download will leave them hunting.
      fix:     Change the download link to point to the My HCLSoftware portal (my.hcltechsw.com) and keep the documentation link separately as a reference for the update procedure steps.
  [major] macOS section — '-p="/Applications/HCL Notes.app"'
      problem: On macOS the Domino REST API runs against HCL Domino (server), not HCL Notes (client). Pointing the -p (program directory) flag at the HCL Notes.app bundle is incorrect for a server-side Domino REST API installation. A macOS Domino server installation has a different program path. This appears to be a copy-paste of a Notes client developer setup, not a production server update procedure.
      fix:     Clarify whether the macOS section targets a Notes client developer setup or a Domino server. If it is a developer/client setup, label it explicitly as such. Provide the correct -p path for a macOS Domino server installation if that is the intended audience.
  [minor] Docker — Step 1 'Remove the existing Docker container'
      problem: The procedure removes the container immediately without first stopping it gracefully. 'docker rm -f' force-kills the container, which can cause data issues if Domino is mid-write. Best practice is to stop Domino cleanly before removing the container.
      fix:     Add a 'docker stop <container_name>' step before 'docker rm -f', or use 'docker-compose down' which handles graceful shutdown.
  [minor] Docker — Step 2 'Ensure you extract the tar.gz file before loading'
      problem: 'docker load' accepts a .tar file, not a .tar.gz. The note says to extract the tar.gz first, but does not show the extraction command, which is non-obvious for less-experienced users and inconsistent with the code snippet that shows a plain .tar file.
      fix:     Show the extraction command explicitly: 'gunzip [name_of_tar_file].tar.gz' or 'tar -xzf ...' before the docker load step, so the procedure is self-contained.
  [minor] Introduction — 'The HCL Domino REST API offers secure RESTful access to HCL Domino servers and databases'
      problem: Minor brand/naming note: the product's marketing name is 'HCL Domino REST API' (sometimes abbreviated DRAPI or Project KEEP in older references). The introduction is accurate but does not mention that this product was previously known as 'Project KEEP', which readers searching for upgrade help for older installations may still know it by.
      fix:     Optionally add a parenthetical on first use: '…HCL Domino REST API (formerly Project KEEP)…' to aid discoverability. Low priority.
-->

## Introduction

The HCL Domino REST API offers secure RESTful access to HCL Domino servers and databases, enabling external systems to interact seamlessly. To leverage the latest features and improvements, it's essential to keep your Domino REST API up to date. This guide outlines the steps to update the API across different platforms and discusses enhancements and fixes in recent versions.

## Preparation Before Updating

Before initiating the update, ensure you have downloaded the latest version of the Domino REST API installer suitable for your platform. You can obtain the latest release from the [HCL official documentation](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html).

## Update Procedures

### Docker

1. **Remove the existing Docker container**:
   
   ```bash
   docker rm -f <container_name>
   ```

2. **Load the new Docker image**:
   
   ```bash
   docker load -i [name_of_tar_file].tar
   ```

   *Note: Ensure you extract the tar.gz file before loading.*

3. **Update the `CONTAINER_IMAGE` variable in your `.env` file**:
   
   ```
   CONTAINER_IMAGE=domino-rest-api:<new_version>
   ```

4. **Start the new container**:
   
   ```bash
   docker-compose up -d
   ```

### Linux

1. **Execute the update command**:
   
   ```bash
   sudo java -jar restapiInstall.jar \
     -d="/local/notesdata" \
     -i="/local/notesdata/notes.ini" \
     -r="/opt/hcl/restapi" \
     -p="/opt/hcl/domino/notes/latest/linux" \
     -u \
     -a
   ```

### macOS

1. **Execute the update command**:
   
   ```bash
   java -jar restapiInstall.jar \
     -d="/Users/[your user name]/Library/Application Support/HCL Notes Data" \
     -i="/Users/[your user name]/Library/Preferences/Notes Preferences" \
     -r="/Users/[your user name]/Applications/restapi" \
     -p="/Applications/HCL Notes.app" \
     -u \
     -a
   ```

### Windows

1. **Run the update command as an administrator**:
   
   ```
   java -jar restapiInstall.jar ^
     -d="C:\Program Files\HCL\Domino\Data" ^
     -i="C:\Program Files\HCL\Domino\notes.ini" ^
     -p="C:\Program Files\HCL\Domino" ^
     -r="C:\Program Files\HCL\Domino\restapi" ^
     -u ^
     -a
   ```

## Improvements and Fixes in Recent Versions

In the latest Domino REST API v1.1.5 release, HCL introduced several enhancements and resolved issues, including:

- **New installers and Docker containers specific to Domino 14.5**.
- **Added pop-up notifications on the Admin UI login page to inform users of login or network errors**.
- **Fixed timeouts in the Admin UI and multiple API endpoints introduced in v1.1.4**.

For detailed information, refer to the [Domino REST API v1.1.5 release notes](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html).

## Post-Update Considerations

After updating to v1.1.6, some users reported encountering `403` errors when logging into the Admin UI. This issue may be related to changes in CORS settings. To resolve this, update the `cors.json` file to ensure the allowed origins are correctly configured. More details can be found in the [HCL community forum](https://developer.ds.hcl-software.com/t/rest-api-log-in-problem-after-updating-to-1-1-6/172263).

## Conclusion

Regularly updating the HCL Domino REST API ensures access to the latest features and security enhancements. Follow the platform-specific steps outlined above, and be mindful of configuration changes to maintain system stability.
