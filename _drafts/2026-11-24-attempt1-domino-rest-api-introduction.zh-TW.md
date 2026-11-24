---
title: "HCL Domino REST API 入門指南"
description: "了解如何安裝、配置和使用 HCL Domino REST API，將 Domino 應用程式與現代開發工具整合，擴展其功能。"
pubDate: "2026-11-24T14:49:42+08:00"
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
  [critical] Download the Installation Files — link text 'My HCLSoftware Portal' points to 'opensource.hcltechsw.com/…/downloaddrapi.html'
      problem: The My HCLSoftware Portal (formerly FlexNet / HCL License & Delivery Portal) is a completely different site at my.hcltechsw.com. The URL given is the Domino REST API open-source documentation page about how to download, not the portal itself. The link text directly contradicts the destination URL, which will confuse readers trying to actually obtain the software.
      fix:     Either link to my.hcltechsw.com with the text 'My HCLSoftware Portal', or link to the documentation page with accurate text such as 'Download instructions in the Domino REST API docs'.
  [critical] restapiInstall-r12.jar
      problem: The installer filename 'restapiInstall-r12.jar' embeds a specific version number ('r12') presented as a concrete example. The current Domino REST API (also known as KEEP/Project KEEP in earlier marketing, now officially 'HCL Domino REST API') has shipped well past v1.0 and its installers do not use that filename pattern. Fabricated or outdated filenames in install instructions will cause readers to look for a file that does not exist.
      fix:     Replace the hardcoded filename with a placeholder such as 'restapiInstall-<version>.jar' and note that the exact filename depends on the version downloaded from the portal.
  [major] Run the Installer — command-line example uses Windows paths exclusively
      problem: The article presents a single Windows command-line example as the installation method, with no acknowledgment that the Domino REST API also supports Linux (the dominant Domino server platform) and Docker/container deployments. The official documentation lists at minimum Windows, Linux, and container installation paths. Presenting only Windows as 'the' way to install is seriously misleading for the majority of Domino administrators.
      fix:     Either add Linux and Docker installation examples, or explicitly state 'The example below is for Windows; see the official documentation for Linux and container installation' and link accordingly.
  [major] Extract the Files — 'extract the downloaded .tar.gz file'
      problem: The Windows installer is typically distributed as a .zip or as the .jar directly, not a .tar.gz. The .tar.gz format is the Linux distribution archive. Telling Windows administrators to extract a .tar.gz is inconsistent with the Windows-only command that follows and will cause confusion.
      fix:     Align the archive format with the platform being described, or explain that the archive format differs by platform (.tar.gz on Linux, .zip on Windows) and handle them separately.
  [major] Activate the Schema — 'Activate the schema by creating a scope.'
      problem: This glosses over a critical and commonly misunderstood two-object model. In the Domino REST API, a Schema defines what is exposed (forms, views, fields, modes) and a Scope makes that schema addressable via a URL scope name and controls whether it is active. They are distinct objects; creating a scope does not simply 'activate' a schema — you associate the schema with a scope and set the scope to active. Collapsing these two concepts misleads readers into thinking they are one step.
      fix:     Explain that you create a Scope that references the Schema and give the scope a URL-safe name; enabling the scope is what makes the schema reachable via the API.
  [major] Configure Applications — 'configure applications to create a client_id and client_secret, allowing your applications to use OAuth for authentication'
      problem: OAuth (Authorization Code flow with client_id/client_secret) is only one of the authentication mechanisms supported. The Domino REST API also supports JWT-based authentication with its own /auth endpoint (issuing a bearer token directly with username/password) and integration with external IdPs (e.g., Keycloak, Microsoft Entra ID). Presenting OAuth application credentials as the authentication story gives the impression that setting up an OAuth app is always required, which it is not for simple API exploration or server-to-server JWT flows.
      fix:     Note that the API supports multiple auth methods (Domino-issued JWT via /api/v1/auth, OAuth 2.0 Authorization Code via registered applications, and external IdP integration) and that the OAuth app registration step is specifically needed for the Authorization Code / PKCE flows.
  [minor] What is HCL Domino REST API?
      problem: The article never mentions that the product was previously known during development/early release as 'Project KEEP' or 'KEEP'. Many existing Domino administrators still search for it under that name, and omitting it means readers may not recognize that existing KEEP documentation applies to them.
      fix:     Add a brief note: 'Previously known during development and early releases as Project KEEP, the product is now officially named HCL Domino REST API.'
  [minor] Start the REST API — 'add restapi to the ServerTasks entry in the notes.ini file'
      problem: The cited URL for this step (references/usingdominorestapi/restapitask.html) has '?utm_source=openai' appended, which reveals the article was drafted with AI assistance. All three cited URLs carry this utm parameter. This is a credibility and editorial-policy concern for publication.
      fix:     Remove all '?utm_source=openai' query-string parameters from the cited URLs before publishing.
  [minor] Overall article
      problem: The article contains no version information at all — not which Domino server version is required as a minimum, not which version of the REST API the installation steps apply to. The REST API has minimum Domino version requirements (Domino 12 at initial GA) and installation details differ between major releases.
      fix:     Add a prerequisites section stating the minimum supported Domino server version and the REST API release the instructions target.
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 提供了一個安全的 REST API，允許外部系統存取 HCL Domino 伺服器和資料庫。這使得開發者可以使用他們偏好的程式語言，擴展和現代化 Domino 應用程式。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html?utm_source=openai))

