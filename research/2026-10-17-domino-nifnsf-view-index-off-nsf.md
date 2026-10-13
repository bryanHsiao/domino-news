---
slug: domino-nifnsf-view-index-off-nsf
title: "NIFNSF:view index 外移 .ndx、硬前提 translog+ODS51、-c 開換 DBIID"
lang: [zh-TW, en]
pubDate: 2026-10-17
status: Path A staged（_pending，排 2026-10-17）
tags: [Domino Server, Admin, Performance]（TYPE 留白：概念＋設定解說）
requester: 使用者「挑 14~19 主題、先查新聞沒有再寫技術文」；原訂 10/17 XPages 自訂錯誤頁經查官方文件偏薄(多論壇/書、requestScope.error 未獲證實)→ 改採真缺口且官方扎實的 NIFNSF
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-13
updated: 2026-10-13
---

# 研究軌跡 — domino-nifnsf-view-index-off-nsf

admin externalization 型,admin cluster 收尾capstone。與 DAOS(10/14)完美成對:DAOS 搬附件、NIFNSF 搬 view index——都縮 NSF、都要先開 translog、都用 copy-style compact 開(→換 DBIID)。第 4 度扣回 translog/DBIID。

## 選題（換題紀錄）

- **原訂 10/17 = XPages 自訂錯誤頁**:WebSearch 後發現官方文件偏薄——多為論壇(developer.ds.hcl-software.com)、書 TOC、2011 簡報;`requestScope.error`、custom error page 機制無乾淨官方頁;ddwiki「XPages configuration file format」頁不含 xsp.error.page。依研究鏈「不靠猜填空、要官方出處」→ 不硬寫,改題。
- **改採 NIFNSF**:grep `NIFNSF` 全站**零命中** → 真缺口;官方文件扎實(12.0.2 moving-views 頁 + NIFNSFEnable/NIFBasePath 參考頁);又與 DAOS 成對、接 admin cluster。

## 核心（官方 WebFetch）

- moving-views（12.0.2):view index 移出 .nsf → .ndx;好處「makes the database file smaller」「speeds up backup and restore」;.ndx 可到 1TB;**前提:程序第一步「Enable transactional logging in the Server document in the Domino directory」+「To use this feature, databases must be at ODS version 51 or higher」逐字**;12.0.2+ Server 文件 NIFNSF 分頁(Store view indexes in NIFNSF／NIFNSF base path／Enable NIFNSF when creating new databases),對應 notes.ini NIFNSFEnable=1／NIFBasePath／CREATE_NIFNSF_DATABASES=1,Server 文件優先,改完重啟;逐庫 `load compact -c -nifnsf on/off`;`show dir -nifnsf`／`-nifnsfonly`。
- NIFNSFEnable（10.0.1）:1=庫外、0=庫內、預設 0、Server 範圍。
- NIFBasePath（11.0.1）:.ndx 位置,預設 data 目錄。
- DBIID 橋接:逐庫開用 copy-style `-c`(官方指令就是 -c)→ 換 DBIID(10/13 translog 已立)→ 補完整備份。

## 措辭守則

- NIFNSF 搬的是 **view index**,不是文件資料、也不是附件(附件是 DAOS)——別混。
- 前提兩個都要:translog **和** ODS 51+——別只講一個。
- 1TB 是 .ndx 單檔上限、且實務上檢視反應先成瓶頸——照官方框,別誇成「無限大」。
- `-c` 換 DBIID 是一般 compact 知識、歸因 translog 文;官方 NIFNSF 頁本身給的逐庫指令確實是 -c。

## 站上互連

- 連 10/14 DAOS（核心對照:搬附件 vs 搬 view index,hook＋多處）。
- 連 10/13 translog（硬前提＋-c 換 DBIID）。
- 連 6/21 ODS（ODS 51+ 要求）。
- 連 10/16 DBMT（`-ods` 同屬 copy-style→補備份那條規則）。

## 標題候選

- [汰除] 名詞平述：`認識 NIFNSF` — 太泛。
- [選定] 對照＋前提：`NIFNSF:把 view index 也搬出 NSF——DAOS 搬附件、NIFNSF 搬檢視索引,一樣要先開 transaction logging`
  — 用「也」接上 DAOS 那篇、建立對照;點出同樣要 translog 的前提;標題自決。
  en 鏡像：`NIFNSF: Move View Indexes Out of the NSF Too — DAOS Moves Attachments, NIFNSF Moves View Indexes, and Both Need Transaction Logging First`

## 查證 checklist

- [x] view index→.ndx、NSF 變小、加速備份還原、.ndx 1TB
- [x] 前提 translog(第一步)＋ODS 51+(兩句逐字)
- [x] 12.0.2+ Server 文件 NIFNSF 分頁三欄位＋notes.ini 對應＋Server 文件優先＋重啟
- [x] NIFNSFEnable 1/0 方向、預設 0、Server 範圍
- [x] 逐庫 load compact -c -nifnsf on/off、show dir -nifnsf / -nifnsfonly
- [x] -c copy-style → DBIID 橋接(歸因 translog 文)
- [x] inline-link diversity：3 相異官方 URL 各 33%（moving-views／NIFNSFEnable／NIFBasePath）；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin + Performance
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ **七條全對、零錯誤、NIFNSFEnable 值方向沒寫反**。逐字命中:「.NDX files have a limit of 1 TB」、「Enable transactional logging in the Server document in the Domino directory」、「To use this feature, databases must be at ODS version 51 or higher」、NIFNSFEnable 0=庫內/1=庫外、`load compact -c -nifnsf on/off`、`show dir -nifnsf`/`-nifnsfonly`、Server 文件值優先。兩個加分項已補:
  - ①官方 64GB 具體數字(10.0.1 頁「Help avoid reaching the 64 GB database size limitation」)→ 補進「NSF 變小」那點。
  - ②12.0.2 的三個 Server 文件欄位還需「伺服器 12.0.2+ 且 pubnames.ntf 為 V12.0.2+ 設計」→ 補進 12.0.2 一節。
  - 1TB 但書(實務先撞其他限制)初稿已含、未再動;「transactional/transaction logging」用字相同意、沿用站上既有譯法。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin 網域有 Admin notebook，本 session NotebookLM 瀏覽器狀態延續問題未解,改以官方 HCL 文件 WebFetch 為據(研究鏈允許 fallback、已揭露)。三官方頁 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-13 新建（排 2026-10-17）。**原訂 XPages 錯誤頁因官方文件偏薄換題 NIFNSF**;官方三文為據;連 10/14＋10/13＋6/21＋10/16;humanizer 自審;Path A staged。（Opus 4.8）
