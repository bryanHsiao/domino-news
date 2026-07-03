---
title: "HCL Nomad 最新更新概覽"
description: "HCL Nomad 最近針對 iOS 和網頁瀏覽器版本進行了多項更新，包括介面改進、新功能和錯誤修復，提升了使用者體驗和應用程式的效能。"
pubDate: "2026-07-03T08:08:18+08:00"
lang: "zh-TW"
slug: "hcl-nomad-latest-updates"
tags:
  - "Nomad"
  - "Release Notes"
  - "Domino Server"
sources:
  - title: "What's new in HCL Nomad for Apple iOS?"
    url: "https://help.hcl-software.com/nomad/1.0/hcln_whatsnew.html"
  - title: "What's new in HCL Nomad for web browsers, HCL Nomad server on Domino, and HCL Nomad for web browsers COM Helper?"
    url: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html"
  - title: "HCL Nomad Documentation"
    url: "https://help.hcl-software.com/nomad/welcome/index.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-latest-updates
-->

## HCL Nomad 最新更新概覽

HCL Nomad 最近針對 iOS 和網頁瀏覽器版本進行了多項更新，旨在提升使用者體驗和應用程式的效能。

### iOS 版本更新

**版本 1.0.55**

- 在 iPad（iPadOS 26 及以上版本）上，新增了「建立」和「動作」選單，現在可在新的系統選單列中使用。
- 當 Nomad 進入背景時，主動複寫現在可持續最多 30 秒。

**版本 1.0.53**

- 對話列表按鈕的圖示和大小已更新，提升了可視性。
- 「開啟應用程式」對話框的「上層」按鈕圖示已更新，使用更直觀。
- 「關於」頁面現在會顯示版本的年份和月份，方便使用者識別版本資訊。

**版本 1.0.52**

- Rich Text Lite 欄位已更新，採用了 HCL Enchanted 設計語言，提供更一致的視覺體驗。
- 新增了「Inter」字體，並將其設為大多數地區的預設無襯線字體，提升了文字的可讀性。

**版本 1.0.51**

- 多個控制項已更新，採用了 HCL Enchanted 設計語言，包括單選按鈕、核取方塊、列表框、選擇器欄位、文字欄位分隔符和分頁表格，提供更現代化的外觀。

**版本 1.0.50**

- 支援 iPadOS 26 的選單列和視窗控制項，提升了與最新系統的兼容性。

### 網頁瀏覽器版本更新

**版本 1.0.13**

- **單一執行檔案**：現在，Nomad 伺服器在 Domino 上只有一個執行檔案，適用於所有支援的 Domino 版本，簡化了部署過程。
- **SAML 配置**：SAML 配置已從 `nomad-config.yml` 移至 `idpcat.nsf`，需要手動遷移。詳細資訊請參閱 [Nomad 伺服器上的 SAML 認證配置](https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html)。
- **OIDC 提供者支援**：如果 Domino HTTP 配置使用 OIDC 提供者進行聯合登入，Nomad 現在也可使用該機制進行認證，前提是 Domino 伺服器版本至少為 14.0.0 FP2。
- **拖放功能**：拖放功能現在不再僅限於 Chrome 和 Edge 瀏覽器，擴展了對其他瀏覽器的支援。
- **現代化更新**：
  - **自訂應用程式建構器**：可自動建立包含視圖、表單和動作列的應用程式，簡化了新應用程式的開發過程。
  - **匯入 Restyle 設定**：可從先前已重新設計的資料庫匯入 Restyle 設定，提升了設計的一致性。
- **新公式函數支援**：新增了對 `@ScanBarcode` 公式函數的支援，擴展了應用程式的功能性。

這些更新旨在提升 HCL Nomad 的功能和使用者體驗，確保應用程式在各種裝置和瀏覽器上都能順暢運行。更多詳細資訊，請參閱 [HCL Nomad 官方文件](https://help.hcl-software.com/nomad/welcome/index.html)。
