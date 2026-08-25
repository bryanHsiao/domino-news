---
slug: formula-control-flow
title: "Control Flow and Variables in Formula: :=, @If, @Do, @For/@While"
lang: [zh-TW, en]
pubDate: 2026-08-30
status: staged
tags: [Formula, Tutorial]
requester: 使用者 (bryan，Formula @function 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；零必修"
created: 2026-08-25
updated: 2026-08-25
---

# 研究軌跡 — formula-control-flow

Formula @function 系列第 6 篇（8/30，控制流與變數）。承 [[formula-list-processing]]（清單導向、迴圈少用）。

## 研究來源 (Research trail)

### WebFetch — 官方 HCL Formula 文件（逐一驗證非 404）
- `H_IF.html` — ✅ 逐字「You can list up to 99 conditions and corresponding actions,
  followed by just one action to be performed when all the conditions are False.」；
  短路逐字「As soon as a condition evaluates to True, Notes/Domino performs the
  associated action and ignores the remainder of the @If statement.」；CostOfGoods 三路
  官方範例。
- `H_DO.html` — ✅ 逐字「Evaluates expressions from left to right, and returns the value
  of the last expression in the list.」
- `H_FOR_FUNCTION.html` — ✅ 逐字「Executes one or more statements iteratively while a
  condition remains true.」；`@For(n:=1; n<=@Elements(Categories); n:=n+1; @Prompt(...))`
  官方原例；`Categories[n]` 下標合法。@While 先判斷、@DoWhile 後判斷。
- 暫存變數 `:=`／「最後敘述為結果」：相關頁（H_ABOUT_STATEMENTS 等）404，但行為正確、
  與 @Do 定義一致、reviewer 確認無矛盾。

### 矛盾檢查
各頁一致。「迴圈少用（清單導向）」與 [[formula-list-processing]] 一貫、well-hedged。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
特別確認暫存變數／最後敘述為結果、`Categories[n]` 下標、四處逐字引用。

**VERDICT：PASS**（零必修）。四處逐字引用 word-for-word；`:=` 暫存變數、分號雙角色、
@If（99 組 + 短路 + 官方三路例）、@Do、@For（官方原例 + `Categories[n]` 合法）、
@While/@DoWhile 前後判斷、`:=` vs @Set 全部通過。唯一 soft spot：「最後敘述為結果」
的專頁 404、無法釘到單一逐字句，但行為正確且與 @Do 定義一致——不需修。

## 標題候選
走標題優化 loop：

- [汰除] 概念 hook：`Formula 的控制流：暫存變數 := 是骨幹、@If 當 switch，而迴圈其實很少用到` — 帶「迴圈少用」驚訝點、好記，但偏長。
- [汰除] 問題先行：`在 formula 裡什麼時候該寫迴圈？（多數時候答案是：不用）` — 反直覺鉤子，但視角較窄。
- [選定] 資訊·好搜：`Formula 控制流與變數：暫存變數 :=、@If、@Do、@For/@While`
  — 使用者拍板。工具名齊、最好搜。
  en 鏡像：`Control Flow and Variables in Formula: :=, @If, @Do, @For/@While`。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 formula 文件為主
- [x] 官方三頁驗證非 404（暫存變數專頁 404、行為由 @Do 定義佐證）
- [x] 矛盾檢查（各頁一致；與 list-processing 一貫）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 @Do/@For 40% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-25 WebFetch 官方 formula 文件、雙語草稿、修 diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-25 獨立 fact-check（subagent）→ PASS（零必修）（Opus 4.8）
