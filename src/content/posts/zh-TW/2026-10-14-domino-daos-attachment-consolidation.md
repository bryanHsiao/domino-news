---
title: "DAOS:把附件搬出 NSF"
description: "同一個附件在幾十份文件、甚至好幾個資料庫裡各存一份,NSF 就是這樣肥起來的。DAOS 把附件搬出 NSF、在伺服器上去重存成一份 .nlo 檔,文件裡只留一張叫「ticket」的引用。這篇講它怎麼運作(存檔當下就去重、不是事後維護)、為什麼開它之前一定要先開 transaction logging、Server 文件 DAOS 分頁怎麼設(base path、minimum size、defer deletion)、資料庫怎麼加入,以及 tier 2 把冷附件搬去 S3;最後提醒:附件搬走後,NSF 還要 compact 才真的瘦下來。"
pubDate: 2026-10-14T07:30:00+08:00
lang: zh-TW
slug: domino-daos-attachment-consolidation
tags:
  - "Domino Server"
  - "Admin"
  - "Performance"
sources:
  - title: "Attachment consolidation(DAOS 機制:去重、ticket 引用、.NLO 檔)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_attachmentconsolidation_c.html"
  - title: "Specifying server settings for attachment consolidation(先開 translog、Server DAOS 分頁、base path、minimum size、defer deletion、資料庫屬性)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_specifyingserversettingsforattachmentconsolidation_t.html"
  - title: "DAOS tier 2 storage(把久未存取的附件搬去 S3 相容儲存,DAOSmgr)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/admn_daos_t2.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-daos-attachment-consolidation.webp"
coverStyle: "risograph"
---

同一份報價單 PDF,被 email 給 30 個人、再被各部門存進幾個資料庫——傳統上,那個附件就在每份文件裡各存一份完整的拷貝。NSF 肥大,很多時候就是這樣堆出來的。

**DAOS(Domino Attachment and Object Service)** 做的事很直接:把附件**搬出 NSF**,在伺服器上**去重**成一份檔案(`.nlo`),文件裡只留一張指向它的引用。同一個附件無論被幾份文件、幾個資料庫參照,磁碟上就**一份**。但要開它之前,有個硬前提常被忽略——**得先開 transaction logging**(那是什麼、怎麼開/檢查,見 [Domino 交易日誌](/domino-news/posts/domino-transaction-logging/))。

---

## 重點摘要

- **它在做什麼**:Domino「no longer saves a separate and complete copy of every document attachment」——相同附件在伺服器上只存**一份** `.nlo`,文件裡留一張叫 **ticket** 的引用指向它。
- **何時去重**:在使用者**存檔的當下**就去重,不是事後靠維護 task 掃。
- **硬前提**:**先開 transaction logging**。參與 DAOS 的 NSF 都必須同時被交易日誌記錄——這樣附件內容才進得了日誌、日誌重放時 `.nlo` 才能被重建。
- **怎麼開**:Server 文件的 **DAOS 分頁**啟用 + 設 base path/minimum size,再在**每個要參與的資料庫**勾進階屬性「Use Domino Attachment and Object Service」。改完**要重啟**。
- **tier 2**:久未存取的 `.nlo` 可由 `DAOSmgr` 搬到 S3 相容儲存,省第一線磁碟。
- **別忘了**:開了 DAOS 只對「之後新存的附件」生效;**既有的舊附件**要靠 **copy-style compact**(`compact -c -daos on`)才搬得進 DAOS、NSF 才真的縮,而 `-c` 會換 DBIID、做完要補一次完整備份。

## 它在做什麼:附件搬出 NSF、去重

