---
title: "NIFNSF:把 view index 搬出 NSF"
description: "NSF 肥大,一半是附件(交給 DAOS 搬出去),另一半常常是 view index(檢視索引)。NIFNSF(把檢視索引移出資料庫)就是對付後者的:它把一個庫的 view index 從 .nsf 裡搬出去、存成獨立的 .ndx 檔,讓 NSF 變小、備份還原變快(.ndx 單檔可到 1TB)。這篇講它在做什麼、為什麼它跟 DAOS 一樣「一定要先開 transaction logging」、還要 ODS 51 以上、12.0.2 起怎麼在 Server 文件的 NIFNSF 分頁設(對應舊的 notes.ini NIFNSFEnable／NIFBasePath／CREATE_NIFNSF_DATABASES)、怎麼用 load compact -c -nifnsf on 逐庫開、show dir -nifnsf 怎麼查——以及為什麼「用 -c 開」又把我們帶回 DBIID 那條規則。"
pubDate: 2026-10-17T07:30:00+08:00
lang: zh-TW
slug: domino-nifnsf-view-index-off-nsf
tags:
  - "Domino Server"
  - "Admin"
  - "Performance"
sources:
  - title: "Moving view indexes out of databases(NIFNSF:.ndx、先開 translog、ODS 51+、Server 文件 NIFNSF 分頁、load compact -c -nifnsf on/off、show dir -nifnsf)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/admn_moving_views_out_of_databases.html"
  - title: "NIFNSFEnable(notes.ini:1=view index 存庫外、0=存庫內、預設 0、Server 範圍)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_nifnsf_view_index_r.html"
  - title: "NIFBasePath(notes.ini:指定 .ndx 檔存放位置,預設 data 目錄)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/conf_nifnsf_view_path_r.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-nifnsf-view-index-off-nsf.webp"
coverStyle: "watercolor"
---

上一篇 [DAOS](/domino-news/posts/domino-daos-attachment-consolidation/) 把**附件**搬出 NSF。但 NSF 肥大常常還有另一半元凶:**view index(檢視索引)**。每個檢視都要維護一份索引,索引就躺在 `.nsf` 裡,一起把檔案撐大、也拖慢備份。

**NIFNSF**(把檢視索引移出資料庫)對付的就是後者:它把一個庫的 view index 從 `.nsf` 裡搬出去、存成**獨立的 `.ndx` 檔**。NSF 變小、備份還原變快(`.ndx` 單檔可長到 1TB)。而它有個跟 DAOS 一模一樣的硬前提——**得先開 transaction logging**(見 [Domino 交易日誌](/domino-news/posts/domino-transaction-logging/))。

---

## 重點摘要

- **它在做什麼**:把一個庫的 **view index 搬出 `.nsf`**、存成獨立的 **`.ndx`** 檔。官方說法:讓資料庫檔變小(更不容易撞大小上限)、**加速備份與還原**。
- **硬前提**:跟 DAOS 一樣,**先開 transaction logging**(官方步驟第一條就是「Enable transactional logging in the Server document」);而且**資料庫要 ODS 51 以上**(官方逐字:「To use this feature, databases must be at ODS version 51 or higher」)。
- **怎麼開(12.0.2 起)**:在 **Server 文件的 NIFNSF 分頁**設——Store view indexes in NIFNSF、NIFNSF base path、Enable NIFNSF when creating new databases。對應舊的 notes.ini 是 `NIFNSFEnable=1`、`NIFBasePath=<路徑>`、`CREATE_NIFNSF_DATABASES=1`;**Server 文件的值優先**。改完**要重啟**。
- **逐庫開/關**:`load compact -c -nifnsf on <db>.nsf`(開完重啟)、`load compact -c -nifnsf off <db>.nsf`(關)。
- **怎麼查**:`show dir -nifnsf`(列全部庫、各自有沒有用、`.ndx` 多大)、`show dir -nifnsfonly`(只列有用的)。
- **又回到 DBIID**:逐庫開用的是 **copy-style 的 `-c`**——會換掉 DBIID,所以跟[交易日誌那篇](/domino-news/posts/domino-transaction-logging/)講的一樣,做完要補一次完整備份。

## 它在做什麼:view index → 獨立的 .ndx

每個檢視背後都有一份索引,預設跟文件資料一起放在 `.nsf` 裡。檢視多、文件多,索引就跟著把 NSF 撐大;備份時整包一起搬,也更慢。

NIFNSF 把這份索引**搬出 `.nsf`**,改存成一個獨立的 **`.ndx`** 檔(預設放 data 目錄,可改)。官方點出的兩個好處很直接:

- **NSF 變小**——檔案不含索引,更不容易撞到 **64GB** 的資料庫大小上限。
- **備份/還原更快**——要備的 `.nsf` 小了;索引那塊可以分開處理。

