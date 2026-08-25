---
slug: formula-name-functions
title: "@Name Is the Swiss Army Knife for Notes Names: Three Formats, Any Component"
lang: [zh-TW, en]
pubDate: 2026-08-28
status: staged
tags: [Formula, Tutorial]
requester: 使用者 (bryan，Formula @function 系列)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；2 精確化（public view、[CANONICALIZE] 補段）已套"
created: 2026-08-25
updated: 2026-08-25
---

# 研究軌跡 — formula-name-functions

Formula @function 系列第 4 篇（8/28，@Name 名稱格式）。交叉連結 [[notesname-formats]]（8/6，三格式為什麼會比對失敗）。

## 研究來源 (Research trail)

### WebFetch — 官方 HCL Formula 文件（逐一驗證非 404）
- `H_NAME.html` — ✅ `@Name([action]; name)`；逐字「Allows you to manipulate hierarchical
  names.」；keywords [CN]/[ABBREVIATE]/[CANONICALIZE]/[O]/[OU1-4]/[G]/[S]/[C]/[Q]/[TOKEYWORD]；
  三格式轉換範例（含 [CN] 官方範例 "Mary Tsen"）。
- `H_USERNAME.html` — ✅ 逐字「Returns the current user name.」；canonical（CN/OU/O/C）；
  index 0 主/1 替代（R5）；server=簽署者；public view 不可預測；不該當安全機制。
- `H_V3USERNAME.html` — ✅ abbreviated 格式（去標籤）；函式名 @V3UserName（非 @V4UserName，
  後者為 404）。

### 矛盾檢查
各頁一致。三格式與「比對前 [CANONICALIZE] 兩邊」和 [[notesname-formats]] 一貫。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
核對 @Name 語法 + 逐字、所有 keyword 名與描述、三格式範例、@UserName/@V3UserName、
伺服器坑三宣稱。

**VERDICT：PASS**（零必修）。keyword 名全對、三格式範例準（[CN] 對上官方範例）、
@UserName「the current user name」逐字 + index、@V3UserName abbreviated、
伺服器坑三宣稱（簽署者「the agent signer is considered the current user」、public view
不可預測、「Don't depend on @UserName as a security mechanism」）全部通過。套 2 精確化：
- ✅ 「public server view」→「public view」（官方無 server 一字）。
- ✅ 補 `[CANONICALIZE]` 對缺段名稱會用當前使用者 ID 補段的 nuance。

## 標題候選
走標題優化 loop：

- [選定] 概念 hook：`@Name 是處理 Notes 名稱的瑞士刀：三種格式互轉、抽出任一段`
  — 使用者拍板。點出 @Name 是那把刀（本篇主角），簡潔。
  en 鏡像：`@Name Is the Swiss Army Knife for Notes Names: Three Formats, Any Component`。
- [汰除] 問題先行：`為什麼 server agent 裡 @UserName 回的是簽署者、不是使用者？` — 坑好，但把 @Name 主線矮化。
- [汰除] 資訊·好搜：`Formula 處理 Notes 名稱：@Name 三格式互轉、@UserName/@V3UserName 取當前使用者` — 齊、好搜，但偏長。

## 查證 checklist
- [x] 研究鏈：WebFetch 官方 formula 文件為主
- [x] 官方三頁驗證非 404（@V4UserName 為 404、確認正確名 @V3UserName）
- [x] 矛盾檢查（各頁一致；與 notesname-formats 一貫）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 @UserName/@V3UserName 40% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（實測導向、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-25 WebFetch 官方 formula 文件、雙語草稿、修 diversity、標題 loop、sidecar（Opus 4.8）
- 2026-08-25 獨立 fact-check（subagent）→ PASS；套 2 精確化（public view / [CANONICALIZE] 補段）（Opus 4.8）
