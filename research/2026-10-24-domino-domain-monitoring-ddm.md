---
slug: domino-domain-monitoring-ddm
title: "DDM:probe、ddm.nsf、collection hierarchy(5 分固定)、event handler 通知"
lang: [zh-TW, en]
pubDate: 2026-10-24
status: Path A staged（_pending，排 2026-10-24，未來日期→cron 自動 promote）
tags: [Domino Server, Admin]（TYPE 留白：概念解說）
requester: 使用者「寫20~26的文章」；20~26「伺服器子系統」cluster 第 5 篇;DDM 全站**零覆蓋**(grep 0)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-20
updated: 2026-10-20
---

# 研究軌跡 — domino-domain-monitoring-ddm

admin 監控子系統型。grep「DDM/domain monitoring/activity logging」=**0 命中**(完全缺口)。切入點=「出事使用者先哀號才知道」的被動監控痛點。

## 核心（官方 WebFetch）

- ddm-overview（10.0.1）:一處看全網域;「Recognizes and reports critical server and client issues within minutes」「determines probable cause」「Provides corrective actions and links to databases」;top-down feature-oriented view;enhanced(帶對象)vs simple events;視覺指示;50+ probe。
- ddm-probes（11.0.1）:probe=「a discrete check, or set of checks, configured to run against one or more servers, databases, and services」逐字;八領域 database/directory/messaging/operating system/replication/security/server/web;probe 文件在 EVENTS4.NSF、改即生效;排程 default/custom/事件觸發。
- ddm.nsf 頁（10.0.1）:存事件、每台一份、collection server 匯整下屬。
- collection-hierarchy（10.0.1）:EVENTS4.NSF 指定 collection server;一處看自己+下屬;多層或單層;**收集間隔固定 5 分鐘不能改**。
- event-handler-notification（10.0.1）:handler 在 EVENTS4.NSF、Event Monitor 執行、有 handler 才動作;log/mail/agent/program/console command/SNMP。

## 措辭守則

- 「proactive」別過度:官方沒明說「在出事前(before outages)攔截」→ 用「within minutes 回報+probable cause+corrective actions」框,不寫「防止當機」。
- 嚴重度:官方只說「視覺指示標出最嚴重/已解決/未解決」、**未命名層級** → 不自創 severity level 名稱。
- 5 分鐘收集間隔「固定不能改」——這是具體限制、別漏。
- 「有 handler 才通知」——DDM 抓到不等於會通知,這是常見誤解點。

## 站上互連

- 鬆連 cluster;console/log 可連 console-troubleshooting(9/17)/notes-log(6/07),正文未硬塞(diversity 用官方 3 URL 已足)。

## 標題候選

- [選定]:`DDM(Domino Domain Monitoring):Domino 內建的主動監控——probe 查什麼、事件進 ddm.nsf、collection hierarchy 一處看全網域、event handler 出事通知你`
  en：`DDM (Domino Domain Monitoring): Domino's Built-in Proactive Monitoring — Probes, Events in ddm.nsf, a Domain-Wide View via the Collection Hierarchy, and Event Handlers That Tell You`

## 查證 checklist

- [x] DDM 一處看全網域、三句官方宣稱、top-down view、enhanced/simple
- [x] probe 定義逐字、50+、八領域、EVENTS4.NSF 改即生效、三種排程
- [x] ddm.nsf 存事件、每台一份、collection 匯整
- [x] collection hierarchy、5 分固定不能改
- [x] event handler EVENTS4.NSF、Event Monitor、有 handler 才動作、六通知方式
- [x] inline-link diversity：3 相異官方 URL 各 33%；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改;proactive 未過度宣稱)
- [x] fact-check（獨立 subagent）→ 1/3/4/5/6 全對、逐字命中(三句宣稱、probe 定義、EVENTS4.NSF 改即生效、ddm.nsf 每台一份+collection 匯整、「collection interval is five minutes and is not modifiable」、enhanced/simple)。**兩處已修**:
  - ①**probe 領域我寫「八個」是硬傷**——官方是**十個**:administration、application code、database、directory、messaging、operating system、replication、security、server、web(漏了 administration、application code)→ 三處(TL;DR／本文／小結)雙語都補成十個。
  - ②通知方式我列六種讀起來像窮舉——官方 Table 1 共 **13 種**→ 改為「官方十多種(13),常見如 log/mail/agent/program/console/SNMP,另有 broadcast/pager/relay/sound/UNIX syslog 等」(zh/en TL;DR＋本文＋小結)。六種本身都正確、只是不完整。
  - 「有 handler 才動作」行為官方逐字確認(「If an event handler has not been defined, the Event Monitor task does nothing」)✓。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據(fallback、已揭露)。官方頁 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-20 新建（排 2026-10-24）。cluster 第 5 篇、零覆蓋缺口;官方多文為據;humanizer 自審;Path A staged。（Opus 4.8）
