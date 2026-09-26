---
slug: formula-command-postedcommand
title: "@Command vs @PostedCommand 執行順序"
lang: [zh-TW, en]
pubDate: 2026-09-29
status: staged（_pending，排 2026-09-29，Path A；批次 #2）
tags: [Formula, Notes UI]
requester: 使用者（跨語言批次 9/28–10/05；Formula 缺口）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。總規則/兩定義/emulates R3/「first statement executed last」全 verbatim、deferred vs immediate 六個命令歸類全對、EditDocument 例正確（非 deferred）、跨語言準。修：①引用標籤補「all」→「Evaluated after all @functions」；②deferred 對照表在 @Command 參考頁（source #3）→ 正文兩處 inline 連它（順補足第 3 外連 diversity）。
created: 2026-09-29
updated: 2026-09-29
---

# 研究軌跡 — formula-command-postedcommand

Formula 執行順序 deep-dive。批次 #2。

## 標題候選（自決 — [[feedback_title_self_decide]]）

- [選定] 問題先行+好搜：`@Command vs @PostedCommand：為什麼你的公式沒照順序跑`
  en 鏡像：`@Command vs @PostedCommand: Why Your Formula Doesn't Run in the Order You Wrote It`
- [汰除] 中性：`@Command 與 @PostedCommand 的執行順序` — 準但無 hook。
- [汰除] 概念：`寫在最前面卻最後跑：@PostedCommand 的排程` — 有記點但搜尋度略差。

## 研究（第一手官方 doc）

- **Order of evaluation**（[12.0.2](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_ORDER_OF_EVALUATION_FOR_FORMULA_STATEMENTS.html)）：總規則 verbatim（beginning to end, left to right … except @PostedCommand and a few @Command …）+「The first statement is executed last」例。
- **Working with @commands**（[12.0.2](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_WORKING_WITH_COMMANDS.html)）：@Command / @PostedCommand 定義 verbatim + emulates R3 + deferred vs immediate 命令對照表（EditClear/FileExit/NavigateNext vs Clear/ExitNotes/NavNext）。
- **@Command reference**（[9.0.1](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html)）：第三個外連。
- 未跑 NotebookLM（Formula 執行順序是語言規則、官方頁逐字足；本 session 卡登入）。

## 查證 checklist

- [x] 總規則、兩定義、emulates R3 對官方 verbatim
- [x] deferred vs immediate 命令對照表名稱歸類正確
- [x] 「寫最前跑最後」例 + @Command/@Prompt 前後例
- [x] 跨語言：LS NotesUIWorkspace（無 defer 語意）、SSJS/XPages 無 @Command
- [x] TYPE 留白（Formula/Notes UI；語言規則+範例，非 build-along tutorial）
- [x] inline-link diversity：3 相異官方外部
- [x] 雙語 temp-build
- [ ] fact-check（跑中）

## 異動日誌

- 2026-09-29 批次 #2；WebFetch order-of-eval + working-with-commands；雙語 hook+TL;DR；標題自決；temp-build；stage 排 9/29。（Opus 4.8）
