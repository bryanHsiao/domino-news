---
slug: ssjs-vector-multivalue
title: "XPages/SSJS: Working with Multi-Value Fields Using java.util.Vector"
lang: [zh-TW, en]
pubDate: 2026-08-12
status: staged                     # staged（_pending）→ shipped（promoted）
tags: [SSJS]
requester: 使用者 (bryan)          # 誰提出這篇（同一張 SSJS 截圖的 SSJS 對照角度）
author_model: claude-opus-4-8      # 寫作模型
review_model: claude-sonnet (獨立 reviewer subagent)  # 審查模型（獨立於寫作）
review_result: "humanizer 45/50；獨立事實查核(Sonnet) ISSUES→已修（getComponent 敘述精確化）"
created: 2026-08-02
updated: 2026-08-02
---

# 研究軌跡 — ssjs-vector-multivalue

SSJS 對照篇，與 [`lotusscript-remove-element`](2026-08-11-lotusscript-remove-element.md)
**雙向連結**（LS 篇 cross-language 段已回補指向本篇的連結）。

## 研究來源 (Research trail)

### NotebookLM — ✅ 有回答（無污染）
- Notebook：SSJS / XPages 參考，
  `https://notebooklm.google.com/notebook/0c88f101-7fb7-4ce2-b35e-37a87d3547ec`
- 日期：2026-08-02
- 問句：SSJS 用 java.util.Vector 操作多值——getItemValue 回型別、@Explode/@Implode、
  Vector 方法、replaceItemValue 接受 Vector、倒著刪的 index-shift、Iterator/List 替代、
  getComponent().getValue() 型別、空值/型別 coercion、完整範例。
- 取得：getItemValue 回 java.util.Vector、replaceItemValue 接受 Vector（最可靠）、
  倒著刪原理、Iterator.remove()、getComponent().getValue() 型別依控制而定、
  **空多值欄位常回 size 1 的 [""]** 這個雷、完整範例。這本回得完全在題、無污染。

### WebFetch — 交叉驗證（可引用原文 + URL 驗證非 404）
- `reference/r_domino_Document.html`（14.5.1）— ✅ 存在（SSJS NotesDocument）。
  replaceItemValue 原文逐字："replaces all items of the specified name with one new
  item, which is assigned the specified value."
- `docs.oracle.com/.../java/util/Vector.html`（Java SE 8）— ✅ 存在。原文："The Vector
  class implements a growable array of objects."；10 個方法逐一確認；reviewer 另指出
  Oracle **明載** removeElementAt 的 index-shift 行為（比文中僅用推理更強）。
- `reference/r_wpdr_globals_r.html`（14.5.1）— ✅ 存在（SSJS 全域 getComponent）。

### 矛盾檢查
NotebookLM 與官方文件一致，無矛盾。

## 獨立審查 (review)

**審查模型**：Claude Sonnet（獨立 reviewer subagent，與寫作模型 Opus 4.8 分開）。

**VERDICT：ISSUES → 已修**：

- ✅ **getComponent 敘述精確化**（修正）：「陷阱」段原本把 `getComponent` 說成「拿到 UI
  控制的值」——不精確。`getComponent` 回的是 UI **元件**（"the base object for a UI
  component"），要再 `.getValue()` 取值。已改（zh + en）；TL;DR 與 code 本來就寫對
  `getComponent().getValue()`。
- ✅ 核心全對：Vector API 10 方法、倒著刪原理、replaceItemValue 逐字引用、程式碼 4 段
  皆正確慣用（含逐行解讀使用者截圖）。
- ⚠️ 來源層級標注（正確、非該頁逐字）：
  - `getItemValue 回 Vector` / `replaceItemValue 接受 Vector`：r_domino_Document 頁只列
    一行 method 摘要、未展開 Vector 型別；此為標準 lotus.domino 行為（NotebookLM 確認）。
  - 空多值欄位回 `[""]`、`getValue()` 型別依控制而定：標準 Domino/XPages 實務知識，
    非那三篇 inline 文件逐字。文中以「雷」呈現、未宣稱逐字出自文件。

## 查證 checklist
- [x] 研究鏈 NotebookLM（SSJS notebook，無污染）→ WebFetch 走完
- [x] NotebookLM vs 官方文件交叉驗證，無矛盾
- [x] 三個官方 URL 逐一 WebFetch 驗證非 404
- [x] inline-link diversity 通過（各語言 3 個相異 URL 各 2 次 = 33%）
- [x] 與 LS 篇雙向連結（LS 篇 cross-language 段已回補）
- [x] 雙語 build 通過（frontmatter schema 驗證）
- [x] humanizer-zh-tw 正式 pass（雙語 45/50）
- [x] 獨立事實查核完成（Sonnet reviewer，ISSUES→已修）

## 異動日誌
- 2026-08-02 建檔、NotebookLM+WebFetch 研究、雙語草稿、sidecar（Opus 4.8）
- 2026-08-02 humanizer-zh-tw 正式 pass（雙語 45/50，Opus 4.8）
- 2026-08-02 獨立事實查核（Sonnet reviewer）→ 修 getComponent 敘述（Opus 4.8）
- 2026-08-02 回補 LS 篇→本篇的雙向連結（Opus 4.8）
- 2026-08-02 進 `_pending`（Path A，pubDate 2026-08-12）
