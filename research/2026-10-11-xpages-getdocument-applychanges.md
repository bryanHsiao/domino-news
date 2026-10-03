---
slug: xpages-getdocument-applychanges
title: "document1.getDocument(true) 的 true 在做什麼（applyChanges 深入）"
lang: [zh-TW, en]
pubDate: 2026-10-11
status: staged（_pending，排 2026-10-11，Path A）
tags: [XPages, JavaScript]（TYPE 留白：概念澄清，非 hands-on tutorial）
requester: 使用者（10/10 文裡質疑「我的情境真的需要 (true) 嗎」→ 要求把 getDocument(true) 單獨成篇；本篇即該獨立文）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-11
updated: 2026-10-11
---

# 研究軌跡 — xpages-getdocument-applychanges

從 10/10 runOnServer 文 deferred 出來的獨立深入。主題＝`document1.getDocument(true)` 的 `applyChanges` 到底做什麼、何時該加、何時多餘。雙向互連 10/10。

## 核心（官方 + JSF 生命週期）

- `getDocument()`／`getDocument(false)`：回內層 `lotus.domino.Document`、不先套改動。`getDocument(true)`：先把 data source 待套改動 flush 進文件再回（官方 help「true applies any changes made to the data store」；JavaDoc「Apply any changes to the wrapped document before returning it」；官方範例 `document1.getDocument(true).generateXML()`）。
- 「改動」兩來源：① bound 控制項輸入 ② 程式 `setValue`/`replaceItemValue`（都落在 data source 層）。
- **JSF 六階段**（WebSearch 確認）：Restore View → Apply Request Values → Process Validations → **Update Model Values(4)** → **Invoke Application(5, 按鈕 SSJS)** → Render Response。4 比 5 早 → 一般送出事件 bound 值已在 data source、`getDocument()` 已帶現值、`(true)` 多半多餘（措辭用「多半/mostly」hedge）。
- `immediate="true"` 跳過 UMV → 新值沒進 data source → `getDocument()`/`(true)` 都拿不到 → 用 `getComponent().getValue()`。
- 真正需要 `(true)`：程式改了 data source + 要直接對 backend 文件動作（generateXML/存副本/傳 agent）。
- 分工：存整份 `document1.save()`（flush+persist）／操作文件 `getDocument(true)`／讀一欄 `getComponent().getValue()`。

## NotebookLM

未跑（10/10 同一輪已知 NotebookLM 不可用：browser state 過舊 + overlay）。本篇為 method 級 API + JSF 生命週期，官方 help/JavaDoc + lifecycle 為權威，WebFetch/WebSearch fallback（CLAUDE.md 允許）。

## 站上涵蓋 / 互連

- grep getDocument(true)/applyChanges/Update Model Values：無專文（只 10/10 有 deferral 註）。本篇補該空檔。
- 雙向互連：10/10 的 deferral 註已改成實際連結指向本篇；本篇 hook + 來源連回 10/10（runOnServer 情境）。

## 標題候選

- [汰除] 好處先行：`getDocument() vs getDocument(true):applyChanges 把畫面/程式改動 flush 進文件` — 清楚但略平、不夠 hook。
- [汰除] 概念窄：`applyChanges 到底套用什麼` — 太抽象。
- [選定] 問題先行：`document1.getDocument(true) 的 true 到底在做什麼——applyChanges、什麼時候該加、什麼時候是多餘`
  — 直接對準讀者最想問的（那個 true 幹嘛、要不要加）；好搜（getDocument(true) 在標題）；不過度承諾（是澄清、非 tutorial）。標題自決（使用者已授權）。
  en 鏡像：`What the true in document1.getDocument(true) Actually Does — applyChanges, When to Add It, When It's Redundant`

## 查證 checklist

- [x] getDocument()/getDocument(true) 語意對官方 help + JavaDoc
- [x] applyChanges 來源＝控制項 + 程式 setValue（flush 進 backend doc）
- [x] JSF 六階段順序、UMV(4) 先於 Invoke Application(5)：WebSearch 確認
- [x] immediate 跳過 UMV → getComponent 讀畫面
- [x] save() flush+persist、分工三法
- [x] inline-link diversity：3 相異官方 URL 各 33%（修掉重複 getDocument、補 NotesXspDocument）；每語 3 外部
- [x] TYPE 留白；tags XPages + JavaScript
- [x] 雙語 temp-build 通過（含改動的 10/10）
- [x] humanizer 自審 ~45/50
- [x] fact-check（獨立 subagent）→ **FAIR、零錯誤、無須改字**。官方 help/JavaDoc 逐字確認；**關鍵 nuance 確認：applyChanges 含程式 `setValue`——官方原文是「the data store」非「control input」，JavaDoc 另有 `getChangedFields()` 追蹤（不論改動來自控制項或程式）**，所以 `getDocument(true)` flush 兩者正確、非過度宣稱；且文中一致用 `document1.setValue`（data-source 層）而非對取出的 backend doc 改，乾淨。生命週期(4 先於 5)、immediate 跳過 UMV、generateXML 範例、save() 分工全對且 hedge 得當。optional（未採）：immediate 下非 immediate input 可能只有 submittedValue、getValue 會 lag——屬 deep-weeds，文章維持實務層級、未宣稱普適，不需改。

## 異動日誌

- 2026-10-11 新建。10/10 deferred 出的獨立文；官方 getDocument + JSF 生命週期為據；雙向互連 10/10；humanizer 自審；排 10/11 Path A。（Opus 4.8）
