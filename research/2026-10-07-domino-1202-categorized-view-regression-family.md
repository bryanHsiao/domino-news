---
slug: domino-1202-categorized-view-regression-family
title: "12.0.2 分類/子分類視圖 regression 家族總覽（四支 KB、兩參數）"
lang: [zh-TW, en]
pubDate: 2026-10-07
status: staged（_pending，排 2026-10-07，Path A）
tags: [Notes Client, XPages, Admin]（TYPE 留白：reference/map、非 Tutorial）
requester: 使用者（給 KB0102042 後問「感覺也蠻像的、若相關可連結」→ 連進 10/06 後，再指「寫那篇 12.0.2 分類視圖 regression 家族總覽」）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw
created: 2026-10-07
updated: 2026-10-07
---

# 研究軌跡 — domino-1202-categorized-view-regression-family

hub/map 型 troubleshooting。把 12.0.2「子分類底下文件消失」的四支官方 KB 整理成一張對照表 + 對症流程，當 cluster hub，深連回 10/06 的 XPages 細節版。

## 立論：一個家族、兩個 sub-family（非一顆 bug）

四支官方 KB 同一病根句（12.0.2「advanced NIF lookup」），但**修復版本不同（FP1 vs FP3/14.0）＝兩組不同改動**，這是「參數不通用」的根因，也是這篇的 thesis。

| 介面 | 參數（範疇） | 修復 | KB |
|---|---|---|---|
| `@PickList`/`PicklistCollection` 對話框 | `EnableExtendedFindByKey=0`(client) | FP1 | KB0102042 |
| Embedded view「Show single category」+ 子分類 | `EnableExtendedFindByKey=0`(client) | FP1 | KB0102043 |
| Embedded view | `EnableExtendedFindByKey=0`(client) | FP1 | KB0101979 |
| XPages 多欄分類、下一欄仍分類 | `DISABLE_REFIND_IN_READENTRIES=1`(server) | FP3/14.0 | KB0102504 |

## 來源（四支皆公開 Defect Article，內建瀏覽器逐字讀，非 WebFetch 殼）

- **KB0102042**（[link](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102042)）：@PickList/PicklistCollection；只顯示子分類最上層；`EnableExtendedFindByKey=0`(client)+重啟；成因「advanced form of NIF lookup」；Resolved 12.0.2 FP1；姊妹列 KB0102043/KB0101979。
- **KB0102043**（[link](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102043)）：Embedded view「Show single category」+ 子分類；只顯示最上層；同參數/成因；**多一句關鍵**：「only effect the HCL Notes clients with that INI and not the HCL Domino Server indexing」（純 client、不動 server 索引）；Resolved 12.0.2 FP1。
- **KB0101979**（[link](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0101979)）：Embedded views only show first category；同參數/成因；Resolved 12.0.2 FP1（Applies to 寫 HCL Notes v12.0.2）。
- **KB0102504**（[link](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0102504)，10/06 篇主源）：XPages ReadEntries refind；`DISABLE_REFIND_IN_READENTRIES=1`(server)；成因 SPR# PJONB7GRUL 修正引入（regression=MNIACMGKUV）；Resolved 12.0.2 FP3/14.0。
- 內部連結（不計 diversity）：10/06 [xpages-multi-column-category-document]（B 群細節版）、7/09 [by-key-lookup-categorized-views]（鄰居：`GetAllDocumentsByKey` 多層分類語意，非 12.0.2 regression，明確區分）。
- **未跑 NotebookLM**：與 10/06 同理——官方 KB 逐字（瀏覽器讀）為第一手，無對應「regression KB」notebook；notebook 是 class/API 參考。identifier（@PickList/PicklistCollection）以 KB repro 步驟為準、不深入教學。

## 措辭守則（避免過度宣稱）

- 明講「同家族、但兩組不同改動、不同 SPR」，**不宣稱兩群是同一段 code**；以 FP1 vs FP3/14.0 佐證。
- 鄰居 7/09 明標「不同問題（API 語意）、非 12.0.2 regression、不靠這兩參數」，不混談。
- `EnableExtendedFindByKey=0` 只影響 client、不動 server 索引——引 KB0102043 原句。

