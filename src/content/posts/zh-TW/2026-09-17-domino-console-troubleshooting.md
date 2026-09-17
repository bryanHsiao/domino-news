---
title: "Domino 伺服器排錯：先別重啟整台，這幾個 console 指令先看清楚狀況"
description: "伺服器怪怪的——某個功能不通、好像卡住、記憶體或磁碟吃緊。反射動作往往是「重啟整台」，但那太粗魯、也可能蓋掉現場。這篇把最常用的 Domino console 排錯指令按「你遇到什麼問題」整理：show tasks 看誰在跑／卡住、show server 看整體健康、restart task <task> 只重啟出問題的那個 task（例如 restart task http，而不是整台）、tell http show thread state 抓卡住的 thread、dbcache show/flush/disable 處理資料庫快取。先看清楚，再決定要不要動手。"
pubDate: 2026-09-17T07:30:00+08:00
lang: zh-TW
slug: domino-console-troubleshooting
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Show Tasks command — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_showtasks_r.html"
  - title: "Tell command — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/10.0.1/admn_tell_r.html"
  - title: "Restart Task command — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_restarttask_r.html"
  - title: "Restart Server command — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_restartserver_r.html"
  - title: "Web Server Tell commands — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/admn_webservertellcommands_r.html"
  - title: "Dbcache Show command — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/10.0.1/admn_dbcacheshow_r.html"
  - title: "Using a console to send commands to a server — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-console-troubleshooting.webp"
coverStyle: "photoreal-3d"
---

伺服器怪怪的——某個功能突然不通、某個 task 好像卡住、記憶體或磁碟吃緊。第一反應常常是「重啟整台看看」。但重啟太粗魯：它會踢掉所有連線、蓋掉現場，而且十之八九，你其實只要處理**其中一個 task**。動手之前，先在 console 敲幾個指令**把狀況看清楚**——這篇把最常用的排錯指令按「你遇到什麼問題」整理。

（怎麼下指令：直接在 server 的 live console 打；或用 Domino Administrator 的遠端 console；或 `domino console`。[官方](https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html)有各種連法。指令大小寫不敏感，多數可縮寫，例如 `sh ta` = `show tasks`。）

## 重點摘要

- **看現在在跑什麼、有沒有卡** → `show tasks`
- **看伺服器整體健康**（連線數、可用度、待送郵件） → `show server`
- **只重啟出問題的那個 task**（別重啟整台） → `restart task <task>`（例 `restart task http`）；重整台的所有 task 用 `restart server`（`res ser`）
- **抓是哪個 thread 卡住**（web 慢／卡） → `tell http show thread state`；全伺服器所有 thread 的 call stack → NSD
- **資料庫快取問題 / 要獨佔某個 .nsf** → `dbcache show` / `dbcache flush` / `dbcache disable`
- 原則：**先看清楚、再動手**，能只重一個 task 就別重整台。

## 看現在在跑什麼：`show tasks`

