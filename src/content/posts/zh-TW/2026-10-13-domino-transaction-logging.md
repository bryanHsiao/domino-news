---
title: "Domino 交易日誌:開了就不用 routine fixup"
description: "維護指令那套規則裡,「有沒有開 transaction logging」一直是那個決定你該下哪個參數的分支——有日誌別 routine 跑 fixup、compact 要用 -b 保留 DBIID、換過 DBIID 要立刻補備份。但交易日誌到底是什麼、為什麼它能一次翻掉這麼多規則?這篇講清楚:它把資料庫變更先寫進一個 log,當機重啟時自動回放、所以 logged 資料庫根本不需要一致性檢查(也就不用 routine fixup);三種 style(circular／linear／archived)各自的取捨;以及為什麼「重建資料庫」的操作(copy-style compact、對損毀跑 fixup、第一次開日誌)會換掉 DBIID、讓舊 log 失效、逼你補一次完整備份。"
pubDate: 2026-10-13T07:30:00+08:00
lang: zh-TW
slug: domino-transaction-logging
tags:
  - "Domino Server"
  - "Admin"
  - "Backup"
sources:
  - title: "Transaction logging(概念:單一 log、當機重啟自動回復、logged DB 不需一致性檢查)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_transactionlogging_c.html"
  - title: "Setting up a Domino server for transaction logging(Server 文件設定、三種 style、log 磁碟需求、換 style 換 DBIID)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_settingupadominoserverfortransactionlogging_t.html"
  - title: "Transaction logging with backup and restore(archived style 與備份／媒體還原)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_backupandrestorerequirements.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-transaction-logging.webp"
coverStyle: "minimalist-mono"
---

如果你看過 Domino 的維護指令那套規則,會發現「**有沒有開 transaction logging**」老是那個決定一切的分支:有日誌,就別把 `fixup` 排進日常;壓縮要用 `-b`、不要用會縮檔的 `-B`;只要做了會換 `DBIID` 的操作,就得立刻補一次完整備份。

一個設定,憑什麼一次翻掉這麼多規則?因為交易日誌改的是 Domino **最底層怎麼保護資料、怎麼從當機回復**的方式。這篇把它講清楚——它是什麼、三種 style 差在哪、以及為什麼它會連動到 `fixup`、`compact` 和你的備份。(維護指令本身怎麼下,見[Domino 維護指令實戰](/domino-news/posts/domino-maintenance-commands-playbook/);這篇是那些「有沒有 translog」分支背後的原因。)

---

## 重點摘要

- **它在做什麼**:把伺服器上所有資料庫的變更,先批次寫進**一個**交易日誌(log extent `Sxxxxxxx.TXN` + 控制檔 `NLOGCTRL.LFH`)。
- **當機回復**:重啟時 Domino 會跑到日誌結尾、把「當機當下還沒寫進磁碟」的變更補回去。官方一句話:**「Logged databases do not require a consistency check」**——所以 logged 資料庫**不需要一致性檢查**,也就不用 routine 跑 `fixup`。
- **三種 style**:`circular`(預設,固定空間、上限 4GB、覆寫最舊)、`linear`(同 circular 但無 4GB 上限)、`archived`(log 要被備份工具封存後才回收;沒備份工具,log 檔只會一直長出來、把 log 磁碟塞爆)。`archived` 是為「封存＋媒體還原」那套流程設計的;circular／linear 主要管當機回復。
- **為什麼牽動 DBIID**:日誌記錄是綁著資料庫的 `DBIID`。會「重建資料庫」的操作——**第一次開日誌、換 logging style、copy-style/縮檔 `compact`、對損毀資料庫跑 `fixup`**——都會配一個**新的 DBIID**,舊的 log 記錄就失效了,所以做完要**立刻補一次完整備份**。就地壓縮 `-b` 保留 DBIID,正是這個原因。
- **設定**:Server 文件的 Transactional Logging 分頁啟用(要重啟),建議給日誌一顆**專用／鏡像磁碟**(至少 1GB)。

## 它在做什麼:變更先寫進一個 log

一般沒開日誌時,Domino 把變更直接寫進各個 NSF;當機時寫到一半的東西就可能讓資料庫不一致,要靠 `fixup` 事後掃。

開了交易日誌之後,變更**先批次寫進一個集中的交易日誌**(每台伺服器一個,存成 `Sxxxxxxx.TXN` 的 log extent 加一個 `NLOGCTRL.LFH` 控制檔),再陸續落到各資料庫。這帶來兩種回復能力:

