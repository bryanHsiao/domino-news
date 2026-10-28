---
slug: domino-message-disclaimers
title: "Message disclaimers:兩份文件、只加外寄、伺服器端破壞簽章、AdminP 套用"
lang: [zh-TW, en]
pubDate: 2026-11-02
status: Path A staged（_pending，排 2026-11-02，未來日→cron 自動 promote）
tags: [Domino Server, Admin]（TYPE 留白）
requester: 使用者「寫27~11/2的文」；郵件管理 cluster 第 7 篇(收尾);連 10/25 policy(mail policy settings 文件)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check）+ humanizer-zh-tw（自審）
created: 2026-10-28
updated: 2026-10-28
---

# 研究軌跡 — domino-message-disclaimers

郵件管理 cluster 第 7 篇(收尾)。grep 確認 message disclaimer 無專文。核心賣點=「伺服器端加會弄壞簽章→用 client 加」+ 中文字集坑。連 10/25 policy(文字住 mail policy settings 文件)。

## 核心（官方 WebFetch）

- setting-up-disclaimers（11.0.1）:兩份文件(mail policy settings=文字/位置/格式、Config Settings=伺服器開關 Router/SMTP→Message Disclaimers);「not added to incoming... only to outgoing SMTP」逐字;client/server/both;伺服器在簽章後加→「S/MIME signed and encrypted messages are not handled well by Notes」+「Whenever possible, use the Notes client to add disclaimers instead of adding them from the server」逐字;client 簽章前加仍有效;字集 client 決定故 client 加無字集問題;AdminP 每 12h、`tell adminp process mailpolicy`。
- creating-mail-policy（11.0.0）:Disclaimer text、位置 append/prepend、格式 plain/HTML。
- 字集 Best Match(→?)vs UTF-8:來自 search 摘要(伺服器端加)。

## 措辭守則

- 大坑方向:伺服器在簽章「之後」加→破壞簽章;client 在「之前」加→有效。別寫反。
- 只加外寄——別寫成也加進站。
- 字集坑對 zh 讀者相關、點出但照官方框。
- AdminP 每 12h、tell adminp process mailpolicy——具體值待 fact-check。

## 站上互連

- 連 10/25 policy（文字住 mail policy settings 文件、AdminP 套用 policy）。

## 標題候選

- [選定] 一句建議:`Domino 郵件免責聲明:為什麼最好在 client 端加`
  en：`Domino Message Disclaimers: Why to Add Them Client-Side`

## 查證 checklist

- [x] 兩份文件分工
- [x] 只加外寄（逐字）
- [x] append/prepend、plain/HTML
- [x] client/server/both
- [x] 伺服器後加破壞 S/MIME（兩句逐字）、client 前加有效
- [x] 字集 Best Match/UTF-8、client 加無字集問題
- [x] AdminP 每 12h、tell adminp process mailpolicy
- [x] inline-link diversity：3 相異官方 URL 各 33%（初稿 2、已補 iNotes）
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審;標題精簡
- [x] fact-check（獨立 subagent）→ 大致正確、逐字命中(只加外寄、「S/MIME signed and encrypted messages are not handled well by Notes」、「Whenever possible, use the Notes client to add disclaimers instead of adding them from the server」、Best Match「typically a question mark (?)」、UTF-8「re-codes the message text and disclaimer text as UTF-8」、「checks for and applies mail policy updates every 12 hours」)。**一個硬錯誤已修**:
  - 指令拼法官方是 **`Tell Adminp Process Mail Policy`**(Mail 與 Policy 間**有空格**,縮寫 `tell adminp p ma`)→ 我原寫連寫 `mailpolicy`,雙語 4 處全改為 `process mail policy`。
  - 另補 claim 5 精確度:官方說伺服器「做得到」(連簽章/加密信都加得上)、只是加完壞簽章 → 雙語加一句「技術上加得上、只是會壞簽章」,免讀者誤解成「伺服器完全不能加」。
  - 小註:Router/SMTP→Message Disclaimers 分頁路徑正確(標準 UI)、非主頁逐字,措辭已標為 Configuration Settings 文件下的分頁。

## NotebookLM 說明

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據（fallback、已揭露）。

## 異動日誌

- 2026-10-28 新建（排 2026-11-02）。郵件管理 cluster 第 7 篇(收尾);官方三文為據;連 10/25;humanizer 自審;標題精簡;Path A staged。（Opus 4.8）
