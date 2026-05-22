---
title: "更新 HCL Domino REST API 的完整指南"
description: "本文提供了在不同平台上更新 HCL Domino REST API 的詳細步驟，並介紹了最新版本的改進與解決的問題。"
pubDate: "2026-05-23T07:29:52+08:00"
lang: "zh-TW"
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

## 簡介

HCL Domino REST API 提供了安全的 REST API，允許外部系統存取 HCL Domino 伺服器和資料庫。為了確保您能夠利用最新的功能和改進，建議定期更新至最新版本。本文將指導您如何在不同平台上更新 Domino REST API，並介紹最新版本的改進與解決的問題。

## 更新前的準備

在開始更新之前，請確保您已下載適用於您平台的最新版本 Domino REST API 安裝檔案。您可以從 [HCL 官方網站](https://opensource.hcltechsw.com/Domino-rest-api/howto/production/versionupdate.html) 取得最新版本的下載連結。

## 更新步驟

### Docker

1. **移除現有的 Docker 容器**：
   
   ```bash
   docker rm -f <container_name>
   ```

2. **載入新的 Docker 映像檔**：
   
   ```bash
   docker load -i [name_of_tar_file].tar
   ```

   *注意：請先解壓縮下載的 tar.gz 檔案。*

3. **更新 `.env` 檔案中的 `CONTAINER_IMAGE` 變數**：
   
   ```
   CONTAINER_IMAGE=domino-rest-api:<new_version>
   ```

4. **啟動新的容器**：
   
   ```bash
   docker-compose up -d
   ```

### Linux

1. **執行更新命令**：
   
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

1. **執行更新命令**：
   
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

1. **以管理員身份執行更新命令**：
   
   ```
   java -jar restapiInstall.jar ^
     -d="C:\Program Files\HCL\Domino\Data" ^
     -i="C:\Program Files\HCL\Domino\notes.ini" ^
     -p="C:\Program Files\HCL\Domino" ^
     -r="C:\Program Files\HCL\Domino\restapi" ^
     -u ^
     -a
   ```

## 最新版本的改進與解決的問題

在最新的 Domino REST API v1.1.5 版本中，HCL 引入了多項改進和問題修復，包括：

- **新增針對 Domino 14.5 的安裝程式和 Docker 容器**。
- **在管理 UI 登入頁面新增彈出通知，提示登入或網路錯誤**。
- **修復了在 v1.1.4 版本中引入的管理 UI 和多個 API 端點的超時問題**。

詳細資訊請參閱 [Domino REST API v1.1.5 發布說明](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html)。

## 更新後的注意事項

在更新至 v1.1.6 後，有使用者報告在登入管理 UI 時遇到 `403` 錯誤。這可能與 CORS 設定變更有關。解決方法是更新 `cors.json` 檔案，確保允許的來源正確配置。更多資訊請參閱 [HCL 社群論壇](https://developer.ds.hcl-software.com/t/rest-api-log-in-problem-after-updating-to-1-1-6/172263)。

## 結論

定期更新 HCL Domino REST API 可確保您獲得最新的功能和安全性改進。請根據您的平台，按照上述步驟進行更新，並注意相關的設定變更，以確保系統穩定運行。