排錯的第一步幾乎都是它。[官方](https://help.hcl-software.com/domino/12.0.0/admin/admn_showtasks_r.html)：`Show Tasks` 顯示「the server name, the Domino program directory path, and the status of the active server tasks」，而且「**Idle tasks are indicated**」——閒置的會標出來。

所以你一眼能看到：HTTP、Router、Indexer、Agent Manager… 這些 task 在不在、現在在忙什麼、還是 idle。**某個 task 卡住**時，它常會停在某個奇怪的狀態不動；某個功能不通時，先看它對應的 task 是不是根本沒起來（例如 web 不通先看有沒有 `HTTP Server`）——在 `show tasks` 的輸出裡掃到你要的那個 task、看它的狀態就好。

## 看整體健康：`show server`

`show server` 給你伺服器的整體體檢：可用度指標（availability index）、目前 session 數、每分鐘交易數、待送郵件、pending 的工作等。要判斷「是不是整台被打爆」（負載高、可用度掉、session 爆量），看這個比重啟有用得多。搭配 `show stat`（或 `show stat <名稱>`）可以看更細的統計數字。

## 重啟一個 task，別重啟整台

這是「別重啟整台」的關鍵。[`tell`](https://help.hcl-software.com/domino/10.0.1/admn_tell_r.html) 是「issue a command to a server program or task」——對**單一 task** 下指令（`tell <task> quit` 收掉、各 task 還有自己專屬的一組，如 `tell router ...`、`tell amgr ...`）。要「關掉再啟動」一個 task，有三種寫法，差別值得搞清楚：

- **`tell <task> quit` + `load <task>`（手動兩步）**：先 `tell http quit` 收掉、再 `load http` 起回來。能用，但它是**兩個獨立指令**——如果你 `load http` 打太快、撞上還沒 quit 乾淨的 task，可能失敗或起不乾淨（race）。
- **`restart task <task>`（推薦，例 `restart task http` / 簡寫 `res task http`）**：一個指令搞定。[官方](https://help.hcl-software.com/domino/11.0.1/admin/admn_restarttask_r.html)：它「shuts down and then restarts a specified server task」——**把「等它關乾淨、再啟動」的順序自己處理好**，所以比手動兩步安全、不會 race。很多資深顧問建議「以 `restart task http` 為主」就是這個原因：單一原子操作、少一個踩雷的機會。
- **`restart server`（`res ser`，重啟整台的所有 task）**：[官方](https://help.hcl-software.com/domino/11.0.1/admin/admn_restartserver_r.html)：它「stops the Domino server and then restarts it after a brief delay」。注意它重啟的是 **Domino 這一層的所有 server task**、停了自動再起，**不是 OS 重開機**——要重整台時，這比手動一個個 quit 再開方便得多。

**一個很多人搞混的點：`tell http restart` 不是「重啟 HTTP task」，而是「重新載入設定」。** [官方 Web Server Tell 指令](https://help.hcl-software.com/domino/14.5.0/admin/admn_webservertellcommands_r.html)寫得清楚：`tell http restart`「Refreshes the Web server with changes made to settings in the: Server document...; NOTES.INI file that affects the HTTP server task; ...」——它是改了 server 文件／notes.ini 後**套用新設定**用的（更輕的還有 `tell http refresh`）。所以：**改設定要套用** → `tell http restart`／`refresh`；**真的要把 HTTP task 關掉重起**（例如 [xspupload 上傳失效那篇](/domino-news/posts/domino-xspupload-upload-fail)講的「每晚上下 HTTP」）→ `restart task http`，或 `tell http quit` + `load http`。

## 抓「是哪個 thread 卡住」

`show tasks` 看的是 **task**，不是 thread。當某個服務（尤其 web）變慢或像卡住，你想知道**是哪個 thread、卡在什麼上面**，有兩個層級：

- **`tell http show thread state`**：列出 HTTP 目前每個 worker thread 的狀態、正在處理哪個 URL。**卡在同一個請求好幾分鐘的那個，多半就是 hung thread**——這是排查 HTTP 慢／卡的第一手，抓到後常能反推是哪支程式或哪個外部相依卡住了。
- **NSD（Notes System Diagnostic）**：要看**全伺服器所有 thread 的 call stack**（每個 thread 走到哪行程式碼）加記憶體狀態，就用 NSD——它是 server hang／crash 時的終極診斷工具，會產出一份報告供進一步分析（較重，通常留給真的 hang 住／要送原廠時用）。

## 資料庫快取：`dbcache show` / `flush` / `disable`

有時問題出在**資料庫快取**——某個 .nsf 一直被 server 開著，你想備份／複製／compact 卻卡住。[官方](https://help.hcl-software.com/domino/10.0.1/admn_dbcacheshow_r.html)：

- **`dbcache show`**：顯示「the names of the databases currently in the cache」——目前被快取（開著）的資料庫清單。想知道某個庫是不是還被 server 抓著，先看這個。
- **`dbcache flush`**：把目前開在快取裡的資料庫**關掉、放掉**，讓它們從記憶體釋放。你要對某個 .nsf 做需要獨佔的操作前，常先 flush。
- **`dbcache disable`**：暫時**關掉快取**，用在「需要對某檔獨佔存取」時，避免跟快取著的實例打架。

## 其他常用的「看清楚」

- `show diskspace` 看磁碟空間（磁碟吃緊時第一個看）。
- `show users` 看目前連進來的使用者。
- `show stat <名稱>` 撈特定統計（例如 `show stat Database.*`、`show stat Mem.*`）。

## 小結

伺服器出狀況，別急著重啟整台——那太粗魯、又蓋現場。先 `show tasks` 看誰在跑、誰卡住，`show server` 看整體健康；鎖定是哪個 task 之後，用 `restart task <task>`（一個原子指令、不會 race）**只動那一個**，真要重整台才用 `restart server`。web 卡住先 `tell http show thread state` 看哪個 thread 卡在哪個 URL、必要時上 NSD。資料庫被抓住就 `dbcache show`／`flush`。把「先看清楚、再精準動手」變成反射，比動不動重整台省事、也少踩雷。