- **當機回復(crash recovery)**:重啟時,Domino「runs through the end of the transaction logs and recovers any writes that were not made to disk at the time of the crash」——把當機當下還沒寫進磁碟的變更,照日誌補回去([官方 Transaction logging 概念](https://help.hcl-software.com/domino/11.0.1/admin/admn_transactionlogging_c.html))。
- **媒體還原(media recovery)**:搭配用 Domino C API Toolkit 的第三方備份工具,可以還原一份完整備份、再套上備份之後的日誌更新,把資料庫帶回較新的狀態。

## 三種 style:circular / linear / archived

日誌怎麼回收空間,有三種 style:

- **`circular`(預設)**:用一塊**固定大小**的空間循環寫,寫滿就從最舊的開始覆寫。最大 4GB(`Maximum log space` 預設 500MB、上限 4096MB)。只做當機回復、效能最單純。
- **`linear`**:跟 circular 一樣會覆寫,但**沒有 4GB 上限**——當你要的日誌空間比 4GB 大、又還沒用到封存媒體時用它。
- **`archived`(官方建議的目標)**:log extent 要被**備份工具封存之後**才會回收。它是為**傳統的「封存＋媒體還原」**(用 Domino C API Toolkit 的備份工具)那套流程設計的 style([官方:交易日誌與備份還原](https://help.hcl-software.com/domino/12.0.0/admin/admn_backupandrestorerequirements.html));但代價是——**沒有備份工具去封存,Domino 會不斷長出新的 log 檔、只進不出,最後把 log 磁碟塞爆**。官方的建議是:先從 circular 或 linear 起步,真的需要再換 archived。

## 為什麼開了它就「不用」routine fixup

這是維護規則裡最常見的那條「有 translog 就別排 fixup」的根。官方講得很直接:**logged 資料庫「do not require a consistency check」**——因為當機重啟時 Domino 已經用日誌自動把它回復到一致狀態了,不需要 `fixup` 再去掃一遍。

所以 `fixup` 在有日誌的環境裡退成**後備**:Server 文件的「Automatic fixup of corrupt databases」預設開著,只有在 Domino **連用日誌都救不回**某個資料庫時,才自動對它跑 `fixup`。你幾乎不需要把 `fixup` 當日常保養(這也是為什麼[維護指令那篇](/domino-news/posts/domino-maintenance-commands-playbook/)說「開了日誌,routine 不要跑 fixup」)。

## 它怎麼牽動 compact 與 DBIID

日誌和 `compact` 的連結,是 **DBIID**(資料庫實例 ID)。日誌裡每一筆記錄都綁著某個資料庫的 DBIID;一旦資料庫被**重建**、拿到新的 DBIID,舊的那些 log 記錄就對不上、失效了。

會換 DBIID 的操作有這幾種:

- **第一次對資料庫啟用日誌**,或**換 logging style**(官方:「After you change the logging style, Domino assigns a new DBIID to each database」)。
- **copy-style 或會縮檔的 `compact`**(`-c`、`-B`)——它們等於把資料庫重寫一份。
- **對損毀資料庫跑 `fixup`**。

這些做完,舊日誌就接不上新資料庫了,所以你**必須立刻做一次完整備份**,讓備份基準跟上新的 DBIID。反過來,就地壓縮 `-b`(只回收空間、不縮檔)**保留原 DBIID**——這正是維護指令那篇說「有日誌時壓縮用 `-b`、不要用 `-B`」的原因:`-b` 不會打斷資料庫跟日誌的關係。

## 設定:Server 文件 + 一顆專用磁碟

啟用的地方在 **Server 文件的 Transactional Logging 分頁**([官方步驟](https://help.hcl-software.com/domino/11.0.1/admin/admn_settingupadominoserverfortransactionlogging_t.html)):

- **Transactional Logging** 設為 Enabled——**改完要重啟**才生效。
- **Log path**:預設在 data 目錄下的 `\LOGDIR`,但官方建議放到**獨立、鏡像**的磁碟(例如有專用控制器的 RAID 0/1),至少配 **1GB** 空間;Domino 會格式出 3 到 64 個 log 檔。把日誌跟資料放同一顆碟,效能和安全都打折。
- **Maximum log space**:circular／linear 用,預設 500MB、上限 4GB。
- **Automatic fixup of corrupt databases**:預設開,當日誌救不回時的後備。
- **Runtime/Restart performance**:預設 Standard;可偏向 runtime(較少 checkpoint)或 restart recovery(較多 checkpoint)。

## 怎麼檢查現在有沒有開

三個地方可以確認:

- **Server 文件(最準)**:Transactional Logging 分頁的「Transactional logging」是不是 Enabled、style 選哪個——這是設定的**來源**。
- **notes.ini**:`TRANSLOG_Status=1` 代表開(`0` 或沒這行=關);`TRANSLOG_Style` 看 style([HCL wiki](https://ds-infolib.hcltechsw.com/ldd/dominowiki.nsf/dx/TransLog_Style):`0`=circular、`1`=archived、`2`=linear)。要注意:這些 `TRANSLOG_*` 值是從 Server 文件寫下來、也會被它蓋回去——**讀它可以看現狀,但要改請改 Server 文件,別直接動 notes.ini**(直接改不會留著)。
- **log 路徑**:開著的話,log 目錄(預設 data 下的 `LOGDIR`)裡會有 `Sxxxxxxx.TXN` 的 log extent 和一個 `NLOGCTRL.LFH` 控制檔;沒開就沒有這些檔。

## 小結

- **是什麼**:把資料庫變更先批次寫進一個集中的交易日誌,再落到各 NSF。
- **換來什麼**:當機重啟自動回復、**logged 資料庫不需一致性檢查**——所以 `fixup` 退成後備、不必當日常。
- **三種 style**:`circular`(預設、≤4GB、覆寫)/ `linear`(無 4GB 上限)/ `archived`(要備份工具封存,為「封存＋媒體還原」而設;沒工具 log 檔會一直長、塞爆磁碟)。
- **DBIID 連動**:第一次開日誌、換 style、copy-style/縮檔 `compact`、對損毀跑 `fixup` 都會換 DBIID、讓舊日誌失效 → **做完補一次完整備份**;就地 `-b` 保留 DBIID。
- **設定**:Server 文件 Transactional Logging 分頁啟用(要重啟),日誌放獨立／鏡像磁碟(≥1GB)。
