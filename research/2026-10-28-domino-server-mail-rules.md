---
slug: domino-server-mail-rules
title: "伺服器 mail rules:在哪設、MAIL.BOX 時跑、六動作、不通知/非防毒"
lang: [zh-TW, en]
pubDate: 2026-10-28
status: Path A staged（_pending，排 2026-10-28＝今天）→ 與 10/27 一起手動 publish-pending 促發當天上線
tags: [Domino Server, Admin]（TYPE 留白）
requester: 使用者「寫27~11/2的文」；郵件管理 cluster 第 2 篇;接 10/20(MAIL.BOX/HOLD)、前接 10/29 journaling(Journal 動作)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check）+ humanizer-zh-tw（自審）
created: 2026-10-28
updated: 2026-10-28
---

# 研究軌跡 — domino-server-mail-rules

郵件管理 cluster 第 2 篇。grep 確認 mail rule 只 1 命中(順帶提)。與 10/20 緊扣(HOLD=held mail 來源之一)、與 10/29 緊扣(Journal 動作)。

## 核心（官方 WebFetch 14.5.0）

- Configuration Settings → Router/SMTP → Restrictions and Controls → Rules;存在 Config Settings 文件。
- 時機:MAIL.BOX 沉積時評估、「Each message is evaluated only once」逐字;set rules 或約 5 分 reload。vs client 規則(信箱內、信進後)。
- conditions:item(Sender/Subject/Body/附件名/Size)+運算子(contains/does not contain/is/is not/is less than/is greater than);AND/OR;一條件一例外;無萬用字元「Text fields do not support wildcard values」逐字;不分大小寫;數值用數字。
- actions(一 rule 一 action):Journal(複製到 journaling DB、繼續投遞)、Move to database(搬去已存在的庫隔離)、Don't accept(拒收、無失敗報告)、Don't deliver(靜默刪 或 NDR)、Change routing state=HOLD(留 MAIL.BOX)、Stop processing。
- 不通知「Domino does not notify the sender or recipient...」逐字;非防毒「Mail rules are not intended to serve as an anti-virus solution」逐字。

## 措辭守則

- 動作六個名稱照官方;Don't accept vs Don't deliver 別混(前者拒收無報告、後者收下不投可選靜默刪/NDR)。
- HOLD 連回 10/20 held mail(mail rule 是來源之一)。
- journaling 要另外在 Advanced→Journaling 開——Journal 動作不等於自動開 journaling。
- 「不是防毒」照官方寫,別淡化。

## 站上互連

- 連 10/20 mail 路由（HOLD/held mail）。
- 前接 10/29 journaling（Journal 動作、journaling 要另外開）。

## 標題候選

- [選定] 一句賣點:`Domino 伺服器 mail rules:信進信箱前就先攔下來`
  en：`Domino Server Mail Rules: Catching Mail Before It Reaches the Inbox`

## 查證 checklist

- [x] 在哪設、存 Config Settings 文件
- [x] MAIL.BOX 時評估、每封一次（逐字）、set rules reload、vs client 規則
- [x] conditions 運算子、無萬用字元（逐字）、AND/OR、例外、不分大小寫
- [x] 六動作名稱與語意
- [x] 不通知（逐字）
- [x] 非防毒（逐字）
- [x] inline-link diversity：3 相異官方 URL 各 33%（初稿 2、已補 delivery-controls）
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審;標題精簡
- [x] fact-check（獨立 subagent）→ **六條全對、逐字驗證、零錯誤**。命中:規則存 Config Settings 文件、「Whenever MAIL.BOX receives a new message」評估、「Each message is evaluated only once」、約 5 分 reload＋`set rules`、運算子＋「Text fields do not support wildcard values」＋「Search string text is not case sensitive」＋數值用數字、六動作名稱語意、「Domino does not notify the sender or recipient...」、「Mail rules are not intended to serve as an anti-virus solution」。兩個非錯誤註記:①「vs client 規則」對比正確、但該對比我本就掛在 client-rules 頁(非 server 頁)✓;②「不通知」是預設、例外有 Send NDR 與 SMTP permanent error,本文已框「預設＋除非動作本身會回(Don't deliver 選 NDR)」✓。無需改內容。

## NotebookLM 說明

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據（fallback、已揭露）。

## 異動日誌

- 2026-10-28 新建（排當天）。郵件管理 cluster 第 2 篇;官方 14.5.0 頁為據;連 10/20、前接 10/29;humanizer 自審;Path A staged＋需手動 publish-pending。（Opus 4.8）
