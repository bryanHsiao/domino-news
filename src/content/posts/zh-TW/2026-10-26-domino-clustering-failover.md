---
title: "Domino cluster 怎麼做 failover 與負載平衡:Cluster Manager、cldbdir.nsf、事件驅動的 Cluster Replicator,以及「沒 replica 就沒 failover」"
description: "一台 Domino 掛了、或忙到不行,使用者卻幾乎無感地繼續用——那是 cluster 在做 failover 與負載平衡。但 failover 不是魔法:它的硬前提是「另一台 cluster 伺服器上有這個資料庫的 replica」,沒有 replica 就沒得切。這篇講 Domino cluster 的幾個元件怎麼合作:每台的 Cluster Manager 用 probe 互相探可用性與負載、靠監看 Domino Directory 的 ClusterName 找成員;cldbdir.nsf(每台一份、每個資料庫與 replica 一份文件);事件驅動、近即時的 Cluster Replicator(約每 15 秒檢查一次、只在 cluster 成員間推變更,對外仍用一般 REPLICA);failover 怎麼走(Cluster Manager 查出有 replica 的伺服器、按可用性排序、把清單送給 Notes client,對使用者大致透明);以及負載平衡的 availability threshold 怎麼把伺服器標成 BUSY、把請求導去其他 replica,和給 HTTP client 的 Internet Cluster Manager(ICM)。"
pubDate: 2026-10-26T07:30:00+08:00
lang: zh-TW
slug: domino-clustering-failover
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "The cluster components(Cluster Manager、cldbdir.nsf、Cluster Database Directory Manager、Cluster Administrator、事件驅動 Cluster Replicator 約 15 秒檢查、對外用 REPLICA)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/10.0.1/plan_theclustercomponents_c.html"
  - title: "How failover works(前提是另一台有 replica、Cluster Manager 列出有 replica 的台按可用性排序送 client、對使用者透明)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.0/admin/plan_howfailoverworks_c.html"
  - title: "How workload balancing works(availability threshold、標 BUSY、導去其他 replica、全 BUSY 或無 replica 則原 DB 照開)— HCL Domino(官方)"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/plan_howworkloadbalancingworks_c.html"
relatedJava: []
relatedSsjs: []
---

一台 Domino 掛了、或忙到爆,使用者卻幾乎無感地繼續用——那就是 **cluster** 在做 **failover** 與**負載平衡**。但 failover 不是魔法:它有一個硬前提——**另一台 cluster 伺服器上要有這個資料庫的 replica**,沒有 replica 就沒得切。背後是一組元件在合作:每台的 **Cluster Manager** 互相探活、一份 **`cldbdir.nsf`** 記誰有哪些 replica、一個 **Cluster Replicator** 近即時地把變更同步到各 replica。這篇把它們怎麼湊起來講清楚。

---

## 重點摘要

- **硬前提**:failover 靠的是**另一台有 replica**。官方:請求「is redirected to a replica of the database on a different server in the cluster」——**沒 replica 就沒得切**。
- **Cluster Manager**(每台一個):用 **probe** 探其他伺服器的**可用性與負載**;靠**監看 Domino Directory 的 `ClusterName` 欄位與成員清單**來認出 cluster 成員。
- **Cluster Database Directory(`cldbdir.nsf`)**:**每台 cluster 伺服器都有一份 replica**,裡面**每個資料庫與 replica 各一份文件**——failover 要找「誰有這個 DB」就是查它。
- **Cluster Replicator**:**事件驅動、近即時**——有變更就「quickly pushes the change to the other replicas」,約**每 15 秒**檢查一次 `cldbdir.nsf`;**只在 cluster 成員之間**推。跟 cluster 外的伺服器複寫,仍由一般的 **REPLICA** task 負責。
- **failover 怎麼走**:第一台不回應時,Notes client 從 cluster cache 問下一台;該台 Cluster Manager 查 `cldbdir.nsf`、**列出有 replica 的伺服器、按可用性排序、把清單送給 client**;client 開最可用的那台——**對使用者大致透明**。
- **負載平衡**:設一個 **availability threshold**,伺服器到門檻就被標 **BUSY**,對它的請求**導去其他 replica**;**但若沒有其他 replica、或所有台都 BUSY,原本那個 DB 還是會照開**(忙總比開不了好)。

## cluster 的元件

