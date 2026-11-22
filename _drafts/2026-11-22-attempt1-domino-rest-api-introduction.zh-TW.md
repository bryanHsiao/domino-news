---
title: "HCL Domino REST API 入門指南"
description: "本文介紹 HCL Domino REST API 的功能、安裝步驟，以及如何配置和使用，幫助管理員和開發者有效地擴展和現代化 Domino 應用程式。"
pubDate: "2026-11-22T10:53:11+08:00"
lang: "zh-TW"
slug: "domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Download Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html"
draft: true
---
<!--
REJECTED DRAFT — 2 critical fact issue(s)
attempt: 1
slug: domino-rest-api-introduction
topicOverlap: false
issues:
  [critical] Extract the Files: `restapiInstall-r12.jar`
      problem: The installer filename `restapiInstall-r12.jar` encodes a specific release version ('r12'). The current Domino REST API (also known as 'DRAPI' or formerly 'Project KEEP') has shipped releases well beyond r12 (e.g. 1.0.x, 1.0.6, 1.0.7, 1.0.8 series under the versioning scheme used since GA). Hardcoding 'r12' in the filename as if it is the current installer will mislead readers into hunting for a file that may not exist on the download portal, or installing an outdated version. The article should refer to the current versioned filename generically (e.g. `restapiInstall.jar` or 'the JAR file downloaded from the portal') and not pin a specific version string.
      fix:     Remove the specific version suffix from the filename. Write something like: 'extract until you obtain the installer JAR (e.g. `restapiInstall.jar` — the exact filename reflects the version you downloaded).' Also add a note to verify the current version on the My HCLSoftware Portal.
  [critical] Run the Installer command: `java -jar restapiInstall-r12.jar -d=... -i=... -r=... -p=... -a`
      problem: The installer command again hardcodes `restapiInstall-r12.jar` (see above). Additionally, the `-r` flag is presented as a 'restapi' directory under the Domino program path, but the official DRAPI documentation defines `-r` as the directory where the REST API data/configuration files will be stored (not necessarily a sub-folder of the Domino program directory). The example path `C:\Domino\restapi` could be misleading but is not strictly wrong; however, the flag semantics must be described accurately. More critically, the command uses the stale versioned JAR name.
      fix:     Use a placeholder filename. Clarify that `-r` specifies the REST API runtime/config directory (can be any writable path, not necessarily under the Domino program dir). Cross-reference the official installation docs for the authoritative flag list.
  [major] Download the Installation File: 'Visit the My HCLSoftware Portal' — URL points to opensource.hcltechsw.com
      problem: The hyperlink text says 'My HCLSoftware Portal' but the URL given (`https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html`) points to the open-source documentation site, not to the actual My HCLSoftware download portal (hclsoftware.flexnetoperations.com or my.hcltechsw.com). These are two different things. Readers looking for the actual installer will not find a download at the docs URL — they need to go to the licensed software portal.
      fix:     Either link directly to the My HCLSoftware Portal (the actual download location) and keep that label, or change the link text to 'the DRAPI installation documentation' and point to the docs page. Do not conflate the two. Add a note that a valid HCL entitlement is required to download the installer.
  [major] Extract the Files: 'Use tools like 7-Zip to extract the downloaded `.tar.gz` file'
      problem: The article states the download is a `.tar.gz` file and instructs Windows users to use 7-Zip to extract it. In practice the DRAPI installer is distributed as a JAR file directly (or sometimes a ZIP), not a `.tar.gz`. Describing a `.tar.gz` extraction step on Windows as the standard path is likely inaccurate and will confuse readers who download the actual package.
      fix:     Verify the actual distribution format for the current release. If the download is a ZIP or a direct JAR, correct the extraction step accordingly. If a tar.gz is used for some platforms, make the platform context explicit.
  [major] Start the REST API: 'add `restapi` to the `ServerTasks` entry in the `notes.ini` file'
      problem: While technically possible, the official and recommended way to add a server task to auto-start in Domino is via the `ServerTasks` line in `notes.ini` OR via a `servertasks` console command. However, the DRAPI documentation recommends using the `notes.ini` parameter `LOAD_RESTAPI=1` (or similar mechanism) rather than manually appending to `ServerTasks`. Advising direct `notes.ini` editing without mentioning the preferred method, and without warning that incorrect `notes.ini` edits can destabilize the server, is incomplete and potentially risky guidance.
      fix:     Confirm the current recommended auto-start method from the official DRAPI docs and use that. At minimum, warn readers to back up `notes.ini` before editing and to follow the official guidance.
  [major] Using the REST API — entire section
      problem: The workflow omits a critical prerequisite: a Domino database must have its NSF registered/added in the DRAPI Admin UI (or via API) before a schema can be created for it. The article jumps straight to 'Create a schema for an existing Domino database' without explaining that DRAPI access is controlled at the NSF level and that the database path must first be known/registered. It also omits that the scope (step 3) is what maps a URL path segment to the schema — this is a non-trivial concept that readers will stumble on.
      fix:     Add a step before schema creation explaining how to identify/register the target NSF. Expand the scope step to explain what a scope is (the public-facing URL prefix) and how it relates to the schema.
  [major] Configure Applications: 'configure applications to create a `client_id` and `client_secret`, allowing your applications to use OAuth'
      problem: OAuth via client_id/client_secret (client credentials or authorization code flow) is only one of several authentication methods supported by DRAPI. The API also supports HTTP Basic authentication (for simple/admin use cases) and JWT bearer tokens. Presenting OAuth application configuration as the authentication step implies it is the only or primary method, which is misleading especially for readers doing quick internal integrations.
      fix:     Mention that DRAPI supports multiple auth methods (Basic, OAuth, JWT) and that the OAuth application setup is needed for production OAuth flows. Link to the authentication section of the official docs.
  [minor] Introduction paragraph: 'allowing external systems to access HCL Domino servers and databases'
      problem: DRAPI is not limited to external systems — it is also used by internal applications, the Domino Volt/Leap integration, and other HCL products. 'External systems' undersells the scope.
      fix:     Broaden to 'allowing applications and systems to access HCL Domino servers and databases via standard HTTP/REST interfaces.'
  [minor] Article title and body — no mention of DRAPI's former name 'Project KEEP'
      problem: Not an error, but many readers searching for information still use 'Project KEEP' or 'Domino KEEP API'. A brief parenthetical noting the former name would help findability.
      fix:     Add a one-sentence note: 'The Domino REST API was developed under the codename Project KEEP and is sometimes still referred to by that name in community resources.'
