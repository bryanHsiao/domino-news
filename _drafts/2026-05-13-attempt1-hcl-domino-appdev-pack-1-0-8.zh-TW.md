---
title: "HCL Domino AppDev Pack 1.0.8：Node.js 支援與配置指南"
description: "HCL Domino AppDev Pack 1.0.8 為 Domino 伺服器引入了 Node.js 支援，本文提供其主要組件概述及配置步驟，協助開發者利用 Node.js 擴展 Domino 應用程式。"
pubDate: "2026-05-13T07:28:14+08:00"
lang: "zh-TW"
slug: "hcl-domino-appdev-pack-1-0-8"
tags:
  - "Domino Server"
  - "AppDev Pack"
  - "Tutorial"
sources:
  - title: "Configuring Domino AppDev Pack trial"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/trial_configuring_appdevpack.html"
  - title: "Domino AppDev Pack Documentation"
    url: "https://doc.cwpcollaboration.com/appdevpack/docs/en/1.0.6/homepage.html"
  - title: "Domino trial"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/trial_over.html"
draft: true
---
<!--
REJECTED DRAFT — URL gate FAILED — 1 source URL(s) are not reachable:
  - 404 https://doc.cwpcollaboration.com/appdevpack/docs/en/1.0.6/homepage.html
attempt: 1
slug: hcl-domino-appdev-pack-1-0-8
-->

## HCL Domino AppDev Pack 1.0.8：Node.js 支援與配置指南

HCL Domino AppDev Pack 1.0.8 為 Domino 伺服器引入了 Node.js 支援，讓開發者能夠使用現代的 JavaScript 技術來擴展和整合 Domino 應用程式。本文將概述 AppDev Pack 的主要組件，並提供配置步驟，協助您開始使用。

### 主要組件

AppDev Pack 包含以下關鍵組件：

- **Proton**：Domino 伺服器的附加任務，負責處理來自外部應用程式的請求。管理員需在一個或多個 Domino 伺服器上安裝並配置 Proton。

- **@domino/domino-db**：Node.js 模組，開發者可在 Node.js 應用程式中使用此模組，透過 Proton 對 Domino 資料庫執行操作。

- **IAM（身份與存取管理）服務**：基於 Node.js 的服務，提供標準的 OAuth 2.0 授權流程，允許遠端應用程式安全地存取 Domino 資源。

### 配置步驟

要配置 AppDev Pack，請參考 [Domino AppDev Pack 試用版配置指南](https://help.hcl-software.com/domino/12.0.0/admin/trial_configuring_appdevpack.html) 中的分步指導。以下是主要步驟：

1. **部署 Domino 試用伺服器**：
   - 下載並部署包含 Domino 12.0 的 Docker 映像。詳細步驟請參閱 [Domino 試用版部署指南](https://help.hcl-software.com/domino/12.0.0/admin/trial_over.html)。

2. **準備 Domino 伺服器**：
   - 完成基本配置，如設定伺服器名稱、網域等。

3. **配置 AppDev Pack**：
   - 下載並安裝 AppDev Pack 套件，該套件包含 Proton 和 IAM 服務。
   - 配置 Proton，確保其能夠處理來自 Node.js 應用程式的請求。
   - 部署並配置 IAM 服務，設定 OAuth 2.0 授權流程，確保安全存取 Domino 資源。

### 開發者資源

配置完成後，開發者可以使用 [@domino/domino-db](https://doc.cwpcollaboration.com/appdevpack/docs/en/1.0.6/homepage.html) 模組，在 Node.js 應用程式中與 Domino 資料庫互動。該模組提供了豐富的 API，允許開發者執行各種操作，如讀取和寫入文件、執行查詢等。

透過 HCL Domino AppDev Pack 1.0.8，開發者可以利用現代的 JavaScript 技術，擴展和整合現有的 Domino 應用程式，提升開發效率和應用程式的靈活性。
