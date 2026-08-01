---
slug: java-dql-dominoquery
title: "Running DQL from Java: DominoQuery and QueryResultsProcessor"
lang: [zh-TW, en]
pubDate: 2026-08-09
status: staged                     # staged（_pending）→ shipped（promoted）
tags: [Java, DQL]
requester: 使用者 (bryan)          # 誰提出這篇
author_model: claude-opus-4-8      # 寫作模型
review_model: claude-sonnet (獨立 reviewer subagent)  # 審查模型（獨立於寫作）
review_result: "humanizer 45/50；獨立事實查核(Sonnet) ISSUES→已修（TimeoutSec→TimeoutSecs）"
created: 2026-08-02
updated: 2026-08-02
---

# 研究軌跡 — java-dql-dominoquery

Java 系列第三篇（接 [`java-session-notesfactory`](2026-08-08-java-session-notesfactory.md)），
回扣站上的 DQL 三部曲。

## 研究來源 (Research trail)

### NotebookLM — ⚠️ 對話污染，未採用
- Notebook：Java back-end API，
  `https://notebook.google.com/notebook/99039350-51ae-4d0c-b79b-8d922e29697b`
- 症狀：本 session 第 3 題（問 DominoQuery/DQL），notebook 回的卻是第 2 題
  （Session/NotesFactory）的答案——典型「問 X 答 Y」的 chat-history 污染
  （見 CLAUDE.md「Chat-history pollution」）。
- 處置：**依規矩退回 WebFetch**，並向使用者回報；清對話記錄是不可逆動作、
  需使用者授權，未自行執行。

### WebFetch — 本篇主要 grounding（逐一驗證非 404 + 可引用原文）
- `H_DOMINOQUERY_CLASS_JAVA.html`（14.5.1）— ✅ 存在。可引用原文："A Java class
  to compile, tune, and run Domino Query Language (DQL) queries."；取得
  `db.createDominoQuery()`（從 **Database** 非 Session）、`parse()`/`execute()`、
  控制屬性與預設（MaxScanDocs 500,000／MaxScanEntries 200,000／TimeoutSecs 300／NoViews）。
- `H_QUERYRESULTSPROCESSOR_CLASS_JAVA.html`（14.5.1）— ✅ 存在。可引用原文：
  "Aggregates, computes, sorts, and formats collections of documents across any
  set of Domino databases."；`db.createQueryResultsProcessor()`、addDominoQuery/
  addCollection/addColumn/addFormula/executeToJSON/executeToView。
- `H_RECYCLE_METHOD_JAVA.html`（14.5.1）— ✅ 存在（結果集 recycle 的 inline 來源）。
- 背景：站上 DQL 三部曲（dql-getting-started / dql-pitfalls / dql-production）提供
  DQL 語言側的既有實測知識。

### WebFetch 當場擋下的假設
作者原問句假設 `session.createDominoQuery()`；WebFetch 確認**是 `Database`** 的方法，
已在文中更正。這是 NotebookLM 污染時、WebFetch 交叉驗證的價值。

## 獨立審查 (review)

**審查模型**：Claude Sonnet（獨立 reviewer subagent，與寫作模型 Opus 4.8 分開），
重新 WebFetch 三份官方文件並特別盯易錯的方法/屬性名與回傳型別。

**VERDICT：ISSUES → 已修**：

- ✅ **`TimeoutSec` → `TimeoutSecs`**（修正）：`DominoQuery` 的屬性是複數 `TimeoutSecs`
  （`getTimeoutSecs`/`setTimeoutSecs`）。TL;DR 與調校表已改。預設值 300 正確。
  reviewer 另指出一個真實陷阱：**同篇兩個類別命名不一致**——`DominoQuery` 用複數
  `TimeoutSecs`，`QueryResultsProcessor` 卻用單數 `setTimeoutSec`；文末 QRP 那句寫
  `setTimeoutSec()` **是對的**，保留。
- ✅ 其餘全 PASS：從 Database 取得（非 Session）兩者皆確認；兩句引用逐字無誤；
  `execute()` 回傳 `DocumentCollection`（reviewer 另查 `H_EXECUTE_METHOD_JAVA.html`
  確認）；`createQueryResultsProcessor`（非 `createQueryProcessor`）正確；
  MaxScanDocs/MaxScanEntries/NoViews 名稱與預設正確；程式碼範例正確且慣用。

（本篇因 NotebookLM 污染改採 WebFetch，獨立審查抓到 `TimeoutSecs` 這種細節、
正是雙重把關的意義。）

## 查證 checklist
- [x] 研究鏈：NotebookLM 污染 → **WebFetch fallback**（已回報使用者、未擅自清 chat）
- [x] 三個 inline 官方 URL 逐一 WebFetch 驗證非 404
- [x] WebFetch 擋下 session vs Database 的假設錯誤
- [x] inline-link diversity 通過（各語言 3 個相異 URL 各 1 次 = 33%）
- [x] 雙語 build 通過（frontmatter schema 驗證）
- [x] humanizer-zh-tw 正式 pass（雙語 45/50；收斂 reveal 破折號 zh2/en3）
- [x] 獨立事實查核完成（Sonnet reviewer，ISSUES→已修）

## 異動日誌
- 2026-08-02 建檔、WebFetch 研究（NotebookLM 污染 fallback）、雙語草稿、sidecar（Opus 4.8）
- 2026-08-02 humanizer-zh-tw 正式 pass（雙語 45/50，Opus 4.8）
- 2026-08-02 獨立事實查核（Sonnet reviewer）→ 修 TimeoutSecs（Opus 4.8）
- 2026-08-02 進 `_pending`（Path A，pubDate 2026-08-09）
