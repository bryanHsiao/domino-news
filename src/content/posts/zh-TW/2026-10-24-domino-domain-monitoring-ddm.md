---
title: "DDM:Domino 內建的主動監控"
description: "伺服器出事通常是「使用者先哀號、你才知道」。DDM(Domino Domain Monitoring)是 Domino 內建、往主動那端走的監控:它定期跑 probe 去查資料庫、目錄、郵件、作業系統、複寫、安全、伺服器、web 各領域的健康,把事件收進 ddm.nsf,並在 Domino Administrator 裡給你一個 top-down、依功能分類的全網域狀態視圖,還常附上 probable cause 與建議的修正動作。這篇講 probe 是什麼(以及它們的設定文件放在 EVENTS4.NSF、改了即生效)、ddm.nsf 怎麼存事件、怎麼用 collection hierarchy 讓一台 collection server 匯整整個網域(收集間隔固定 5 分鐘)、enhanced 與 simple 事件差在哪,以及 event handler 怎麼在事件發生時用 log/mail/跑 agent/跑程式/下 console 指令/SNMP trap 通知你。"
pubDate: 2026-10-24T07:30:00+08:00
lang: zh-TW
slug: domino-domain-monitoring-ddm
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Domino domain monitoring (DDM)(一處看全網域、50+ probe、within minutes、probable cause 與 corrective actions、collection hierarchy、enhanced vs simple events)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/admn_dominodomainmonitoring_c.html"
  - title: "DDM probes(probe 是 discrete check、八個領域、probe 文件在 EVENTS4.NSF、改即生效、排程)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_ddmprobes_c.html"
  - title: "Event handler notification methods(event handler 在 EVENTS4.NSF、Event Monitor 執行、log/mail/agent/program/console/SNMP 通知)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/admn_eventhandlernotificationmethods_r.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-domain-monitoring-ddm.webp"
coverStyle: "photoreal-3d"
---

伺服器出事,很多時候是「使用者先哀號、你才知道」——等你發現,往往已經晚了。**DDM(Domino Domain Monitoring)** 是 Domino 內建、往**主動**那端走的監控:它定期跑**probe**去查各領域的健康,把事件收進 **`ddm.nsf`**,在 Domino Administrator 裡給你一個**全網域**的狀態視圖,出事還能**自動通知**你、甚至附上可能原因與建議動作。這篇講 DDM 的幾個零件怎麼湊起來。

---

## 重點摘要

- **DDM 是什麼**:一個讓你**從一個地方看整個網域**所有伺服器健康的監控功能。官方說它能「Recognizes and reports critical server and client issues within minutes」,並**自動做問題判定、給出可能原因**(「determines probable cause」),還「Provides corrective actions and links to databases」——不只報警,還給你下一步。
- **probe**:一個 **discrete check(或一組 check)**,對一台或多台伺服器、資料庫、服務執行。官方內建 **50 多個 probe**,分**十個領域**:**administration、application code、database、directory、messaging、operating system、replication、security、server、web**。probe 的**設定文件放在 `EVENTS4.NSF`**,改了**即時生效**;可用預設排程、自訂排程、或**事件發生時按需**跑。
- **ddm.nsf**:**Domino Domain Monitor 資料庫**,存 probe 與其他內建檢查產生的事件。**每台伺服器各有一份**;若設了 collection server,它那份還會**匯整**下屬伺服器的資料。
- **collection hierarchy**:在 `EVENTS4.NSF` 指定一台(或多台)**collection server**,就能在**一處**看它自己加下屬伺服器的事件,不必逐台開 `ddm.nsf`。**定期收集間隔固定 5 分鐘、不能改**。
- **event handler**:定義「某事件發生時 Domino 要做什麼」的文件(也在 `EVENTS4.NSF`);由 **Event Monitor** task 執行,**只有在該事件有對應 handler 時才動作**。通知/動作方式官方列了十多種,常見的如:記到資料庫、寄信、跑 agent、跑程式、送 console 指令、SNMP trap 等。

## DDM 是什麼:一處看全網域

