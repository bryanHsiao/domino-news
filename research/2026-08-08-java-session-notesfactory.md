---
slug: java-session-notesfactory
title: "Getting a Session in Java: NotesFactory, Local, and Remote"
lang: [zh-TW, en]
pubDate: 2026-08-08
status: staged                     # staged（_pending）→ shipped（promoted）
tags: [Java]
requester: 使用者 (bryan)          # 誰提出這篇
author_model: claude-opus-4-8      # 寫作模型
review_model: claude-sonnet (獨立 reviewer subagent)  # 審查模型（獨立於寫作）
review_result: "humanizer 45/50；獨立事實查核(Sonnet) PASS（2 個來源層級 flag，見【獨立審查】）"
created: 2026-08-02
updated: 2026-08-02
---

# 研究軌跡 — java-session-notesfactory

Java 系列第二篇（接 [`java-recycle-memory`](2026-08-07-java-recycle-memory.md)）。

## 研究來源 (Research trail)

### NotebookLM — ✅ 有回答
- Notebook：Java back-end API (`lotus.domino.*`)，
  `https://notebook.google.com/notebook/99039350-51ae-4d0c-b79b-8d922e29697b`
- 日期：2026-08-02
- 問句（單一綜合題）：如何在 lotus.domino Java API 取得 Session／NotesFactory 的角色：
  (1) 為何 Java 沒有 LS 全域 session (2) createSession 本機 vs 遠端 DIIOP 多載、
  createSessionWithFullAccess (3) agent 用 AgentBase.getSession()、不自己建/recycle
  (4) 獨立程式/servlet 的 NotesThread 前置 (5) local JNI vs 遠端 DIIOP（jar、port）
  (6) Session 生命週期與 recycle 的擁有權規則 (7) 版本/情境 caveat (8) 兩段完整範例。
- 取得：三條取得路徑、Notes.jar vs NCSO.jar、DIIOP task/port 63148、bitness、
  一 thread 一 session、standalone 與 agent 兩段範例。

### WebFetch — 交叉驗證（可引用原文 + URL 驗證非 404）
- `H_NOTESFACTORY_CLASS_JAVA.html`（14.5.1）— ✅ 存在。取得 createSession 多載清單、
  可引用原文："Applications call the NotesFactory createSession methods to create a
  Session object."
- `H_AGENTBASE_CLASS_JAVA.html`（14.5.1）— ✅ 存在。可引用原文："Notes/Domino agents
  must extend AgentBase and use NotesMain() as the entry point"、"Use getSession()
  to create a Session object."
- `H_COMPILING_AND_RUNNING_JAVA.html`（14.5.1）— ✅ 存在（inline 來源）。

### 矛盾檢查
NotebookLM 與官方文件一致，無矛盾。

## 獨立審查 (review)

**審查模型**：Claude Sonnet（獨立 reviewer subagent，與寫作模型 Opus 4.8 分開）。
重新 WebFetch 三份官方文件逐條核對。

**VERDICT：PASS**（核心架構正確、引用逐字無誤）。兩個**來源層級 flag**（事實正確、
但不在那三篇 inline 文件內，屬 NotebookLM＋標準 Domino 知識，保留並在此標注）：

- ⚠️ **port 63148**：正確的 DIIOP 預設 port，但三篇 inline 文件未列出（文中以「預設」
  陳述、未宣稱出自特定 inline 文件；來源為 NotebookLM＋通用文件）。
- ⚠️ **「別 recycle agent 的 Session」**：AgentBase 文件未談 session 生命週期；此為
  標準慣例＋NotebookLM 明確陳述（自己 recycle 環境給的 handle 會讓 Agent Manager
  崩潰）。事實正確，屬慣例層級。
- 其餘（`nnotes.dll`/`libnotes.so`、`PATH`/`LD_LIBRARY_PATH`、bitness）同屬 install/
  admin 常識，非這三篇 inline 文件——保留為背景。
- reviewer 另指出可加強的 nuance：`AgentBase` 本身 extends `NotesThread`（文中未矛盾）。

## 查證 checklist
- [x] 研究鏈 NotebookLM → WebFetch 走完
- [x] NotebookLM vs 官方文件交叉驗證，無矛盾
- [x] 三個官方 URL 逐一 WebFetch 驗證非 404
- [x] inline-link diversity 通過（各語言 3 個相異 URL 各 1 次 = 33%）
- [x] 雙語 build 通過（frontmatter schema 驗證）
- [x] humanizer-zh-tw 正式 pass（雙語 45/50；收斂 reveal 破折號 zh3/en3）
- [x] 獨立事實查核完成（Sonnet reviewer，PASS + 2 來源層級 flag，已標注）

## 異動日誌
- 2026-08-02 建檔、NotebookLM+WebFetch 研究、雙語草稿、sidecar（Opus 4.8）
- 2026-08-02 humanizer-zh-tw 正式 pass（雙語 45/50，Opus 4.8）
- 2026-08-02 獨立事實查核（Sonnet reviewer）→ PASS，2 flag 標注來源層級（Opus 4.8）
- 2026-08-02 進 `_pending`（Path A，pubDate 2026-08-08）
