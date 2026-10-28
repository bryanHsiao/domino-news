---
title: "Domino 內建 Backup task:12 版終於自帶備份還原"
description: "Domino 12 之前,想做資料庫層級的備份還原,得自己接第三方(走 C API Toolkit)的工具;12 版起,Domino 內建了 Backup 與 Restore 兩個 server task,用一個 dominobackup.nsf 設定資料庫就能排程備份、按需還原單一資料庫。這篇講它是什麼、為什麼它跟 DAOS 一樣「一定要先開 transaction logging」、怎麼用 Configuration view 的平台預設設定文件建一份 config(Main/Backup/Snapshot/Restore/Prune/Notification 分頁)、怎麼用 load backup 的開關(-b/-t/-i/-s/-p)排程跑、以及怎麼從 Database Inventory 還原——包含一個很容易踩的雷:還原到 data 目錄之外會換掉 DBIID、讓之前的交易日誌失效。"
pubDate: 2026-10-15T07:30:00+08:00
lang: zh-TW
slug: domino-backup-restore-task
tags:
  - "Domino Server"
  - "Admin"
  - "Backup"
sources:
  - title: "Setting up backup and restore(dominobackup.nsf、要先開 translog、Configuration view 平台預設、六個分頁)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/admn_configuringbackup.html"
  - title: "Running the Backup server task(load backup 的 -b／-t／-i／-s／-p／-e／-E 開關)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/admn_runningbackup.html"
  - title: "Restoring databases(Database Inventory、Restore Job、Selected backup、還原到 data 目錄外會換 DBIID)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/admn_restoringdatabases.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-backup-restore-task.webp"
coverStyle: "art-deco"
---

Domino 12 之前,想做「資料庫層級、能挑單一庫還原、能做時點還原」的備份,你得自己接一套第三方備份工具。12 版起,這件事變成**內建**的了:Domino 自帶 **Backup** 和 **Restore** 兩個 server task,配一個 **`dominobackup.nsf`** 設定資料庫,就能排程備份、再按需還原單一資料庫。但它有個跟 DAOS 一模一樣的硬前提——**得先開 transaction logging**(那是什麼、怎麼開/檢查,見 [Domino 交易日誌](/domino-news/posts/domino-transaction-logging/))。

---

## 重點摘要

- **是什麼**:Domino **12 版起內建**的備份還原,靠 `dominobackup.nsf`(設定資料庫)+ **Backup / Restore** 兩個 server task 運作。第一次跑 Backup task 會自動建出 `dominobackup.nsf`。
- **硬前提**:官方一句話——**「Domino transaction logging is required on a Domino server that performs backup and restore」**。跟 DAOS 一樣,沒開日誌就免談。
- **怎麼設**:開 `dominobackup.nsf` → Configuration view → 挑你平台(Linux/Windows)的**預設設定文件** → New Config → 填 **Main / Backup / Snapshot / Restore / Prune / Notification** 六個分頁(路徑欄位可用 **Test Formula** 先預覽算出來的路徑)。
- **怎麼跑**:主控台 `load backup` 或用 Program 文件排程。開關:`-b`(備資料庫/範本,建議每天)、`-t`(備 archived 日誌的 TXN 檔)、`-i`(增量、支援時點還原)、`-s`(snapshot)、`-p`(prune 過期還原副本)。
- **怎麼還原**:`dominobackup.nsf` 的 **Database Inventory** 挑那個庫 → Restore 開 **Restore Job** → 選 **Selected backup**(唯一必填)→ 可按時點挑備份與日誌 → Submit Restore → `load restore`。
- **一個雷**:還原路徑**留空=回原位**;還原到 **data 目錄之外**會**換掉 DBIID**、讓之前的交易日誌失效(官方建議還原就留在 data 目錄內)。

## 它是什麼:一個設定庫 + 兩個 task

內建備份的核心是 **`dominobackup.nsf`**——一個放「要備什麼、備到哪、怎麼還原、怎麼清舊檔」設定的資料庫。你不用自己寫腳本,改填設定文件;兩個 server task 照設定做事:

- **Backup task**:照設定把一個或多個資料庫(與範本)備到目標目錄。第一次執行時會順手把 `dominobackup.nsf` 建出來。
- **Restore task**:按需還原單一資料庫——這是內建備份最實用的地方:不必為了救一個庫去還原整台伺服器。

這是 Domino **12** 才有的功能;12 版之前只能靠第三方備份工具。

## 硬前提:先開 transaction logging

跟 [DAOS](/domino-news/posts/domino-daos-attachment-consolidation/) 一樣,內建備份要求伺服器**先開交易日誌**。官方設定頁講得很死:**「Domino transaction logging is required on a Domino server that performs backup and restore.」**

道理也一致:**時點還原**(point-in-time)靠的就是「還原一份完整備份、再套上備份之後的日誌更新」,把庫帶回某個時刻。沒有交易日誌,這套就不成立。所以**先把日誌開好、確認在跑**(開法與檢查見[交易日誌那篇](/domino-news/posts/domino-transaction-logging/)),再來設備份。

