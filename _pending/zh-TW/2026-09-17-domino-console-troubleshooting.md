---
title: "Domino 伺服器排錯：先別重啟整台，這幾個 console 指令先看清楚狀況"
description: "伺服器怪怪的——某個功能不通、好像卡住、記憶體或磁碟吃緊。反射動作往往是「重啟整台」，但那太粗魯、也可能蓋掉現場。這篇把最常用的 Domino console 排錯指令按「你遇到什麼問題」整理：show tasks 看誰在跑／卡住、show server 看整體健康、tell <task> 只重啟出問題的那個 task（例如 tell http restart，而不是整台）、dbcache show/flush/disable 處理資料庫快取。先看清楚，再決定要不要動手。"
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
  - title: "Dbcache Show command — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/10.0.1/admn_dbcacheshow_r.html"
  - title: "Using a console to send commands to a server — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html"
relatedJava: []
relatedSsjs: []
---

伺服器怪怪的——某個功能突然不通、某個 task 好像卡住、記憶體或磁碟吃緊。第一反應常常是「重啟整台看看」。但重啟太粗魯：它會踢掉所有連線、蓋掉現場，而且十之八九，你其實只要處理**其中一個 task**。動手之前，先在 console 敲幾個指令**把狀況看清楚**——這篇把最常用的排錯指令按「你遇到什麼問題」整理。

（怎麼下指令：直接在 server 的 live console 打；或用 Domino Administrator 的遠端 console；或 `domino console`。[官方](https://help.hcl-software.com/domino/11.0.1/admin/admn_usingaconsoletosendcommandstoaserver_c.html)有各種連法。指令大小寫不敏感，多數可縮寫，例如 `sh ta` = `show tasks`。）

## 重點摘要

- **看現在在跑什麼、有沒有卡** → `show tasks`
- **看伺服器整體健康**（連線數、可用度、待送郵件） → `show server`
- **只處理出問題的那個 task**（別重啟整台） → `tell <task> …`，例如 `tell http restart`
- **資料庫快取問題 / 要獨佔某個 .nsf** → `dbcache show` / `dbcache flush` / `dbcache disable`
- 原則：**先看清楚、再動手**，能只重一個 task 就別重整台。

## 看現在在跑什麼：`show tasks`

排錯的第一步幾乎都是它。[官方](https://help.hcl-software.com/domino/12.0.0/admin/admn_showtasks_r.html)：`Show Tasks` 顯示「the server name, the Domino program directory path, and the status of the active server tasks」，而且「**Idle tasks are indicated**」——閒置的會標出來。

所以你一眼能看到：HTTP、Router、Indexer、Agent Manager… 這些 task 在不在、現在在忙什麼、還是 idle。**某個 task 卡住**時，它常會停在某個奇怪的狀態不動；某個功能不通時，先看它對應的 task 是不是根本沒起來（例如 web 不通先看有沒有 `HTTP Server`）。想聚焦看某一個，用 `show tasks only <task>`。

## 看整體健康：`show server`

`show server` 給你伺服器的整體體檢：可用度指標（availability index）、目前 session 數、每分鐘交易數、待送郵件、pending 的工作等。要判斷「是不是整台被打爆」（負載高、可用度掉、session 爆量），看這個比重啟有用得多。搭配 `show stat`（或 `show stat <名稱>`）可以看更細的統計數字。

## 只重出問題的那個 task：`tell`

這是「別重啟整台」的關鍵。[`tell`](https://help.hcl-software.com/domino/10.0.1/admn_tell_r.html) 是「issue a command to a server program or task」——對**單一 task** 下指令。有些是通用的（`tell <task> quit` 收掉某個 task），有些是特定 task 專屬的。

最實用的幾個：

- **只重啟 HTTP**：`tell http restart`（或 `tell http quit` 再 `load http`）。web 出問題時，重的是 HTTP 這個 task，不是整台伺服器——所有非 web 的服務都不受影響。（我們在 [xspupload 上傳失效那篇](/domino-news/posts/domino-xspupload-upload-fail)講過「每晚上下 HTTP」的硬撐法，用的就是這個。）
- **收掉／重啟某個 task**：`tell <task> quit` 停掉，再用 `load <task>` 起回來。
- **task 專屬指令**：例如 `tell http show ...`、`tell amgr ...`、`tell router ...`——各 task 有自己的一組。

`load <task>` 是「把某個 task 起起來」；`tell <task> quit` 是「把它收掉」——這兩個就是你在**不動整台**的前提下，單獨重整某個服務的組合。

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

伺服器出狀況，別急著重啟整台——那太粗魯、又蓋現場。先 `show tasks` 看誰在跑、誰卡住，`show server` 看整體健康，鎖定是哪個 task 的事之後，用 `tell <task> restart` / `tell <task> quit` + `load <task>` **只動那一個**。資料庫被抓住就 `dbcache show`／`flush`。把「先看清楚、再精準動手」變成反射，比動不動重整台省事、也少踩雷。
