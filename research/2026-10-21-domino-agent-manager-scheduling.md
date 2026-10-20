---
slug: domino-agent-manager-scheduling
title: "Agent Manager:日/夜時段 gap、Max concurrent、execution time、notes.ini 節流、Tell Amgr"
lang: [zh-TW, en]
pubDate: 2026-10-21
status: Path A staged（_pending，排 2026-10-21，未來日期→cron 自動 promote）
tags: [Domino Server, Admin]（TYPE 留白：概念＋排查）
requester: 使用者「寫20~26的文章」；20~26「伺服器子系統」cluster 第 2 篇
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-20
updated: 2026-10-20
---

# 研究軌跡 — domino-agent-manager-scheduling

admin agent 子系統型。grep 確認 AMgr 無專文(命中皆 java-agent/console-troubleshooting 順帶提)。切入點=「排程 agent 為什麼不跑/跑太慢/被砍」這個顧問日常問題。

## 核心（官方 WebFetch）

- server-tasks-agent-manager-tab（12.0.0）:日/夜兩套;Refresh agent cache 預設 12AM;Max LS/Java execution time 日 10 分/夜 15 分;Max concurrent 1–10 日1/夜2;Max % busy before delay 僅 R4.6 以前;Daytime 8AM–8PM / Nighttime 8PM–8AM;**gap 內不跑排程 agent**(官方例 5AM–8AM)。
- improving-performance（11.0.1）:每並行=一個 Agent Executive;notes.ini AMgr_SchedulingInterval 1min、DocUpdateEventDelay 5min、DocUpdateAgentMinInterval 30min、NewMailEventDelay 1min、NewMailAgentMinInterval 0;DominoAsynchronizeAgents 0=一次一個 web agent;排不贏→「AMgr: Agent scheduling is paused」。
- tell-commands（11.0.1）:Tell Amgr Schedule(今日排程)、Tell Amgr Status(佇列+設定快照)。
- 另:排程最小間隔 5 分(=polling);事件觸發 agent 建立/修改時排立刻跑一次;web agent 由 Domino Web Engine「Run Web agents concurrently?」控制、與排程無關。

## 措辭守則

- gap 行為方向別反:gap 內「不跑」。
- Max concurrent 預設日 1/夜 2、execution time 日 10/夜 15——日夜別對調。
- DocUpdateAgentMinInterval 預設 30 分是「文件觸發為何不即時」關鍵,別跟 EventDelay(5 分)混。
- web agent 設定「與排程 agent 無關」——別讓讀者以為改這個會影響排程 agent。

## 站上互連

- 鬆連:Agent 本體概念可連 notes-agent(6/12)/java-agent-anatomy(8/10);Tell/console 可連 console-troubleshooting(9/17)。正文未硬塞,避免硬湊(diversity 用官方 3 URL 已足)。

## 標題候選

- [選定] 痛點＋機制:`排程 agent 為什麼沒跑、或跑太慢:Agent Manager 的日/夜時段、並行數、執行時間上限,與 Tell Amgr 怎麼查`
  en：`Why Your Scheduled Agent Doesn't Run (or Runs Late): Agent Manager's Day/Night Windows, Concurrency, Execution Limits, and Tell Amgr`

## 查證 checklist

- [x] AMgr 排程+事件觸發、輪詢、最小間隔 5 分、事件 agent 建立即排跑
- [x] 日/夜時段預設 8AM-8PM/8PM-8AM、gap 內不跑(官方例)
- [x] Max concurrent 1-10 日1/夜2、Agent Executive、scheduling is paused
- [x] Max LS/Java exec time 日10/夜15、超時終止記 Agent Log
- [x] Refresh agent cache 12AM、Max % busy 僅 R4.6 以前
- [x] notes.ini 五個節流預設值
- [x] web agent DominoAsynchronizeAgents 另管
- [x] Tell Amgr Schedule/Status
- [x] inline-link diversity：3 相異官方 URL 各 33%；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、排查清單、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ 第 2–8 條**全對**(日/夜 8AM-8PM/8PM-8AM＋gap 不跑、Max concurrent 1-10 日1/夜2＋Agent Executive＋scheduling is paused、Max exec 10/15 分記 Agent Log、Refresh cache 12AM、Max%busy 僅 R4.6 前、五個 notes.ini 預設、DominoAsynchronizeAgents、Tell Amgr Schedule/Status 皆官方逐字)。**第 1 條兩個錯已修**:
  - ①「排程最小間隔 5 分=輪詢間隔」**雙重錯**:官方無最小間隔下限,5 分只是「別排太密會傷效能」的例子;輪詢是 `AMgr_SchedulingInterval` 預設 **1 分鐘** → 改寫為「排程器預設 1 分鐘輪詢、agent 按設定間隔跑、排太密傷效能」。
  - ②「事件觸發 agent 建立/修改時立刻跑一次」官方無此說 → 改為「文件建立/修改觸發依負載有 **5–30 分鐘延遲**、不是即時」。
  - 三處(TL;DR／本文／小結)雙語都已改。gap/concurrent/exec/notes.ini 等其餘未動。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin 網域;本 session NotebookLM 瀏覽器狀態延續問題未解;官方 HCL 文件 WebFetch 為據(fallback、已揭露)。官方頁 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-20 新建（排 2026-10-21）。cluster 第 2 篇;官方三文為據;humanizer 自審;Path A staged。（Opus 4.8）
