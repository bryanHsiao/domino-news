---
slug: panagenda-makenotesfaster-webinar
title: "panagenda MakeNotesFaster webinar recap（Notes client 效能）"
lang: [zh-TW, en]
pubDate: 2026-09-26
status: staged（_pending，排 2026-09-26）
tags: [Performance, Admin, Community]
requester: 使用者（備忘 project_makenotesfaster_webinar_recap 的計畫；使用者貼來錄影頁+slides PDF「都回來了」→ 動筆）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent，對照 slides 全文 mnf-slides.txt）→ PASS。所有數字/ODS 參數 verdict/cache.ndk 三迷思裁決/週一 10 項清單逐一吻合 slides、無捏造、無加料、迷思未過度延伸。3 nit：①「兩個決定」框架 slides 沒明講→但 panagenda webinar 頁有（source #1 逐字），保留；②「其他都白調」比 slides「fix before anything else」強→軟化；③desktop8.ndk 漏「and a lot more」→補回。兩內部連結（domino-1451-fp1 / domino-unread-marks）已確認 zh/en 皆存在。
created: 2026-09-26
updated: 2026-09-26
---

# 研究軌跡 — panagenda-makenotesfaster-webinar

Community/recap 型（比照 [[openntf-domino-iq-rag-webinar]] 的做法）。

## 主要來源（第一手 slides 全文）

- **slides PDF**（[panagenda](https://www.panagenda.com/download/webinar/20260915_EN_HCL_Webinar_Slides_MakeNotesFaster.pdf)，2026-09-15，50 頁）。
  WebFetch 抽不出（壓縮）→ 用 pymupdf 抽全文存 scratchpad `mnf-slides.txt`（**fact-check ground truth**）。
- **webinar 頁**（[panagenda](https://www.panagenda.com/webinars/makenotesfaster1/)）：講者/範圍/隨選觀看。
- 講者：Christoph Adler（Head of Solution Consulting）+ Marc Thomas（Senior Solution Architect）。範圍 = Windows Notes Standard client 14.5.1 FP1、本機設定；out：server 調校/Nomad/macOS/app design。

## 備忘那條「傳說多」怎麼處理

- project memory 記「注意無 notebook + 傳說多」。本篇**嚴格只寫 slides 講的**，不加站外江湖傳言。
- 剛好 webinar 自己就有一整段**打破 cache.ndk 迷思**（Myth/Verdict），正對站上實證調性——recap 把它當重點段，忠實轉述三條裁決（別過度延伸）。呼應 [[feedback_no_vague_community_consensus]]。
- 無 NotebookLM notebook（Notes client 效能非既有 notebook 域）→ 主源就是 slides，符合「無 notebook 先講清、主源第一手」。

## 內容取捨（recap 非逐頁抄）

挑管理者最有用：真實數字（16k users / cold 2+min…）、ODS（每開檔轉、names.nsf 60s、ODS55 since 12.0.2、notes.ini 參數 verdict 表）、檔案系統（別放網路碟、一 replica ID 一份）、cache.ndk 迷思、AV 排除三陷阱、週一清單。略過 IF TIME 的次要頁（cluster stack、location doc 細節、plugin cleanup）或只一句帶過。

## ODS 預設矛盾 → 查官方後修正（2026-09-26，使用者要我連 6/21 ODS 篇時發現）

- panagenda slide 說「ODS 55 是 12.0.2 起的預設、新建也建在 55、Create_R12 不需要」；站上 [[domino-ods-versions]]（6/21）說「新建預設仍 52、要 55 需 Create_R12」。**兩篇打架**。
- 查官方 [inst_dominoondiskstructure_t.html](https://help.hcl-software.com/domino/14.5.0/admin/inst_dominoondiskstructure_t.html) 逐字：「a new database created in Domino 12 uses ODS 52」、要 55「if you use Create_R12_Databases=1」；client 自動升級「Starting with Notes 12.0.2, upgrading a Notes client upgrades databases in the data directory to the latest ODS format」。
- **結論：6/21 那篇對、panagenda slide 不精確。** 真相＝「client 升級會把**既有本機 DB** 自動升到最新(55)」對；「**新建**預設就是 55」錯（官方：新建仍 52、要 55 靠 Create_R12）。
- **修 recap 6 處**（zh/en）：body「55 是預設」→「client 自動升既有 DB 到最新」+ 補「新建預設仍 52、需 Create_R12」精確區別 + 交叉連 6/21；footnote 去「12.0.2 起預設」→「目前最高版本」；CREATE_R12 表格列去「12.0.2+ 不需要」→「要新建落在 55 就靠它」。fact-check 抓不到此矛盾（它 ground truth 是 slides、slides 本身就這樣寫）——是「連站上舊文」的交叉核對抓到的，呼應 [[feedback_no_vague_community_consensus]]。

## 交叉連

- 內部：[[domino-ods-versions]]（ODS 版本演進/create ODS 規則，ODS 段交叉連）、[[domino-1451-fp1]]（14.5.1 FP1 版本脈絡）、[[domino-unread-marks]]（重複 replica 造成未讀漂移）。
- 外部（link diversity 3 相異）：panagenda webinar 頁 / slides PDF / HCL 14.5.1 FP1 whatsnew。

## 查證 checklist

- [x] 講者/範圍/客戶數字/ODS/cache.ndk 迷思/AV 三陷阱/週一清單 對照 slides
- [x] 數字逐一對 slides（cold 2+min、warm 35–40s、upgrade 22min、17 小時、60 秒、30MB…）
- [x] notes.ini ODS 參數 verdict 表對 slide 13
- [x] cache.ndk 三迷思裁決忠實轉述、未過度延伸
- [x] 只寫 slides 講的、不加站外傳說
- [x] tags Performance/Admin/Community（皆站上既用）；TYPE=Community
- [x] inline-link diversity：3 相異外部 + 2 內部
- [ ] 雙語 temp-build
- [ ] independent fact-check subagent（跑中，以 mnf-slides.txt 為 ground truth）

## 異動日誌

- 2026-09-26 使用者提供錄影+slides→pymupdf 抽全文→雙語 recap（管理者向、cache.ndk 迷思為重點）；temp-build；sidecar；stage _pending 排 9/26。（Opus 4.8）
