---
slug: java-collection-iteration
title: "Looping a DocumentCollection in Java: Get the Next One First, Then recycle This One"
lang: [zh-TW, en]
pubDate: 2026-08-16
status: staged
tags: [Java]
requester: 使用者 (bryan)          # Java 資料層四部曲之三
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；NotebookLM 仍拒答→WebFetch fallback"
created: 2026-08-12
updated: 2026-08-12
---

# 研究軌跡 — java-collection-iteration

Java 資料層四部曲第 3 篇（8/16）。主題：Java 版集合迭代的正確寫法——
DocumentCollection 的 getFirstDocument/getNextDocument、「先拿下一份再 recycle
當前」的順序、isValid 濾刪除標記、何時改用 ViewNavigator。

## 研究來源 (Research trail)

### NotebookLM — ⚠️ 仍拒答（沿用前兩篇判斷）
Java notebook chat 仍在污染狀態，直接走 WebFetch。

### WebFetch — 官方 Java class 頁（逐一驗證非 404）
- 首輪猜 `H_DOCUMENTCOLLECTION_CLASS_JAVA` / `H_VIEWNAVIGATOR_CLASS_JAVA` 皆 404；
  修正為 **NOTES 前綴**（同 DateTime）後命中。
- `H_NOTESDOCUMENTCOLLECTION_CLASS_JAVA.html` — ✅ getFirstDocument()（無參）、
  getNextDocument 兩形式（無參用 current pointer／帶 Document 參數）；current
  pointer；isValid 濾刪除標記（deletion stub）。
- `H_NOTESVIEWNAVIGATOR_CLASS_JAVA.html` — ✅ 逐字 "A view navigator provides
  access to all or a subset of the entries in a view."／"A goto method is favored
  over a get method for navigation-only purposes because a goto method does not
  create a ViewEntry object."／"You can set the cache size and should set it to
  try to minimize server access."／IsAutoUpdate=false 建議。
- `H_RECYCLE_METHOD_JAVA.html` — ✅（第 3 個 inline URL，回收語意佐證）。
- getNextDocument 專屬方法頁多個 URL 404；兩形式已由 class 頁 + reviewer 另查的
  官方 examples 頁佐證。

### 矛盾檢查
「先拿下一份再 recycle 當前」是公認 Domino 實務、非可引用的官方原句，文中未當引用
呈現。其餘與站上 [[java-recycle-memory]]、[[java-document-items]]、[[java-datetime]] 一致。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch 兩 class 頁 + 官方 "Collecting all documents" Java 範例頁 + getNextDocument
範例頁，逐條核對。

**VERDICT：PASS**。零必修。getFirstDocument/getNextDocument 兩形式、recycle 順序樣式
（正確且文中未偽稱為官方引用）、isValid（在 Document、true=真/false=刪除標記）、
三處 ViewNavigator 逐字引用全部 word-for-word、IsAutoUpdate 建議、code 例、跨語言主張
——全部通過。

## 標題候選
走標題優化 loop：

- [選定] 概念 hook：`在 Java 裡迴圈跑 DocumentCollection：先拿下一份，再 recycle 這一份`
  — 使用者拍板。直接把正確順序（本篇 takeaway）寫進標題，好記又可操作。
  en 鏡像：`Looping a DocumentCollection in Java: Get the Next One First, Then recycle This One`。
- [汰除] 問題先行：`在 Java 裡跑上萬份文件，為什麼記憶體會爆？` — 痛點清楚，但沒點出「順序」這個核心解法。
- [汰除] 資訊·好搜：`Java 迭代 DocumentCollection：getFirstDocument、getNextDocument 與 recycle 順序` — 方法名齊、好搜，但沒鉤子。

## 查證 checklist
- [x] 研究鏈：NotebookLM（拒答）→ WebFetch fallback 走完
- [x] 官方 Java class 頁逐一 WebFetch 驗證非 404（修正 NOTES 前綴後命中）
- [x] 矛盾檢查（各頁 + recycle/item/datetime 篇一致）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%；初稿 ViewNavigator 67% 已修）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（LS→Java 實測口吻、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-12 WebFetch class 頁（修 NOTES 前綴）、雙語草稿、標題 loop、sidecar（Opus 4.8）
- 2026-08-12 修 inline-link diversity（ViewNavigator 67%→33%，補 recycle inline）（Opus 4.8）
- 2026-08-12 獨立 fact-check（subagent）→ PASS（Opus 4.8）
- 2026-08-12 進 `_pending`（Path A，pubDate 2026-08-16）
