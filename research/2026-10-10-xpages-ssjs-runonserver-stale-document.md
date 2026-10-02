---
slug: xpages-ssjs-runonserver-stale-document
title: "XPages SSJS runOnServer 後 stale document + contextDocument 替代暫存文件"
lang: [zh-TW, en]
pubDate: 2026-10-10
status: staged（_pending，排 2026-10-10，Path A）
tags: [XPages, JavaScript]（TYPE 留白：gotcha 解說 + pattern，非純 hands-on tutorial）
requester: 使用者（給 xred《為什麼呼叫 RunOnServer 代理程式後無法取得文件的新值?》+ 自己的 SSJS 截圖；指「xred 示範偏 notesclient、ssjs 也一樣、另可用 contextDocument 取代暫存文件」）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-10
updated: 2026-10-10
---

# 研究軌跡 — xpages-ssjs-runonserver-stale-document

SSJS/XPages gotcha 型。xred 原文是 LotusScript/Notes client 版「runOnServer 後讀到舊值」；本篇寫 SSJS/XPages 版同一陷阱 + 用 document data source（contextDocument）取代暫存文件。獨立寫、不引 xred；以官方 method 文件 + 使用者第一手 SSJS 截圖為據。

## 獨立性（不引用 xred）

- xred 主題 = runOnServer 後 in-memory 文件 stale、要 Set Nothing + GetDocumentByID 重抓（LotusScript/Notes client）。本篇不引用它。
- 本篇據：**使用者真實 SSJS 程式碼**（截圖：tmpdoc.save→getNoteID→recycle→runOnServer→getDocumentByID 重讀 Selected_Reviewer/NextSigner）為第一手範例；**官方 method 文件**鎖 API。
- 新貢獻（xred 沒有）：SSJS 版機制敘述 + **contextDocument 替代暫存文件**（`document1.getDocument(true)`）這條。

## 站上涵蓋確認

grep runOnServer/contextDocument/recycle/getDocument：相關的有 notes-agent(6/12 class 介紹)、agent-run-as-identity(8/3)、java-recycle-memory(8/7)、xpages-save-conflicts(9/16)、ssjs-vector-multivalue(8/12)、xpages-scope-variables(9/27)——但「SSJS runOnServer stale value + contextDocument 替代」這個具體角度**沒寫過**。內部深連 java-recycle-memory(8/7)。

## NotebookLM 不可用（已 fallback，透明記錄）

依 CLAUDE.md 研究流程 SSJS 文先跑 NotebookLM（SSJS notebook 0c88f101-…）。但 **ask_question.py 失敗**：browser state 62 天舊、頁面 overlay（cdk-overlay-container）攔截點擊、ElementHandle.click 逾時——需互動式 re-auth，不自行處理（呼應 [[reference_notebooklm_repair]] 授權邊界）。
→ Fallback：以官方 HCL method 文件為準（method 級本就是 notebook 的弱項、WebFetch 更權威），+ 使用者第一手程式碼。此為 CLAUDE.md 允許的 WebFetch fallback。已向使用者說明。

## 官方 API 事實（WebFetch 逐字）

- `runOnServer()`/`runOnServer(noteID)`（[官方](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_domino_Agent_runOnServer.html)）：runs agent on server containing DB；回 int、0=success；noteID→called agent 的 `ParameterDocID`；任何語言 agent 皆可；local DB 等同 run()；output→Domino log。（文件未明示同步/非同步→文中不宣稱「synchronous」，只說「回來後再讀」。）
- `getDocument()`/`getDocument(applyChanges)`（[官方](https://help.hcl-software.com/dom_designer/9.0.1/reference/r_wpdr_xsp_xspdocument_getdocument_r.html) + [DominoDocument JavaDoc](https://public.dhe.ibm.com/software/dw/lotus/Domino-Designer/JavaDocs/DesignerAPIs/com/ibm/xsp/model/domino/wrapped/DominoDocument.html)）：回內層 `NotesDocument`；`applyChanges` true=「applies any changes made to the data store」、false(預設)=不套用。data source 預設變數 document1/2…
- stale 機制：呼叫端 backend 文件物件＝載入當下快照、不隨磁碟自動同步 → recycle + getDocumentByID 重抓。（框成「物件性質/行為」，不深入內部實作。）

## 標題候選

- [汰除] 好處先行：`不想為了呼叫 agent 建暫存文件:用 contextDocument 傳參數讀結果` — 點出替代法但沒帶出「拿到舊值」這個主症狀（最會被搜）。
- [汰除] 概念窄：`in-memory 文件是快照` — 太抽象、不好搜。
- [選定] 問題先行＋替代：`XPages 呼叫 runOnServer 後文件還是舊值?in-memory 文件是快照——解法與用 contextDocument 省掉暫存文件`
  — 症狀（runOnServer 後舊值、好搜）＋真因（快照）＋替代法（contextDocument）全包；標題自決（使用者已授權）。
  en 鏡像：`After runOnServer in XPages the Document Is Still Stale — the Fix, and Using the contextDocument Instead of a Temp Doc`

## 查證 checklist

- [x] runOnServer 回 0=success、noteID→ParameterDocID、getParameterDocID：官方
- [x] getDocument(applyChanges) 回內層 NotesDocument、true=套用改動：官方
- [x] save 於 runOnServer 前必要（agent 讀磁碟、新文件存後才有穩定 note id）
- [x] stale 機制框成「載入當下快照、不自動同步」，不過度宣稱內部實作
- [x] contextDocument 替代（getDocument(true)→save→runOnServer）+ 讀結果仍要重抓的 caveat
- [x] inline-link diversity：3 相異官方 URL 各 33%（移除 TL;DR 多餘的 runOnServer link 後）；每語 3 外部
- [x] TYPE 留白；tags XPages + JavaScript
- [x] 雙語 temp-build 通過
- [x] humanizer 自審 ~45/50（field-report；code block 為正當結構）
- [x] fact-check（獨立 subagent）→ **FAIR、零錯誤、無必改項**。三官方源逐字確認：runOnServer 0=success/noteID→ParameterDocID；getDocument(applyChanges) 回內層 NotesDocument、true 套用改動；**DominoDocument JavaDoc 確證 getDocument(true) 只「apply changes to the wrapped document」、不存檔 → 我寫的 explicit save() 必要、非冗餘**；stale 機制、contextDocument caveat(e)、save-before(b) 全對。兩 optional hedge：synchronicity 雖未文件化但文中未宣稱「文件說」、只用 0-gate（合法）；「快照」措辭已框成物件性質。採一項：補「runOnServer 同步/blocks 到 agent 完成」一句（行為框架），讓「回來即讀」邏輯完整。

## 異動日誌

- 2026-10-10 新建。官方 method 文件 + 使用者第一手 SSJS 截圖；NotebookLM 不可用（62 天舊 state + overlay）已 fallback 並告知；不引 xred；深連 java-recycle-memory；排 10/10 Path A。（Opus 4.8）
