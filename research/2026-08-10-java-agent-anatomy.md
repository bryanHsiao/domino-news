---
slug: java-agent-anatomy
title: "Anatomy of a Java Agent: Triggers, Rights, Output, Debugging"
lang: [zh-TW, en]
pubDate: 2026-08-10
status: staged                     # staged（_pending）→ shipped（promoted）
tags: [Java]
requester: 使用者 (bryan)          # 誰提出這篇
author_model: claude-opus-4-8      # 寫作模型
review_model: claude-sonnet (獨立 reviewer subagent)  # 審查模型（獨立於寫作）
review_result: "humanizer 45/50；獨立事實查核(Sonnet) ISSUES→已修（getUnprocessedDocuments 引號）"
created: 2026-08-02
updated: 2026-08-02
---

# 研究軌跡 — java-agent-anatomy

Java 系列第四篇（接 [`java-dql-dominoquery`](2026-08-09-java-dql-dominoquery.md)）。
**本篇同時是「NotebookLM 對話污染清除」的有效性驗證。**

## 研究來源 (Research trail)

### NotebookLM — ✅ 有回答（且驗證清理有效）
- Notebook：Java back-end API，
  `https://notebook.google.com/notebook/99039350-51ae-4d0c-b79b-8d922e29697b`
- 日期：2026-08-02（在清除對話記錄之後）
- 問句：如何建立/部署/執行 Java agent（Designer 建/匯入、Trigger 與 target、
  AgentContext 的 getUnprocessedDocuments/updateProcessedDoc/getSavedData 等、
  簽章者權限與 restricted/unrestricted、System.out→log、debug、完整範例）。
- **清理驗證**：這題主題（agent 營運）與前三題（recycle/Session/DQL）完全不同；
  notebook 回的是**正確主題**的答案（agent signer、getUnprocessedDocuments/
  updateProcessedDoc、System.out→log.nsf、getSavedData、範例），**沒有**殘留前題
  內容 → 確認 2026-08-02 清除對話記錄**有效**（見 [[reference_notebooklm_repair]]）。
- notebook 誠實標了幾處「outside your sources」（getAgentOutput 在 AgentBase、
  restricted 三層、manual→Java Debug Console）——已交由 WebFetch/獨立審查覆核。

### WebFetch — 交叉驗證（可引用原文 + URL 驗證非 404）
- `H_NOTESAGENTCONTEXT_CLASS_JAVA.html`（14.5.1）— ✅ 存在（注意類別文件名有 `NOTES`
  前綴，`H_AGENTCONTEXT_CLASS_JAVA.html` 會 404）。原文："Represents the agent
  environment of the current program, if an agent is running it."；getSavedData
  ="a document that an agent uses to store information between invocations"。
- `H_NOTESAGENT_CLASS_JAVA.html`（14.5.1）— ✅ 存在。原文：Trigger="Read-only.
  Indicates when this agent runs."；Owner="Read-only. The name of the person who
  last modified and saved an agent."
- `H_AGENTBASE_CLASS_JAVA.html`（14.5.1）— ✅ 存在（AgentBase/NotesMain 骨架）。

### 矛盾檢查
NotebookLM 與官方文件一致，無矛盾。

## 獨立審查 (review)

**審查模型**：Claude Sonnet（獨立 reviewer subagent，與寫作模型 Opus 4.8 分開），
重新 WebFetch 三份官方文件，特別盯逐字引用與 method 位置。

**VERDICT：ISSUES → 已修**：

- ✅ **getUnprocessedDocuments 的「引號」**（修正）：TL;DR 原本把「上次跑之後新增/修改」
  當逐字引用呈現，但該字串不在 AgentContext 類別頁（在其屬性子頁）。已改成 paraphrase、
  去引號（zh + en）。
- ✅ 全部逐字引用經覆核**無誤**：AgentContext 描述、Agent 描述、Trigger、Owner、
  getSavedData 皆逐字正確；`updateProcessedDoc` 確認在 AgentContext 上；程式碼範例正確慣用。
- ℹ️ **reviewer 反而確認更有據**：`System.out`→`log.nsf`「Miscellaneous Events」
  在 **Agent 頁有逐字原文**；client→Java Debug Console 在 **AgentBase 頁有**（doc 的實際
  區分是 foreground/background，本文以「手動/排程」對應，屬合理但略寬鬆的等價）。
- ⚠️ **正確但非那三篇 inline 文件（來源層級標注）**：
  - Owner→「簽章者」→「以該身分＋ACL 權限執行」是**標準 Domino 安全模型**的推論，
    Owner 頁只寫「最後存檔者的名字」；本文以自身文字陳述此後果（非宣稱逐字）。
  - `ACLEntry.IsCanCreateLSOrJavaAgent`（在 ACLEntry 類別）、restricted/unrestricted
    語意（`AgentBase.isRestricted()` 存在但語意未在該頁解釋）、ECL（本文已footnote 標注）、
    `Log` 類別 logAction/logError——皆正確標準知識，非這三篇。

## 查證 checklist
- [x] 研究鏈 NotebookLM（清理後）→ WebFetch 走完
- [x] **NotebookLM 清理有效性驗證**：異主題查詢回正確主題、無前題殘留
- [x] NotebookLM vs 官方文件交叉驗證，無矛盾
- [x] 三個 inline 官方 URL 逐一 WebFetch 驗證非 404
- [x] inline-link diversity 通過（各語言 3 個相異 URL 各 1 次 = 33%）
- [x] 雙語 build 通過（frontmatter schema 驗證）
- [x] humanizer-zh-tw 正式 pass（雙語 45/50；收斂 reveal 破折號 zh3/en3）
- [x] 獨立事實查核完成（Sonnet reviewer，ISSUES→已修 + 來源層級標注）

## 異動日誌
- 2026-08-02 建檔、NotebookLM（清理後）+WebFetch 研究、雙語草稿、sidecar（Opus 4.8）
- 2026-08-02 humanizer-zh-tw 正式 pass（雙語 45/50，Opus 4.8）
- 2026-08-02 獨立事實查核（Sonnet reviewer）→ 修 getUnprocessedDocuments 引號（Opus 4.8）
- 2026-08-02 進 `_pending`（Path A，pubDate 2026-08-10）
