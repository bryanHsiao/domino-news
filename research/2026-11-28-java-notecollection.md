---
slug: java-notecollection
title: "Java 的 NoteCollection:先設條件再 buildCollection,連 form、view 都選得到"
lang: zh-TW · en
pubDate: 2026-11-28T07:30:00+08:00
tags: ["Java"]
status: staged
requester: 使用者（排 11/24-30 Java/SSJS 續寫）
author_model: Opus 4.8
review_model:
review_result:
created: 2026-11-24
updated: 2026-11-24
---

# Research trail — java-notecollection (2026-11-28)

**Topic**: `lotus.domino.NoteCollection`（Java）—— 選 design+data note、餵 DXL。
招牌坑:必須 buildCollection(不 build 空的)、getNextNoteID(id) 要傳當前 id。
插旗 `coversClass: NoteCollection` ＋ `apiLang: java`。排程 #5（11/28）。

## 為什麼是這題

- map 缺口:NoteCollection 在 Java gap 清單、無對應文。
- Java 側實用:設計盤點 / 選擇性 DXL 匯出 / 依建立時間批次。

## 研究來源

- **NotebookLM**：未用，走官方文件。
- **WebFetch（web-fetch agent，兩輪：第一輪猜錯 URL 全 404；用 ls_classes.json
  的 docUrl 推正確檔名後重派）**：
  - `H_NOTESNOTECOLLECTION_CLASS_JAVA.html`（class）→「Represents a collection of
    Domino design and data elements in a database.」vs DocumentCollection「a collection
    of documents」;**new with Release 6.5**;Contained by Database。
  - `H_CREATENOTECOLLECTION_METHOD_DB_JAVA.html`（真名 _DB 非 _DATABASE，404 校正）→
    `createNoteCollection(boolean selectallflag)`「Sets all the "Select" ... true or false.」
  - `H_BUILDCOLLECTION_METHOD_NC_JAVA.html` →「You must build the collection before it
    is usable.」/「determined by the current values of SelectionFormula, SinceTime, and
    the Select properties.」;clearCollection「Clears (invalidates)」。
  - `H_SELECTIONFORMULA_PROPERTY_NC_JAVA.html` →「must be a valid Domino formula that
    evaluates to True ... or False」;「It intersects the other selection criteria.」;
    初始空字串=全選。
  - `H_SINCETIME_PROPERTY_NC_JAVA.html` →「earliest note **creation** time」/「excluding
    notes created prior to this time.」（**修正**：是建立時間非修改時間）。
  - `H_GETFIRSTNOTEID_METHOD_NC_JAVA.html` + `H_GETNEXTNOTEID_METHOD_NC_JAVA.html` →
    `getNextNoteID(String noteid)` 要傳當前 id;「returns a string of length 0」結束;
    「throws an exception if the parameter is an invalid note ID.」
  - `H_SELECTALLDESIGNELEMENTS_METHOD_NC_JAVA.html` → 整組設計旗;SelectDocuments /
    SelectProfiles「Not in a selectAll group」。
- **矛盾檢查**：SinceTime 是建立時間（我原假設修改時間，已修正）。buildCollection
  group 3 列 SelectDataConnections 但 selectAllDesignElements 頁未列 → 文章未宣稱此點。
  404 校正：CREATENOTECOLLECTION_METHOD_DATABASE → _DB。
- **DXL 下游**：exportDxl(NoteCollection) 本輪未逐字驗 → 文章只以「常見下游/use-case」
  帶過並連 java-dxl-exporter-importer，不寫確切 API 簽名。

## 獨立審查 (review)

本篇未跑獨立審查模型;官方逐條查證 + 自我驗證清單。review 欄留空。

## 查證 checklist

- [x] map 缺口（NoteCollection 無 Java 旗）、不與 documentcollection 重疊
- [x] 官方逐字（web-fetch agent，ls_classes.json 校正錯檔名、兩輪）
- [x] 兩步驟 / buildCollection / SelectionFormula intersect / SinceTime=建立時間 / getNextNoteID 傳 id 查準
- [x] 矛盾檢查:SinceTime 時間語意修正、DataConnections 不宣稱、DXL 只帶 use-case
- [ ] coversClass: NoteCollection + apiLang java（map-lang-report 待驗）
- [ ] inline-link diversity（每語言 3 URL 各 33%）
- [ ] build / humanizer

## 標題候選

- [汰除] 純功能：`Java 的 NoteCollection:選 note` — 目錄。
- [選定] 兩步驟＋廣度：`Java 的 NoteCollection:先設條件再 buildCollection,連 form、view 都選得到`
  — 點出兩步驟節奏 + 「連設計都選得到」的廣度差異，好搜、不過度承諾。
  en 鏡像：`NoteCollection in Java: Set the Criteria, Then buildCollection — and It Selects Design Notes, Not Just Documents`

## 異動日誌

- 2026-11-24 建檔 / web-fetch agent 兩輪（404 校正）研究官方文件 / 寫雙語草稿 / 進 _pending
