---
slug: domino-readviewentries-count-regression
title: "分類視圖 &Count regression / DISABLE_REFIND_IN_READENTRIES"
lang: [zh-TW, en]
pubDate: 2026-10-06
status: staged（_pending，排 2026-10-06，Path A）
tags: [Domino Server, Admin]
requester: 使用者（貼 KB 段落 + 給 KB0113007 編號與症狀「分類視圖 &count 項目數不對」，要寫成文件）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS（無 BLOCKER、無 grounding 過度宣稱）。?ReadViewEntries/Count/Start 對官方 verbatim、與 FoCul「空類別」bug 明確區隔、SPR/FP3+14.0/workaround 正確歸給 gated KB0113007（非公開驗證）、refind 為機制解釋非引用。修 2：①Count 那句去 blockquote 改 paraphrase（原輕微改寫卻擺 verbatim）；②FoCul 那個 bug 由「XPages/Nomad Web」改回「Nomad Web」（FoCul 頁是 Nomad Web 1.07；XPages 相似的是 KB0102504、另註）。
created: 2026-10-06
updated: 2026-10-06
---

# 研究軌跡 — domino-readviewentries-count-regression

admin/troubleshooting「已知問題 + workaround」型。

## 標題候選（自決 — [[feedback_title_self_decide]]）

- [選定] 症狀+關鍵字好搜：`分類視圖用 &Count 讀出來的項目數不對？12.0.2 的 ReadViewEntries regression 與 DISABLE_REFIND_IN_READENTRIES`
  en 鏡像：`Wrong Entry Count from &Count on a Categorized View? The 12.0.2 ReadViewEntries Regression and DISABLE_REFIND_IN_READENTRIES`
- [汰除] 參數先行：`DISABLE_REFIND_IN_READENTRIES 是什麼、什麼時候該加` — 好搜但少了症狀 hook。
- [汰除] 中性：`Domino 12.0.2 的分類視圖讀取 regression` — 無 hook。

## 來源與 grounding（重要：主源 gated）

- **KB0113007**（[HCL 客戶支援](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0113007)）：**登入 gated、公開打不開**（無 auth 回「Knowledge record not found」）。SPR# MNIACMGKUV、由修 PJONB7GRUL 引入、workaround `DISABLE_REFIND_IN_READENTRIES=1`、修於 12.0.2 FP3 / 14.0——**這些由使用者提供（他是 Domino 顧問、手上有 KB）**，我沒能獨立開該頁核對；文中已把這些明確歸給 KB0113007、不冒充公開文件驗證。
- **機制（已獨立驗證）**：`?ReadViewEntries` + `Count=n`——官方 [URL commands](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_ABOUT_URL_COMMANDS_FOR_OPENING_SERVERS_DATABASES_AND_VIEWS.html)「Count=n where n is the number of rows to display」、Start 支援分類視圖 subindex（3.5.1）；APAR LO57600 亦佐證 `?ReadViewEntries&Count=` 存在。
- **相似但不同的 bug（已驗）**：[FoCul](https://www.focul.net/categorised-view-problem-in-domino-nomad-web-1-07/)——分類視圖「空類別」（XPages/Nomad Web），`DISABLE_REFIND_IN_READENTRIES=1`「did not work」、相關修於 12.0.2 FP1（KB0102504/KB0101979）。文中明確區隔、不與 KB0113007 混談（呼應 [[feedback_no_vague_community_consensus]]）。
- 「refind」= ReadEntries 讀取時「重新定位 entry」的步驟——由參數名 + KB 推得的機制解釋，非官方逐字。未跑 NotebookLM（notes.ini regression、無 notebook 域）。

## 查證 checklist

- [x] ?ReadViewEntries / Count / Start 機制對官方 verbatim
- [x] SPR/workaround/FP3+14.0 明確歸 KB0113007（gated、非公開驗證）
- [x] 與 FoCul「空類別」bug 明確區隔、參數在該 bug 無效
- [x] DISABLE_REFIND_IN_READENTRIES=1＝伺服端 notes.ini + 重啟、標為 stopgap（正解升版）
- [x] 「refind」機制標為解釋非引用
- [x] TYPE 留白（admin/troubleshooting）；tags Domino Server + Admin
- [x] inline-link diversity：3 相異外部（URL commands / KB0113007 / FoCul）
- [x] 雙語 temp-build
- [ ] fact-check（跑中）

## 異動日誌

- 2026-10-06 使用者提供 KB0113007 + 症狀；WebFetch URL-commands + FoCul；雙語成稿（症狀→機制→暫解/正解→區隔相似 bug）；標題自決；temp-build；stage 排 10/06。（Opus 4.8）
