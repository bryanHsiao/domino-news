---
slug: java-document-items
title: "Reading and Writing Notes Items in Java: getItemValue Hands You a Vector, Not the Array You Know"
lang: [zh-TW, en]
pubDate: 2026-08-14
status: staged                     # staged（_pending）→ shipped（promoted）
tags: [Java]
requester: 使用者 (bryan)          # 誰提出（8/13–8/16 Java 資料層四部曲之一）
author_model: claude-opus-4-8      # 寫作模型
review_model: general-purpose (獨立 fact-check subagent)  # 審查模型（獨立於寫作）
review_result: "獨立 fact-check(subagent) PASS；NotebookLM 拒答→WebFetch fallback（見下）"
created: 2026-08-12
updated: 2026-08-12
---

# 研究軌跡 — java-document-items

Java 資料層四部曲第 1 篇（8/14）。主題：Java 版 `Document` 的讀寫 item，
與 LotusScript 的差異。

## 研究來源 (Research trail)

### NotebookLM — ⚠️ 拒答，改走 WebFetch
- Notebook：Java back-end API（`lotus.domino.*`），
  `https://notebooklm.google.com/notebook/99039350-51ae-4d0c-b79b-8d922e29697b`
- 問了 item 讀寫的綜合題，Gemini Notebook 回
  「無法回答這個問題，請換個說法或提出其他問題」。連兩次皆然；`Existing chat
  pairs: 3`，chat 已開始累積（[[reference_notebooklm_repair]] 記的污染前兆）。
- 依研究鏈規則（NotebookLM 薄／拒答時 fall back 官方 doc）改走 WebFetch。
  未硬逼、未擅自清 chat（清史需使用者授權且 headless 不可行）。

### WebFetch — 官方 Java 方法頁（逐一驗證非 404，取得可逐字引用原文）
- `H_GETITEMVALUE_METHOD_JAVA.html` — ✅ 簽章 `public java.util.Vector
  getItemValue(String)`；元素型別 text→String／number→Double／date→DateTime；
  逐字："If no item with the specified name exists, this method returns an
  empty vector. It does not throw an exception."
- `H_GETITEMVALUESTRING_METHOD_JAVA.html` — ✅ 回 String；缺欄位 6.55 後空字串、
  6.5 及更早 null。
- `H_GETITEMVALUEINTEGER_METHOD_JAVA.html` / `H_GETITEMVALUEDOUBLE_METHOD_JAVA.html`
  — ✅（reviewer 另行驗證）回 int / double。
- `H_REPLACEITEMVALUE_METHOD_JAVA.html` — ✅ 簽章 `public Item replaceItemValue
  (String, Object)`；型別對照表；逐字："If the document does not contain an item
  with the specified name, this method creates a new item and adds it to the
  document." 與 "you must call save after calling replaceItemValue."
- `H_APPENDITEMVALUE_METHOD_JAVA.html` — ✅ 四個 overload；逐字重複 item 警告
  "…appendItemValue does not replace it. Instead, it creates another item of the
  same name…"；"In general, replaceItemValue is favored over appendItemValue"（文中以 paraphrase 呈現，未加引號）。
- `H_GETITEMVALUEDATETIMEARRAY_METHOD_JAVA.html` — ✗ 404（不需要，未使用）。

### 矛盾檢查
各方法頁彼此一致，無矛盾。DateTime-in-Vector 需 recycle 一說與站上
[[java-recycle-memory]]（8/7）一致。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch 六個官方 Java 方法頁，逐條核對簽章、回傳型別、型別對照表、
每個逐字引用是否 word-for-word。

**VERDICT：PASS**。零必修。所有簽章、回傳、對照表、逐字引用對照 live 14.5.1 doc 全部吻合。
唯一 cosmetic：「6.5 以前 / before 6.5」→「6.5 及更早 / 6.5 and earlier」以符官方 inclusive 用語——已套用。

## 標題候選
走標題優化 loop：

- [選定] 概念 hook：`Java 讀寫 Notes item：getItemValue 回的是 Vector，不是你熟的那種陣列`
  — 使用者拍板。方法名（好搜）+ 一句點破驚訝點（Vector 不是陣列）。
  en 鏡像：`Reading and Writing Notes Items in Java: getItemValue Hands You a Vector, Not the Array You Know`。
- [汰除] 受眾先行（recycle-winner 風）：`LotusScript 的 GetItemValue 搬到 Java 就變了樣：Vector、缺欄位、DateTime 洩漏` — 點名受眾，但略長、方法名被稀釋。
- [汰除] 問題先行：`在 Java 裡讀 Notes 欄位，為什麼不能像 LotusScript 那樣 For 一圈就完？` — 痛點清楚，但沒帶方法名、搜尋性弱。

## 查證 checklist
- [x] 研究鏈：NotebookLM（拒答）→ WebFetch fallback 走完
- [x] 六個官方 Java 方法頁逐一 WebFetch 驗證非 404
- [x] 矛盾檢查（各方法頁 + recycle 篇一致）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（LS→Java 實測口吻、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-12 NotebookLM（拒答）→ WebFetch 六方法頁、雙語草稿、標題 loop、sidecar（Opus 4.8）
- 2026-08-12 獨立 fact-check（subagent）→ PASS；套用 1 cosmetic（6.5 及更早）（Opus 4.8）
- 2026-08-12 進 `_pending`（Path A，pubDate 2026-08-14）
