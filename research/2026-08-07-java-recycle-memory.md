---
slug: java-recycle-memory
title: "recycle(): Manual Memory Management in the Java Domino API"
lang: [zh-TW, en]
pubDate: 2026-08-07
model: claude-opus-4-8
status: staged            # staged (in _pending) → shipped (promoted)
tags: [Java, Performance]
---

# 研究軌跡 — java-recycle-memory

每篇技術文的來源查證留痕。目的：日後任何人（包括未來的我）都能驗證這篇的
技術主張是怎麼來的、查了哪些來源、有沒有走完研究鏈。

## 研究來源 (Research trail)

### NotebookLM — ✅ 有回答
- Notebook：Java back-end API (`lotus.domino.*`)，
  `https://notebook.google.com/notebook/99039350-51ae-4d0c-b79b-8d922e29697b`
- 日期：2026-08-02
- 問句（單一綜合題）："In the lotus.domino Java API, explain recycle() and
  memory management thoroughly: (1) what recycle() is / the problem it solves…
  (2) Java object ↔ native C backing-store handle, why GC can't free them
  (3) recycle() / recycle(Vector) signatures (4) parent-child recycle order
  (5) the loop leak pattern (6) NotesThread sinitThread/stermThread/runNotes
  (7) local vs remote CORBA/DIIOP (8) best practices (9) a full loop code
  example."
- 取得：機制（輕量 Java + 重量後端 handle）、四條規則、迴圈洩漏樣式、
  two-variable 安全迴圈範例、NotesThread、local(JNI) vs 遠端(DIIOP)、
  不要 recycle 的 singleton、DateTime 洩漏。

### WebFetch — 交叉驗證（method-level 語法 + 可引用原文）
- `H_RECYCLE_METHOD_JAVA.html`（14.5.1）— ✅ 驗證存在。取得確切簽章
  `void recycle()` / `void recycle(java.util.Vector)`、四條官方規則、
  可引用原文："Java has no knowlege of the heavyweight back-end Domino
  Objects… Garbage collection has no effect… unless you first explicitly
  recycle them."
- `H_NOTESTHREAD_CLASS_JAVA.html`（14.5.1）— ✅ 驗證存在。sinitThread/
  stermThread 一對一、runNotes、AgentBase/AppletBase 內建、遠端不需要。
- `H_COMPILING_AND_RUNNING_JAVA.html`（14.5.1）— ✅ 驗證存在（inline 來源）。

### 矛盾檢查
NotebookLM 與官方文件**一致，無矛盾**（機制、四條規則、簽章、迴圈樣式
彼此吻合）。

## 查證 checklist
- [x] 研究鏈 NotebookLM → WebFetch 走完
- [x] NotebookLM vs 官方文件交叉驗證，無矛盾
- [x] 三個官方 URL 逐一 WebFetch 驗證非 404
- [x] inline-link diversity 通過（各語言 3 個相異 URL 各 1 次 = 33%）
- [x] 雙語 build 通過（frontmatter schema 驗證）
- [ ] **humanizer-zh-tw 正式 skill pass —— 待辦**（草稿已依 24 tells 原則
      自我審過、field-report voice；正式 skill 跑分留在 8/7 promote 前）

## 異動日誌
- 2026-08-02 建檔、NotebookLM+WebFetch 研究、雙語草稿、sidecar（Opus 4.8）
- 2026-08-02 進 `_pending`（Path A，pubDate 2026-08-07）
