---
title: "誰是 domain administration server？Domino 一個 ACL 設定，牽動 entitlement 聚合、CertMgr 與 AdminP"
description: "一台 additional server 冷啟動後每 5 秒噴一次「Error connecting to server…」，逐台想連 domain 內每台 server。追到最後，兇手不是 entitlement 設定，而是一個把它悄悄變成「domain administration server」的 ACL 設定。這篇講 Domino 裡「管理伺服器」到底有幾個意思、domain admin 身份由誰決定、又暗地牽動了哪些機制（entitlement 跨-domain 聚合、CertMgr、AdminP），以及怎麼把這些混在一起的職責拆開。"
pubDate: 2026-09-24T07:30:00+08:00
lang: zh-TW
slug: domino-admin-server-identity
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Entitlement tracking — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html"
  - title: "Running CertMgr — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/secu_le_running_certificate_manager.html"
  - title: "CertMgr_Server notes.ini — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/secu_le_CertMgr_Server.html"
  - title: "Configuring Entitlement Tracking in Domino 12（dpastov，DISABLE setting 出處）"
    url: "https://dpastov.blogspot.com/2023/11/configuring-entitlement-tracking-in.html"
relatedJava: []
relatedSsjs: []
---

先講一個真實現象。一台 additional server（Domino 12.0.2 的 lab 機）冷啟動後，console.log 每 5 秒洗一次版：

```
Entitlement Tracking Aggregator processing directory CN=ap02/O=TheNet!!entitlementtrack.ncf
Error connecting to server ap02/TheNet: 伺服器沒有回應…
Error connecting to server ap03/TheNet: …
Error connecting to server DominoIQ-01/TheNet: …
```

它在**逐台去連 domain 內每一台 server**、想 pull 對方的 entitlement 資料，連不到就一直噴。奇怪的是——這只是一台 additional server，不該有「遍歷全 domain」這種行為。追到最後，兇手跟 entitlement 設定一點關係都沒有：是一個把它悄悄變成「domain administration server」的 ACL 設定。這篇就從這個 case 談一件容易混淆的事——**Domino 裡「管理伺服器」到底有幾個意思、domain admin 身份由誰決定、又暗地牽動了哪些機制。**

## 重點摘要

- **「管理伺服器（Administration Server）」在 Domino 有兩個層次**：每個 database 各有一個（AdminP[^adminp] 用它維護「那個 db」的 ACL）；但**只有 Domino Directory（`names.nsf`）上的那個，才等於「domain administration server」這個域級身份**。把「某個 db 的管理伺服器」當成「domain 的管理伺服器」，就是這次踩坑的起點。
- **domain admin 身份會暗地驅動域級機制**：其中最會咬人的是 **entitlement 跨-domain 聚合**——官方明訂只在 domain administration server 上做。
- **誤觸經過**：為了讓一台孤立的 additional server 自己當 CertMgr server，把 `names.nsf` 的管理伺服器改成了它 → 它自認 domain admin → `dircat` 啟動域級 entitlement 聚合 → 遍歷全 domain server → 連不到就洗版。
- **拆解**：CertMgr 其實不必靠 admin 身份（有 `CertMgr_Server` 可明確指定，官方也只說 admin server 是「a good choice」）。把 `names.nsf` 管理伺服器改回真正的 domain admin、用 `CertMgr_Server` 釘住本機，兩件事就分開了。
- **只有 `names.nsf` 決定 domain 身份**：`admin4.nsf`、`certstore.nsf` 的管理伺服器不影響（本案例實證：它們沒動，聚合照樣停）。

## 「管理伺服器」不只一個意思

在 Domino Administrator 裡，每個 database 的 ACL 進階頁都有一個「管理伺服器（Administration Server）」欄位。它的意義是：**這個 db 的 ACL、Readers/Authors 欄位裡的人名，由哪一台 server 的 AdminP 負責維護**（改名、刪除、群組展開）。每個 db 都有，各自獨立。

但當你打開的是 **`names.nsf`（Domino Directory）** 的那一個，意義就不一樣了——它決定的是**整個 domain 的 administration server 身份**。域級的自動化機制看的就是這一個，不是別的 db 的。

混淆點就在這：`admin4.nsf`、`certstore.nsf`、某個應用 db 的「管理伺服器」都寫著同一台，很容易讓人以為「這台到處都是管理伺服器、很正常」。但**只有 `names.nsf` 那一個會把它推上 domain admin 的位子**，並連帶啟動一票域級行為。

## domain admin 身份暗地牽動了哪些機制

### Entitlement tracking：兩層，只有聚合層綁 domain admin

Domino 12 的 [Entitlement Tracking](https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html) 有**兩層**，常被混為一談：

| 層 | 誰做 | 資料庫 | 範圍 |
|---|---|---|---|
| **本地收集** | 每台 server 的 `update` task | `entitlementtrack.ncf` | 只掃自己 |
| **跨-domain 聚合** | `dircat`（Directory Cataloger） | `entitlements.nsf` | 全 domain |

官方對本地收集的描述是「Approximately once a day, each Domino 12 server scans every database on the server and collects the highest level of access for each entitled user」——**每台都做、只掃自己**。而聚合層，官方寫得很明白：

> The entitlement data collected daily by each Domino server in a domain is also aggregated for the entire domain **on the domain administration server**. The directory catalog task manages the synchronization process…

也就是說：**一台 server 只要自認 domain admin，`dircat` 就會啟動域級聚合**——照著 `names.nsf` 裡的 server 清單，逐台去 pull 對方的 `entitlementtrack.ncf`。domain 內都連得到時這沒事；但在 VPN 常不通的 lab 環境，連不到就每 5 秒噴一次。前面那串洗版，就是這麼來的。

