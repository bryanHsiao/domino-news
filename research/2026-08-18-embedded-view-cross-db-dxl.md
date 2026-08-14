---
slug: embedded-view-cross-db-dxl
title: "A Cross-DB Embedded View Won't Start in the Test Region? It's the Replica ID Baked into the DXL"
lang: [zh-TW, en]
pubDate: 2026-08-18
status: staged
tags: [LotusScript, Tutorial, Domino Designer, DevOps]
requester: 使用者 (bryan，現場遇到 + 提供實測 agent code)
author_model: claude-opus-4-8
review_model: general-purpose (獨立 fact-check subagent)
review_result: "獨立 fact-check(subagent) PASS；1 cosmetic（英文選單名）已套"
created: 2026-08-12
updated: 2026-08-12
---

# 研究軌跡 — embedded-view-cross-db-dxl

**field report（實測記錄）**：使用者現場遇到「跨 DB embedded view 搬測試區
無法啟動」，診斷出是 form DXL 裡 `<embeddedview>` 的 `database` 屬性綁死來源
抄本 ID，寫了 agent 換掉、後來發現 Designer「以 DXL 編輯」更快。使用者提供了
**實際跑過的 agent 原始碼**（解法 A 直接採用其 export→字串邊界替換→import 邏輯）。

## 研究來源 (Research trail)

### NotebookLM — ⚠️ 無此領域 notebook（DXL）
DXL 目前沒有對應的 NotebookLM notebook。依 CLAUDE.md 規定**先向使用者說明**、
未擅自跳 WebFetch；使用者裁示以「其重現截圖為一手證據 + WebFetch 官方 DXL
reference 佐證」進行（未為單篇 field report 專建 notebook）。

### 一手證據（使用者重現）
- 截圖：嵌入視圖錯誤「VDataRetentionMgmtLog 無法啟動…按空白鍵」（Java Applet 版）。
- 截圖：嵌入的視圖內容面板（名稱／目標圖文框／顯示=使用 Java Applet），無來源庫欄位。
- 截圖：來源庫內容面板 抄本 ID `48258DCC:002E9502` ↔ 匯出 DXL `database='48258DCC002E9502'`（只差冒號）。
- 截圖：agent 完成對話（Database TestBryan/SampleCode.nsf, Replica ID 48258205002125C2）。
- 截圖：設計元件右鍵「以 DXL 編輯」。
- 使用者提供的完整 agent 原始碼（Initialize + ReplaceEmbeddedViewDatabase）。

### WebFetch — 官方佐證（逐一驗證非 404）
- `H_EMBEDDEDVIEW_ELEMENT_XML.html`（Domino DTD，10.0.1）— ✅ 逐字："Database
  containing the view being embedded. Can be the database's replica ID or one of
  the keywords defined in the %named.element.link.databases; entity…"；`displayusing`
  值含 `html` / `javaapplet` / `designsettings`（對上截圖的 Java Applet）。
- `H_NOTESDXLIMPORTER_CLASS.html`（14.5.1）— ✅ DesignImportOption「indicates the
  handling of the incoming design elements: create, ignore, or replace」；常數含
  `DXLIMPORTOPTION_REPLACE_ELSE_IGNORE`。
- `H_NOTESDXLEXPORTER_CLASS.html`（14.5.1）— ✅（匯出側 + 第 3 個 inline URL）。
- WebSearch 佐證「以 DXL 編輯 / Package Explorer DXL editor」為 Designer 既有功能。

### 矛盾檢查
官方 DTD 與使用者截圖一致（database=抄本 ID）。用詞精確化：互為 replica 的庫
抄本 ID 相同、獨立拷貝才不同——初稿誤寫「不同抄本」，寫作階段即改為「各自獨立
的拷貝、各有抄本 ID」。

## 獨立審查 (review)

**審查模型**：獨立 fact-check subagent（general-purpose，與寫作 Opus 4.8 分開）。
自行 WebFetch 三官方頁，核對 embeddedview database 屬性逐字、DesignImportOption
常數、agent 內每個 LotusScript API 是否為真實成員、replica/copy 用詞精確性、
「以 DXL 編輯」功能存在性、Java DxlExporter/DxlImporter 對應。**注意：agent code
為作者實測原碼，只驗 API 正確性、不改寫風格。**

**VERDICT：PASS**。零必修。embeddedview `database` 屬性逐字引用、`DesignImportOption`
逐字 + `DXLIMPORTOPTION_REPLACE_ELSE_IGNORE`（值 5，有同名取代、否則略過不建）、
agent 內每個 LotusScript API（CurrentDatabase / GetDatabase 三參 / ReplicaID 回無冒號
16 碼 / GetForm / CreateNoteCollection+Add / CreateDXLExporter.Export(nc) 回 String /
CreateDXLImporter.Import(dxl, db)）、replica vs copy 用詞、Java DxlExporter/DxlImporter
對應——全部通過。唯一 cosmetic：英文選單實為 **「Edit With DXL」**（非 "Edit design
element in DXL"）；zh「以 DXL 編輯」與使用者截圖一致、正確。已把英文標籤改為 Edit With DXL。

## 標題候選
走標題優化 loop：

- [選定] 問題先行：`跨 DB 的 embedded view 搬到測試區就「無法啟動」？問題出在 DXL 裡綁死的抄本 ID`
  — 使用者拍板。痛點問句（搜「embedded view 無法啟動」直接接住）+ 一句點出答案（DXL 綁死抄本 ID）。
  en 鏡像：`A Cross-DB Embedded View Won't Start in the Test Region? It's the Replica ID Baked into the DXL`。
- [汰除] 概念 hook：`嵌入視圖用抄本 ID 綁死來源庫——所以跨環境會壞，而 Designer UI 改不了` — 點出機制，但沒帶「無法啟動」這個讀者實際會搜的症狀。
- [汰除] 故事·繞路：`寫了 agent 改 DXL，才發現 Designer 直接就能編：跨 DB 嵌入視圖的抄本 ID 坑` — 有 arc 味，但把重點放在過程而非讀者的問題。

## 查證 checklist
- [x] NotebookLM 無 DXL notebook → 先告知使用者、裁示 WebFetch + 一手截圖
- [x] 官方三頁 WebFetch 驗證非 404（embeddedview DTD / DXLImporter / DXLExporter）
- [x] 一手證據（使用者重現截圖 + 實測 agent 原碼）
- [x] 矛盾檢查（DTD vs 截圖一致；replica/copy 用詞精確化）
- [x] inline-link diversity 通過（3 個相異 URL 各 2 次 = 33%）
- [x] 雙語 build 通過
- [x] humanizer-zh-tw 自審（earned 第一人稱 field-report 口吻、無 AI framing）
- [x] 獨立 fact-check（subagent）→ PASS

## 異動日誌
- 2026-08-12 使用者現場診斷 + 提供 agent 原碼；WebSearch/WebFetch 官方佐證、雙語草稿、標題 loop、sidecar（Opus 4.8）
- 2026-08-12 獨立 fact-check（subagent）→ PASS；套用 1 cosmetic（英文選單名 Edit With DXL）（Opus 4.8）
- 2026-08-12 進 `_pending`（Path A，pubDate 2026-08-18）
