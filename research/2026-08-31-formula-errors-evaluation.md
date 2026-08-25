---
slug: formula-errors-evaluation
title: "Error Handling and Evaluation in Formula: @IfError, @Eval, and Where a Formula Runs"
lang: [zh-TW, en]
pubDate: 2026-08-31
status: staged
tags: [Formula, Tutorial]
requester: 使用者 (bryan，Formula @function 系列收尾)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；1 精確化（computed-field 時機 + 引用）已套"
created: 2026-08-25
updated: 2026-08-25
---

# 研究軌跡 — formula-errors-evaluation

Formula @function 系列第 7 篇（8/31，收尾：錯誤與求值）。回顧全系列 1–6。

## 研究來源 (Research trail)

### WebFetch — 官方 HCL Formula 文件（逐一驗證非 404）
- `H_IFERROR_FUNCTION.html` — ✅ 逐字「Returns a null string ("") or the value of an
  alternative statement if a statement returns an error.」；`@IfError(s1; s2)`、無 s2 回 ""。
- `H_ISERROR.html` — ✅ 逐字「Returns 1 (True) if the value is an @ERROR value, returns
  0 (False) if not an error.」
- `H_EVAL.html` — ✅ `{}`／`""` 包、`+` 串、回最後一句；官方範例 `x:="re"; @Eval({x+"bar"})`
  → "rebar"；不宜用在 view column/selection（引擎無法預先分析）。
- `H_WHERE_TO_USE_SCRIPTS_AND_FORMULAS.html` — ✅ 逐字「Formulas are expressions that have
  program-like attributes」、「working within the object that the user is currently
  processing」。
- `H_ABOUT_EDITABLE_AND_COMPUTED_FIELDS.html` — ✅（精確化後補的引用）Computed=建立/存檔/
  重整、Computed for display=開啟/存檔、Computed when composed=建立時一次。

### 矛盾檢查
各頁一致。「@DbLookup/@Now/@Eval 不宜用在 view column/selection」與各函式頁 + 系列
（[[formula-dblookup-dbcolumn]]、[[formula-date-time]]）一貫。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
特別交代查 computed-field 型別時機是否可引用或應軟化（no-uncited-assertion）。

**VERDICT：PASS**（零必修）。四處逐字引用 word-for-word、@IfError/@IsError、@Eval（含官方
"rebar" 範例 + view 限制）、where-to-use 逐字、求值情境（view index-time、agent 副作用、
hide-when）全部通過。套 1 精確化：
- ✅ **computed-field 時機**：初稿「開啟/重整/存檔」為 loose umbrella（Computed 其實不在
  開啟時重算）且無來源 → 改精確（Computed=建立/存檔/重整、Computed for display=開啟/存檔、
  Computed when composed=建立一次）並引用 `H_ABOUT_EDITABLE_AND_COMPUTED_FIELDS.html`。

## 標題候選
走標題優化 loop：

- [選定] 資訊·好搜：`Formula 的錯誤處理與求值：@IfError、@Eval，以及公式在哪裡跑很重要`
  — 使用者拍板。函式名 + 收尾統合洞察（情境決定行為）。
  en 鏡像：`Error Handling and Evaluation in Formula: @IfError, @Eval, and Where a Formula Runs`。
- [汰除] 問題先行：`為什麼同一個 @function 在 view 欄公式就沒作用？公式跑在哪裡決定一切` — 統合痛點好，但把錯誤處理主線矮化。
- [汰除] 概念 hook：`公式在哪裡跑，決定它能做什麼：@IfError 接錯誤、@Eval 動態求值（系列收尾）` — 點題準，但偏長。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 formula 文件為主
- [x] 官方五頁驗證非 404
- [x] 矛盾檢查（各頁一致；與系列前篇一貫）
- [x] inline-link diversity 通過（精確化後 4 個相異 URL，最高 2/8 = 25%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-25 WebFetch 官方 formula 文件、雙語草稿、修 diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-25 獨立 fact-check（subagent）→ PASS；精確化 computed-field 時機 + 引用（Opus 4.8）