`.ndx` 單檔可以長到 **1TB**(實務上通常是「檢視大到應用程式反應變慢」先成為瓶頸,而不是這個上限)。

你會發現這跟 [DAOS](/domino-news/posts/domino-daos-attachment-consolidation/) 的思路一樣:**把本來塞在 NSF 裡、但不一定要跟文件綁在一起的東西搬出去**。DAOS 搬附件、NIFNSF 搬檢視索引。

## 硬前提:translog + ODS 51

跟 DAOS 一樣,開 NIFNSF 之前有兩道關要先過([官方步驟](https://help.hcl-software.com/domino/12.0.2/admin/admn_moving_views_out_of_databases.html)):

- **先開 transaction logging**:官方程序的**第一步**就是「Enable transactional logging in the Server document in the Domino directory」。理由跟 DAOS 一致——NSF 跟外部 `.ndx` 之間的關係,要靠交易日誌一起保護,當機回復才對得上(translog 本身見[交易日誌那篇](/domino-news/posts/domino-transaction-logging/))。
- **ODS 要 51 以上**:官方逐字「To use this feature, databases must be at ODS version 51 or higher」。ODS 怎麼看、怎麼升,見 [ODS 版本那篇](/domino-news/posts/domino-ods-versions/)——庫太舊的話,得先升 ODS 才用得了 NIFNSF。

## 怎麼開:Server 文件分頁(12.0.2 起)

**12.0.2 起**,設定搬到了 **Server 文件的 NIFNSF 分頁**;若 notes.ini 和 Server 文件都有設,**Server 文件的值優先**。(這三個欄位要**伺服器本身 12.0.2 以上、且 Domino Directory 用 V12.0.2+ 的 `pubnames.ntf` 設計**才會出現;更舊的環境仍走 notes.ini。)三個欄位對應舊的 notes.ini:

| Server 文件欄位 | 舊 notes.ini | 作用 |
|---|---|---|
| Store view indexes in NIFNSF | `NIFNSFEnable=1` | 開啟「索引存庫外」([NIFNSFEnable](https://help.hcl-software.com/domino/10.0.1/admin/conf_nifnsf_view_index_r.html):1=庫外、0=庫內,預設 0) |
| NIFNSF base path | `NIFBasePath=<路徑>` | `.ndx` 存哪([NIFBasePath](https://help.hcl-software.com/domino/11.0.1/admin/conf_nifnsf_view_path_r.html),預設 data 目錄) |
| Enable NIFNSF when creating new databases | `CREATE_NIFNSF_DATABASES=1` | 新建的庫是否套用(預設否) |

改完**要重啟**伺服器。

## 逐庫開關與檢查

伺服器層開了之後(或不想整台一起來時),可以逐庫處理:

- **開**:`load compact -c -nifnsf on <db>.nsf`,開完**重啟**。
- **關**:`load compact -c -nifnsf off <db>.nsf`。
- **查**:`show dir -nifnsf` 列出所有庫、各自有沒有用 NIFNSF、`.ndx` 多大;`show dir -nifnsfonly` 只列有用的。

## 又回到 DBIID:為什麼用 -c 開

注意逐庫開 NIFNSF 用的是 **copy-style 壓縮 `-c`**。[交易日誌那篇](/domino-news/posts/domino-transaction-logging/)講過,copy-style(`-c`)等於把庫重寫一份、會**換掉 DBIID**,舊日誌就對不上了——所以開完 NIFNSF 記得**補一次完整備份**,讓備份基準跟上新的 DBIID。這跟 [DAOS 要用 `compact -c -daos on` 搬既有附件](/domino-news/posts/domino-daos-attachment-consolidation/)、[DBMT 的 `-ods`](/domino-news/posts/domino-dbmt-database-maintenance-tool/) 是同一條規則:**凡是 copy-style 的動作,做完都要補備份**。

## 小結

- **是什麼**:把一個庫的 view index 搬出 `.nsf`、存成獨立 `.ndx`;NSF 變小、備份還原更快(`.ndx` 可到 1TB)。
- **硬前提**:**先開 transaction logging**(官方第一步)+ **ODS 51 以上**。
- **怎麼開(12.0.2 起)**:Server 文件 NIFNSF 分頁(對應 `NIFNSFEnable`/`NIFBasePath`/`CREATE_NIFNSF_DATABASES`),Server 文件優先,改完重啟。
- **逐庫**:`load compact -c -nifnsf on/off`;`show dir -nifnsf` / `-nifnsfonly` 查。
- **DBIID**:逐庫開用 copy-style `-c`、**換 DBIID → 做完補完整備份**;跟 DAOS 搬附件、DBMT `-ods` 同一條規則。
- **跟 DAOS 的對照**:DAOS 搬附件、NIFNSF 搬檢視索引——都把 NSF 塞不下的東西外移,也都要先開日誌。
