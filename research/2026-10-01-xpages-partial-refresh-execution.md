---
slug: xpages-partial-refresh-execution
title: "XPages JSF 六階段 / partial refresh vs execution"
lang: [zh-TW, en]
pubDate: 2026-10-01
status: staged（_pending，排 2026-10-01，Path A；批次 #4）
tags: [XPages, SSJS, Performance]
requester: 使用者（跨語言批次 9/28–10/05；SSJS/XPages 缺口）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。execMode/refreshMode 定義 verbatim、六階段名稱與順序正確、SSJS 在 phase 5、驗證失敗跳 phase 6、partial refresh/execution 歸屬正確、Withers 為 paraphrase 非偽引用。修 1 minor：refreshId/execId 的 default 規則 3 來源未載→改成只講「要鎖定特定元件就在原始碼設」。nit（immediate=false 讓 SSJS 早跑的 edge case 略）不動。
created: 2026-10-01
updated: 2026-10-01
---

# 研究軌跡 — xpages-partial-refresh-execution

XPages JSF lifecycle deep-dive。批次 #4。

## 標題候選（自決 — [[feedback_title_self_decide]]）

- [選定] 對比+痛點好搜：`partial refresh vs partial execution：XPages 的 JSF 六階段，為什麼只刷一塊卻整頁重算`
  en 鏡像：`partial refresh vs partial execution: the XPages JSF Lifecycle, and Why Refreshing One Area Still Recomputes the Whole Page`
- [汰除] 問題先行：`為什麼按一個按鈕、不相干欄位卻擋我？` — 生動但不夠好搜。
- [汰除] 中性：`XPages 的 JSF 生命週期與局部更新` — 準但無 hook。

## 研究（官方定義 + Intec lifecycle）

- **execMode**（[HCL 11.0.0](https://help.hcl-software.com/dom_designer/11.0.0/xpage_user_guide/builds/wpd_controls_pref_execmode.html)）：partial execution 定義 verbatim。
- **refreshMode**（[HCL 11.0.0](https://help.hcl-software.com/dom_designer/11.0.0/xpage_user_guide/builds/wpd_controls_pref_refreshmode.html)）：partial refresh 定義 verbatim。
- **Intec JSF lifecycle Part 3**（Paul Withers）：六階段細節、execMode 影響 phase 2、驗證失敗跳 phase 6、refreshId 不影響 server 處理。
- 六階段是 JSF 規範既有；execMode/execId server 端、refreshMode/refreshId client 端、兩者獨立。
- 未跑 NotebookLM（XPages/JSF 平台行為，官方 control 定義 + Intec 足；本 session 卡登入）。

## 查證 checklist

- [x] execMode/refreshMode 定義對官方 verbatim
- [x] 六階段名稱與順序正確、SSJS 在 phase 5、驗證失敗跳 phase 6
- [x] partial refresh 只影響 client、partial execution 縮 server phase 2-5，歸屬正確（HCL 定義 / Withers 行為）
- [x] refreshId/execId 預設圈 eventHandler 所在元件、execId 外的值回上次狀態
- [x] 跨語言：LS/Java agent 無 lifecycle、SSJS 在 phase 5
- [x] TYPE：XPages/SSJS/Performance（partial execution＝效能）
- [x] inline-link diversity：3 相異外部（execMode / refreshMode / Intec）+ 內部 scope 連
- [x] 雙語 temp-build
- [ ] fact-check（跑中）

## 異動日誌

- 2026-10-01 批次 #4；WebSearch→WebFetch execMode+refreshMode+Intec；雙語 hook+TL;DR；標題自決；temp-build；stage 排 10/01。（Opus 4.8）
