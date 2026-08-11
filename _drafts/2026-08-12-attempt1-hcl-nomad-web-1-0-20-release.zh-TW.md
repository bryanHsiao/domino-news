---
title: "HCL Nomad Web 1.0.20 發布"
description: "HCL Nomad Web 1.0.20 現已發布，包含多項安全修復和功能增強，建議所有用戶升級。"
pubDate: "2026-08-12T07:41:59+08:00"
lang: "zh-TW"
slug: "hcl-nomad-web-1-0-20-release"
tags:
  - "Release Notes"
  - "Nomad"
  - "Security"
sources:
  - title: "Customer Information for HCL Nomad Web 1.0.20 - panagenda"
    url: "https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-20/"
  - title: "HCL Nomad for web browsers and HCL Nomad server on Domino 1.0.19 – Now Officially Released!"
    url: "https://developer.ds.hcl-software.com/t/hcl-nomad-for-web-browsers-and-hcl-nomad-server-on-domino-1-0-19-now-officially-released/172443"
  - title: "HCL Nomad for web browsers User Documentation"
    url: "https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Saturated source URL: "https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf" was already cited by [hcl-nomad-ios-updates] on 2026-08-01. Re-citing it within 14 days means writing about a covered topic. Pick a different topic or a different angle that doesn't lean on this URL.
  - Inline-link diversity check failed: "https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-20/" appears 4/8 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 1
slug: hcl-nomad-web-1-0-20-release
-->

HCL Nomad Web 1.0.20 已於近期正式發布，該版本帶來了多項安全修復和功能增強，建議所有用戶盡快升級以確保系統安全性和穩定性。

## 主要更新內容

- **安全修復**：
  - 修復了 zlib 中的拒絕服務（DoS）漏洞（CVE-2026-27171），該漏洞可能導致系統崩潰或無法正常運行。詳細資訊請參閱 [安全公告](https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-20/)。
  - 修復了 libpng、yaml 和 Lodash 中的已知安全漏洞，進一步提升了系統的安全性。

- **功能增強**：
  - 改善了灰色表單和表格單元格背景的渲染問題，確保界面顯示的一致性和美觀性。
  - 針對與 Domino 14.5.1 版本搭配使用時，啟用 OIDC 後台登出功能時可能出現的 Nomad 伺服器啟動崩潰問題進行了修復。

## 升級建議

考慮到本次更新中包含的多項安全修復和功能增強，建議所有使用 HCL Nomad Web 的用戶盡快升級至 1.0.20 版本，以確保系統的安全性和穩定性。詳細的升級指南和注意事項可參閱 [HCL Nomad 官方文件](https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf)。

## 相關資源

- [HCL Nomad Web 1.0.20 發布資訊](https://www.panagenda.com/blog/customer-information-for-hcl-nomad-web-1-0-20/)
- [HCL Nomad 官方文件](https://help.hcl-software.com/nomad/1.0_web/PDF/nomad_web.pdf)

請確保在升級前備份相關數據，並在升級後進行必要的測試，以確保系統正常運行。
