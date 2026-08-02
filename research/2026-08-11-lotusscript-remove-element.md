---
slug: lotusscript-remove-element
title: "LotusScript Has No removeElementAt: Removing One Element from an Array, List, or Multi-Value Field"
lang: [zh-TW, en]
pubDate: 2026-08-11
status: staged                     # staged（_pending）→ shipped（promoted）
tags: [LotusScript]
requester: 使用者 (bryan)          # 誰提出這篇（由一張 SSJS Vector.removeElementAt 截圖起）
author_model: claude-opus-4-8      # 寫作模型
review_model: claude-sonnet (獨立 reviewer subagent)  # 審查模型（獨立於寫作）
review_result: "humanizer 45/50；獨立事實查核(Sonnet) PASS（引用逐字、5 段 LS code 語法全有效）"
created: 2026-08-02
updated: 2026-08-02
---

# 研究軌跡 — lotusscript-remove-element

由使用者一張 SSJS 截圖（`java.util.Vector.removeElementAt` 依 index 刪多值）起題：
「LS 有沒有類似功能？」→ LS 角度專篇。SSJS 對照篇規劃為 2026-08-12（雙向連結）。

## 研究來源 (Research trail)

### NotebookLM — ✅ 有回答（無污染）
- Notebook：LotusScript 參考（V14.0），
  `https://notebooklm.google.com/notebook/bb543ae4-7f16-4048-aee2-93d31543543e`
- 日期：2026-08-02
- 問句：LS 如何從集合/陣列刪一個元素（無 removeElementAt；Split/Join；List+Erase；
  動態陣列 ReDim/Erase 與重建；多值欄位 item.Values / Evaluate+@Replace）。
- 取得：Split/Join、List+Erase(tag)、ReDim Preserve 只改末維、ReplaceItemValue、
  Evaluate+@Trim/@Replace、caveat（item 值恆為陣列 / Variant 型別 / ReDim Preserve
  效能）、兩段範例。**這本這次回得完全在題上、無「問X答Y」污染。**

### WebFetch — 交叉驗證（可引用原文 + URL 驗證非 404）
- `LSAZ_SPLIT.html`（14.5.1）— ✅ 存在。原文："Returns an Array of Strings that
  are the substrings of the specified String."（R6 起）。
- `LSAZ_ERASE_STATEMENT.html`（14.5.0）— ✅ 存在。原文：動態陣列「removes all
  elements from storage and recovers the storage」（整個清空）；List 元素
  「no longer exists in the list」（刪一個）。**本篇核心對照的出處。**
- `LSAZ_WORKING_WITH_LISTS.html`（14.5.0）— ✅ 存在。原文：「Erase listName(listTag)
  removes the individual element identified by listTag from the list」+ IsElement 守讀取。
- `H_USING_THE_EVALUATE_STATEMENT.html`（14.5.1）— ✅ 存在（Evaluate + doc context）。
- **URL pattern 註記**：LS 語言參考是 `LSAZ_<NAME>_FUNCTION/_STATEMENT.html`
  （`LSAZ_ERASE_STATEMENT`、`LSAZ_FORALL_STATEMENT`…）；`H_<NAME>` 前綴的多為 404。
  Split 例外為 `LSAZ_SPLIT.html`（無 _FUNCTION）。

### 矛盾檢查
NotebookLM 與官方文件一致，無矛盾。

## 獨立審查 (review)

**審查模型**：Claude Sonnet（獨立 reviewer subagent，與寫作模型 Opus 4.8 分開），
重新 WebFetch 四份官方文件、逐條核對，並逐段檢查 LS 程式碼語法。

**VERDICT：PASS**：

- ✅ 引用逐字正確（Split、Erase 動態陣列/List 元素、Working-with-lists、Evaluate）。
- ✅ 核心對照（陣列 Erase=全清、List Erase(tag)=刪一個）官方逐字確認。
- ✅ **5 段 LS 程式碼語法全部有效**：Split/Join、陣列重建（ReDim Preserve 縮末維、
  n=0 時 fallback Erase）、List+Erase(tag)+IsElement、Evaluate、SSJS→LS 翻譯迴圈。
- ⚠️ 正確但非那四篇 inline 文件（來源層級標注）：Join 為 Split 反向、ReDim Preserve
  只改末維、`item.Values` 恆為陣列——皆標準 LS 知識，文中未宣稱逐字出自這四篇。
- ℹ️ 最後「翻譯 SSJS」那段以 `wordValue`/`deleteValue` 為既有輸入（示意 excerpt，
  註解已說明），非可獨立執行的完整程式——刻意如此。

## 查證 checklist
- [x] 研究鏈 NotebookLM（LS notebook，無污染）→ WebFetch 走完
- [x] NotebookLM vs 官方文件交叉驗證，無矛盾
- [x] 四個官方 URL 逐一 WebFetch 驗證非 404（並記錄 LSAZ URL pattern）
- [x] inline-link diversity 通過（各語言 4 個相異 URL 各 1 次 = 25%）
- [x] 雙語 build 通過（frontmatter schema 驗證；LS code 高亮 fallback txt 為站台既有行為）
- [x] humanizer-zh-tw 正式 pass（雙語 45/50；收斂 reveal 破折號 zh3/en3）
- [x] 獨立事實查核完成（Sonnet reviewer，PASS）

## 異動日誌
- 2026-08-02 建檔、NotebookLM+WebFetch 研究、雙語草稿、sidecar（Opus 4.8）
- 2026-08-02 humanizer-zh-tw 正式 pass（雙語 45/50，Opus 4.8）
- 2026-08-02 獨立事實查核（Sonnet reviewer）→ PASS（Opus 4.8）
- 2026-08-02 進 `_pending`（Path A，pubDate 2026-08-11）
