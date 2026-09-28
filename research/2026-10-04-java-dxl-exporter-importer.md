---
slug: java-dxl-exporter-importer
title: "Java DxlExporter / DxlImporter"
lang: [zh-TW, en]
pubDate: 2026-10-04
status: staged（_pending，排 2026-10-04，Path A；批次 #7）
tags: [Java, Tutorial]
requester: 使用者（跨語言批次 9/28–10/05；Java DXL＝跨語言矩陣裡「已指向未寫」的 Java 對應）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent，首次 agent stalled→重跑）→ 修 BLOCKER 後 PASS。exportDxl/importDxl 引用 verbatim、五個 ImportOption 選項對、DXLIMPORTOPTION_CREATE 確認為真常數（含 DocumentImportOption）。BLOCKER：code 用小寫 getFirstImportedNoteId/getNextImportedNoteId 且無參數→改大寫 getFirstImportedNoteID / getNextImportedNoteID(noteId)（後者需傳目前 note ID），並去多餘 isEmpty；TL;DR 方法名同步改大寫。overview 那句 verbatim 引用（小寫 Id）為官方原文、保留。
created: 2026-10-04
updated: 2026-10-04
---

# 研究軌跡 — java-dxl-exporter-importer

Java DXL deep-dive。批次 #7。填跨語言矩陣：DxlExporter/DxlImporter 被 embedded-view-cross-db-dxl / dxl-round-trip-pitfalls / notes-dxl-importer 指向但無 Java 專篇。

## 標題候選（自決 — [[feedback_title_self_decide]]）

- [選定] 主題+好搜：`Java 端的 DXL：DxlExporter／DxlImporter 怎麼把 Domino 資料進出 XML`
  en 鏡像：`DXL in Java: Exporting and Importing Domino Data with DxlExporter / DxlImporter`
- [汰除] 問題先行：`import DXL 為什麼覆蓋了我不想動的東西？` — 只切到 import option 一面。
- [汰除] 中性：`在 Java 用 DxlExporter 與 DxlImporter` — 無 hook。

## 研究（第一手官方 Java doc）

- **Exporting and importing DXL (Java)**（[14.5.0](https://help.hcl-software.com/dom_designer/14.5.0/basic/H_EXPORTING_AND_IMPORTING_DXL_JAVA.html)）：createDxlExporter/exportDxl 輸入類型/String out、createDxlImporter/importDxl 輸入/Database out、getFirst/NextImportedNoteId，verbatim。
- **DxlImporter (Java)**（[14.0.0](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTESDXLIMPORTER_CLASS_JAVA.html)）：setDesign/Document/Acl-ImportOption、setReplaceDbProperties、setReplicaRequiredForReplaceOrUpdate 及各自選項。
- **createDxlExporter (Session-Java)**（[10.0.1](https://help.hcl-software.com/dom_designer/10.0.1/basic/H_CREATEDXLEXPORTER_METHOD_SESSION_JAVA.html)）：第 3 外連。
- 內部交叉連 [[java-recycle-memory]]、[[dxl-round-trip-pitfalls]]、[[notes-dxl-importer]]。
- 未跑 NotebookLM（Java class API，官方頁逐字足；本 session 卡登入）。

## 查證 checklist

- [x] exportDxl/importDxl 輸入輸出類型、getFirst/Next 對官方 verbatim
- [x] 三個 ImportOption 選項組合對 DxlImporter 頁
- [x] DXLIMPORTOPTION_CREATE 常數名（待 fact-check 確認）
- [x] Java code 有效、recycle
- [x] 跨語言：LS NotesDXLExporter/Importer 對應、SSJS 少用
- [x] TYPE：Java + Tutorial（可照跑 export/import）
- [x] inline-link diversity：3 相異官方外部 + 內部交叉連
- [x] 雙語 temp-build
- [ ] fact-check（跑中）

## 異動日誌

- 2026-10-04 批次 #7；WebFetch DXL overview + DxlImporter class；雙語 hook+TL;DR；標題自決；temp-build；stage 排 10/04。（Opus 4.8）
