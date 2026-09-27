---
slug: formula-prompt-picklist
title: "Formula @Prompt / @PickList 對話框"
lang: [zh-TW, en]
pubDate: 2026-10-02
status: staged（_pending，排 2026-10-02，Path A；批次 #5）
tags: [Formula, Notes UI]
requester: 使用者（跨語言批次 9/28–10/05；Formula 缺口）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。@Prompt/@PickList purpose/樣式/回傳/client-only 限制全 verbatim、兩段 code 有效、跨語言準。修 1 minor：[Ok] 回傳「—」→「1」；順修 nit [LocalBrowse]「路徑」→「選中的檔名」。([OkCancelEdit] 254 字上限省略、nit 不動)
created: 2026-10-02
updated: 2026-10-02
---

# 研究軌跡 — formula-prompt-picklist

Formula UI 對話框 deep-dive。批次 #5。

## 標題候選（自決 — [[feedback_title_self_decide]]）

- [選定] 功能+邊界好搜：`@Prompt 與 @PickList：用 Formula 跳對話框問使用者（只在 client、上不了 web）`
  en 鏡像：`@Prompt and @PickList: Formula Dialogs to Ask the User — Client-Only, Not on the Web`
- [汰除] 中性：`Formula 的對話框函式：@Prompt 與 @PickList` — 無 hook。
- [汰除] 問題先行：`為什麼我的 @Prompt 在 web 上沒反應？` — 只切到 client-only 一面。

## 研究（第一手官方 doc）

- **@Prompt**（[12.0.2](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PROMPT.html)）：purpose、syntax、樣式清單與回傳、client-only + 不能用在 column/selection/mail/scheduled agent，verbatim。
- **@PickList**（[12.0.2](https://help.hcl-software.com/dom_designer/12.0.2/basic/H_PICKLIST.html)）：purpose、[CUSTOM]/[NAME]/[SINGLE] 語法、回傳欄值文字清單、cannot use in Web，verbatim。
- **@Command**（[9.0.1](https://help.hcl-software.com/dom_designer/9.0.1/appdev/H_COMMAND.html)）：第 3 外連（對話框後接 UI 動作）。
- 內部交叉連 [[formula-command-postedcommand]]。
- 未跑 NotebookLM（Formula 函式，官方頁逐字足；本 session 卡登入）。

## 查證 checklist

- [x] @Prompt purpose/樣式/回傳/限制 對官方 verbatim
- [x] @PickList purpose/語法/回傳/限制 對官方 verbatim
- [x] 兩段 code 語法有效
- [x] 跨語言：LS NotesUIWorkspace Prompt/PickList*/DialogBox、SSJS 無
- [x] TYPE 留白（Formula/Notes UI；函式 reference+範例）
- [x] inline-link diversity：3 相異官方外部 + 內部連
- [x] 雙語 temp-build
- [ ] fact-check（跑中）

## 異動日誌

- 2026-10-02 批次 #5；WebFetch @Prompt+@PickList；雙語 hook+TL;DR；標題自決；temp-build；stage 排 10/02。（Opus 4.8）
