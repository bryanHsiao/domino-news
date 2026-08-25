---
slug: formula-text-functions
title: "String Functions in Formula: @Left/@Right/@Middle, @Word, @ReplaceSubstring"
lang: [zh-TW, en]
pubDate: 2026-08-27
status: staged
tags: [Formula, Tutorial]
requester: 使用者 (bryan，Formula @function 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；@Word 引用降級為敘述"
created: 2026-08-25
updated: 2026-08-25
---

# 研究軌跡 — formula-text-functions

Formula @function 系列第 3 篇（8/27，文字處理）。承 [[formula-list-processing]]（清單逐元素）。

## 研究來源 (Research trail)

### WebFetch — 官方 HCL Formula 文件（逐一驗證非 404）
- `H_MIDDLE.html` — ✅ 四簽章（offset/startString × numberchars/endstring）；三範例
  逐字（"h C"/"Car"/" is the "）；負 numberchars 往左。
- `H_WORD.html` — ✅ `@Word(string; separator; number)`；範例 "Collins,"；0≡1、負數從尾、
  超範圍回 ""；`@UserName`（大寫 N）。separator 為單一字元（文中未誇大）。
- `H_REPLACESUBSTRING.html` — ✅ 逐字「Replaces specific words or phrases in a string
  with new words or phrases that you specify. Case sensitive.」；平行清單依序；範例
  "I hate peaches"。（首個 URL H_REPLACESUBSTRING_FUNCTION.html 為 404，改正確 URL 命中。）
- reviewer 另查 `H_LEFT.html`/`H_RIGHT.html`/`H_LEFTBACK.html`/`H_RIGHTBACK.html` 確認
  dual-form（count 或 subString）與 @LeftBack/@RightBack 從尾端找。

### 矛盾檢查
各函式頁一致。dual-form 頭號宣稱 reviewer 對 H_LEFT/H_RIGHT 逐字確認。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
特別交代查 @Left/@Right 的 subString 形態（作者未抓那兩頁）+ @UserName 拼法。

**VERDICT：PASS**（零必修）。**@Left/@Right dual-form 頭號宣稱查證正確**（`@Left(s;"@")`
取 @ 之前、找不到回 ""）；@Middle 四簽章 + 三範例、@LeftBack/@RightBack、@Word（含
`@UserName` 拼法、-1 抓尾）、@ReplaceSubstring（逐字 + 平行清單）全部通過。唯一低風險：
@Word「A 'word' is defined as…」reviewer 無法 100% 確認逐字（語意精確）→ 已降級為敘述、
去引號。

## 標題候選
走標題優化 loop：

- [汰除] 概念 hook：`@Left 不只會數字元：formula 的 @Left/@Right/@Middle 也吃分隔字串` — dual-form 驚喜、好記，但摘要感弱。
- [汰除] 問題先行：`在 formula 裡從 email 取 @ 之前？別數字元——@Left 直接吃分隔字串` — 具體痛點，但視角較窄。
- [選定] 資訊·好搜：`Formula 字串處理：@Left/@Right/@Middle、@Word、@ReplaceSubstring`
  — 使用者拍板。函式名齊、最好搜（搜任一函式都接得住）。
  en 鏡像：`String Functions in Formula: @Left/@Right/@Middle, @Word, @ReplaceSubstring`。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 formula 文件為主
- [x] 官方三頁（+ reviewer 補 @Left/@Right/@LeftBack/@RightBack）驗證非 404
- [x] 矛盾檢查（各函式頁一致；dual-form 逐字確認）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-25 WebFetch 官方 formula 文件、雙語草稿、標題 loop、sidecar（Opus 4.8）
- 2026-08-25 獨立 fact-check（subagent）→ PASS；@Word 引用降級為敘述（Opus 4.8）
