---
title: "HCL Nomad Web 1.0.21 發布：修復 MarvelClient 配置問題"
description: "HCL Nomad Web 1.0.21 版本已發布，主要修復了與 panagenda MarvelClient 配置相關的問題，並包含其他多項錯誤修正。"
pubDate: "2026-09-23T09:19:23+08:00"
lang: "zh-TW"
slug: "hcl-nomad-web-1-0-21-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Admin"
sources:
  - title: "HCL Nomad Web 1.0.21: Important Bug Fix for MarvelClient | panagenda"
    url: "https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/"
  - title: "HCL Nomad for web browsers 1.0.21 - Ales Lichtenberg"
    url: "https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-21/"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/?utm_source=openai" appears 6/6 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-web-1-0-21-release
-->

HCL 最近發布了 HCL Nomad Web 1.0.21 版本，該版本專注於錯誤修復和穩定性提升，未引入新功能。([panagenda.com](https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/?utm_source=openai))

**MarvelClient 配置修復**

對於使用 panagenda MarvelClient 的用戶，該版本修復了在 `notes.ini` 中通過 `NOM_MC_DB` 指定的 MarvelClient 配置數據庫未被正確使用的問題。此問題在 1.0.20 版本中出現，導致 Nomad Web 無法定位自定義的 MarvelClient 配置數據庫。1.0.21 版本恢復了該功能的正常運作。([panagenda.com](https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/?utm_source=openai))

**其他修復**

除了上述修復，1.0.21 版本還解決了以下問題：

- 在特定條件下，無法在“日期/時間”字段中選擇多個值。
- 在顯示搜索對話框時，無法向數據庫字段輸入 IME。
- 嵌入式大綱圖標位置“中右”未被正確顯示。
- 打印預覽對話框顯示額外的輸入字段，文本和邊框未正確對齊。
- 通過“打開應用程序”導入大型數據庫時崩潰。
- 傳統的灰色系統風格按鈕被轉換為輪廓按鈕。
- 在 GetPrintSettings 中出現“LookupHandle: handle out of range”導致崩潰。
- 電子郵件頁腳內嵌圖像顯示為附件。
- 標籤表格單元格顏色渲染意外更改。
- 使用 Google Workspace 作為 IdP 的 Nomad 聯合登錄導致 400 錯誤。

**獲取最新版本**

HCL Nomad Web 1.0.21 可通過 My HCLSoftware Portal 獲取。HCL 於 2026 年 9 月 15 日宣布了該版本的發布。([panagenda.com](https://www.panagenda.com/blog/hcl-nomad-web-1-0-21/?utm_source=openai))

**結論**

HCL Nomad Web 1.0.21 是一個專注於維護的版本，未引入新功能，但包含多項有用的修復，提升了穩定性和兼容性。特別是對於使用 panagenda MarvelClient 的用戶，建議升級至 1.0.21 版本，以確保配置正常運作。
