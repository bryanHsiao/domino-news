---
title: "dircat 的雙重身份：你以為它只在建通訊錄目錄，Domino 12 起它還兼了授權稽核"
description: "在 show tasks 看到 dircat（Directory Cataloger），多數人想到的是「通訊錄目錄」——把多個 Domino Directory 聚合成一份好查的目錄。那是它的本業。但從 Domino 12 起，這支 task 悄悄兼了第二份差：把各 server 的 entitlement 資料聚合到 entitlements.nsf，屬於授權合規稽核，跟通訊錄毫無關係。這篇講 dircat 的本業（condensed vs extended 目錄、DIRCAT5.NTF 別選成 CATALOG.NTF）、它 Domino 12 起的隱藏第二身份，以及一支 task 兩個職責會怎麼咬人。"
pubDate: 2026-09-25T07:30:00+08:00
lang: zh-TW
slug: domino-dircat-dual-role
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Directory catalogs — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/10.0.1/admin/conf_directorycatalogs_c.html"
  - title: "Setting up a condensed directory catalog — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/conf_settingupacondenseddirectorycatalog_c.html"
  - title: "Entitlement tracking — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-dircat-dual-role.webp"
coverStyle: "bw-grain"
---

在 `show tasks` 裡看到 `dircat`（Directory Cataloger），多數人第一個念頭是「喔，通訊錄目錄那個」——把公司內多個 Domino Directory 聚合成一份好查的目錄。沒錯，那是它的**本業**。但從 Domino 12 起，這支 task 悄悄多了一份跟通訊錄八竿子打不著的工作：**把各 server 的 entitlement 資料聚合起來，做授權合規稽核**。一支 task、兩個完全不相干的身份——而第二個身份，正是為什麼一台不該多管閒事的 server，會突然開始「連全 domain 每台機器」。

## 重點摘要

- **本業**：dircat 把多個 Domino Directory 聚合成一份 **Directory Catalog（通訊錄目錄）**，給 client／server 快速查地址、人名、群組、資源。
- **兩種目錄**：**condensed**（`DIRCAT5.NTF`，給 Notes client、壓縮極大、可離線查）vs **extended**（`PUBNAMES.NTF`，給 server、查得更快更彈性）。
- **第二份差（Domino 12 起）**：dircat 還「manages the synchronization process」，把各 server 的 entitlement 資料聚合到 `entitlements.nsf`——這是**授權/entitlement 合規追蹤**，跟通訊錄無關。
- **一個踩雷點**：建 condensed catalog 要用 `DIRCAT5.NTF`，**別選到 `CATALOG.NTF`**（那是「資料庫編目」、完全不同的東西）。
- **一支 task 兩個職責的後果**：某台一旦被誤推成 domain admin，dircat 的第二身份就會啟動、遍歷全 domain 做 entitlement 聚合、連不到就洗版。

## 本業：把多個 Domino Directory 聚合成一份目錄

官方對 directory catalog 的定義很直白：

> A directory catalog is an optional directory database that typically contains information aggregated from multiple Domino directories.

用途是讓 client 與 server「look up mail addresses and other information about the people, groups, mail-in databases, and resources throughout an organization」——**跨多個 domain／多本 Domino Directory 查人查地址**，不必逐本翻。

dircat 就是建與維護這份目錄的 task。官方描述它的動作：第一次跑會 **build**，之後通常是 **update**——「it checks for changes to the contents of fields in the source Domino Directories, and then makes the appropriate changes to the directory catalog」，另外也能 partial／full rebuild。排程跑、增量更新，就是它的日常。

## 兩種目錄：condensed vs extended

| 類型 | 模板 | 用在 | 特點 |
|---|---|---|---|
| **condensed（精簡）** | `DIRCAT5.NTF` | Notes client | 把多筆目錄文件**併成單一文件**、壓縮極大；可離線查名 |
| **extended（擴充）** | `PUBNAMES.NTF`（與 Domino Directory 同模板） | server | 「faster and more flexible directory lookups」 |

condensed 的壓縮很誇張：官方舉例，一個「more than 350,000 users and total 3GB」的目錄，壓成 condensed catalog「only about 50MB」——靠的就是「combines multiple documents from Domino directories into single documents」這招，所以能塞進 client 離線用。注意 **condensed catalog 在 server 上已不支援**（"Using a condensed directory catalog on a server is no longer supported"），server 要用就用 extended。

