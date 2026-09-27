---
slug: java-notesthread
title: "Java NotesThread 背景執行緒"
lang: [zh-TW, en]
pubDate: 2026-09-30
status: staged（_pending，排 2026-09-30，Path A；批次 #3）
tags: [Java, Tutorial]
requester: 使用者（跨語言批次 9/28–10/05；Java 進階缺口）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。四處 block-quote 全 verbatim、runNotes() 進入點正確、三寫法對、code 有效、跨緒不共用/背景無 sessionAsSigner 正確框成行為、跨語言準。唯一 nit：Quote 1 省略「Java™」的 ™（cosmetic，免動）。
created: 2026-09-30
updated: 2026-09-30
---

# 研究軌跡 — java-notesthread

Java 背景執行緒 deep-dive。批次 #3。

## 標題候選（自決 — [[feedback_title_self_decide]]）

- [選定] 規矩導向+好搜：`NotesThread：在 Domino 開背景執行緒的規矩——每條 thread 要 init、要自己的 session`
  en 鏡像：`NotesThread: The Rules for Background Threads in Domino — init Each Thread, Give It Its Own Session`
- [汰除] 問題先行：`為什麼 new Thread 跑 Domino 會爆？` — 太窄。
- [汰除] 中性：`NotesThread 與 Domino 的多執行緒` — 無 hook。

## 研究（第一手官方 doc）

- **NotesThread (Java)**（[14.0.0](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESTHREAD_CLASS_JAVA.html)）：extends Thread + init/term、三種寫法、runNotes()、sinitThread/stermThread 配對 + finally verbatim。
- **Running a Java program**（[14.0.0](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COMPILING_AND_RUNNING_JAVA.html)）：每條 thread 要 init、listener 用 static、createSession per thread verbatim。
- **NotesFactory (Java)**（[14.0.0](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESFACTORY_CLASS_JAVA.html)）：createSession 第 3 外連。
- 內部交叉連：[[java-recycle-memory]]、[[java-session-notesfactory]]、[[xpages-sessionassigner]]。
- 未跑 NotebookLM（Java 執行緒模型，官方 class doc 逐字足；本 session 卡登入）。
- 「不能跨緒共用 Session/物件」「背景 thread 無 faces context 拿不到 sessionAsSigner」標為已知行為/解釋，非官方逐字。

## 查證 checklist

- [x] NotesThread 定義、三寫法、sinitThread/stermThread+finally、每 thread init、listener static、createSession 對官方 verbatim
- [x] runNotes() 是繼承時進入點
- [x] Java code 有效（extend+runNotes / static+try-finally）
- [x] 跨緒不共用、背景無 sessionAsSigner 標為行為非引用
- [x] 跨語言：LS 單執行緒無 NotesThread、SSJS 無手開 thread
- [x] TYPE：Java + Tutorial（三種寫法可照做）
- [x] inline-link diversity：3 相異官方外部 + 內部交叉連
- [x] 雙語 temp-build（lang 一度誤打 en 已修 zh-TW）
- [ ] fact-check（跑中）

## 異動日誌

- 2026-09-30 批次 #3；WebFetch NotesThread + running-java；雙語 hook+TL;DR；標題自決；修 zh lang 誤打；temp-build；stage 排 9/30。（Opus 4.8）
