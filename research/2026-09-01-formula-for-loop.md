---
slug: formula-for-loop
title: "Formula's @For Loop: When You Actually Need It, and a Real 'Reverse an Org Hierarchy' Example"
lang: [zh-TW, en]
pubDate: 2026-09-01
status: staged
tags: [Formula, Tutorial]
requester: 使用者 (bryan，延伸自 8/26 控制流留言：想單獨介紹 @For + 真實反轉組織階層需求)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) ISSUES → 1 必修（例子缺 result 初始化）已修 → 再驗 PASS"
created: 2026-08-26
updated: 2026-08-26
---

# 研究軌跡 — formula-for-loop

@For 專篇。使用者看 8/26 控制流那篇（[[formula-control-flow]]）後，提到自己以前寫過
一段 @For「把 `A\B\C` 組織階層反轉成 `C\B\A`」並特別記下來備用，想單獨寫一篇介紹 @For。
以使用者那段真實需求為主角。

## 研究來源 (Research trail)

### WebFetch — 官方 HCL Formula 文件（逐一驗證非 404）
- `H_FOR_FUNCTION.html` — ✅ 語法 `@For( initialize ; condition ; increment ; statement ; ... )`；
  四部位角色逐字（initialize 給起始值、condition 回 True/False、increment 改變數、statement 重複主體）；
  逐字「executes one or more statements iteratively while a condition remains true」；
  **關鍵：回傳值逐字「True (1) unless an error occurs during execution of the condition.」——
  @For 回傳 1，不是累積值**；上限「maximum of 252 statements」（整個 @For，非只主體）；
  無限迴圈逐字「The formula engine exits a formula or breaks an infinite loop if the time
  spent performing the iterations exceeds the standard timeout value allowed for an operation.」
- `H_WHILE_FUNCTION.html` — ✅ 逐字「Executes one or more statements iteratively while a
  condition is true. Checks the condition before executing the statements.」（先測、可能 0 次）；
  上限 254 句（與 @For 的 252 不同，故 252 為 @For 專屬）。
- `H_DOWHILE_FUNCTION.html` — ✅「Checks the condition after executing the statements」（後測、至少 1 次）。
- @Explode 以 `"\\"`（單一反斜線）分隔、`A[n]` 1-based 下標、`@Elements`、`@Member`（回第一個
  出現位置，故鏡像反轉在重名時會壞）——與系列前篇 [[formula-list-processing]]／[[formula-text-functions]] 一致。

### 矛盾檢查
各頁一致。timeout 保護只出現在 @For 頁（@While/@DoWhile 頁無此條），文章把它放在 @For 段、未誤植。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
特別指示查證：反轉例子中 `result` 於第一輪 `@If(result = ""; ...)` 被讀取時尚未賦值，是否安全。

**VERDICT：ISSUES（1 必修）→ 修後 PASS。**
- **必修**：反轉例子從 `A := @Explode(...)` 直接進迴圈，**沒有 `result := "";` 初始化**。
  Formula 讀取「從未賦值的暫存變數」會在求值時報錯（非靜默當空字串），且與文章自己 TL;DR／
  累積器段主張的「先 `result := ""`」自相矛盾。→ **已在 zh/en 兩版於 @Explode 後補
  `result := "";`**（審查回覆前即主動補上，審查獨立確認為必修）。
- **小修（非阻擋）**：252 句原繫於「主體」，官方是 @For 整體語句上限（@While/@DoWhile 為 254，
  故 252 確為 @For 專屬）→ 已把 TL;DR 與註解改為「整個 @For 上限 252 句」。
- 其餘全部通過：@For 四部位與逐字定義、**回傳 1 非累積值**（逐字前綴正確）、`"\\"`=單一反斜線、
  1-based `A[n]`、trace table（n=1 公司／n=2 部門\公司／n=3 組\部門\公司）、@For=初始化+@While、
  @While 先測／@DoWhile 後測、timeout 保護位置正確、@Member 鏡像反轉重名會壞（已妥善 hedge）。

## 標題候選
走標題優化 loop（AskUserQuestion，使用者拍板）：

- [汰除] 需求先行：`把 A\B\C 的組織階層反轉成 C\B\A：一個非用 @For 不可的 formula 實例` — 需求具體、
  有畫面，但把整篇窄化成單一例子。
- [汰除] 痛點 hook：`@For 回傳的是 1、不是你累積的值——formula 迴圈最容易愣的一點` — 抓「回傳 1」痛點，
  但視角偏窄、沒帶出反轉實例。
- [選定] 資訊·好搜：`Formula 的 @For 迴圈：什麼時候該用它，以及一個「反轉組織階層」的實例`
  — 使用者拍板。工具名 + 使用時機 + 真實例子都在，好搜。
  en 鏡像：`Formula's @For Loop: When You Actually Need It, and a Real 'Reverse an Org Hierarchy' Example`。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 formula 文件（@For/@While/@DoWhile）為主
- [x] 官方三頁驗證非 404
- [x] 矛盾檢查（各頁一致；timeout 只在 @For 頁、未誤植）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過
- [x] frontmatter YAML 驗證（`A\\B\\C` 逸出反斜線解析正常、無裸 `""` 陷阱）
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ ISSUES（1 必修）→ 修後 PASS

## 異動日誌
- 2026-08-26 WebFetch 官方 @For/@While/@DoWhile、雙語草稿（使用者真實反轉需求為主角）、
  diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-26 獨立 fact-check（subagent）→ 必修：例子缺 `result := ""` 初始化 → zh/en 補上；
  252 句歸屬改為 @For 整體 → 再驗 PASS（Opus 4.8）