一般情況下,每份文件都帶著自己那份完整的附件資料。開了 DAOS 之後,Domino **不再為每份文件各存一份完整拷貝**([官方](https://help.hcl-software.com/domino/12.0.0/admin/admn_attachmentconsolidation_c.html)):

- **去重**:每個附件在一個共用的內部儲存庫裡**只存一份**,同一台伺服器上跨資料庫的多份文件都參照那一份。Domino 用對應表認出「一樣的附件」,並在使用者刪除、取代、複製時調整引用。
- **文件裡留什麼**:不再是整包附件,而是一張**引用**——官方叫它 **ticket**,指向附件在儲存庫裡的位置。
- **附件資料放哪**:進儲存庫、存成 **`.nlo`** 檔(DAOS 物件)。單一目錄裡的檔案多到超過作業系統上限時,Domino 會自動開子目錄。

注意一個時機:去重是在**使用者存檔的那一刻**發生,不是之後靠某個 task 去掃——這跟 `compact` 那種「事後維護」不一樣。

## 硬前提:先開 transaction logging

這是最常被卡住的地方:**DAOS 要求伺服器先開 transaction logging**(官方步驟第一句就是「Make sure that transaction logging is enabled on the Domino server」)。

原因在於資料一致性:參與 DAOS 的 NSF,它們的附件被搬到外部的 `.nlo`,那 NSF 跟 `.nlo` 之間的關係必須被**交易日誌**一起記錄;萬一當機、要用日誌重放回復,那些 `.nlo` 才能跟著被重建、不會對不上。所以**先把日誌開好、確認有在跑**(開法與檢查見[交易日誌那篇](/domino-news/posts/domino-transaction-logging/)),再來開 DAOS。

## 怎麼開:Server 分頁 + 資料庫屬性

開 DAOS 分兩層——伺服器層先打開,再逐個資料庫加入([官方設定步驟](https://help.hcl-software.com/domino/14.0.0/admin/admn_specifyingserversettingsforattachmentconsolidation_t.html)):

**伺服器層**(Server 文件的 DAOS 分頁):

- **Store file attachments in DAOS**:設 Enabled。
- **DAOS base path**:附件儲存庫的路徑。官方**強烈建議放在 Domino data 目錄之外**的完整路徑(目錄不存在會自動建)。
- **Minimum size of object before Domino will store in DAOS**:小於這個位元組數的附件不搬——太小的附件搬了省不了多少、不划算。
- **Defer object deletion for n days**:0 到 9999。最後一份參照它的文件被刪後,`.nlo` 再多留幾天才真的刪,給「誤刪」一個後悔的緩衝。
- 這頁還有 **DAOS object encryption**(None／Private to this server／Shared)與加密強度(Domino classic／AES-128／AES-256)可設,要不要加密 `.nlo`、能不能跨伺服器共用就看這裡。
- 存檔**重啟**才生效。

**資料庫層**:不是全伺服器一起來——每個要參與的資料庫,要在**資料庫屬性 → Advanced** 勾「**Use Domino Attachment and Object Service**」。沒勾的資料庫,附件照舊存在文件裡。要注意:**勾選只對「之後新存的附件」生效**;已經在庫裡的舊附件不會自己搬,得靠下面講的 copy-style compact(看不到這個選項,通常是該庫 ODS 版本太舊)。

## tier 2:把冷附件搬去 S3

`.nlo` 也分層。**DAOS tier 2 storage**(Domino 11 起)讓你把**久未存取**(超過設定天數沒被碰)的附件物件,由 `DAOSmgr` task 從伺服器本機(tier 1)搬到 **S3 相容的儲存服務**(tier 2),把第一線那顆碟留給熱資料([官方 tier 2](https://help.hcl-software.com/domino/12.0.2/admin/admn_daos_t2.html))。Domino 12 起還能跨多台 DAOS 伺服器共用加密金鑰。

## 別忘了:既有附件要靠 copy-style compact 搬

一個很常見的誤會:Server 和資料庫都開了 DAOS 之後,NSF 就會自己瘦下來。其實不會——如上一節所說,勾選**只對之後新存的附件生效**;已經躺在 NSF 裡的舊附件不會自己搬進 `.nlo`,那塊空間也不會自己回收。

要把既有附件一起搬進 DAOS、讓 NSF 真的縮小,得對那個資料庫跑一次 **copy-style 的 compact 並帶上 DAOS 選項**:`compact -c -daos on`(copy-style 與 in-place 的差別見[維護指令那篇](/domino-news/posts/domino-maintenance-commands-playbook/))。注意**不能用就地壓縮**——DAOS 選項在 in-place `-b` 之下不可用,`-b` 搬不動既有附件。

而 copy-style compact(`-c`)會**換掉資料庫的 DBIID**——這正是[交易日誌那篇](/domino-news/posts/domino-transaction-logging/)講的「會換 DBIID、讓舊日誌失效」的操作之一,所以做完記得**補一次完整備份**,讓備份基準跟上新的 DBIID。

## 小結

- **是什麼**:把附件搬出 NSF、在伺服器上去重存成一份 `.nlo`,文件只留一張 ticket 引用。
- **怎麼去重**:使用者**存檔當下**就去重,不是事後維護。
- **硬前提**:**先開 transaction logging**(參與 DAOS 的 NSF 都要被日誌記錄)。
- **怎麼開**:Server 文件 DAOS 分頁啟用(base path 放 data 目錄外、設 minimum size、defer deletion),再在每個資料庫勾「Use Domino Attachment and Object Service」,重啟。
- **tier 2**:冷附件用 `DAOSmgr` 搬去 S3。
- **別忘了**:勾選只對新附件生效;既有附件要靠 **copy-style compact**(`compact -c -daos on`、不是就地 `-b`)才搬進 DAOS、NSF 才縮,且 `-c` 會換 DBIID、做完補一次完整備份。
