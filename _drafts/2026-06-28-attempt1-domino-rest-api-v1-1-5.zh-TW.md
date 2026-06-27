---
title: "Domino REST API v1.1.5：新功能與改進"
description: "HCL Domino REST API v1.1.5 於 2025 年 9 月 3 日發布，帶來了多項新功能與改進，包括針對 Domino 14.5 的安裝程式與 Docker 容器、管理 UI 的錯誤通知，以及對 DQL 處理的增強。"
pubDate: "2026-06-28T07:26:57+08:00"
lang: "zh-TW"
slug: "domino-rest-api-v1-1-5"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Domino Server"
sources:
  - title: "Domino REST API v1.1.5 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html"
  - title: "New Domino REST APIs Are Now Available"
    url: "https://www.hcl-software.com/blog/domino/new-domino-rest-apis-are-now-available"
  - title: "Domino Administrators - What You Need to Know About the Domino REST API"
    url: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html" was already cited by [domino-rest-api-update] on 2026-06-17. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://www.hcl-software.com/blog/domino/domino-administrators-what-you-need-to-know-about-the-domino-rest-api" was already cited by [domino-rest-api-introduction] on 2026-06-16. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html" appears 12/12 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: domino-rest-api-v1-1-5
-->

HCL 於 2025 年 9 月 3 日發布了 Domino REST API v1.1.5，為開發者與管理者帶來多項新功能與改進。以下是此版本的主要更新內容：

## 新功能

- **針對 Domino 14.5 的安裝程式與 Docker 容器**：
  - 現在可在 [My HCLSoftware Portal](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html) 和 HCL 容器儲存庫下載專為 Domino 14.5 設計的安裝程式與 Docker 容器。

## 改進

- **管理 UI 的錯誤通知**：
  - 在管理 UI 登入頁面新增了彈出式通知，當登入或網路錯誤發生時，會顯示相關的狀態碼與訊息，方便使用者識別錯誤。

- **DQL 處理的增強**：
  - 更新了 `GET v1/odata/{dataSource}/{name}` 端點，現在可使用 `notes.ini` 中設定的最大可掃描 NSF 文件數、索引條目數和掃描時間限制。更多資訊請參閱 [DQL 處理的掃描限制](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html)。

## 修正的問題

- **管理 UI 和多個 API 端點的超時問題**：
  - 修正了在 v1.1.4 中引入的問題，該問題導致管理 UI 和多個 API 端點出現超時情況。

- **認證過程中的暫存檔案問題**：
  - 修正了在認證過程中產生的暫存檔案未被移除，導致認證處理速度變慢的問題。詳細資訊請參閱 [Domino REST API v1.1.5 發布說明](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html)。

## 其他

- **新增 WOPI 與 Collabora 容器的操作指南**：
  - 新增了關於如何使用 Domino REST API WOPI 與 Collabora 容器的操作指南，詳情請參閱 [Domino REST API v1.1.5 發布說明](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html)。

- **安裝程式與 Docker 映像版本資訊**：
  - 提供了針對不同 Domino 版本的安裝程式 JAR 檔案與 Docker 映像版本資訊，詳情請參閱 [Domino REST API v1.1.5 發布說明](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html)。

這些更新旨在提升 Domino REST API 的功能性與穩定性，為開發者與管理者提供更好的使用體驗。更多詳細資訊，請參閱 [Domino REST API v1.1.5 發布說明](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.5.html)。
