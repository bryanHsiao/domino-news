---
slug: formula-date-time
title: "Date Arithmetic in Formula: @Adjust to Add/Subtract, @Now/@Today for Now, and @Modified's Two Versions"
lang: [zh-TW, en]
pubDate: 2026-08-29
status: staged
tags: [Formula, Tutorial]
requester: 使用者 (bryan，Formula @function 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；2 修正（@Now 引用、月底/閏年 uncited）已套"
created: 2026-08-25
updated: 2026-08-25
---

# 研究軌跡 — formula-date-time

Formula @function 系列第 5 篇（8/29，日期時間）。

## 研究來源 (Research trail)

### WebFetch — 官方 HCL Formula 文件（逐一驗證非 404）
- `H_ADJUST.html` — ✅ `@Adjust(date; y; m; d; h; min; s; [DST])`；逐字「Adjusts the
  specified time-date value... The amount of adjustment may be positive or negative.」；
  七位必填（0 不調）、可 list、last-to-first。
- `H_NOW.html` — ✅ 逐字「Returns the current time-date.」（**非**「@Now returns...」）；
  每次重算；逐字警告「using @Now in column or selection formulas may impact the
  efficiency of your application」；[SERVERTIME]；@Today 只到日（同效能警告）。
- `H_MODIFIED.html` — ✅ 逐字 @Modified「...modified initially」/ @ModifiedInThisFile
  「...last modified in the current file」；replica per-copy。
- reviewer 另查「Performing time-date operations」確認**兩時戳相減 = 秒差**、/86400 = 天。

### 矛盾檢查
各頁一致。相減=秒差、@Adjust 加時間 兩者方向已明確分開。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
特別確認「兩時戳相減=秒差」與四處逐字引用。

**VERDICT：PASS**（零必修）。@Adjust 語法/定義逐字 + 範例、@Now/@Today（含效能警告逐字）、
@Modified/@ModifiedInThisFile 逐字 + replica、@Created、**相減=秒差（`/86400`=天）確認**、
extractors 全部通過。套 2 修正：
- ✅ **@Now 引用**：初稿引「@Now returns the current time-date」，官方實為「Returns the
  current time-date.」（無 @Now 前綴）→ 修正。
- ✅ **月底/閏年**：初稿「正確處理月底、閏年」為無來源絕對宣稱（站規禁 uncited）→ 軟化為
  「日曆邊界由它替你算」。

## 標題候選
走標題優化 loop：

- [選定] 資訊·好搜：`Formula 的日期運算：@Adjust 加減、@Now/@Today 取現在、@Modified 的兩個版本要分清`
  — 使用者拍板。函式名齊 + 點出 @Modified/@ModifiedInThisFile 的分別。
  en 鏡像：`Date Arithmetic in Formula: @Adjust to Add/Subtract, @Now/@Today for Now, and @Modified's Two Versions`。
- [汰除] 問題先行：`在 formula 裡別拿 @Now 當文件時間——@Adjust、@Now、@Modified 怎麼用` — 痛點好，但視角較窄。
- [汰除] 概念 hook：`formula 日期就三招：@Adjust 加、相減拿秒差、@Now 取現在（小心重算）` — 好記，但搜尋性弱。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 formula 文件為主
- [x] 官方三頁 + 時間運算頁驗證非 404
- [x] 矛盾檢查（各頁一致；相減=秒差確認）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 @Now/@Modified 40% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-25 WebFetch 官方 formula 文件、雙語草稿、修 diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-25 獨立 fact-check（subagent）→ PASS；套 2 修正（@Now 引用 / 月底閏年 uncited）（Opus 4.8）