## 怎麼設:Configuration view + 六個分頁

設定都在 `dominobackup.nsf` 裡做([官方設定步驟](https://help.hcl-software.com/domino/12.0.2/admin/admn_configuringbackup.html)):

1. 開 `dominobackup.nsf`,進 **Configuration** view。
2. 挑你平台(Linux 或 Windows)的**預設設定文件**,按 **New Config** 從它複製一份出來(預設值已填好)。
3. 逐一填這幾個分頁:
   - **Main**:一般設定(例如排除哪些庫、目標目錄等)。
   - **Backup**:備份目的地;路徑欄位可用 **Test Formula** 先預覽算出來的實際路徑。
   - **Snapshot**(選填):要搭第三方 snapshot 方案時設這裡。
   - **Restore**:還原位置,**應與備份路徑對得上**,一樣能 Test Formula 預覽。
   - **Prune**:什麼時候清掉比較舊的備份副本。
   - **Notification**:備份通知。
4. Save & Close。設定裡的 backup／restore／prune 指令要彼此對得上;另有一份 **Global Configuration** 文件提供整體預設。

## 怎麼跑:load backup 的開關

備份可以用 **Program 文件排程**,也可以在主控台直接 `load backup`。常用開關([官方執行頁](https://help.hcl-software.com/domino/12.0.2/admin/admn_runningbackup.html)):

- **`-b`**:只備**資料庫與範本**。官方建議**每天跑一次**(不論日誌模式)。
- **`-t`**:備**交易日誌的 TXN 檔**——**只適用 archived style** 日誌;官方建議每 2–8 小時,視伺服器大小與資料變動量。
- **`-i`**:做**增量**備份(自上次完整備份後新增、或換過 DBIID 的庫),用來**支援時點還原**;archived 專用,建議每 2–4 小時。
- **`-s`**:照 Configuration 的 Snapshot 分頁做 **snapshot** 備份。
- **`-p <天數>`**:**prune**(清掉標記過期的還原副本)達指定天數;省略天數就用設定裡的保留天數。注意 `-p` **不備份**。
- **`-e` / `-E`**:`-e` 另外加排除樣式(可多次);`-E` 忽略設定裡的 Excluded databases 欄位,跟 `-e` 合用等於整組換掉。

所以典型節奏是:`-b` 每天一次備庫,archived 環境再用 `-t`、`-i` 以較短間隔備日誌與增量,撐起時點還原。

## 怎麼還原:Database Inventory → Restore Job

要救某個庫時([官方還原步驟](https://help.hcl-software.com/domino/12.0.2/admin/admn_restoringdatabases.html)):

1. 開 `dominobackup.nsf` 的 **Database Inventory** view——每個被備過的庫一份文件。
2. 選那個庫的文件,按 **Restore**,開一份 **Restore Job** 文件。
3. 挑備份:**Selected backup 是唯一必填**欄位;用 Restore time / 時點選項,可以幫你把對應的備份與交易日誌一起挑出來。
4. **還原路徑留空 = 放回原位**。一個很容易踩的雷:**還原到 data 目錄之外會換掉 DBIID、讓之前的交易日誌失效**——所以官方建議還原就留在 data 目錄內(這跟[交易日誌那篇](/domino-news/posts/domino-transaction-logging/)講的「會換 DBIID 的操作要補備份」是同一個道理)。
5. 可選:把刪掉的文件/資料夾還原回原庫。另外注意還原對話有個 **Disable replication**(停用複寫)選項,它**預設是開著的**——也就是還原出來的副本**預設不複寫**;要讓這份副本參與複寫,得自己把這個選項關掉。
6. 按 **Submit Restore**,再按 Run Restore Server Cmd 或在主控台 `load restore`;進度在 Backup 庫的 **Restore Jobs** 看。

若你用的是**第三方還原**工具,Global Configuration 有個 **Restore 3rd party** 選項;這種情況下備份清單不存在 `dominobackup.nsf` 裡。

## 小結

- **是什麼**:Domino **12 起內建**的備份還原——`dominobackup.nsf` 設定庫 + Backup/Restore 兩個 server task,能排程備份、按需還原單一庫。
- **硬前提**:**先開 transaction logging**(官方明列);時點還原正是靠日誌。
- **怎麼設**:Configuration view 挑平台預設文件 → New Config → 填 Main/Backup/Snapshot/Restore/Prune/Notification 六分頁(路徑用 Test Formula 預覽)。
- **怎麼跑**:`load backup` 或 Program 文件排程;`-b` 每天備庫,archived 再用 `-t`/`-i` 短間隔備日誌與增量撐時點還原,`-s` snapshot、`-p` prune。
- **怎麼還原**:Database Inventory → Restore Job → 選 Selected backup → Submit → `load restore`。
- **一個雷**:還原留空=回原位;**還原到 data 目錄外會換 DBIID、讓舊日誌失效**——盡量留在 data 目錄內。
