---
title: "OpenNTF 發布 NSF ODP Tooling 4.1.0 版"
description: "OpenNTF 於 2026 年 3 月 28 日發布了 NSF ODP Tooling 4.1.0 版，該版本改進了 JavaSourceClassLoader 的效能，並降低了部分日誌訊息的層級。"
pubDate: "2026-06-27T11:45:02+08:00"
lang: "zh-TW"
slug: "openntf-nsf-odp-tooling-4-1-0"
tags:
  - "Domino Designer"
  - "LotusScript"
  - "Admin"
  - "Release Notes"
sources:
  - title: "OpenNTF.org - NSF ODP Tooling 4.1.0 Release"
    url: "https://openntf.org/main.nsf/project.xsp?r=project%2FNSF+ODP+Tooling%2Freleases%2FD1AE627FE95698F786258B0B0056CACD"
  - title: "OpenNTF.org - NSF ODP Tooling Project"
    url: "https://openntf.org/main.nsf/project.xsp?r=project%2FNSF+ODP+Tooling%2Fsummary"
cover: "/covers/openntf-nsf-odp-tooling-4-1-0.webp"
coverStyle: "low-poly-3d"
---
OpenNTF 於 2026 年 3 月 28 日發布了 NSF ODP Tooling 4.1.0 版，該工具旨在增強 HCL Domino 開發者的開發體驗。

## 主要更新

- **JavaSourceClassLoader 的改進**：此版本修改了 JavaSourceClassLoader，使用 ConcurrentHashMaps 以提升效能，解決了 [Issue #319](https://github.com/OpenNTF/org.openntf.nsfodp/pull/321)。

- **日誌訊息層級調整**：降低了 NSFODPContainer 中多個 INFO 級別的日誌訊息至 DEBUG 級別，解決了 [Issue #320](https://github.com/OpenNTF/org.openntf.nsfodp/pull/322)。

## 下載與更多資訊

開發者可從 [OpenNTF 官方網站](https://openntf.org/main.nsf/project.xsp?r=project%2FNSF+ODP+Tooling%2Freleases%2FD1AE627FE95698F786258B0B0056CACD)下載 NSF ODP Tooling 4.1.0 版，並查看完整的變更日誌。

NSF ODP Tooling 是一個開源項目，旨在為 HCL Domino 開發者提供更高效的開發工具。更多關於該項目的資訊，請參閱 [NSF ODP Tooling 項目頁面](https://openntf.org/main.nsf/project.xsp?r=project%2FNSF+ODP+Tooling%2Fsummary)。
