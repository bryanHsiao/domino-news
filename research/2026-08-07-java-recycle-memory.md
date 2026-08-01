---
slug: java-recycle-memory
title: "recycle(): Manual Memory Management in the Java Domino API"
lang: [zh-TW, en]
pubDate: 2026-08-07
status: staged                     # staged（_pending）→ shipped（promoted）
tags: [Java, Performance]
requester: 使用者 (bryan)          # 誰提出這篇
author_model: claude-opus-4-8      # 寫作模型
review_model: claude-sonnet (獨立 reviewer subagent)  # 審查模型（獨立於寫作）
review_result: "humanizer 45/50；獨立事實查核(Sonnet) ISSUES→已處置（見【獨立審查】）"
created: 2026-08-02
updated: 2026-08-02
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

## 獨立審查 (review)

**審查模型**：Claude Sonnet（獨立 reviewer subagent，與寫作模型 Opus 4.8 分開）。
重新 WebFetch 三份官方文件，逐條核對技術主張。

**VERDICT：ISSUES**（核心機制全部正確；數項細節超出「那三篇 inline 文件」能佐證的範圍）。已處置：

- ✅ **逐字引用爭議字**：EN 原本引「Java has no *knowlege*…」。作者 WebFetch 抓到的是
  `knowlege`（HCL 文件本身 typo），reviewer 重抓成 `knowledge`——兩次 fetch 不一致。
  依「矛盾即紅旗」，把逐字引用**收斂成兩邊一致的第二句**（"Garbage collection has no
  effect…"），第一句改寫進內文，避免逐字引到有爭議的字。
- ✅ **規則 2 補例外**：官方文件另有「remote (IIOP) 環境 recycle 可從任一執行緒呼叫」，
  原文把「同執行緒」講成絕對。雙語已補上此例外。
- ⚠️ **NotebookLM/慣例層級主張（保留，來源層級標注於此）**：JNI／`nnotes.dll`／
  `libnotes.so` 命名、DIIOP 全名、「別 recycle agent 環境給的 Session/AgentContext/
  DocumentContext」、`DateTime`/`DateRange` 洩漏——這些**不在**那三篇 inline 文件內，
  來自 Java NotebookLM notebook（其 59 份來源含 admin/install 文件）＋標準 Domino
  實務知識，事實正確。文中「別 recycle 的 Session」已明確限定為「agent 環境提供的」，
  與官方「自建 session 要在所有 thread 結束後 recycle」不衝突（兩者指不同的 session）。

## 查證 checklist
- [x] 研究鏈 NotebookLM → WebFetch 走完
- [x] NotebookLM vs 官方文件交叉驗證，無矛盾
- [x] 三個官方 URL 逐一 WebFetch 驗證非 404
- [x] inline-link diversity 通過（各語言 3 個相異 URL 各 1 次 = 33%）
- [x] 雙語 build 通過（frontmatter schema 驗證）
- [x] **humanizer-zh-tw 正式 skill pass 完成** —— 輕觸式：收斂 reveal 型
      破折號（zh 4 處 / en 3 處）、去掉「本身就是重點」這類輕微 AI framing；
      保留 earned 第一人稱、實測細節、承載真實 aside 的破折號；未動
      identifier / code / 引用原文 / 連結。5 維評分 **45/50**（直接 9・
      節奏 9・信任 9・真實 9・精煉 9）。
- [x] **獨立事實查核完成**（Sonnet reviewer，與寫作模型分開）——見上方【獨立審查】；
      抓到的問題已處置（引用收斂、規則 2 補例外、來源層級標注）。

## 異動日誌
- 2026-08-02 建檔、NotebookLM+WebFetch 研究、雙語草稿、sidecar（Opus 4.8）
- 2026-08-02 進 `_pending`（Path A，pubDate 2026-08-07）
- 2026-08-02 humanizer-zh-tw 正式 pass（雙語 45/50，Opus 4.8）
- 2026-08-02 獨立事實查核（Sonnet reviewer）→ 修引用/規則 2/來源標注（Opus 4.8）
