---
slug: domino-backup-restore-task
title: "Domino 內建 Backup task(dominobackup.nsf):12 版自帶備份還原、硬前提 translog、還原出 data 目錄換 DBIID"
lang: [zh-TW, en]
pubDate: 2026-10-15
status: Path A staged（_pending，排 2026-10-15）
tags: [Domino Server, Admin, Backup]（TYPE 留白：概念＋設定解說）
requester: 使用者「挑選 14~19 主題、先查新聞沒有再寫技術文」→ 六篇計畫第 2 篇
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-13
updated: 2026-10-13
---

# 研究軌跡 — domino-backup-restore-task

admin 概念＋設定型。收尾 admin cluster:translog(10/13,為什麼) → DAOS(10/14,一個需要 translog 的場景) → **內建 Backup(本篇,另一個需要 translog 的場景)**。三篇都扣在「先開 translog」＋「DBIID」兩個點上。

## 選題（對帳後）

- 14~19 查無可發新聞（14.5.1 已涵蓋、無新 fixpack、webinar 待錄影)→ 技術文。
- grep「backup/dominobackup/備份」:只在 10/13 translog 順帶提媒體還原,**無專文** → 真缺口。
- 選它的理由:① translog(10/13)剛立、DAOS(10/14)剛立,內建 Backup 同樣「硬前提 translog」,正好把 admin cluster 收尾成三篇互扣;② 還原到 data 目錄外換 DBIID,再次呼應 10/13 的 DBIID 主題;③ Domino 12 內建備份是顧問常被問、站上沒寫過的缺口。

## 核心（官方 WebFetch）

- configuringbackup（12.0.2):Domino 12 引入;dominobackup.nsf 設定庫 + Backup/Restore 兩 task;**「Domino transaction logging is required on a Domino server that performs backup and restore.」逐字**;Configuration view → 平台預設文件 → New Config → Main/Backup/Snapshot/Restore/Prune/Notification 六分頁;Test Formula 預覽路徑;Global Configuration 整體預設;第一次跑 Backup 建出 dominobackup.nsf。
- runningbackup（12.0.2）:`load backup` 或 Program 文件;-b 備庫/範本(每天)、-t 備 archived TXN(2–8h)、-i 增量支援時點還原(archived,2–4h)、-s snapshot、-p<天數> prune 過期還原副本(不備份)、-e 加排除(可多次)、-E 忽略設定 Excluded 欄位。頁上唯一範例是 `load backup -p`（`load backup log.nsf` 來自 quickstart 頁,非本頁 → 未用、改用文件化開關）。
- restoringdatabases（12.0.2):Database Inventory(每庫一文件)→ Restore → Restore Job;Selected backup 唯一必填;時點挑備份與日誌;**還原路徑留空=原位、還原到 data 目錄外換 DBIID 並使舊日誌失效、官方建議留 data 目錄內**;可還原刪除文件/資料夾;還原副本複寫預設啟用;Submit Restore → Run Restore Server Cmd / `load restore`;Restore Jobs 看進度。third-party restore → Global Config「Restore 3rd party」、清單不存 dominobackup.nsf。

## 措辭守則

- 「Domino 12 才內建」別寫成「Domino 一直都有」——12 之前靠第三方 C API 工具。
- -b 每天、-t/-i archived 專用——別把 -t/-i 說成任何 style 都能用。
- -p 不備份——別把它混進「備份開關」一起講。
- 還原到 data 目錄外 → 換 DBIID、舊日誌失效——方向別反(呼應 10/13)。
- 時點還原靠 translog——這是「為什麼硬前提是 translog」的核心理由。

## 站上互連

- 連 10/13 translog（硬前提＋DBIID,hook＋兩節連回)。
- 連 10/14 DAOS（並列「另一個需要先開 translog 的功能」)。
- cluster:10/13 translog → 10/14 DAOS → 10/15 Backup,三篇互指。

## 標題候選

- [汰除] 名詞平述：`Domino 內建備份介紹` — 太泛。
- [汰除] 只講新功能：`Domino 12 新增內建備份還原` — 漏掉 translog 前提與 DBIID 雷。
- [選定] 版本＋前提：`Domino 內建 Backup task(dominobackup.nsf):12 版終於自帶備份還原,為什麼它一樣要先開 transaction logging`
  — 點出「12 才有(新)」＋「跟 DAOS 一樣要 translog(前提)」;dominobackup.nsf 好搜;標題自決。
  en 鏡像：`Domino's Built-in Backup Task (dominobackup.nsf): Domino 12 Finally Ships Backup and Restore — and Why It Also Needs Transaction Logging First`

## 查證 checklist

- [x] Domino 12 引入、12 前靠第三方
- [x] dominobackup.nsf + Backup/Restore 兩 task、首次跑建出
- [x] translog 硬前提（逐字引用）
- [x] 設定六分頁、Configuration view 平台預設、Test Formula、Global Config
- [x] load backup 開關 -b/-t/-i/-s/-p/-e/-E 語意
- [x] 還原流程、Selected backup 唯一必填、留空=原位、出 data 目錄換 DBIID、third-party
- [x] inline-link diversity：3 相異官方 URL 各 33%；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin + Backup
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ 多數正確,**抓到一個硬錯誤＋一處要軟化**,已修:
  - ①**還原副本複寫預設寫反了**(硬錯):初稿寫「預設啟用複寫」。官方相反——還原對話的 **Disable replication** 選項「enabled by default」,即還原副本**預設停用複寫**,要複寫得自己關掉該選項。雙語已改。
  - ②**「12 前靠 C API Toolkit」不在所引那三頁**:agent 確認歷史屬實(12 前走 C API NSFBackup*＋第三方如 Tivoli/Spectrum Protect),但非這幾個 admin 頁所述 → 依 [[feedback_no_vague_community_consensus]] 把 hook 的「走 C API Toolkit 那條路」軟化為「第三方備份工具」,不冠在這幾頁名下。(註:10/13 translog 文另有官方 backup 頁佐證 C API Toolkit 備份工具,故站上非無據,只是本篇不掛它。)
  - ③兩小點初稿已正確:`-p` 天數選填(省略用 Backup retention days)✓、Snapshot 分頁選填(只搭第三方 snapshot)✓——未再動。
  - agent 另確認逐字命中:translog 硬前提那句、Selected backup「only field required」、還原出 data 目錄換 DBIID、third-party restore inventory 不存 dominobackup.nsf。
- [x] 改後雙語 temp-build 再通過

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin 網域有 Admin notebook（2e2b3510-...），但本 session NotebookLM 瀏覽器狀態延續問題未解、無法互動啟用,改以官方 HCL 文件 WebFetch 為據(研究鏈允許 fallback、已揭露)。四個官方頁均 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-13 新建（排 2026-10-15）。六篇計畫第 2 篇、收尾 admin cluster;官方三文為據;連 10/13＋10/14;humanizer 自審;Path A staged。（Opus 4.8）
