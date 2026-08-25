---
slug: formula-list-processing
title: "Why You Barely Write Loops to Process a List in Formula"
lang: [zh-TW, en]
pubDate: 2026-08-26
status: staged
tags: [Formula, Tutorial]
requester: 使用者 (bryan，Formula @function 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；1 建議（@Trim 說明）已補正"
created: 2026-08-25
updated: 2026-08-25
---

# 研究軌跡 — formula-list-processing

Formula @function 系列第 2 篇（8/26，清單處理）。承 [[formula-dblookup-dbcolumn]]。

## 研究來源 (Research trail)

### WebFetch — 官方 HCL Formula 文件（逐一驗證非 404）
- `H_TRANSFORM.html` — ✅ `@Transform(list; variableName; formula)`；逐字「applies a
  formula to each element of a list and returns the results in a list」；@Nothing 踢元素、
  回 list 攤平、錯誤外傳；官方範例 @Begins/星號。
- `H_EXPLODE.html` — ✅ 預設分隔 `" ,;"`；換行永遠是分隔（除非 newlineAsSeparator=False）；
  @Implode 逐字「Concatenates all members of a text list and returns a text string」；
  swap-separator 範例 `@Implode(@Explode(entry;"&");"+")` 即官方範例。
- `H_SORT.html` — ✅ 關鍵字 [ASCENDING]/[DESCENDING]/[CASEINSENSITIVE]/[ACCENTINSENSITIVE]/
  [CUSTOMSORT]；預設「ascending, case-sensitive, accent-sensitive, pitch-sensitive」；
  [CUSTOMSORT] 逐字「a formula that uses the temporary variables $A and $B to compare
  the values of elements in the list two at a time」；$A>$B 回 @True/正數。

### 矛盾檢查
各函式頁一致。隱式 map（算符逐元素）為 formula 核心行為、reviewer 確認。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch 三頁 + @Implode/@Unique/@Elements/@Trim，核對隱式 map、@Transform
三合一（map/filter/flatMap/錯誤外傳）、@Explode 分隔、@Implode 逐字、@Sort 選項 +
[CUSTOMSORT]、組合範例語法。

**VERDICT：PASS**（零必修）。隱式 map hook、@Transform（含 @Nothing 踢元素、回 list
攤平、錯誤外傳，皆逐字對照）、@Explode/@Implode、@Sort（含 [CUSTOMSORT] $A/$B 逐字）、
組合範例（`:=` 暫存變數、`;` 分隔、巢狀）全部通過。套 1 建議：`@Trim` 我原寫「移空字串
元素」不精確——官方主要是去每元素前後/多餘空白、順帶移除全空白元素，已補正。

## 標題候選
走標題優化 loop：

- [汰除] 概念 hook：`Formula 其實是個函數式清單語言：@Transform 當 map、@Explode/@Implode 切接、@Sort 排序` — 重新框架的 thesis、好記，但偏長。
- [選定] 問題先行：`在 formula 裡處理一串值，為什麼幾乎不用寫迴圈？`
  — 使用者拍板。直接是 LS/Java 過來者的困惑（怎麼沒迴圈），開場正好答這題。
  en 鏡像：`Why You Barely Write Loops to Process a List in Formula`。
- [汰除] 資訊·好搜：`Formula 清單處理：@Transform、@Explode/@Implode、@Sort 一次搞定整串` — 函式名齊、好搜，但少了鉤子。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 formula 文件為主
- [x] 官方三頁 + @Implode/@Unique/@Trim 驗證非 404
- [x] 矛盾檢查（各函式頁一致）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 @Sort/@Explode 40% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-25 WebFetch 官方 formula 文件、雙語草稿、修 diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-25 獨立 fact-check（subagent）→ PASS；補正 @Trim 說明（Opus 4.8）
