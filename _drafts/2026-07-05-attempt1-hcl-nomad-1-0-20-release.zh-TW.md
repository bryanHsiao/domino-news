---
title: "HCL Nomad 1.0.20 發布"
description: "HCL Nomad 1.0.20 版本現已推出，為 Web 瀏覽器帶來多項新功能和改進，包括 Kiosk 模式、LotusScript 對 C API 的存取，以及 COM Helper 的更新。"
pubDate: "2026-07-05T08:03:30+08:00"
lang: "zh-TW"
slug: "hcl-nomad-1-0-20-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Domino Server"
sources:
  - title: "HCL Nomad Documentation"
    url: "https://help.hcl-software.com/nomad/welcome/index.html"
  - title: "HCL Nomad for web browsers 1.0.x Release Notes"
    url: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html"
  - title: "HCL Nomad for web browsers COM Helper beta 3"
    url: "https://help.hcl-software.com/nomad/beta/nomadweb/nomadweb_welcome_beta.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/nomad/welcome/index.html" was already cited by [hcl-nomad-latest-updates] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Saturated source URL: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html" was already cited by [hcl-nomad-latest-updates] on 2026-07-03. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-1-0-20-release
-->

HCL Nomad 1.0.20 版本現已推出，為 Web 瀏覽器帶來多項新功能和改進。以下是此版本的主要更新內容：

## Kiosk 模式

此版本引入了 Kiosk 模式，允許指定的資料庫在啟動時自動運行，提供更流暢的用戶體驗。詳細資訊請參閱 [HCL Nomad for web browsers 1.0.x Release Notes](https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html)。

## LotusScript 對 C API 的存取

HCL Nomad 1.0.20 現在支援 LotusScript 存取 C API，增強了應用程式的功能和靈活性。更多資訊可在 [HCL Nomad Documentation](https://help.hcl-software.com/nomad/welcome/index.html) 中找到。

## COM Helper 更新

為了改善與 COM 物件的互動，HCL Nomad for web browsers COM Helper 已更新至 Beta 3 版本。此更新需要 Nomad for web browsers 1.0.14 或更高版本，並將白名單管理從登錄機碼移至安裝目錄中的檔案。詳細資訊請參閱 [HCL Nomad for web browsers COM Helper beta 3](https://help.hcl-software.com/nomad/beta/nomadweb/nomadweb_welcome_beta.html)。

## 其他改進

- **單一執行檔**：Nomad 伺服器在 Domino 上現在僅需一個執行檔，適用於所有支援的 Domino 版本，簡化了安裝和維護過程。

- **SAML 配置變更**：SAML 配置已從 `nomad-config.yml` 移至 `idpcat.nsf`，需要手動遷移。更多資訊請參閱 [HCL Nomad for web browsers 1.0.x Release Notes](https://help.hcl-software.com/nomad/1.0_web/nomad_web_new.html)。

建議所有使用者升級至 HCL Nomad 1.0.20，以利用這些新功能和改進。