### CertMgr：建議在 admin server，但**不是強制**

CertMgr / `certstore.nsf` 是 domain-wide 的憑證機制。[官方文件](https://help.hcl-software.com/domino/14.0.0/admin/secu_le_running_certificate_manager.html)說「The Domino administration server for the domain **is a good choice**」——注意是「a good choice」，**建議、不是強制**。這個「建議」很容易被讀成「CertMgr 必須跑在 domain admin server 上」，於是為了讓某台獨立跑 CertMgr，就去動了 `names.nsf` 的管理伺服器。埋伏筆的正是這一步。

## 一次誤觸：SSL 設定意外開啟 entitlement 聚合

把上面兩件事接起來，因果鏈就清楚了：

```
設 SSL/CertMgr 時，把 names.nsf 管理伺服器設成這台 additional server（以為 CertMgr 必須）
  → 它自認 domain administration server
    → dircat 啟動域級 entitlement 聚合
      → 遍歷 names.nsf 內全 domain server 清單
        → 逐台 pull entitlementtrack.ncf → VPN 連不到 → 每 5 秒 Error connecting
```

排查時走過兩條彎路，都值得記下來別再踩：

- **`DISABLE_ENTITLEMENT_TRACKING=1` 對這個問題無效**。這是網路上（[dpastov](https://dpastov.blogspot.com/2023/11/configuring-entitlement-tracking-in.html)）唯一流傳的 disable setting，但它針對的是**本地收集層**（建 `entitlementtrack.ncf`）、不是**聚合層**。本案例冷啟動實測：notes.ini 加了它，`dircat` 照樣 aggregate。打錯層了。
- **`tell dircat quit` 只是治標**。`dircat` 是做聚合的 task，停掉 log 立刻安靜；但冷啟動它會 auto-start 再犯。臨時止血可以，根治不行。

## 拆解：把 admin 身份的兩件事分開

關鍵洞察是那句被誤讀的官方建議——**CertMgr 不必靠 `names.nsf` 的 admin 身份**：

- [`CertMgr_Server`](https://help.hcl-software.com/domino/12.0.2/admin/secu_le_CertMgr_Server.html) 這個 notes.ini setting 官方定義是「Defines the server that has `certstore.nsf`」，可以**明確指定** CertMgr server、不靠 admin 身份。
- `certstore.nsf` 自己的管理伺服器，可獨立於 `names.nsf`。

於是把原本擠在同一個開關上的兩件事拆開：

| 設定 | 改成 | 效果 |
|---|---|---|
| `names.nsf` 管理伺服器 | 真正的 domain admin server | 這台不再自認 domain admin → **停掉域級聚合** |
| notes.ini `CertMgr_Server` | 本機（`set config CertMgr_Server=<本機>/…`） | 本地明確認得自己是 CertMgr server → HTTPS 續命 |
| `certstore.nsf` 管理伺服器 | 本機（確認，本來就是） | CertMgr 獨立性 |

改完 `docker restart` 冷啟動實測：entitlement 聚合沒再復發、`Error connecting…` 完全消失，HTTPS 443 與 CertMgr（含 ACME 擴充）都完好。**唯一副作用**是冷啟動時一條無害 warning——「Cannot update CertMgr Server in Directory profile」：因為 `names.nsf` 的 admin 現在是別台，本機沒權限把「我是 CertMgr server」寫回 Directory Profile 廣播。對一台憑證手動更換、沒有別台要 replicate 其 `certstore.nsf` 的孤島 lab 來說，無所謂（要 ACME 自動續期或多台共用 certstore 才需要處理它）。

## 只有 `names.nsf` 決定 domain 身份

這是整件事的概念收斂，也有實證：拆解驗證時，`admin4.nsf`（Administration Requests）的管理伺服器**一直是那台 additional server 沒動**，entitlement 聚合卻已經停了。可見——

**domain administration server 身份只由 `names.nsf`（Domino Directory）的管理伺服器決定。** 其他 db 的「管理伺服器」只代表「這個 db 的 ACL 由誰的 AdminP 維護」，跟 domain 身份無關：

- `names.nsf` 管理伺服器 = **domain admin 身份** → 會觸發域級聚合，是唯一該動的。
- `admin4.nsf`、`certstore.nsf` 管理伺服器 = 各自的 ACL 由誰維護 → 保持本機即可。反而把 `admin4.nsf` 改成連不到的別台，會讓本機 AdminP 請求 db 的 ACL 維護卡住，更糟。

## 小結

「管理伺服器」在 Domino 是個被 overload 的詞：在單一 db 上它只是「誰用 AdminP 維護這個 db 的 ACL」；但在 `names.nsf` 上，它是「domain administration server」這個域級身份，會悄悄驅動 entitlement 跨-domain 聚合這類機制。當一個設定引發看似不相關的症狀，先分清楚你動到的是**哪一層**——這次的教訓有兩個：一是把 domain 身份誤植到 additional server 會誤觸聚合，二是 `DISABLE_ENTITLEMENT_TRACKING` 針對的是收集層、對聚合層無效，別在錯的層上耗時間。憑證與 CertMgr 的設定脈絡，站上的 [certstore 系列](/domino-news/posts/certstore-getting-started)有完整走過。

[^adminp]: AdminP（Administration Process，管理程序）是 Domino 的背景維護程序，負責跨 db 的 ACL/名稱維護——例如某人改名或離職時，把 domain 內各 db 裡的相關人名一併更新。它以每個 db 的「管理伺服器」設定決定由哪台執行。