## 安裝與配置

要在 Domino 伺服器上安裝 Domino REST API，請按照以下步驟進行：

1. **下載安裝檔案**：
   - 前往 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/installconfig/install/downloaddrapi.html) 下載適用於您平台的安裝檔案。

2. **解壓縮檔案**：
   - 使用適當的工具解壓縮下載的 `.tar.gz` 檔案。

3. **執行安裝程式**：
   - 將解壓縮後的安裝程式（例如 `restapiInstall-r12.jar`）複製到 Domino 伺服器的程式目錄。
   - 在命令提示字元中，以管理員身份執行以下命令：
     ```
     java -jar c:\domino\restapiInstall-r12.jar -d="C:\Domino\Data" -i="C:\Domino\notes.ini" -r="C:\Domino\restapi" -p="C:\Domino" -a
     ```
     請根據您的伺服器路徑調整上述命令中的路徑。 ([hcl-software.com](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api?utm_source=openai))

4. **啟動 REST API**：
   - 在 Domino 伺服器控制台中，輸入以下命令以啟動 REST API：
     ```
     load restapi
     ```
   - 若要確保 REST API 在伺服器啟動時自動啟動，請在 `notes.ini` 檔案的 `ServerTasks` 條目中添加 `restapi`。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/restapitask.html?utm_source=openai))

## 使用 REST API

安裝並配置完成後，您可以透過 REST API 存取 Domino 資料庫。以下是基本步驟：

1. **建立資料庫配置（Schema）**：
   - 使用管理 UI 或 API，為現有的 Domino 資料庫建立 Schema。

2. **啟用表單、視圖和文件項目**：
   - 指定哪些表單、視圖和文件項目可透過 API 存取。

3. **激活 Schema**：
   - 透過建立範圍（Scope）來激活 Schema。

4. **測試 API**：
   - 使用如 `curl` 或 Postman 等工具測試 API 呼叫。

5. **配置應用程式**：
   - 在管理 UI 中配置應用程式，以建立 `client_id` 和 `client_secret`，使您的應用程式能夠使用 OAuth 進行身份驗證。 ([opensource.hcltechsw.com](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html?utm_source=openai))

## 結論

HCL Domino REST API 為 Domino 應用程式提供了現代化的開發體驗，允許開發者使用各種程式語言和工具，擴展和整合 Domino 的功能。透過正確的安裝和配置，您可以充分利用 REST API，提升應用程式的靈活性和可擴展性。
