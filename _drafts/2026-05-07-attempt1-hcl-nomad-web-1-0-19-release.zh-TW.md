---
title: "HCL Nomad Web 1.0.19 發布"
description: "HCL Nomad Web 1.0.19 引入了多項新功能和修復，包括更新的 UI 控件和增強的穩定性。"
pubDate: "2026-05-07T07:22:57+08:00"
lang: "zh-TW"
slug: "hcl-nomad-web-1-0-19-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Domino Server"
sources:
  - title: "HCL Nomad for web browsers 1.0.19"
    url: "https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-19/"
  - title: "HCL Nomad for web browsers User Documentation"
    url: "https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf"
  - title: "HCL Nomad and panagenda MarvelClient"
    url: "https://help.hcl-software.com/nomad/1.0_admin/hcln_marvel_client.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-19/" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-web-1-0-19-release
-->

HCL 最近發布了 Nomad Web 1.0.19，為用戶帶來了多項新功能和修復，進一步提升了使用體驗和應用程序的穩定性。

## 更新的 UI 控件

在此版本中，以下控件已更新以採用 HCL Enchanted 設計語言：

- 富文本精簡版（rich text lite）
- 時間選擇器
- 時區選擇器
- 顏色選擇器
- 顏色字段
- 鏈接熱點

這些更新使得用戶界面更加現代化和一致，提升了整體的用戶體驗。

## 修復列表

1. **連接問題修復**：解決了在代理或防火牆無重置地丟棄連接後，Nomad Web 重新連接到 Domino 服務器所需時間過長的問題。

2. **上下文菜單問題修復**：修復了間歇性丟失右鍵上下文菜單功能的問題。

3. **打印問題修復**：解決了打印文檔時缺少組合框的問題。

詳細的修復列表和相關知識庫文章可參考 [HCL Nomad for web browsers 1.0.19](https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-19/)。

## MarvelClient 集成

HCL Nomad 現在與 panagenda 的 MarvelClient 集成，允許管理員通過定義自己的設置來管理 Nomad 客戶端。MarvelClient 提供了以下功能：

- **集中管理**：無需用戶干預，即可集中管理 Nomad 的各個方面，包括最近的應用程序、本地副本、位置/連接文檔等。

- **初始設置**：確保 Nomad 客戶端在初始安裝後正確設置，讓用戶立即投入工作，無需考慮設置或如何找到 Notes 應用程序。

- **一致性應用設置**：確保 Nomad 始終正確配置，簡單重啟應用程序即可自動修復錯誤配置，無需求助於幫助台。

- **持續收集信息**：持續收集有關已部署的 Nomad 安裝、操作系統和硬件的詳細信息，以進一步進行管理分析。

- **應用程序限制**：配置應用程序限制以提高數據安全性。

有關如何下載帶有 HCL Nomad 支持的 MarvelClient 配置數據庫模板，以及如何配置 MarvelClient 的更多信息，請參閱 [HCL Nomad 和 panagenda MarvelClient](https://help.hcl-software.com/nomad/1.0_admin/hcln_marvel_client.html)。

## 結論

HCL Nomad Web 1.0.19 通過引入新的 UI 控件和多項修復，顯著提升了用戶體驗和應用程序的穩定性。MarvelClient 的集成進一步增強了管理能力，使得管理員能夠更有效地管理 Nomad 客戶端。建議所有用戶盡快升級到此版本，以享受這些改進帶來的好處。
