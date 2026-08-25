---
slug: formula-dblookup-dbcolumn
title: "@DbColumn or @DbLookup? Reading Across Views and Databases in Formula"
lang: [zh-TW, en]
pubDate: 2026-08-25
status: staged
tags: [Formula, Tutorial]
requester: 使用者 (bryan，Formula @function 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；1 optional（第一個排序欄）已套"
created: 2026-08-25
updated: 2026-08-25
---

# 研究軌跡 — formula-dblookup-dbcolumn

Formula @function 系列第 1 篇（8/25）。系列 7 篇（8/25–8/31）：@DbLookup/@DbColumn →
清單處理 → 文字 → @Name → 日期 → 控制流/變數 → 錯誤與求值。
（原規劃 8/25 為 OpenNTF「Developer Variety Hour '26」recap，但錄影尚未上架 → 依
CLAUDE.md「commit before cron」不硬等，改由 Formula 填 8/25；recap 待 URL 到手再補篇。）

## 研究來源 (Research trail)

### NotebookLM — 有 Formula notebook，但沿用系列做法走 WebFetch 官方 formula 文件

### WebFetch — 官方 HCL Formula 文件（逐一驗證非 404）
- `H_DBCOLUMN_NOTES_DATABASES.html` — ✅ `@DbColumn(class:cache; server:database; view;
  columnNumber)`；cache `""`/`ReCache`/`NoCache`（逐字 "no cache is used"）；逐字
  "@DbColumn can return no more than 64K bytes of data."；逐字 "This function does not
  work in column or selection formulas, or in mail agents."；回傳 "The values found in
  the view column that you indicated."
- `H_DBLOOKUP_NOTES_DATABASES.html` — ✅ 六參數語法（fieldName 或 columnNumber）；
  keywords [FAILSILENT]/[PARTIALMATCH]/[RETURNDOCUMENTUNIQUEID]；fieldName=儲存值、
  columnNumber=顯示值；key 比第一個**排序**欄；"Entry not found in index"（@IsError/
  @IfError）；rich text 不能回；同 "does not work in column/selection/mail agents"。
- `H_ABOUT_FORMULAS_THAT_LOOK_FOR_VALUES_IN_COLUMNS_AND_VIEWS.html` — ✅（欄計數排除
  常數/特殊欄；第 3 個 inline URL）。

### 矛盾檢查
兩函式頁一致。64K 深入談交叉引 [[dblookup-cache-64k]]（8/4）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch 三頁，核對兩函式語法、cache 值 + 逐字、keywords、fieldName vs
columnNumber、兩處 64K/限制逐字、排序欄/相等比對/rich text 等規矩。

**VERDICT：PASS**（零必修）。所有語法簽章、參數、cache 值、keyword、逐字引用
word-for-word 對照 14.5.1 doc 通過。套 1 optional：TL;DR「第一欄要排序」→「第一個
**排序**欄（未必是第 1 欄）」，與內文一致。equality/大小寫/標點一句這三頁未逐字佐證
（公認行為、未被否定），保留。

## 標題候選
走標題優化 loop：

- [汰除] 資訊·好搜：`Formula 讀別處的資料：@DbColumn 抓整欄、@DbLookup 按 key 找，兩個就搞定九成` — 好搜、講清，但偏長。
- [選定] 問題先行：`@DbColumn 還是 @DbLookup？formula 讀跨 view／庫資料該用哪個`
  — 使用者拍板。直接是讀者最常有的疑問（這兩個到底用哪個）。
  en 鏡像：`@DbColumn or @DbLookup? Reading Across Views and Databases in Formula`。
- [汰除] 概念 hook：`@DbColumn 倒出一整欄、@DbLookup 對一個 key：formula 讀別處資料的兩個工作馬` — 點題好，但搜尋性弱。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 formula 文件為主
- [x] 官方三頁 WebFetch 驗證非 404
- [x] 矛盾檢查（兩函式頁一致；64K 交叉引 dblookup-cache-64k）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 2 URL/50% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-25 WebFetch 官方 formula 文件、雙語草稿、補第 3 inline 連結、標題 loop、sidecar（Opus 4.8）
- 2026-08-25 獨立 fact-check（subagent）→ PASS；套 1 optional（第一個排序欄）（Opus 4.8）
