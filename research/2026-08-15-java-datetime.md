---
slug: java-datetime
title: "Why Can't You Just Use java.util.Date for Notes Dates in Java?"
lang: [zh-TW, en]
pubDate: 2026-08-15
status: staged
tags: [Java]
requester: 使用者 (bryan)          # Java 資料層四部曲之二
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；NotebookLM 仍拒答→WebFetch fallback"
created: 2026-08-12
updated: 2026-08-12
---

# 研究軌跡 — java-datetime

Java 資料層四部曲第 2 篇（8/15）。主題：Java 版 `DateTime`——後端物件、
recycle 負擔、`createDateTime` 建、`toJavaDate` 通往 `java.util.Date` / `java.time`。

## 研究來源 (Research trail)

### NotebookLM — ⚠️ 仍拒答（沿用 8/14 判斷）
Java notebook 前一篇已連兩次「無法回答」、chat pairs 累積中，不再重試以免加劇
污染（[[reference_notebooklm_repair]]），直接走 WebFetch。清 chat 史需使用者授權
＋互動 Chrome，已向使用者說明、待其決定是否清理。

### WebFetch — 官方 Java 方法頁（逐一驗證非 404）
- `H_NOTESDATETIME_CLASS_JAVA.html` — ✅ class 頁。逐字 "Represents a date and
  time."／"Extends the Base class."；Contained-By：AgentContext/Database/DateRange/
  DateTime/Document/Session/View；屬性 DateOnly/TimeOnly/GMTTime（RO 字串）、
  LocalTime（RW）、TimeZone（RO int）；方法 setNow/adjustDay-Hour-Month-Year/
  timeDifference/convertToZone；recycle 為可用方法（後端物件）。
- `H_CREATEDATETIME_METHOD_JAVA.html` — ✅ 三 overload（String / java.util.Date /
  java.util.Calendar，Calendar 為 R6 新增）。逐字 "An invalid date-time or empty
  string results in an 'Invalid date' exception."
- `H_TOJAVADATE_METHOD_JAVA.html` — ✅ `public java.util.Date toJavaDate()`；
  逐字 "Converts a Notes date and time into a java.util.Date object."（原文有 ®，
  文中省略，無害）。
- `H_DATETIME_CLASS_JAVA.html` — ✗ 404（class 頁正確 URL 是 NOTESDATETIME 前綴）。
- `H_TIMEDIFFERENCEDOUBLE_METHOD_JAVA.html` — ✗ 404（不需要）。reviewer 另行查得
  `H_TIMEDIFFERENCE_METHOD_JAVA.html`：`public int timeDifference(DateTime)`，回秒（int）。

### 矛盾檢查
各頁一致。DateTime 需 recycle 與站上 [[java-recycle-memory]]（8/7）、
[[java-document-items]]（8/14 DateTime-in-Vector）一致。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch 四頁 + 另查 timeDifference 回傳型別。

**VERDICT：PASS**。零必修。三個簽章、屬性讀寫性、兩處逐字引用、java.time 橋接
code 全部對照 live doc 吻合。**timeDifference 確認回 int**（原文猜測正確）。
套用兩處優化：code 例 `timeDifference` 方向改成 `due.timeDifference(now)`（正值、
語意更清楚）、種子註解補「覆蓋種子」。®-省略與 setNow 種子屬無害，未再動。

## 標題候選
走標題優化 loop：

- [汰除] 概念 hook：`Java 的 DateTime：一個會漏記憶體的日期物件，和它通往 java.util.Date 的橋` — 好記、兩段點痛（漏記憶體 + 過橋），但長。
- [選定] 問題先行：`在 Java 裡處理 Notes 日期，為什麼不能直接用 java.util.Date？`
  — 使用者拍板。直接是讀者的第一個疑問，開場 hook 已鋪這條線。
  en 鏡像：`Why Can't You Just Use java.util.Date for Notes Dates in Java?`。
- [汰除] 資訊·好搜：`Java 的 DateTime：createDateTime 建、toJavaDate 轉、recycle 收` — 方法名齊、好搜，但少了鉤子。

## 查證 checklist
- [x] 研究鏈：NotebookLM（拒答）→ WebFetch fallback 走完
- [x] 官方 Java 方法頁逐一 WebFetch 驗證非 404（含 timeDifference 由 reviewer 補查）
- [x] 矛盾檢查（各頁 + recycle/item 篇一致）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（LS→Java 實測口吻、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-12 WebFetch 四 Java 頁、雙語草稿、標題 loop、sidecar（Opus 4.8）
- 2026-08-12 獨立 fact-check（subagent）→ PASS；套用 2 優化（timeDifference 方向 / 種子註解）（Opus 4.8）
- 2026-08-12 進 `_pending`（Path A，pubDate 2026-08-15）
