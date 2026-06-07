---
title: "HCL Domino REST API：入門指南"
description: "本文介紹 HCL Domino REST API 的基本概念、安裝與配置步驟，以及如何開始使用，幫助您快速上手並擴展 Domino 應用的功能。"
pubDate: "2026-06-08T07:28:22+08:00"
lang: "zh-TW"
slug: "hcl-domino-rest-api-introduction"
tags:
  - "Tutorial"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Introducing the Domino REST API - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/introducingrestapi.html"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
  - title: "Quickstart - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html"
draft: true
---
<!--
REJECTED DRAFT — topic overlap with **drapi-keycloak-oidc** + 2 critical fact issue(s)
attempt: 1
slug: hcl-domino-rest-api-introduction
topicOverlap: true (overlapWith=drapi-keycloak-oidc)
issues:
  [critical] restapiInstall-r12.jar
      problem: The installer JAR file name 'restapiInstall-r12.jar' is almost certainly fabricated or outdated. HCL's actual DRAPI installer has changed names across versions and is not a single generic JAR invoked with a bare 'java -jar' command. The current DRAPI installer (v1.x releases) is distributed as a platform-specific installer (e.g. restapiInstall.jar or via an HCL Flexnet/Software Portal download with a versioned name), and the '-r12' suffix implies a hard tie to Domino 12 that is misleading for a 'Getting Started' article. Publishing a fabricated or stale installer filename will break readers' attempts to follow the instructions.
      fix:     Replace the hardcoded filename with a generic placeholder such as '<restapiInstall-version>.jar' and direct readers to the HCL Software Portal or the official DRAPI GitHub releases page (https://github.com/HCL-TECH-SOFTWARE/Domino-rest-api/releases) to download the current installer. Include the actual install command documented in the official quickstart, which typically requires additional flags (e.g. -d for Domino data directory, -i for notes.ini path).
  [critical] java -jar restapiInstall-r12.jar
      problem: The install command shown is missing mandatory parameters. The real DRAPI installer requires at minimum the Domino program directory (-d), the Domino data directory, and the notes.ini path. Running 'java -jar restapiInstall-r12.jar' with no arguments either prints usage help or fails. A reader following this command verbatim will not successfully install DRAPI.
      fix:     Provide the full install command with required flags, for example: 'java -jar restapiInstall.jar -d <DominoDataDir> -i <path/to/notes.ini> -p <DominoProgramDir> -a' — or link directly to the official quickstart which specifies the exact syntax for each platform.
  [major] Extract the downloaded package and copy the `restapiInstall-r12.jar` file to the Domino server's program directory.
      problem: The DRAPI installer does not need to be copied to the Domino program directory before running; it is typically run from any directory with the target paths passed as arguments. Telling readers to copy it to the program directory is incorrect and may confuse them about what the installer actually does (it installs files into the program and data directories, it does not run from within them).
      fix:     Clarify that the installer can be run from any convenient directory and that the Domino program and data directory paths are supplied as command-line arguments. Remove the instruction to copy the JAR to the program directory.
  [major] Install and Start the API
      problem: The article conflates installation with starting the service. DRAPI does not auto-start after running the installer JAR. After installation, DRAPI is loaded as a Domino server task (typically 'load restapi' from the Domino console, or by adding 'restapi' to the ServerTasks notes.ini line). This is a separate step that is completely omitted.
      fix:     Add a distinct step explaining how to start the DRAPI task on the Domino server (e.g. 'load restapi' at the server console, or adding it to ServerTasks=... in notes.ini for automatic startup).
  [major] Post-Installation Configuration
      problem: The post-installation section is essentially empty ('follow the official documentation'). For a 'Getting Started' article this is insufficient. Critical post-install steps include: creating a DRAPI configuration database (keep.nsf / KeepConfig.nsf), defining a 'scope' (formerly called a 'schema') to expose an NSF, and creating an application (OAuth client) to obtain credentials. Without these a reader cannot make a single authenticated API call.
      fix:     Expand this section to cover at minimum: (1) verifying the keep.nsf / KeepConfig.nsf configuration database was created, (2) creating a scope to expose a target NSF, (3) creating an application entry for OAuth2, and (4) confirming the Swagger UI is reachable at http://<server>:8880/openapi/index.html.
  [major] Using the REST API — no mention of authentication
      problem: The article lists Swagger UI, Postman, and curl as testing tools but never mentions authentication. DRAPI uses OAuth2 (with its own built-in IdP or an external IdP like Keycloak). A reader cannot call any protected endpoint without first obtaining a JWT/Bearer token. This omission means none of the listed tools will actually work beyond unauthenticated endpoints.
      fix:     Add a section explaining that DRAPI requires OAuth2 authentication, how to obtain a token (POST to /api/v1/auth with Notes credentials against the built-in IdP, or via an external OIDC provider), and how to include it as a Bearer token in subsequent requests. Reference the companion site article [drapi-keycloak-oidc] for external IdP setup.
  [minor] What is HCL Domino REST API?
      problem: The introduction is accurate but extremely thin. It does not mention the product's previous name (KEEP / Project KEEP / Domino KEEP) which readers searching for it may still encounter in older documentation, nor the default port (8880), nor the fact that it ships as a Domino server task rather than a standalone server.
      fix:     Add a sentence clarifying that DRAPI was formerly known as 'Project KEEP' or 'HCL KEEP' and runs as a Domino add-in task on port 8880 by default. This helps readers correlate older blog posts and documentation with the current product name.
  [minor] Further Learning — HCL Domino REST API Official Documentation link
      problem: The URL https://opensource.hcltechsw.com/Domino-rest-api/index.html is the documentation root but is not cited in the 'Cited sources' list at the top of the article (only the /topicguides/ and /tutorial/ subpages are). Minor inconsistency, but the main docs root should be a primary cited source for a Getting Started article.
      fix:     Add the documentation root URL to the cited sources list, or ensure all URLs in the article body are present in the cited sources.
-->

## 什麼是 HCL Domino REST API？

HCL Domino REST API 提供了一個安全的 REST API，允許外部系統存取 HCL Domino 伺服器和資料庫。它基於業界標準，讓開發者能夠使用自己偏好的程式語言與 Domino 互動，從而擴展和現代化 Domino 應用程式的功能。

## 安裝與配置

要開始使用 HCL Domino REST API，請按照以下步驟進行：

1. **下載安裝包**：
   - 登入 HCL 軟體門戶，下載適用於您平台的最新 Domino REST API 安裝包。

2. **安裝與啟動**：
   - 將下載的安裝包解壓縮，並將 `restapiInstall-r12.jar` 文件複製到 Domino 伺服器的程式目錄。
   - 在命令提示字元中，以管理員身份執行以下命令來安裝並啟動 REST API：
     ```
     java -jar restapiInstall-r12.jar
     ```

3. **後續配置**：
   - 完成安裝後，請按照官方文檔中的指導進行必要的配置，以確保 REST API 的正常運行。

## 使用 REST API

安裝和配置完成後，您可以使用以下工具來測試和使用 REST API：

- **Swagger UI**：
  - 提供互動式的 API 文檔，方便您探索和測試可用的端點。

- **Postman**：
  - 一個流行的 API 測試工具，允許您發送 API 請求並查看響應。

- **curl**：
  - 命令行工具，適用於快速測試 API 請求。

## 進一步學習

為了更深入地了解和使用 HCL Domino REST API，建議參考以下資源：

- [HCL Domino REST API 官方文檔](https://opensource.hcltechsw.com/Domino-rest-api/index.html)
- [Domino 管理員需知的 REST API 相關資訊](https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api)
- [快速入門指南](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/quickstart.html)

透過這些資源，您將能夠更全面地理解和應用 HCL Domino REST API，從而提升您的 Domino 應用程式的功能和靈活性。
