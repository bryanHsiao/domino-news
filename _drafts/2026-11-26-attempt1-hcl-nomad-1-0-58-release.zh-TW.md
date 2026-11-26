---
title: "HCL Nomad 1.0.58 版本發布"
description: "HCL Nomad 1.0.58 版本引入了多項新功能，包括文件列印、應用程式快捷方式與 Siri 整合，以及 iPhone 上的頂部標籤導航。"
pubDate: "2026-11-26T12:44:16+08:00"
lang: "zh-TW"
slug: "hcl-nomad-1-0-58-release"
tags:
  - "Release Notes"
  - "Domino Server"
sources:
  - title: "HCL Nomad App - App Store"
    url: "https://apps.apple.com/us/app/hcl-nomad/id751904885?platform=watch"
  - title: "HCL Nomad for web browsers and HCL Nomad server on Domino 1.0.x Release Notes"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0090289"
  - title: "HCL Nomad – Apps on Google Play"
    url: "https://play.google.com/store/apps/details?hl=en_US&id=com.lotus.nomad"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/nomad/1.0/hcln_welcome.html" appears 4/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-1-0-58-release
-->

HCL 最近發布了 HCL Nomad 1.0.58 版本，為使用者帶來多項新功能和改進，提升了行動裝置上 Domino 應用程式的使用體驗。

## 文件列印功能

使用者現在可以直接從 HCL Nomad 列印文件至任何支援 AirPrint 的印表機，或透過 iOS 分享功能將文件匯出為 PDF。要使用此功能，只需在文件視窗中長按，選擇「列印...」即可。此功能也支援 `@Command([FilePrint])` 公式命令，雖然可選參數將被忽略。管理員可以透過新的設定來管理列印功能的使用權限。詳細資訊請參閱 [HCL Nomad 使用者文件](https://help.hcl-software.com/nomad/1.0/hcln_welcome.html)。

## 應用程式快捷方式與 Siri 整合

HCL Nomad 現在支援原生的應用程式意圖，允許使用者透過快捷方式、Spotlight 搜尋或 Siri 語音命令快速開啟應用程式或同步頁面。例如，使用者可以說「在 HCL Nomad 中顯示同步頁面」來觸發相應操作。請注意，Siri 語音命令需要 Siri AI 支援，目前僅限於特定地區。管理員可以透過新的設定來管理此功能。更多資訊請參閱 [HCL Nomad 使用者文件](https://help.hcl-software.com/nomad/1.0/hcln_welcome.html)。

## iPhone 上的頂部標籤導航

在 iPhone 上，應用程式標籤現在移至螢幕頂部，提供更流暢的導航和標籤切換體驗。這一改進旨在提升使用者在小螢幕設備上的操作便利性。

## 最低 iOS 版本要求

請注意，HCL Nomad 1.0.58 現在要求最低 iOS 版本為 17.0，之前的版本要求為 16.0。請確保您的設備已更新至最新版本的 iOS，以享受最新功能和改進。

這些更新旨在提升 HCL Nomad 的功能性和使用者體驗，讓使用者能夠更有效率地在行動設備上使用 Domino 應用程式。