## 標題候選

- [汰除] 問題先行：`升到 12.0.2 後分類底下的文件不見了?先分清楚你中的是哪一個` — 症狀好搜，但沒帶出「家族／四支 KB／兩參數」核心，讀起來像單一 bug。
- [汰除] 好處先行：`一張表看懂 12.0.2「子分類文件消失」：哪個介面該用哪個 notes.ini 參數` — 好處明確，但「一張表看懂」略帶輕鬆 over-promise，且沒點出 regression 家族的立論。
- [選定] 概念 hook＋問題：`12.0.2「子分類底下的文件消失」regression 家族：四支 KB、兩個 notes.ini 參數，先分清楚你中的是哪一個`
  — 「家族」是本篇獨有立論、「四支 KB／兩參數」是最硬的具體資訊、末句給行動；症狀詞前置好搜、reference-map 不承諾 tutorial（不過度承諾）。標題自決（使用者已授權產文標題自決）。
  en 鏡像：`The 12.0.2 'Documents Vanish Under a Sub-Category' Regression Family — Four KBs, Two notes.ini Parameters, Matched to Your Interface`

## 查證 checklist

- [x] 四支 KB 症狀/參數/範疇(client vs server)/修復版本 全對逐字
- [x] 家族＝同 NIF 病根、兩組不同改動（FP1 vs FP3/14.0）＝不過度宣稱同一 code
- [x] KB0102043「只影響 client、不動 server 索引」引原句
- [x] 鄰居 7/09 明確區分（API 語意 vs 12.0.2 regression）
- [x] inline-link diversity：4 相異外部（四支 KB）各 25%（<40%），每語 8 外部連結（≥2）
- [x] TYPE 留白；tags Notes Client + XPages + Admin（PRODUCT/TECH/TOPIC 各一）
- [x] 雙語 temp-build 通過
- [x] humanizer-zh-tw：約 45/50（收兩處 meta transition；表格/bullet 為 reference-map 正當結構）
- [x] fact-check（獨立 subagent）→ **FAIR、可發**。四支 KB 症狀/參數/範疇/修復版本全對逐字；client-vs-server 軸線最扎實（對齊參數位置＋fixpack 產品＋症狀出現處）；NIF＝Notes Index(ing) Facility，`NIFFindByKeyExtended*`/`NIFReadEntries*` 為實存函式，兩路徑框架成立。修正/軟化：
  - **事實修正（自查、非 agent 抓）**：原寫「四支成因欄都貼同一句 advanced NIF lookup」→ 錯，該句只在三支 A 群；KB0102504(B 群)成因是 PJONB7GRUL 的 refind。已改「三支貼同句、第四支寫另一回事」。
  - 軟化 ①「different fix versions **prove** two changes」→ 改以「兩參數＋B 群 SPR＋分別 FP1/FP3 才修」為主證、fix 版本佐證，用「都指向」不用「證明」。
  - 軟化 ②「單一根因/one root cause」→ 改「同屬 NIF 這層、同一波、同一類症狀＝家族；但兩個各自獨立的改動」。
  - hedge ③ A 群 FindByKey：KB 只說 advanced NIF lookup、未點名 find-by-key → 明寫「從參數名 `EnableExtendedFindByKey` 反推」。
  - hedge ④ B 群 refind：KB 只說修 PJONB7GRUL 造成 regression → 明寫「看參數名 `DISABLE_REFIND_IN_READENTRIES`，那次修復顯然引入 refind」。
  - agent 提醒未引進 PSHECLULWM（Computed-for-Display 情境、不在四支內）；A 群三支無 SPR、文中未暗示——OK。

## 異動日誌

- 2026-10-07 新建。四支公開 KB 瀏覽器逐字讀 → 家族地圖 + 兩參數對照 + 對症流程；深連 10/06、鄰接 7/09；humanizer 過；排 10/07 Path A。（Opus 4.8）
