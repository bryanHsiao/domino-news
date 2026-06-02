---
title: "HCL Nomad Web 1.0.10 發布：整合設計器與多項新功能"
description: "HCL Nomad Web 1.0.10 於 2023 年 12 月 13 日發布，新增整合設計器、離線郵件發送、HTTP 連線支援等功能，並修復多項問題。"
pubDate: "2026-06-03T07:38:28+08:00"
lang: "zh-TW"
slug: "hcl-nomad-web-1-0-10"
tags:
  - "Release Notes"
  - "Nomad"
  - "Domino Server"
sources:
  - title: "Customer Information for HCL Nomad Web 1.0.10"
    url: "https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-10/"
  - title: "HCL Nomad for web browsers 1.0.10"
    url: "https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-10/"
  - title: "HCL Nomad for web browsers User Documentation"
    url: "https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-10/" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-web-1-0-10
-->

HCL 於 2023 年 12 月 13 日發布了 HCL Nomad Web 1.0.10，為使用者帶來多項新功能與改進。

## 整合設計器

此版本引入了整合設計器，允許使用者直接在瀏覽器中創建或編輯 Notes 資料庫。只需在應用程式的上下文選單中選擇「設計器」選項，即可進入設計模式。請注意，使用者需具備資料庫的開發者權限才能使用此功能。更多資訊請參閱 [HCL Nomad for web browsers 1.0.10](https://alichtenberg.cz/hcl-nomad-for-web-browsers-1-0-10/)。

## 離線郵件發送

1.0.10 版本支援離線郵件發送功能。使用者即使在無網路連線的情況下，也可撰寫並發送郵件，郵件將儲存在本地的 mail.box 中，待恢復連線後自動發送。詳細資訊請參閱 [Customer Information for HCL Nomad Web 1.0.10](https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-10/)。

## HTTP 連線支援

Nomad 伺服器現在支援 HTTP 連線，除了先前支援的 HTTPS 連線外，提供更多連線選項。這對於需要透過 HTTP 協議連接反向代理的使用者特別有用。更多資訊請參閱 [HCL Nomad for web browsers User Documentation](https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf)。

## 其他新功能與修復

- **可選的 HTTP 標頭支援**：Nomad 伺服器現在支援在回應中添加可選的 HTTP 標頭。
- **Let's Encrypt 整合**：簡化了 SSL/TLS 憑證的管理，提升了安全性。
- **語言支援**：新增了對多種語言的支援，提升了全球使用者的體驗。
- **Domino Restyle 更新**：改進了應用程式的視覺風格，提供更現代的外觀。

此外，1.0.10 版本修復了 16 個已知問題，進一步提升了系統的穩定性與性能。完整的更新內容與修復清單，請參閱 [Customer Information for HCL Nomad Web 1.0.10](https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-10/)。

## 總結

HCL Nomad Web 1.0.10 的發布為使用者帶來了多項實用的新功能與改進，進一步提升了在瀏覽器中使用 Notes 應用程式的體驗。建議所有使用者盡快升級至此版本，以享受最新的功能與修復。
