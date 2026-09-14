---
slug: notes-document-ids
title: "NoteID / UNID / @DocumentUniqueID 三個文件 ID 的差別"
lang: [zh-TW, en]
pubDate: 2026-09-14
status: published（9/14 當日直發 posts/，Path B）
tags: [Domino Designer, LotusScript, Formula]
requester: 使用者 (bryan，補 9/14 空檔；coverage 選題確認 UNID/NoteID 無專篇)
author_model: claude-opus-4-8
review_model: (內容全為官方 doc 逐字錨定；WebFetch 第一手)
created: 2026-09-14
updated: 2026-09-14
---

# 研究軌跡 — notes-document-ids

9/14 補空檔（附件/XPages 系列外的差異化題）。coverage 100% class 但**無 UNID/NoteID 專篇**（`getalldocumentsbykey`/`by-key-lookup` 等
只涉 key，未講三個 ID 差異）。reference/概念導向 → **TYPE 留白（不掛 Tutorial）**，符合 tag 精準度。

## 研究鏈（NotebookLM 不可用 → WebFetch fallback，第一手驗官方）

- NotebookLM 本 session 一直卡登入/overlay，照 CLAUDE.md fallback 用 WebFetch 直驗。
- **UniversalID property**（[14.0 doc](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_UNIVERSALID_PROPERTY_DOC.html)）：
  「The universal ID, which uniquely identifies a document across all replicas of a database.」32 hex、read-write、
  同 UNID＝互為 replica。**兩個 gotcha 逐字**：「Modifying the UNID of an existing document transforms it into a new document」、
  「saving a document with the same UNID as an existing document raises an lsERR_NOTES_ERROR (4000)」。
- **NoteID property**（[12.0 doc](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_NOTEID_PROPERTY.html)）：8 字元、per-database、
  代表文件在檔案內位置、replica 間通常不同（＋刪除後可能重用，社群通識）。
- **@DocumentUniqueID**（[12.0 doc](https://help.hcl-software.com/dom_designer/12.0.0/basic/H_DOCUMENTUNIQUEID.html)）：回 UNID；
  逐字「To display the UNID, you must convert the result of this function to text, that is, you must specify @Text(@DocumentUniqueID).」
  不加 @Text 回的是 doclink。
- **GetDocumentByUNID**（[11.0.1 doc](https://help.hcl-software.com/dom_designer/11.0.1/basic/H_GETDOCUMENTBYUNID_METHOD.html)）：LS 用 UNID 取回。
- web `/0/UNID`：`0`＝不透過 view、直接用 UNID 找文件（標準 `/db.nsf/<view>/<doc>` 的 view 佔位）；交叉連 [[domino-web-attachment-ui]]
  （那篇下載連結就是 `@Text(@DocumentUniqueID)` 拼進 `/0/…/$FILE/…`）。

## 查證 checklist

- [x] 官方 URL 非 404、逐字錨定（UniversalID / NoteID / @DocumentUniqueID / GetDocumentByUNID）
- [x] gotcha 有官方逐字（改 UNID→新文件、dup UNID→4000、@Text 才顯示）
- [x] Replica ID（DB 層）與 NoteID/UNID（doc 層）區隔，避免混淆
- [x] inline-link diversity：4 相異官方 URL + 內部交叉連，遠低於 40%
- [x] TYPE 留白（reference，非 Tutorial）
- [ ] 雙語 build（直發 posts/，當日 pubDate 已過→會 render）
- [ ] humanizer 自審
- [ ] 直發 + deploy

## 異動日誌

- 2026-09-14 WebFetch 驗官方三 ID + GetDocumentByUNID、雙語、對照表、sidecar；9/14 當日直發 posts/ Path B（Opus 4.8）
