---
slug: domino-message-tracking
title: "Message tracking:MTC/MTSTORE.NSF、選項、Tracking Center、vs journaling"
lang: [zh-TW, en]
pubDate: 2026-11-01
status: Path A staged（_pending，排 2026-11-01，未來日→cron 自動 promote）
tags: [Domino Server, Admin]（TYPE 留白）
requester: 使用者「寫27~11/2的文」；郵件管理 cluster 第 6 篇;接 10/29 journaling(metadata vs copies 對照)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check）+ humanizer-zh-tw（自審）
created: 2026-10-28
updated: 2026-10-28
---

# 研究軌跡 — domino-message-tracking

郵件管理 cluster 第 6 篇。grep 確認 message tracking/MTC/MTSTORE 無專文。核心賣點=「一封信送到哪了」+ 跟 journaling 的分工(metadata vs 複本)。

## 核心（官方 WebFetch）

- configuring-message-tracking（10.0.1）:Router/SMTP→Message Tracking 分頁、Enabled/Disabled(預設關);collection interval 分鐘(預設 15、影響效能);Log message subjects 預設 No(隱私)+Don't log subjects for;Don't track messages for(排除 ISpy);Allowed to track messages/subjects 留空=LocalDomainServers;保留靠 replication 設定;Tracking Center 追單一信。
- controlling-mtc（14.0.0）:MTC 建 MTSTORE.NSF 於 MTDATA、定期收 Router 的 MTC log;tell mtc process/quit/compact/reindex/purge。
- tools-for-mail-monitoring（11.0.1）:整套監控工具裡的位置。

## 措辭守則

- tracking=metadata/軌跡、journaling=複本/內容——對照別混(全文賣點)。
- 預設 Disabled、Log subjects 預設 No、Allowed to track 留空=LocalDomainServers——預設值別寫錯。
- 無「MsgTrack」指令;用 tell mtc 系列。
- 兩段流程:Router 產 log → MTC 收進 store → Tracking Center 讀。

## 站上互連

- 連 10/29 journaling（metadata vs 複本對照,hook＋一節）。

## 標題候選

- [選定] 一句提問:`Domino message tracking:一封信到底送到哪了`
  en：`Domino Message Tracking: Where Did That Message Actually Go?`

## 查證 checklist

- [x] 定義、vs journaling
- [x] 開啟位置、預設 Disabled
- [x] MTC/MTSTORE.NSF/MTDATA、兩段流程
- [x] collection interval 15/Log subjects No/Don't track for/Allowed to track LocalDomainServers/保留靠 replication
- [x] tell mtc 五指令
- [x] Tracking Center 追單一信
- [x] inline-link diversity：3 相異官方 URL 各 33%（初稿 2、已補 tools）
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審;標題精簡
- [x] fact-check（獨立 subagent）→ **六條全對、零錯誤**。逐字命中:「Disabled (default)」、「The MTC task creates the Domino MailTracker Store database (MTSTORE.NSF) in the MTDATA subdirectory」、collection interval「The default is 15 minutes」、「No - (default) The server does not log message subjects」、Don't track for ISpy 範例、留空=「only members of the LocalDomainServers group」、保留靠 replication、tell mtc process/quit/compact/reindex/purge 全對、Tracking Center「track the status of individual mail messages」。一處用詞收緊:官方只說「log files produced by the Router」、未明寫 `.mtc` 副檔名 → 把「(MTC 檔)」雙語軟化為「追蹤 log 檔」。

## NotebookLM 說明

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據（fallback、已揭露）。

## 異動日誌

- 2026-10-28 新建（排 2026-11-01）。郵件管理 cluster 第 6 篇;官方三文為據;連 10/29;humanizer 自審;標題精簡;Path A staged。（Opus 4.8）
