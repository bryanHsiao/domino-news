---
slug: domino-out-of-office
title: "Out of Office:Service vs Agent、在哪設、為何用 Service"
lang: [zh-TW, en]
pubDate: 2026-10-27
status: Path A staged（_pending，排 2026-10-27＝過去日）→ 與 10/28 一起手動 publish-pending 促發當天上線
tags: [Domino Server, Admin]（TYPE 留白）
requester: 使用者「27忘了產文章了嗎? 寫27~11/2的文」→ 10/27 補上(漏排的一天)；郵件管理 cluster 第 1 篇;接 10/20 mail 路由
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check）+ humanizer-zh-tw（自審）
created: 2026-10-28
updated: 2026-10-28
---

# 研究軌跡 — domino-out-of-office

郵件管理 cluster（27~11/2 共七篇）開篇。grep 確認 out-of-office 全站 0 命中。接 10/20 mail 路由（OOO Service 跑在 router 內）。

**標題精簡（2026-10-28 新回饋 [[feedback_writing_style]]）**:這批起標題改走「核心賣點一句」,不再塞子標題長串。本篇定「Domino 外出通知:為什麼該用 Service 而不是 Agent」。

## 核心（官方 WebFetch）

- designating-ooo-service-type（14.0.0）:Server Configuration → Router/SMTP → Advanced → Control → Miscellaneous「Out of Office service type」;預設 Agent（逐字）;Service 跑 router 內、即時+failover（逐字）、delegation 整合行事曆（委派需 Editor）、自動停用（逐字）、<1 天 >1 小時;Agent 排程一天四次（逐字）、手動停用（逐字）、delegation 不整合行事曆、最短一天、需代簽 agent 權限;Service 用全 Domino 8/MAIL8.NTF 叢集、Agent 用含 pre-8 叢集;Files 分頁 Out of Office 欄;`Tell router O` 列有啟用 Service 的庫。
- set-username-enable（11.0.1）:client 啟用 agent 產生請求、需 Editor。

## 措辭守則

- 「現在都該用 Service」框成「Domino 8 以上=現在幾乎所有環境」,不誇大;保留「只有 pre-8 才用 Agent」。
- 版本框架老（Domino 8），但這是官方適用條件原文、照引、翻成白話即可。
- Tell router O 的 O 是字母、別寫成數字 0。

## 站上互連

- 連 10/20 mail 路由（OOO 在 router 內、用 router 指令查）。

## 標題候選

- [汰除] 長串：`Domino 外出通知:Service 與 Agent 差在哪、在哪設、為什麼用 Service…` — 犯了使用者剛提的「太長」。
- [選定] 一句賣點：`Domino 外出通知:為什麼該用 Service 而不是 Agent`
  en：`Domino Out of Office: Why to Use the Service, Not the Agent`

## 查證 checklist

- [x] 兩型、在哪設、預設 Agent（逐字）
- [x] Service 即時+failover+自動停用+<1 天（逐字）
- [x] Agent 一天四次+手動停用+最短一天（逐字）
- [x] 適用（MAIL8.NTF / pre-8）
- [x] Tell router O、Files 分頁 Out of Office 欄
- [x] inline-link diversity：3 相異官方 URL 各 33%（初稿 1、已補 2）
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審；標題精簡
- [x] fact-check（獨立 subagent）→ 1/2/3/4/6 全對、逐字命中(預設 Agent、「instantaneous, server failover is supported」、「disables itself after processing the first email」、「less than one day, but greater than one hour」、Agent「executes four times each day」「must be manually disabled」、最短一天、MAIL8.NTF/pre-8 適用、`Tell router O`「Lists all databases that have an active Out of Office service」)。一處小修:claim 5「開啟」→官方是「設定/啟用(Tools→Out of Office 完成對話框)」,已改「設定並啟用」。另補:Files 分頁 Out of Office 欄反映的是 **Service** 狀態(Agent 不一定顯示)→ 雙語補一句。

## NotebookLM 說明

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據（fallback、已揭露）。

## 異動日誌

- 2026-10-28 新建（排 2026-10-27，補漏日）。郵件管理 cluster 第 1 篇;標題改精簡;官方二文為據;humanizer 自審;Path A staged＋需手動 publish-pending。（Opus 4.8）
