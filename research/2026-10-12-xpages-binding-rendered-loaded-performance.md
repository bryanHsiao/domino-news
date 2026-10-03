---
slug: xpages-binding-rendered-loaded-performance
title: "XPages 效能：#{} vs ${}、rendered vs loaded（computed 重算）"
lang: [zh-TW, en]
pubDate: 2026-10-12
status: staged（_pending，排 2026-10-12，Path A）
tags: [XPages, Performance]（TYPE 留白：效能概念解說）
requester: 使用者（給 intec「Understanding Partial Execution Part Three – JSF Lifecycle」問值不值得單獨寫 → 我判斷「partial exec/lifecycle 已被 10/01 涵蓋（且 10/01 已引該 intec 文），但其效能角度是空檔」→ 使用者：以效能角度起草、排 10/12）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-12
updated: 2026-10-12
---

# 研究軌跡 — xpages-binding-rendered-loaded-performance

從 intec part-three 衍生、但**走它沒被站上涵蓋的效能角度**（非重寫 partial exec/lifecycle）。

## 為什麼不是重寫 partial execution

- 站上 **10/01 `xpages-partial-refresh-execution`** 已涵蓋 JSF 六階段 + partial refresh/execution（execMode/execId）+ 驗證跳第 6 階段，**且已把這篇 intec 文列為來源**。10/11 getDocument 又講過六階段。再寫 partial exec = 重複。
- intec part-three 的**效能段**（computed/rendered 一次提交重算多遍、`${}` vs `#{}`、`rendered` vs `loaded`）站上**完全沒寫**（grep `rendered 屬性/loaded 屬性/每階段` → 0）。本篇補這塊。

## 核心（已查實 + 官方）

- **`#{}` = compute dynamically（井號）= 每次讀/render 重算**（生命週期多階段 → 一次提交好幾遍）；**`${}` = compute on page load（錢號）= 載入算一次、靜態**。官方 HCL「Value (control and data binding)」逐字：「pound sign to compute dynamically or a dollar sign to compute on page load」；社群逐字：「`#{...}` computed at each update of the page, `${...}` computed only once at the first loading」。
- caveat：`${}` 不能參照生命週期後期才建的物件（repeat row var、每請求 data source 值）；`${}`/`#{}` 不可混用（混用逼 `#{}` 載入時算）。
- `rendered=false`＝建進 tree、不顯示、**各階段仍處理/評估、資源仍載**；`loaded=false`＝**不建進 tree、全程跳過、getComponent 抓不到**。靜態可見性用 loaded 省。
- 連帶：submittedValue（早期字串）vs getValue（第 4 階段後）；關 validation 不跳 converter。

## ⚠️ 查證關卡：${}/#{} 方向差點被 garbled WebFetch 帶反

WebFetch intec bindings 文時，抽取器**把 `${}`/`#{}` 的 compute-dynamically/page-load 標反了**（這是 XPages 最惡名昭彰的混淆點）。沒照抽取結果寫，改用乾淨 WebSearch（逐字「`#{}` at each update、`${}` once at first loading」）+ **官方 HCL value binding 文**（「pound＝compute dynamically、dollar＝compute on page load」）釘死正確方向。教訓：method/語意級、尤其易反的點，單一抽取不可信，要回官方對照。另交獨立 fact-check 專門驗方向。

## 站上互連

- 連回 10/01（lifecycle/partial exec 背景）、10/11（getDocument：submittedValue vs getValue 同一條生命週期）。串成 XPages 系列（10/01→10/10→10/11→10/12）。

## 標題候選

- [汰除] 概念平述：`XPages 的 #{} vs ${} 與 rendered vs loaded` — 清楚但沒 hook、沒點出痛點。
- [汰除] 好處先行：`XPages 效能:少算幾遍 computed 就快了` — 太空泛。
- [選定] 症狀 hook＋具體旋鈕：`XPages 效能：為什麼一次提交你的 computed 被算了好幾遍——#{} vs ${}、rendered vs loaded`
  — 症狀（computed 被算好幾遍、很多人踩過、好搜）＋點出三個具體旋鈕；不過度承諾（是解說非 tutorial）。標題自決（使用者已授權）。
  en 鏡像：`XPages Performance: Why Your Computed Values Run Many Times per Submit — #{} vs ${}, rendered vs loaded`

## 查證 checklist

- [x] `#{}`＝compute dynamically/重算、`${}`＝compute on page load/一次：官方 HCL + 社群逐字（方向確認、非反）
- [x] `${}` caveat（後期物件）、`${}`/`#{}` 不可混用
- [x] rendered（在 tree、各階段處理）vs loaded（不建 tree、跳過、getComponent 抓不到）
- [x] computed 一次提交被評估多遍
- [x] submittedValue vs getValue（第 4 階段後）、validation 關了 converter 照跑
- [x] inline-link diversity：3 相異外部各 33%（官方 HCL + intec + qtzar）；每語 3 外部
- [x] TYPE 留白；tags XPages + Performance
- [x] 雙語 temp-build 通過
- [x] humanizer 自審 ~45/50
- [x] fact-check（獨立 subagent）→ **FAIR、零錯誤、無須改字**。**claim 1 方向明確判定 CORRECT（非反）**：`#{}`＝compute dynamically/重算、`${}`＝compute on page load/一次，官方 HCL 文逐字（「pound to compute dynamically / dollar to compute on page load」）+ Intec（「Compute on Page Load [${}] vs Compute Dynamically [#{}]」）佐證；agent 另確認「When # Runs at Page Load」標題只指混用例外、文中用對。claims 2–7 全逐字確認：`${}` 後期物件 caveat、`${}`/`#{}` 不可混（value 屬性是單一 string 參數）、rendered（在 tree、資源仍注入）vs loaded（跳過、getComponent 抓不到）、「properties get recalculated a number of times」、submittedValue vs getValue（phase 4 後）、「converters... you cannot skip converters」。zh/en 方向一致。

## 異動日誌

- 2026-10-12 新建。intec part-three 的效能角度（非重寫 partial exec，那已在 10/01）；${}/#{} 方向對官方 HCL 釘死（garbled WebFetch 差點帶反、已擋）；連回 10/01/10/11；humanizer 自審；排 10/12 Path A。（Opus 4.8）
