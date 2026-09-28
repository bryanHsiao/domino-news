---
slug: ssjs-session-evaluate-formula
title: "SSJS session.evaluate 跑 @Formula"
lang: [zh-TW, en]
pubDate: 2026-10-05
status: staged（_pending，排 2026-10-05，Path A；批次 #8／最後一篇）
tags: [SSJS, Formula, XPages]
requester: 使用者（跨語言批次 9/28–10/05 收尾；SSJS 跑 Formula）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS（零 issue）。兩 signature/Vector/firstElement/2-param/UI @functions 13 個清單/「不能改文件+replaceItemValue」全 verbatim、SSJS 原生 @functions 適度 hedge、code 有效、跨語言（LS Evaluate 同語意）準。
created: 2026-10-05
updated: 2026-10-05
---

# 研究軌跡 — ssjs-session-evaluate-formula

SSJS 跑 @Formula deep-dive。批次 #8（收尾）。

## 標題候選（自決 — [[feedback_title_self_decide]]）

- [選定] 主題+痛點好搜：`從 SSJS 跑 @Formula：session.evaluate 的回傳、限制，與「不能改文件」這件事`
  en 鏡像：`Running @Formula from SSJS: session.evaluate — Its Vector Return, Limits, and Why It Can't Change a Document`
- [汰除] 中性：`在 SSJS 使用 session.evaluate` — 無 hook。
- [汰除] 問題先行：`為什麼 session.evaluate 沒改到我的文件？` — 只切一面。

## 研究（第一手官方 doc）

- **evaluate (Session-Java)**（[14.0.0](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_EVALUATE_METHOD_JAVA.html)）：兩 signature、Vector/firstElement、2-param 帶 doc、UI @functions 清單、「cannot change a document... replaceItemValue」verbatim。
- **Global objects and functions**（[14.0.0](https://help.hcl-software.com/dom_designer/14.0.0/reference/r_wpdr_globals_r.html)）+ **Server-side scripting**（[12.0.0](https://help.hcl-software.com/dom_designer/12.0.0/xpageuser/wpd_scripts_server.html)）：SSJS 原生 @functions（輕描,不列窮舉清單以免過度宣稱）。
- 內部交叉連 [[lotusscript-evaluate]]、[[formula-prompt-picklist]]、[[formula-command-postedcommand]]。
- 未跑 NotebookLM（SSJS API + Formula 語意，官方 evaluate 頁逐字足；本 session 卡登入）。

## 查證 checklist

- [x] 兩 signature、Vector/firstElement、2-param 對官方 verbatim
- [x] UI @functions 清單、「不能改文件+replaceItemValue」verbatim
- [x] SSJS 原生 @functions 輕描不窮舉（避免過度宣稱）
- [x] code 有效（.firstElement()/getDocument()/replaceItemValue）
- [x] 跨語言：LS Evaluate 同語意、Java 就是 session.evaluate
- [x] TYPE：SSJS/Formula/XPages（橋接）
- [x] inline-link diversity：3 相異官方外部 + 內部交叉連
- [x] 雙語 temp-build
- [ ] fact-check（跑中）

## 異動日誌

- 2026-10-05 批次 #8（末）；WebFetch evaluate doc；雙語 hook+TL;DR；標題自決；temp-build；stage 排 10/05。（Opus 4.8）
