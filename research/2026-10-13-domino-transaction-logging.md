---
slug: domino-transaction-logging
title: "Domino 交易日誌(transaction logging):三 style、recovery、DBIID"
lang: [zh-TW, en]
pubDate: 2026-10-13
status: Path A staged（_pending，排 2026-10-13）＋同日需手動 publish-pending 促發（已過台北 07:30）
tags: [Domino Server, Admin, Backup]（TYPE 留白：概念解說）
requester: 使用者「今天是不是沒文章了?查一下,沒有就寫」→ 對帳確認 10/13 空（pending 全空、最新 10/12）→ 自選題目
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-13
updated: 2026-10-13
---

# 研究軌跡 — domino-transaction-logging

admin 概念型。回補 10/08 維護指令那篇整篇拿「有沒有 translog」當分支、卻沒解釋 translog 本身的空檔。

## 選題（對帳後）

- git pull + `date -u`（10/13 02:52 UTC = 台北約 11:00）+ `ls _pending`（全空）→ 確認 10/13 無文章。
- grep「transaction log/交易日誌」：只在 10/08、9/18、domino-iq-rag 順帶提,**無專文** → 真缺口。
- 選它的理由:回頭深化 10/08 的「-b 保 DBIID / 有日誌別 routine fixup / 換 DBIID 補備份」三條規則的「為什麼」;站上 admin/troubleshooting 強項;官方文件充足。

## 核心（官方 WebFetch）

- concept（admn_transactionlogging_c）:單一 per-server log（`Sxxxxxxx.TXN` + `NLOGCTRL.LFH`）、批次寫;crash recovery 重啟自動回放;**「Logged databases do not require a consistency check」** 逐字。
- setup（admn_settingupadominoserverfortransactionlogging_t）:Server 文件 Transactional Logging 分頁、Enabled 要重啟;Log path 建議專用/鏡像磁碟 ≥1GB;3–64 log 檔;Max log space 預設 500MB/上限 4096MB（circular/linear）;Automatic fixup 預設開（日誌救不回才跑）;Runtime/Restart performance Standard 預設。三 style:circular 預設（≤4GB 覆寫）、archived 建議（備份工具封存後才回收）、linear（>4GB）。「After you change the logging style, Domino assigns a new DBIID to each database」逐字。
- backup（admn_backupandrestorerequirements）:archived 與媒體/時點還原。
- DBIID:第一次開/換 style/copy-style・縮檔 compact（-c/-B）/對損毀 fixup → 換 DBIID → 補完整備份;就地 -b（不縮檔）保留 DBIID。

## 措辭守則

- circular 才有 4GB 上限、linear 無;archived 沒備份工具會塞爆 panic——方向別反。
- -b 保 DBIID、-B/-c 換 DBIID——方向別反（這是連回 10/08 的關鍵）。

## 站上互連

- 雙向連 10/08 維護指令（hook + 兩節連回;它那篇的「有 translog」分支的原因就是這篇）。

## 標題候選

- [汰除] 名詞平述：`Domino 交易日誌是什麼` — 太泛、沒 hook。
- [汰除] 好處先行：`開了交易日誌,fixup 幾乎不用跑` — 只點一面。
- [選定] 回補脈絡＋三面：`Domino 交易日誌:三種 style、為什麼開了它就不用 routine fixup,以及它怎麼牽動 compact 的 DBIID`
  — 直接對準讀者看維護指令時冒出的「translog 到底是什麼、為什麼翻掉那麼多規則」;三個具體面向(style/fixup/DBIID)好搜;標題自決（使用者已授權）。
  en 鏡像：`Domino Transaction Logging: the Three Styles, Why It Replaces Routine Fixup, and How It Drives Compact's DBIID`

## 查證 checklist

- [x] 三 style（circular ≤4GB／linear 無上限／archived 需備份工具・媒體還原）方向正確
- [x] DBIID：-b 保、-B/-c・fixup-on-corrupt・開/換 style 換 → 補備份（方向正確）
- [x] 「Logged databases do not require a consistency check」逐字；fixup 退後備、Automatic fixup 預設開
- [x] 設定（重啟、專用/鏡像磁碟 ≥1GB、Max 500MB/4GB、Automatic fixup 預設、Standard）
- [x] inline-link diversity：3 相異官方 URL 各 33%；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin + Backup
- [x] 雙語 temp-build 通過
- [x] humanizer 自審 ~45/50
- [x] fact-check（獨立 subagent）→ **NEEDS SOFTENING、方向全對**（4GB 屬 circular ✓、`-b` 保/`-B`・`-c`・fixup 換 DBIID ✓、「do not require a consistency check」逐字、設定全對）。兩處已修：
  - ①「只有 archived 能媒體/時點還原」過度宣稱——所引 12.0.0 backup 頁自己寫「Circular, linear, and archived... are all supported」做 point-in-time（Domino 12 Backup task）→ 改「archived 為封存＋媒體還原而設、circular/linear 主管當機回復」，拿掉「只有」。
  - ②「伺服器 panic」無官方出處（real-world lore）→ 改為文件有據的「log 檔不斷長出、只進不出、塞爆 log 磁碟」，拿掉 panic。呼應 [[feedback_no_vague_community_consensus]]。
  - agent 另確認 backup 頁逐字「Compacting a database using an option other than -b」「Running Fixup on a database」→ require full backup。

## 補強（使用者觸發，promote 後）

使用者問「有提到從哪啟用?如何檢查有沒有啟用?」+「跟 10/08 做雙向引用、順序上 translog 應先於維護指令」。
- **「怎麼檢查現在有沒有開」新一節**（雙語）：① Server 文件 Transactional Logging 分頁（最準、設定來源）；② notes.ini `TRANSLOG_Status=1`=開、`TRANSLOG_Style` 0=circular/1=archived/2=linear（[HCL dominowiki TransLog_Style](https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/TransLog_Style)），caveat：TRANSLOG_* 由 Server 文件寫下並覆寫、讀可看現狀但要改走 Server 文件；③ log 路徑有 `Sxxxxxxx.TXN`＋`NLOGCTRL.LFH`。（TRANSLOG_Status 1/0 方向、Style 0/1/2 對照 WebSearch 多源確認；官方現行 notes.ini 頁抓不到，故 Server 文件為主、notes.ini 為輔、框成「讀現狀用」。）
- **雙向引用補齊**：10/13 本來就連去 10/08；這次在 **10/08 的「transaction log 改變一切」段加回連指向 10/13**，並照使用者的順序建議寫「建議先讀 translog 那篇再回來看指令」。兩篇都在正式目錄、push 會重新 deploy。
- diversity 升到 4 URL 各 25%；雙語 temp-build 通過。

## 異動日誌

- 2026-10-13 新建。對帳確認今日無文、自選 translog 回補 10/08;官方三文為據;雙向連 10/08;humanizer 自審;排 10/13 Path A ＋需手動 publish-pending 促發。（Opus 4.8）