**一個常見踩雷**：建 condensed catalog 時要選 **`DIRCAT5.NTF`**，官方特別警告「DO NOT select the Catalog (V6) template (`CATALOG.NTF`)」。`CATALOG.NTF` 是「資料庫編目」（列出 server 上有哪些 db）、跟通訊錄目錄是兩回事，名字像、選錯就整個做歪。

## 第二份差：Domino 12 起，dircat 兼做 entitlement 聚合

這是很多人不知道的一段。從 Domino 12 起，[Entitlement Tracking](https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html) 的**跨-domain 聚合**也交給了 dircat。官方原文：

> The entitlement data collected daily by each Domino server in a domain is also aggregated for the entire domain on the domain administration server. **The directory catalog task manages the synchronization process**…

也就是說——**同一支 dircat**，除了維護通訊錄目錄，還負責把各 server 每天收集的 entitlement 資料（每個使用者的最高存取層級，供 HCL 授權合規用）聚合進 `entitlements.nsf`。這件事只在 domain administration server 上做。

為什麼把它塞給 dircat？大概因為 dircat 本來就是「跨 server 聚合資料」的專業戶，聚合 entitlement 算是複用同一套同步機制。但**職責上，這跟建通訊錄目錄是兩回事**——一個是給人查地址、一個是給原廠算授權。名字只講了前者。

## 一支 task、兩個身份，會怎麼咬人

問題就出在兩個工作**共用同一支 auto-start 的 dircat**：

- 你在 `show tasks`（見站上的 [console 排錯](/domino-news/posts/domino-console-troubleshooting)）看到 `dircat`，光看名字分不出它在做哪一個身份、還是兩個都在做。
- 更會咬人的是：entitlement 聚合**綁 domain administration server 身份**。某台一旦被誤推成 domain admin（例如設 CertMgr 時動了 `names.nsf` 的管理伺服器），dircat 的第二身份就會啟動、照著 `names.nsf` 的 server 清單遍歷全 domain 做 entitlement 聚合、連不到就每 5 秒噴 error。這條完整的因果與解法，在 [Domino admin server 身份那篇](/domino-news/posts/domino-admin-server-identity)講過。
- **怎麼分辨它在做哪件事**：看 `console.log`。出現「Entitlement Tracking Aggregator processing directory CN=…!!`entitlementtrack.ncf`」就是第二身份（entitlement 聚合）；一般 directory catalog 的 build／update 訊息才是本業。

## 能不能只關掉稽核那半？

既然兩個身份綁在一支 task 上，常見的下一個問題是：**能不能只關掉 entitlement 稽核那半、留著 directory catalog 本業？** 老實說——**沒有乾淨的官方開關**。

- **官方沒有 disable 設定**：[官方 entitlement tracking 頁](https://help.hcl-software.com/domino/14.0.0/admin/admn_entitlementtracking.html)通篇沒提怎麼關，還註明這套資料庫與收集「offered as is」。
- **`DISABLE_ENTITLEMENT_TRACKING=1` 是社群解、而且打錯層**：網路上流傳的這個 notes.ini 設定不在官方文件裡；而且它針對的是**本地收集層**（每台建自己的 `entitlementtrack.ncf`），不是聚合層。實測上，在一台會做聚合的 server 冷啟動加了它，dircat 照樣聚合——擋不住稽核那半。
- **真正能分開的是「角色」，不是開關**：聚合只在 **domain administration server** 上跑。所以要讓一台 server 的 dircat **只做 directory catalog、不碰 entitlement 聚合**，做法是**別讓它當 domain admin**（把 `names.nsf` 的管理伺服器交還真正的 domain admin server）——這正是 [Domino admin server 身份那篇](/domino-news/posts/domino-admin-server-identity)的解法。反過來，在 domain admin server 本機，目前沒有已驗證、受支援的方式能「留著通訊錄目錄、只砍掉 entitlement 聚合」。

一句話：稽核那半是**綁在 domain admin 角色上**、不是靠某個「`XXX=`關」的開關獨立關掉的。要哪台不做稽核聚合，就別讓它當 domain admin。

## 小結

dircat 是個名字會誤導的 task：名字說「目錄編目（Directory Cataloger）」，本業也確實是建通訊錄目錄——condensed 給 client、extended 給 server。但從 Domino 12 起，它多了一個名字沒提的隱藏身份：授權合規的 entitlement 聚合。知道這件事，下次在一台 additional server 上看到 dircat 在「連全 domain 每台機器」，就不會誤以為是通訊錄壞了——那是它的第二份差在跑，而該查的是這台是不是被誤設成了 domain administration server。