一個 Domino cluster 由幾個元件撐起來([官方:cluster components](https://help.hcl-software.com/domino/10.0.1/plan_theclustercomponents_c.html)):

- **Cluster Manager**:每台 cluster 伺服器上都跑一個。它用 **probe** 持續探其他伺服器的**可用性與負載**,並負責 failover 與負載平衡的判斷。它怎麼知道「誰跟我同一個 cluster」?靠**定期監看 Domino Directory** 裡 Server 文件的 **`ClusterName`** 欄位與 cluster 成員清單——所以你把一台加進/移出 cluster,是改 Directory,Cluster Manager 會跟著認。
- **Cluster Database Directory(`cldbdir.nsf`)**:**每台都有一份**,記錄 cluster 裡**每一個資料庫與 replica** 的文件(在哪台、狀態如何)。這是 failover 與負載平衡的「地圖」。
- **Cluster Database Directory Manager**:負責建立並即時維護這份 `cldbdir.nsf`——有 DB 新增、刪除、狀態改變就更新。
- **Cluster Administrator**:做雜務,例如一台加入 cluster 時,幫忙啟動 Cluster Database Directory Manager 與 Cluster Replicator。
- **Cluster Replicator**:下一節細講。

## Cluster Replicator:事件驅動的近即時複寫

一般的複寫是**排程**的(每隔幾分鐘/幾小時跑一次)。cluster 內不一樣:**Cluster Replicator** 是**事件驅動**的——某台的某個 replica 一有變更,它就「quickly pushes the change to the other replicas in the cluster」,**近即時**地同步到其他 replica。它約**每 15 秒**檢查一次 `cldbdir.nsf` 看有什麼要推。

兩個邊界要記住:

- Cluster Replicator **只在 cluster 成員之間**複寫;跟 **cluster 外**的伺服器複寫,還是走一般的 **REPLICA**(scheduled replication)task。
- 這是 failover「切過去資料還在、還新」的基礎——因為各 replica 幾乎隨時同步。但也因此,**低速 WAN** 上官方建議可考慮**關掉 cluster replication、改用較頻繁的排程複寫**,免得近即時複寫把慢速線路塞爆。

(這跟站上[複寫那篇](/domino-news/posts/notes-replication/)講的 scheduled replication 是互補的:cluster 內近即時、cluster 外照排程。)

## failover 怎麼走(從使用者這端看)

當使用者要開的伺服器**沒回應**([官方:how failover works](https://help.hcl-software.com/domino/11.0.0/admin/plan_howfailoverworks_c.html)):

1. Notes client 從自己的 **cluster cache** 找出其他 cluster 成員,去問下一台。
2. 那台的 Cluster Manager **查 `cldbdir.nsf`**,找出哪些伺服器有這個資料庫的 replica。
3. 它**建一份「有 replica 的伺服器」清單、按可用性排序**,把清單送回 client。
4. client **開清單上最可用的那台**;若那台也不行,就往清單下一台試。

官方的說法是:雖然使用者連到的是**另一台上的 replica**,但「failover is essentially transparent to the user」——大致無感。前提永遠是第一條:**那個資料庫在別台有 replica**;沒有,failover 就無從切起。

## 負載平衡:availability threshold 與 BUSY

failover 處理「掛掉」,負載平衡處理「太忙」([官方:how workload balancing works](https://help.hcl-software.com/domino/11.0.1/admin/plan_howworkloadbalancingworks_c.html)):

- 你為伺服器設一個 **availability threshold**(可用性門檻,notes.ini `Server_Availability_Threshold`)。
- 伺服器忙到**達門檻**時,Cluster Manager 把它標成 **BUSY**。
- 之後對這台上資料庫的請求,就**被導去其他 replica**——把負載分出去。
- **但有個保底**:**如果沒有別台有 replica、或所有 cluster 伺服器都 BUSY,原本那個資料庫還是會照開**,即使該台正忙。寧可慢,也不要開不了。
- (另一個獨立設定 `Server_Restricted` 則是讓伺服器**拒絕新的資料庫開啟請求**——注意它只擋**新**開啟,**既有連線不受影響、也不影響複寫**,不是把整台封死。)

## 給 HTTP:Internet Cluster Manager(ICM)

上面講的是 Notes client。瀏覽器(HTTP)client 走的是 **Internet Cluster Manager(ICM)**:它套用**同一套** failover 與負載平衡規則;當還有多台可選時,ICM 會把 client 導向**可用性最高(availability index 最高)**且持有 replica 的那台。(注意 availability index 是**依所有 open session 綜合算出來**的,不是只看瞬時負載,所以官方的用詞是「most available」而非字面的「負載最輕」。)所以 web 應用也能吃到 cluster 的 failover,只是入口換成 ICM。

## 小結

- **硬前提**:failover 要**另一台有 replica**——沒 replica 就沒得切。
- **元件**:Cluster Manager(probe 探活、監看 Directory `ClusterName` 找成員)、`cldbdir.nsf`(每台一份、每 DB/replica 一文件)、Cluster Database Directory Manager、Cluster Administrator、Cluster Replicator。
- **Cluster Replicator**:事件驅動、近即時(約 15 秒查一次)、只在成員間;對外用一般 REPLICA;低速 WAN 可改回排程複寫。
- **failover**:Cluster Manager 查 `cldbdir`、列有 replica 的台按可用性排序送 client、client 開最可用的——對使用者透明。
- **負載平衡**:到 availability threshold 標 BUSY、導去其他 replica;**無其他 replica 或全 BUSY 則原 DB 照開**。
- **HTTP**:ICM 套同一套規則、挑**可用性最高(availability index 最高)**且有 replica 的台。
