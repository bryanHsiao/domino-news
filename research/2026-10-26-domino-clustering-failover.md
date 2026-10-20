---
slug: domino-clustering-failover
title: "Domino clustering:failover 前提 replica、Cluster Manager、cldbdir.nsf、事件驅動 Cluster Replicator、BUSY 門檻、ICM"
lang: [zh-TW, en]
pubDate: 2026-10-26
status: Path A staged（_pending，排 2026-10-26，未來日期→cron 自動 promote）
tags: [Domino Server, Admin]（TYPE 留白：概念解說）
requester: 使用者「寫20~26的文章」/「繼續」；20~26「伺服器子系統」cluster 第 7 篇(收尾);grep 確認 clustering/failover 無專文(命中皆順帶提)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-20
updated: 2026-10-20
---

# 研究軌跡 — domino-clustering-failover

admin 高可用子系統型,20~26 cluster 收尾。切入點=「一台掛了使用者無感」背後的 failover,核心賣點=「沒 replica 就沒 failover」。

## 核心（官方 WebFetch）

- cluster-components（10.0.1）:Cluster Manager/cldbdir.nsf/Cluster Database Directory Manager/Cluster Administrator/Cluster Replicator;Cluster Replicator 事件驅動「quickly pushes the change to the other replicas」、約 15 秒查 cldbdir、只在成員間、對外用 REPLICA;低速 WAN 可改排程複寫;Cluster Manager 監看 Directory ClusterName 找成員。
- how-failover-works（11.0.0）:前提=另一台有 replica「is redirected to a replica...on a different server」;client 從 cluster cache 問下一台;Cluster Manager 查 cldbdir、列有 replica 的台按可用性排序送 client;「failover is essentially transparent to the user」。
- how-workload-balancing（11.0.1）:availability threshold→標 BUSY→導其他 replica;無其他 replica 或全 BUSY 則原 DB 照開;Server_Availability_Threshold / Server_Restricted。
- ICM（12.0.0）:HTTP client、同套規則、多台挑最輕負載。

## 措辭守則

- 「沒 replica 就沒 failover」是全文主軸——別讓讀者以為 cluster 自動就有 HA(要先有 replica)。
- Cluster Replicator 事件驅動 vs 一般 REPLICA 排程——兩者別混(對內近即時、對外排程)。
- 全 BUSY 則原 DB 照開——這個保底別漏(否則讀者以為 BUSY 就開不了)。
- 6 台上限/同網域:官方這幾頁未給 → **不寫 6 台上限**(避免無出處宣稱);成員靠 Directory ClusterName 認,寫這個就好。
- 15 秒、Server_Availability_Threshold/Server_Restricted 為具體值,待 fact-check 確認。

## 站上互連

- 連 notes-replication(6/06):cluster 內近即時 vs cluster 外排程,互補(正文一處)。
- 收尾 20~26 cluster。

## 標題候選

- [選定]:`Domino cluster 怎麼做 failover 與負載平衡:Cluster Manager、cldbdir.nsf、事件驅動的 Cluster Replicator,以及「沒 replica 就沒 failover」`
  en：`How Domino Cluster Failover and Workload Balancing Work: the Cluster Manager, cldbdir.nsf, the Event-Driven Cluster Replicator, and 'No Replica, No Failover'`

## 查證 checklist

- [x] failover 前提 replica(逐字)
- [x] Cluster Manager probe、監看 ClusterName
- [x] cldbdir.nsf 每台一份、每 DB/replica 一文件
- [x] Cluster Database Directory Manager / Cluster Administrator
- [x] Cluster Replicator 事件驅動、15 秒、只成員間、對外 REPLICA、低速 WAN 建議
- [x] failover 流程、排序送 client、transparent
- [x] workload balancing threshold/BUSY/全 BUSY 照開/Server_Restricted
- [x] ICM HTTP 挑最輕
- [x] 未寫 6 台上限(無出處)
- [x] inline-link diversity：3 相異官方 URL 各 33%；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過;內部連結 notes-replication slug 確認
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ **八條全對、零事實錯誤**。逐字命中:「event-driven, rather than schedule-driven」、「every 15 seconds by default, the Cluster Replicator checks for changes in the Cluster Database Directory」、「pushes changes to servers in the cluster only」、「failover is essentially transparent to the user」、「If no other cluster server contains a replica or if all cluster servers are BUSY, the original database opens, even though the server is BUSY」、Server_Availability_Threshold 約每分鐘重算、ICM「the most available server that contains a replica」。兩處用詞已精準化:
  - ①**Server_Restricted**:改為「拒絕**新**的資料庫開啟請求、既有連線不受影響、不影響複寫」(原寫「完全擋下」過頭)。
  - ②**ICM 選台**:官方用「most available / availability index 最高(依所有 open session 算)」,非字面「負載最輕」→ 雙語 ICM 段＋小結已改,並點明 index 的計算基礎。
  - agent 另提醒:client cluster cache 預設 15 分鐘刷新 ≠ Cluster Replicator 的 15 秒(本文未混用、未提 cache 刷新)✓;未寫「6 台上限」(無出處)✓。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據(fallback、已揭露)。官方頁 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-20 新建（排 2026-10-26）。cluster 第 7 篇(收尾);官方四文為據;連 notes-replication;humanizer 自審;Path A staged。（Opus 4.8）
