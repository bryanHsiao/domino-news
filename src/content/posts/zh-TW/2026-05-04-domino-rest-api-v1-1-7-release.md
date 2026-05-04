---
title: "Domino REST API 目前最新版 v1.1.7：新端點與修正整理"
description: "HCL Domino REST API 目前最新版本是 v1.1.7（2026 年 4 月 7 日釋出），新增日曆設定、PIM 未讀狀態、Email 文件更新等端點，並修正附件下載、Microsoft Entra ID 認證、會議邀請等問題。"
pubDate: "2026-05-04T07:20:47+08:00"
lang: "zh-TW"
slug: "domino-rest-api-v1-1-7-release"
tags:
  - "Release Notes"
  - "Domino REST API"
  - "Admin"
sources:
  - title: "Domino REST API v1.1.7 - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html"
  - title: "What's new - HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html"
  - title: "HCL Domino REST API Documentation (home)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/"
cover: "/covers/domino-rest-api-v1-1-7-release.png"
coverStyle: "minimalist-mono"
---

HCL Domino REST API 截至目前的最新版本是 [v1.1.7](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/v1.1.7.html)（2026 年 4 月 7 日釋出），為開發者和管理員帶來了多項新功能和改進，特別是在日曆和電子郵件管理方面。

## 新功能

- **獲取日曆設定檔**：
  新增了 `GET pim-v1/calendar/profile` 端點，允許開發者檢索已驗證用戶的日曆設定檔文件。該文件包含個人日曆和排程設定，如工作時間、預設會議時長、時區、自動處理選項、空閒時間顯示設定等。

- **管理未讀狀態的 PIM 項目**：
  新增了 `POST pim-v1/pimitems/unread` 端點，允許檢查並選擇性地更新 PIM 項目的未讀狀態。該端點接受包含必要的 `unids` 陣列和可選的 `markRead: true` 或 `markUnread: true` 標誌的請求對象，返回一個將每個 UNID 映射到布林值的對象，`true` 表示未讀狀態，`false` 表示已讀狀態。

- **更新電子郵件文件**：
  實現了 `PUT pim-v1/message/{unid}` 端點，支持更新由其 UNID 識別的電子郵件文件的欄位。

## 修正問題

- **附件下載問題**：
  修復了使用 `GET v1/attachments/{unid}/{attachmentname}` 端點下載文件名中包含特殊字符的附件時出現的問題。

- **Microsoft Entra ID 認證問題**：
  修復了使用 Microsoft Entra ID 作為管理 UI 和 Office Round Trip Experience 的外部身份提供者（IdP）進行認證時，導致用戶被重定向到錯誤頁面的問題。

- **會議邀請問題**：
  修復了新建帶有參與者的會議被視為廣播日曆條目的問題，該問題導致受邀者無法接受或拒絕會議，組織者無法接收參與者的回應。

## 其他資訊

- **安裝器 JAR 文件**：
  - Domino 14.5：`restapiInstall-r145.jar`
  - Domino 14：`restapiInstall-r14.jar`
  - Domino 12：`restapiInstall-r12.jar`

- **Docker 映像版本**：
  - Domino 14.5：`domino-rest-api:1.1.7-r145`
  - Domino 14：`domino-rest-api:1.1.7-r14`
  - Domino 12：`domino-rest-api:1.1.7-r12`

完整的 API 端點規格與安裝指南可在 [HCL Domino REST API 官方文件](https://opensource.hcltechsw.com/Domino-rest-api/) 查閱；歷代版本與更新內容可在 [What's new 索引頁](https://opensource.hcltechsw.com/Domino-rest-api/whatsnew/index.html) 完整檢視。
