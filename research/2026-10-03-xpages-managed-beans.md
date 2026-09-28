---
slug: xpages-managed-beans
title: "XPages managed beans（SSJS vs Java bean）"
lang: [zh-TW, en]
pubDate: 2026-10-03
status: staged（_pending，排 2026-10-03，Path A；批次 #6）
tags: [XPages, Java, SSJS]
requester: 使用者（跨語言批次 9/28–10/05；SSJS/XPages 缺口）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。faces-config 三元素、class 三要件、Serializable 綁 Keep-pages-on-disk、EL/SSJS 存取（Wissel「top-level object like database/session」+ demo.playTune()）、session 行為全對、Java code 有效、跨語言準。修 1 minor（diversity）：正文原只 2 外連→補 tutorialspoint JSF facility inline，成 3 相異外連。nit（範例類別名大小寫、view scope+Serializable 為合理 synthesis）不動。
created: 2026-10-03
updated: 2026-10-03
---

# 研究軌跡 — xpages-managed-beans

XPages managed bean deep-dive。批次 #6。

## 標題候選（自決 — [[feedback_title_self_decide]]）

- [選定] 好處+類比好搜：`XPages managed bean：給 SSJS 一個真正的 Java 物件，像 database 一樣直接用`
  en 鏡像：`XPages Managed Beans: Giving SSJS a Real Java Object You Use Like database`
- [汰除] 中性：`XPages 的 managed bean 入門` — 無 hook。
- [汰除] 問題先行：`SSJS 邏輯太肥？搬進 managed bean` — 可，但類比版更好記。

## 研究（XPages 社群權威）

- **Per Lausten**：faces-config 三元素、class 三要件（no-arg ctor / get-set / Serializable for Keep pages on disk）、EL 存取。
- **Wissel（NotesSensei）**：name 變 SSJS/EL 頂層變數（像 database/session）、bean.playTune()、session scope 行為 verbatim。
- **TutorialsPoint JSF Managed Beans**：底層 JSF facility（第 3 外連，generic）。
- 內部交叉連 [[xpages-scope-variables]]（scope + 序列化同一套）。
- 未跑 NotebookLM（XPages/JSF 構造，社群權威文足；本 session 卡登入）。序列化綁 view/session/application scope＝呼應 scope-variables 篇的 NotSerializableException。

## 查證 checklist

- [x] faces-config 三元素、class 三要件、EL/SSJS 存取對來源
- [x] Serializable 綁持久 scope（Keep pages on disk）
- [x] scope 四種 + none
- [x] Java code 有效
- [x] 跨語言：bean=Java、SSJS 消費、LS 無對應
- [x] TYPE：XPages/Java/SSJS（橋接三者）
- [x] inline-link diversity：3 相異外部 + 內部 scope 連
- [x] 雙語 temp-build
- [ ] fact-check（跑中）

## 異動日誌

- 2026-10-03 批次 #6；WebFetch Per Lausten + Wissel；雙語 hook+TL;DR；標題自決；temp-build；stage 排 10/03。（Opus 4.8）