傳統上你查伺服器健康,得一台一台連上去看 log、看 console。DDM 把這件事**集中**起來:它在 Domino Administrator 裡提供一個「top-down、依功能分類」的網域狀態視圖,讓你從最上層往下 drill 到細節([官方 DDM 總覽](https://help.hcl-software.com/domino/10.0.1/admin/admn_dominodomainmonitoring_c.html))。

它往「主動」那端走的地方在於:它不是等你去翻 log,而是**自己定期跑檢查**、在幾分鐘內認出並回報重大問題,而且——這是 DDM 最有價值的一點——它會**自動做問題判定、給出可能原因,並附上修正動作與相關資料庫的連結**。所以 DDM 的事件通常不只告訴你「壞了」,還告訴你「大概為什麼、可以怎麼處理」。

事件分兩種:**enhanced events** 帶有具體對象資訊(哪台伺服器、哪個資料庫、哪個 agent),**simple events** 則沒有具體對象。視圖上也有**視覺指示**標出哪些最嚴重、哪些已解決、哪些還沒。

## probe:實際去查的那隻手

DDM 真正去「查」的是 **probe**。官方定義:「A probe is a discrete check, or set of checks, configured to run against one or more servers, databases, and services.」——一個針對伺服器/資料庫/服務的離散檢查([官方 DDM probes](https://help.hcl-software.com/domino/11.0.1/admin/admn_ddmprobes_c.html))。

- **內建 50 多個**,分**十個領域**:**administration、application code、database、directory、messaging、operating system、replication、security、server、web**。從「某個 DB 的 view 索引是不是壞了」到「複寫有沒有卡」「安全設定有沒有問題」都有對應 probe。
- **設定文件放在 `EVENTS4.NSF`**(Monitoring Configuration 資料庫),而且**改了即時生效**,不用重啟。
- **排程**有三種:跑在**預設排程**上、你**自訂的排程**上、或**當伺服器發生事件時按需**跑。

要調整 DDM 查什麼、多久查一次,就是去 `EVENTS4.NSF` 編輯這些 probe 文件。

## ddm.nsf 與 collection hierarchy

probe 查出來的結果要有地方放,那就是 **`ddm.nsf`(Domino Domain Monitor 資料庫)**:它存 DDM probe 與其他內建檢查產生的**事件**。重點是——**每台伺服器各有一份 `ddm.nsf`**。

如果每台都要自己開來看,那就失去「一處看全網域」的意義了。所以 DDM 有 **collection hierarchy**:你在 `EVENTS4.NSF` 指定一台或多台 **collection server**,它就會**匯整下屬(node)伺服器的事件**,你只要開 collection server 的 `ddm.nsf`,就能看到它自己加底下那些伺服器的狀況。階層可以多層、也可以只有一層。有一個數字要記住:**這個定期收集的間隔固定是 5 分鐘、不能改**。

## event handler:出事怎麼通知你

DDM 負責「發現並記錄」,但「發現之後要不要吵你、怎麼吵」是另一個機制:**event handler**([官方:event handler 通知方式](https://help.hcl-software.com/domino/10.0.1/admin/admn_eventhandlernotificationmethods_r.html))。

- event handler 文件也放在 **`EVENTS4.NSF`**,定義「**某個事件發生時 Domino 要採取什麼動作**」。
- 由 **Event Monitor** task 執行,而且**只有在該事件存在對應 handler 時才會動作**——沒設 handler,事件就只是靜靜躺在 `ddm.nsf` 裡,不會主動通知你。
- 可用的**通知/動作方式**官方共**十多種(13 種)**,常見的如:記到資料庫、**寄信**、**跑一個 agent**、**跑一個程式**、**送 console 指令**、**SNMP trap**,另外還有 broadcast、pager、relay 到其他伺服器、sound、寫入 UNIX system log 等。

所以「DDM 有抓到、但我沒收到通知」通常不是 DDM 沒跑,而是**那個事件沒有對應的 event handler**——要通知,就得去 `EVENTS4.NSF` 幫它建一個。

## 小結

- **DDM**:一處看全網域健康的內建監控;within minutes 回報、附 probable cause 與 corrective actions。
- **probe**:對伺服器/資料庫/服務的離散檢查,內建 50+、分十領域(administration、application code、database、directory、messaging、OS、replication、security、server、web);設定在 `EVENTS4.NSF`、改即生效;預設/自訂/事件觸發排程。
- **ddm.nsf**:存事件,每台一份;collection server 匯整下屬。
- **collection hierarchy**:指定 collection server 一處看全網域;收集間隔固定 **5 分鐘**不能改;事件分 enhanced / simple。
- **event handler**:在 `EVENTS4.NSF` 定義出事動作,Event Monitor 執行、**有 handler 才通知**;方式十多種,常見如 log/mail/agent/program/console/SNMP。
