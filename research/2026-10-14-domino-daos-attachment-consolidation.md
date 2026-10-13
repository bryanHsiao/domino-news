---
slug: domino-daos-attachment-consolidation
title: "DAOS(Domino Attachment and Object Service):附件搬出 NSF、去重存 NLO、硬前提 translog"
lang: [zh-TW, en]
pubDate: 2026-10-14
status: Path A staged（_pending，排 2026-10-14）
tags: [Domino Server, Admin, Performance]（TYPE 留白：概念＋設定解說，非 hands-on tutorial）
requester: 使用者「挑選 14~19 的文章主題，先檢查有沒有新訊息可發布、沒有的話繼續寫技術文章」→ 查無可發新聞（14.5.1 已涵蓋、無新 fixpack、webinar 待錄影）→ 自選題目；此為 14~19 六篇計畫的第 1 篇
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-13
updated: 2026-10-13
---

# 研究軌跡 — domino-daos-attachment-consolidation

admin／performance 概念＋設定型。接 10/13 translog → 10/08 維護指令那條 admin 內容線:translog 是 DAOS 的硬前提,DAOS 搬完要 compact——三篇互扣成一個 cluster。

## 選題（對帳後）

- 14~19 先查新聞:最新 Domino = 14.5.1（2026-03,已有「HCL Domino 2026 Release Highlights」涵蓋）、無新 fixpack、OpenNTF/panagenda webinar 待錄影 → **無可發新聞** → 轉技術文。
- grep「DAOS/attachment consolidation/\.nlo」:只在零星提及（無專文）→ 真缺口。
- 選它的理由:① translog(10/13)剛立,DAOS 正好是「為什麼要先開 translog」最常見的實務場景;② 連回 10/08 compact（搬完要壓縮才回收空間);③ NSF 肥大是顧問日常痛點、admin 強項;④ 官方文件充足。

## 核心（官方 WebFetch）

- attachment consolidation（admn_attachmentconsolidation_c，12.0.0）:「no longer saves a separate and complete copy of every document attachment」逐字;去重=相同附件共用庫只存一份、跨 DB 文件共同參照;文件留 **ticket** 引用;存成 **.nlo**;目錄超 OS 上限自動開子目錄。
- setup（admn_specifyingserversettingsforattachmentconsolidation_t，14.0.0）:第一句「Make sure that transaction logging is enabled」;Server DAOS 分頁欄位 Store file attachments in DAOS / DAOS base path（建議 data 目錄外）/ Minimum size / Defer object deletion for n days（0–9999）;要重啟;資料庫層 Advanced「Use Domino Attachment and Object Service」。
- tier 2（admn_daos_t2，12.0.2）:Domino 11 起;DAOSmgr 把久未存取物件由 tier 1 本機搬 tier 2 S3 相容儲存;Domino 12 起跨伺服器共用加密金鑰。
- compact 連動（連回 10/08）:搬走後 NSF 不自動縮、要 compact 回收;有 translog 用 -b 保 DBIID。

## 措辭守則

- consolidation 發生在**存檔當下**,不是事後維護 task——別寫成「某個 task 去掃」。（fact-check 特別盯這條時機）
- ticket 是官方用語（引用/參照),不是 pointer 的自創詞。
- translog 是**硬前提、官方明列**,不是「建議」——措辭要到位。
- tier 2 是搬「久未存取」物件,不是搬全部;「S3 相容」不等於「只能 AWS S3」。

## 站上互連

- 連 10/13 translog（硬前提,hook + 專節連回）。
- 連 10/08 維護指令（搬完要 compact 回收空間）。
- 三篇 cluster:translog(為什麼) → DAOS(一個需要 translog 的場景) → compact(收尾回收)。

## 標題候選

- [汰除] 名詞平述：`什麼是 DAOS` — 太泛、沒 hook。
- [汰除] 只講好處：`用 DAOS 幫 NSF 瘦身` — 漏掉 translog 前提這個最容易踩的雷。
- [選定] 機制＋前提：`DAOS(Domino Attachment and Object Service):把附件搬出 NSF、去重存成 NLO,為什麼它一定要先開 transaction logging`
  — 一句把「做什麼(搬出去重)」＋「最容易被忽略的前提(先開 translog)」都講了;好搜;標題自決（使用者已授權 [[feedback_title_self_decide]]）。
  en 鏡像：`DAOS (Domino Attachment and Object Service): Moving Attachments Out of the NSF into De-duplicated NLO Files — and Why It Needs Transaction Logging First`

## 查證 checklist

- [x] 去重/ticket/.nlo 機制（official attachment consolidation 頁逐字）
- [x] consolidation 時機=存檔當下（措辭守則盯）
- [x] translog 硬前提（「Make sure that transaction logging is enabled」逐字）
- [x] Server DAOS 分頁欄位（base path 建議 data 外、Minimum size、Defer 0–9999、重啟）
- [x] 資料庫層 Advanced「Use Domino Attachment and Object Service」
- [x] tier 2（DAOSmgr、S3 相容、Domino 11 起、12 起共用金鑰）
- [x] 搬完要 compact 回收、-b 保 DBIID（連回 10/08、10/13）
- [x] inline-link diversity：3 相異官方 URL 各 33%；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin + Performance
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（散文已實戰語氣、無宣傳套話、破折號承載真實補述,未強改）
- [x] fact-check（獨立 subagent）→ **九條方向全對、零事實錯誤**（共用庫單一拷貝限「同一伺服器」✓、ticket ✓、.nlo＋子目錄 ✓、去重=存檔當下「Consolidation occurs immediately」逐字 ✓、translog 硬前提第一句逐字 ✓、Server 欄位 ✓、資料庫 Advanced ✓、tier2 DAOSmgr/S3/11起/12起共用金鑰 ✓、搬完要 compact ✓）。依 agent 兩點「補足以免誤解」已修：
  - ①**compact 方向原寫錯**:初稿寫「壓縮用 -b」實為反——既有附件要搬進 DAOS 必須 **copy-style `compact -c -daos on`**(DAOS 選項在 in-place `-b` 下不可用、`-b` 搬不動既有附件)。已改;並點明 `-c` 會換 DBIID → 做完補完整備份(正好呼應 10/13 DBIID 那條,cluster 更緊)。
  - ②補官方 caveat「勾選只對之後新存附件生效、既有附件靠 copy-style compact 搬」(第 9 條的前因)+「看不到選項=ODS 太舊」。
  - ③Server 分頁補 DAOS object encryption(None/Private/Shared)＋加密強度(classic/AES-128/AES-256)。
  - agent 另提醒別把 DAOS *resynchronization*(可排程)誤當去重時機——本文未涉,去重時機寫對(存檔當下)。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

DAOS 屬 admin 網域,有 Admin notebook（2e2b3510-...）,但本 session NotebookLM 瀏覽器狀態延續性問題仍在、無法互動啟用,故改以**官方 HCL 文件 WebFetch** 為據(研究鏈允許 NotebookLM thin/不可用時 WebFetch fallback、並向使用者揭露)。三個官方頁均已 WebFetch 驗證非 404。

## 異動日誌

- 2026-10-13 新建（排 2026-10-14）。14~19 查無新聞、轉技術文,此為六篇計畫第 1 篇;官方三文為據;連 10/13＋10/08 成 cluster;humanizer 自審;Path A staged。（Opus 4.8）
