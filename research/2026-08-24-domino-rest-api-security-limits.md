---
slug: domino-rest-api-security-limits
title: "The Domino REST API Before Go-Live: the Security Model, One-Way Rich Text, CORS, and Admin Ports"
lang: [zh-TW, en]
pubDate: 2026-08-24
status: staged
tags: [Domino REST API, Security, DevOps]
requester: 使用者 (bryan，DRAPI 系列收尾)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；核心 Readers/ACL 宣稱有官方依據、零必修"
created: 2026-08-19
updated: 2026-08-19
---

# 研究軌跡 — domino-rest-api-security-limits

DRAPI 系列第 6 篇（8/24，收尾：安全與上線限制）。承全系列，交叉連結 1–5 + RAG recap。

## 研究來源 (Research trail)

### NotebookLM — 沿用系列判斷，走 WebFetch 官方文件

### WebFetch — 官方 DRAPI 文件（逐一驗證非 404）
- `references/security/index.html` — ✅ 逐字「All Domino REST API access is authorized
  using a signed JWT claim」「No anonymous access is granted for REST data」「Databases
  aren't automatically exposed on REST when you run Domino REST API. Only the ones
  configured by the administrators」；The Barbican（per-form/field/user read/write）。
  ⚠️ 此頁**未逐條明講** ACL/Readers 欄位在 REST/DQL/lists 上照算——文中以「以 Domino
  使用者身分讀（JWT sub）」推導。**核心宣稱交給 reviewer 查證是否有據**。
- `references/limitation.html` — ✅ 逐字「The Domino REST API translates Rich Text to
  HTML/MIME. This is one way. The Domino REST API doesn't translate MIME back to Rich
  Text.」「Only configured fields can be created, read, or updated.」「If an item doesn't
  exist in a document, it doesn't get returned.」「When you have multiple views with the
  same name, the Admin UI selects the first one found.」
- `references/troubleshooting.html` — ✅ CORS 常見錯誤；BindException（port 撞）、
  OutOfMemory、keepconfig.d JSON 錯誤。
- Port（8880 資料 / 8889 console / 8890 metrics / 8886 health）承第二篇 functional accounts。

### 矛盾檢查
各頁一致。Readers 相關教訓交叉引 [[openntf-domino-iq-rag-webinar]]（RAG 到 FP1 才修好、
「文件層安全值得自己實測」）。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
特別交代查證**核心宣稱**（DRAPI 以 Domino 使用者身分讀→ACL/Readers 照算，跨 CRUD/
lists/DQL）是否有據或過度，加上所有逐字引用、port、CORS、回顧表。

**VERDICT：PASS**（零必修）。**核心宣稱有官方依據、非過度**：
- JWT `sub` = Domino distinguished name（authentication.html 逐字確認）
- 以該使用者身分讀、ACL 限制結果：authentication.html 逐字「Access is limited by Domino's
  ACL entries. Users can only access databases that grant them access in the ACL.」
- Readers/Authors 照算：security index 指向 The Barbican（per-form/field/user），
  Barbican 明列 schema 擴充含 readers/names/authors——DRAPI 明確 Readers/Names/Authors-aware。
- 唯一 soft flag：DQL-specific 的 reader-bounded 一句官方未逐條說；但文中「自己實測確認」
  的 hedge 已中和，不算過度。
所有 7 處逐字引用 word-for-word；port（8880/8889/8890/8886，官方且建議 8889 鎖 localhost）、
CORS/BindException/OOM/keepconfig.d、回顧表 全部通過。zh/en 主張與引用一致。

## 標題候選
走標題優化 loop：

- [汰除] 問題先行：`上線前的 Domino REST API：它會不會漏掉 Readers 保護的文件？還有哪些坑會咬你` — 打在最大恐懼，但偏長。
- [選定] 資訊·好搜：`Domino REST API 上線前：安全模型、rich text 單向、CORS 與 admin port`
  — 使用者拍板。把四個上線前重點都列進標題、好搜。
  en 鏡像：`The Domino REST API Before Go-Live: the Security Model, One-Way Rich Text, CORS, and Admin Ports`。
- [汰除] 概念 hook：`DRAPI 不繞過 Domino 安全，而是疊在上面——系列收尾的安全與限制` — 點題準，但搜尋性弱。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 DRAPI security/limitation/troubleshooting 為主
- [x] 官方三頁 WebFetch 驗證非 404
- [x] 矛盾檢查（各頁一致；Readers 教訓交叉引 RAG recap）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 security/limitation 40% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS（核心 Readers/ACL 宣稱有官方依據）

## 異動日誌
- 2026-08-19 WebFetch 官方文件、雙語草稿、修 diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-19 獨立 fact-check（subagent）→ PASS；核心 Readers/ACL 宣稱查證有據、零必修（Opus 4.8）
