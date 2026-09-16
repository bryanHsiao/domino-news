---
slug: domino-updall-fixup-compact
title: "updall / fixup / compact 該跑哪個"
lang: [zh-TW, en]
pubDate: 2026-09-18
status: staged（_pending）
tags: [Domino Server, Admin]
requester: 使用者 (bryan，9/17–9/22 六篇批次；候選 2)
author_model: claude-opus-4-8
review_model: (待批次 fact-check)
created: 2026-09-16
updated: 2026-09-16
---

# 研究軌跡 — domino-updall-fixup-compact

9/18（第 2 篇）。coverage：無專篇（三詞只在 DQL/rich-text 等順帶提到，無維護指令專篇）。按「症狀→工具」組織 + 官方損毀升級順序。TYPE 留白。

## 研究鏈（WebFetch 第一手）

- **Fixing corrupted databases**（[12.0.0 doc](https://help.hcl-software.com/domino/12.0.0/admin/admn_fixingcorrupteddatabases_r.html)）逐字升級順序：
  「Run Updall to fix corrupted views and full-text indexes; if a corrupted view is the problem, try Updall before trying Fixup.」／
  「Run Fixup to fix corrupted views and documents.」／「Run Compact with the -c option to fix corruption problems that Fixup doesn't correct.」／
  「primarily used for solving corruption problems in unlogged databases」（transaction logging 讓損毀變少）。
- updall/fixup 參數頁（[updall options](https://help.hcl-software.com/domino/11.0.1/admin/admn_updalloptions_r.html)、[fixup options](https://help.hcl-software.com/domino/12.0.0/admin/admn_fixupoptions_r.html)）：`-r`/`-f`/`-j` 依情況；細節保守描述。
- Program document 排程頁。
- 本職分工（updall=索引、fixup=修損毀、compact=收空間 -B in-place/-c copy-style）為通識 + 官方語意；Shift+F9/Ctrl+Shift+F9 為用戶端重建 view。
- 交叉連 [[domino-console-troubleshooting]]。

## 查證 checklist

- [x] 官方升級順序逐字（updall→fixup→compact -c）+ unlogged 註記
- [x] fixup「可能丟文件、優先備份」立場（官方 fixup 語意，保守陳述）
- [x] compact -B/-c 差異描述保守（-c 需暫存副本、可做結構改動/開功能）
- [x] inline-link diversity：4 相異官方 URL + 內部連結
- [ ] 雙語 build 驗證
- [ ] 批次 fact-check（與 9/17、9/19 併）

## 異動日誌

- 2026-09-16 WebFetch 驗損毀升級順序、雙語按症狀組織、sidecar；stage _pending 排 9/18（Opus 4.8）
