---
slug: java-notesexception
title: "Java's NotesException: .id, .text, and try/catch/finally"
lang: [zh-TW, en]
pubDate: 2026-08-17
status: staged
tags: [Java]
requester: 使用者 (bryan)          # Java 資料層四部曲之四（收尾）
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；NotebookLM 仍拒答→WebFetch fallback"
created: 2026-08-12
updated: 2026-08-12
---

# 研究軌跡 — java-notesexception

Java 資料層四部曲第 4 篇（8/17，收尾）。主題：Java 版例外處理——受檢的
NotesException、`.id`/`.text`、用 `NotesError` 常數分流，以及把整個系列收在
一起的「recycle 放進 finally」。

## 研究來源 (Research trail)

### NotebookLM — ⚠️ 仍拒答（沿用前三篇判斷），走 WebFetch

### WebFetch — 官方 Java 文件（逐一驗證非 404）
- `H_NOTESEXCEPTION_CLASS_JAVA.html` — ✅（官方頁標題為「NotesError and
  NotesException classes (Java)」，兩者同頁）。逐字取得：
  "The NotesException class extends java.lang.Exception to include exception
  handling for Notes/Domino."／"NotesException.id, of type int, contains the
  error code."／"NotesException.text, of type String, contains the error text."／
  internal 欄位 "Otherwise (and typically), this variable is null."／
  "Notes/Domino throws the exception NOTES_ERR_SYS_FILE_NOT_FOUND (4003)"／
  官方範例 `if (e.id == NotesError.NOTES_ERR_SYS_FILE_NOT_FOUND)`。
- `H_RECYCLE_METHOD_JAVA.html`、`H_GETITEMVALUE_METHOD_JAVA.html` — ✅（另兩個 inline URL）。
- `H_NOTESERROR_CLASS_JAVA.html` — ✗ 404（常數其實與 NotesException 同頁，已取得）。

### 矛盾檢查
初稿第二例用了未查證的 `NOTES_ERR_BAD_UNID`，寫作階段即主動移除、改為只 log
id/text（避免引到不存在的常數）。reviewer 事後確認保留的 `NOTES_ERR_SYS_FILE_NOT_FOUND`
(4003) 與 `NOTES_ERR_ERROR` (4000) 皆真。與 [[java-recycle-memory]] 等前三篇一致。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch 官方 NotesError/NotesException 頁，逐條核對五處逐字引用、欄位型別、
常數名與值、finally-recycle 樣式、code 例。

**VERDICT：PASS**。零必修。五處逐字引用全部 word-for-word；`.id`(int)/`.text`(String)/
`internal`(Exception)、`NotesError.NOTES_ERR_SYS_FILE_NOT_FOUND`(4003)、finally-recycle
樣式、跨語言主張全部通過。唯一 optional pedantic：`NotesError` 技術上是 interface 而非
class——但文中用語為「常數在 NotesError 裡」/「constants in NotesError」、未稱其為 class，
`Interface.CONSTANT` 語法也合法，故不改。

## 標題候選
走標題優化 loop：

- [汰除] 概念 hook：`Java 的 NotesException：.id、.text，和一定要放進 finally 的 recycle` — 類別名 + 系列收尾洞察（recycle 放 finally），但偏長。
- [汰除] 問題先行：`在 Java 裡一拋例外，recycle 就漏了——NotesException 與 finally` — 痛點清楚，但把「例外處理」矮化成只講 recycle。
- [選定] 資訊·好搜：`Java 的 NotesException：.id、.text 與 try/catch/finally`
  — 使用者拍板。類別名 + 兩個核心欄位 + Java 例外骨架，最好搜、最能一眼看出主題。
  en 鏡像：`Java's NotesException: .id, .text, and try/catch/finally`。

## 查證 checklist
- [x] 研究鏈：NotebookLM（拒答）→ WebFetch fallback 走完
- [x] 官方 Java 頁 WebFetch 驗證非 404（NotesError 常數與 NotesException 同頁）
- [x] 矛盾檢查（移除未查證常數；保留者 reviewer 確認為真）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 2 URL/50% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（LS→Java 實測口吻、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-12 WebFetch 官方頁、雙語草稿（主動移除未查證常數）、標題 loop、sidecar（Opus 4.8）
- 2026-08-12 修 inline-link diversity（補 recycle inline，2→3 URL）（Opus 4.8）
- 2026-08-12 獨立 fact-check（subagent）→ PASS（Opus 4.8）
- 2026-08-12 進 `_pending`（Path A，pubDate 2026-08-17）