-->

## HCL Domino REST API 簡介

HCL Domino REST API 提供了一個安全的 REST API，允許外部系統存取 HCL Domino 伺服器和資料庫。這使得開發者可以使用自己偏好的程式語言，擴展和現代化 Domino 應用程式。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 安裝與配置

要在 Windows 伺服器上安裝 Domino REST API，請按照以下步驟：

1. **下載安裝檔案**：
   - 前往 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) 下載適用於您的平台的安裝檔案。

2. **解壓縮檔案**：
   - 使用 7-Zip 等工具解壓縮下載的 `.tar.gz` 檔案，直到獲得 `restapiInstall-r12.jar` 檔案。

3. **執行安裝程式**：
   - 將 `restapiInstall-r12.jar` 複製到 Domino 伺服器的程式目錄。
   - 以管理員身份開啟命令提示字元，導航至 Domino 程式目錄，執行以下命令：
     ```
     java -jar restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
     ```
     請根據您的伺服器路徑調整上述命令中的路徑。 ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api?utm_source=openai))

4. **啟動 REST API**：
   - 在 Domino 伺服器控制台輸入 `load restapi` 以啟動 REST API。
   - 若要確保 REST API 在伺服器啟動時自動啟動，請在 `notes.ini` 檔案的 `ServerTasks` 條目中添加 `restapi`。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## 使用 REST API

安裝完成後，您可以透過以下步驟開始使用 Domino REST API：

1. **創建資料庫配置（Schema）**：
   - 使用管理 UI 或 API 為現有的 Domino 資料庫創建 Schema。

2. **啟用表單、視圖和文件項目**：
   - 在管理 UI 或透過 API，啟用您希望透過 API 存取的表單、視圖和文件項目。

3. **激活 Schema**：
   - 創建一個範圍（Scope）來激活 Schema。

4. **測試 API**：
   - 使用 `curl` 或 Postman 等工具測試 REST API 呼叫。

5. **配置應用程式**：
   - 在管理 UI 中配置應用程式，以創建 `client_id` 和 `client_secret`，使您的應用程式能夠使用 OAuth 進行身份驗證。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html?utm_source=openai))

## 結論

HCL Domino REST API 為 Domino 應用程式提供了現代化和擴展的能力，使開發者能夠使用各種程式語言和工具與 Domino 互動。透過正確的安裝和配置，管理員可以確保 REST API 的安全性和穩定性，從而充分發揮其潛力。
