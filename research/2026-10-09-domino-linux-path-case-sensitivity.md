---
slug: domino-linux-path-case-sensitivity
title: "Domino for Linux 路徑大小寫 + path cache 陷阱（第一手實測）"
lang: [zh-TW, en]
pubDate: 2026-10-09
status: staged（_pending，排 2026-10-09，Path A）
tags: [Domino Server, Admin, Tutorial]（Tutorial：含可照跑的重現步驟 + workaround）
requester: 跨 session 協作——peer「WSL Domino R12 伺服器-LDAT05」在真實環境實測後把資料送來寫文章（代使用者）。參考原文 xred《Domino for Linux 檔案路徑大小寫相容性解析》，但獨立寫、不引用。
author_model: claude-opus-4-8
testing_source: LDAT05 session（真實 Domino 12.0.2 FP8 / Linux WSL2，curl + Claude-in-Chrome 登入 session 實測）
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-09
updated: 2026-10-09
---

# 研究軌跡 — domino-linux-path-case-sensitivity

第一手實測型。核心證據是 peer LDAT05 在真實 R12（12.0.2 FP8 / Linux WSL2）跑的三輪 curl + 登入 session 對照。獨立寫、不引 xred。

## 獨立性（不引用 xred）

xred 原文《Domino for Linux 檔案路徑大小寫相容性解析》只是觸發題材；本篇不引用它，改以：
- **第一手實測**（LDAT05 真環境）為主證——這是比任何轉貼都硬的證據，也是使用者偏好的實證驅動。
- **官方佐證**：directory/database links（[官方](https://help.hcl-software.com/domino/14.0.0/admin/admn_creatingupdatinganddeletingdirectoryanddatabasel_t.html)）、Redirect URL command（[官方](https://help.hcl-software.com/domino/11.0.1/admin/conf_findinglinkswiththeredirecturlcommand_t.html)）、UNIX/Linux 大小寫風險（Data Protection for Domino 已知限制）。

## 核心事實（全第一手實測 + 官方佐證）

- Linux 檔案系統分大小寫、Windows 不分 → URL 的「資料夾 + .nsf」大小寫對不上實體 → `File does not exist`/404。
- **path cache 間歇性**（本文最大洞見）：Domino HTTP task 快取成功的路徑解析；正確大小寫開過一次後、錯誤大小寫也通。404 只在「cache 冷 + 首發打錯」出現。
- 三輪重現：輪1 熱 cache 兩種都 200（測不到）；輪2 `dbcache flush` 單獨不夠、首發仍 200；輪3 `dbcache flush` + `restart task http` + 中性探針（/homepage.nsf，不污染目標路徑）+ 搶首發 `/ffh/` → 404，再 `/FFH/` → 200，再 `/ffh/` → 200。
- 要清的是 HTTP task 快取（`restart task http`），不是 dbcache。
- workaround 對照（冷 cache 首發 `/ffh/`）：無→404、OS symlink→200、Domino `.dir` link→200。加碼：`.dir` 指 data dir 內部子目錄也 work（打破「只用於 data dir 外」的常見認知）。
- notes.ini：grep 過沒有路徑大小寫/path cache 開關（負結果）。

## 補測 A 的烏龍與更正（重要，出刊前擋下）

LDAT05 第一版補測 A 用 curl 打 `/FFH/doc.nsf/homepage.xsp`（元件小寫）得 200、誤判「.xsp 大小寫不敏感」。**我一度把這個錯結論寫進草稿**（「實測坐實 .xsp 不受影響」）。
LDAT05 隨即自我更正：那個 200 是**未登入的 Login 頁假象**——curl 無 session，Domino 處理順序是「解析 db 路徑 → 認證 → 才查元件」，curl 卡在認證層、根本沒走到元件查找。
正確版（Claude-in-Chrome 帶使用者自己登入的 session 實測）：`HomePage.xsp` 開得了、`homepage.xsp`/`HOMEPAGE.xsp` 都 404「找不到項目異常」→ **.xsp 元件名其實一直大小寫敏感**（使用者一開始就講對）。
→ 已從草稿刪掉錯結論，改寫成「**兩種大小寫敏感**」一節：
1. OS path cache 陷阱（資料夾+.nsf、只有 Linux、有 cache 時間性、可 workaround）；
2. NSF 設計元件查找（.xsp/view/form、Windows+Linux 恆定敏感、無 workaround）。
教訓：peer 送來的「實測結論」也要能被使用者/再驗推翻；幸好 ship 前抓到。呼應 [[feedback_no_vague_community_consensus]]（涉 API 行為先對照、別將就）。

## 高價值鑑別點（入文）

兩種大小寫失敗吐**不同 404 訊息**：OS 層「File does not exist」vs 元件層「找不到項目異常」。看訊息就知道查哪一層。（en 版未硬翻英文字串，改寫成 "item not found"-type、保留 zh 原訊息，重點放「兩者訊息不同」這個可驗證事實。）

## 措辭守則

- 第一手實測明確框成「一台真實 R12 12.0.2 FP8 實測」，不假稱官方文件化行為；path cache 機制講成「measurements imply HTTP-task-level cache」不過度宣稱內部實作。
- `.xsp` 不寫成「大小寫不敏感」（會誤導）；明講它恆定敏感、只是敏感的理由是 design element 查找、非 OS。

## 標題候選

- [汰除] 問題先行：`搬到 Linux 後 URL 大小寫錯有時通有時 404?` — 症狀好搜但沒點出 path cache 這個真兇。
- [汰除] 概念 hook（窄）：`cache 熱著測不出來的 bug` — hook 很強但不夠具體、沒講主題。
- [選定] 主題＋真兇：`Domino for Linux 的大小寫陷阱：URL 大小寫錯為什麼時通時 404，path cache 把它藏起來`
  — 點題（Domino for Linux 大小寫）＋症狀（時通時 404、好搜）＋真兇（path cache 藏起來，這是全文洞見）。標題自決（使用者已授權）。
  en 鏡像：`Domino on Linux: the Case-Sensitivity Trap, and Why the Path Cache Hides It`

## 查證 checklist

- [x] Linux 大小寫 / File does not exist：官方佐證（Data Protection 已知限制 + 一般 Linux 行為）
- [x] directory/database link（.dir/.nsf、路徑重導、UNIX 子目錄規則、ACL）：官方逐字
- [x] path cache 三輪重現、restart task http vs dbcache flush、中性探針：第一手實測
- [x] 兩種大小寫敏感分層（OS path cache vs NSF 元件）：第一手實測（含補測 A 更正版）
- [x] 不同 404 訊息鑑別點：第一手（en 字串已 hedge）
- [x] workaround 對照表（無/symlink/.dir）+ .dir 內部子目錄 + notes.ini 負結果：第一手
- [x] inline-link diversity：3 相異官方 URL 各 ~33%（<40%），每語 3 外部（≥2）
- [x] TYPE Tutorial（重現步驟 + workaround 可照跑）；tags Domino Server + Admin + Tutorial
- [x] 雙語 temp-build 通過（更正後）
- [x] humanizer 自審 ~45/50（field-report 第一手語氣；表格/步驟為正當結構）
- [x] fact-check（獨立 subagent）→ **NEEDS SOFTENING、無事實錯誤**，三處已修：
  - **#1 引用掛錯**：原引 Redirect URL command 頁（其實講網頁內連結解析）→ 換成正確的 **URL commands for opening servers, databases, and views**（官方明寫 server／appFileAndPath／name 皆 case insensitive）。順勢把「為什麼」段改寫成更利的框架：**Domino URL 模型本承諾路徑不分大小寫（Windows 成立），Linux OS 層把它破功**＝陷阱源頭。
  - **#2 過度宣稱（最重要）**：原寫「view／form／agent 名也恆定大小寫敏感」→ 錯。只實測了 `.xsp`；且官方 URL 命令說明 classic view/form `name` **不分大小寫**。改寫成「一條 URL 裡哪幾段吃大小寫」：OS 層（資料夾+`.nsf`、Linux 敏感、cache 時間性）／classic view-form 名（不分，官方）／XPages `.xsp` 頁名（實測敏感、恆定、無 workaround）。
  - **#3 path cache 內部機制講得像官方事實**→ hedge 成「行為上 HTTP task 記住解析過的路徑（內部是快取或開著 handle 官方沒文件化），用 path cache 當代稱」。TL;DR／why／wrap 皆已軟化。
- [x] LDAT05 追加第一手數據已折入：server 端 cache（非瀏覽器、curl 從 server 本機重現）＋「重啟後首發決定全體」隱蔽性；OS 層確切錯誤字串「錯誤 404 HTTP Web Server: HCL Notes 異常情況 - File does not exist」；symlink body 對照（無＝File does not exist／有＝Login 頁，證明解的是路徑層）；`.nsf` 檔名（`Doc.nsf`）實測與資料夾同行為（OS 層＝資料夾+`.nsf` 兩者皆實測）。
- [x] diversity 重查（換 URL 後）：3 相異官方 URL 各 33%（<40%），每語 3 外部。雙語 temp-build（修正後）通過。

## 異動日誌

- 2026-10-09 新建。LDAT05 第一手 R12 實測為主證、官方佐證、不引 xred。補測 A 烏龍（curl Login 頁假 200）ship 前更正為「.xsp 恆定大小寫敏感」、改寫成兩種大小寫敏感 + 錯誤訊息鑑別點。humanizer 自審；排 10/09 Path A。（Opus 4.8）
