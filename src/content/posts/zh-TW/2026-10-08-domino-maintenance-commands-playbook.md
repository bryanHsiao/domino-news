---
title: "Domino 維護指令實戰：參數規則、transaction log 分支，與三種情境 playbook（日常／修復／開不起來）"
description: "updall、compact、fixup 的參數網路上一抓一大把，但同一個 compact 下 -b 還是 -B、有沒有開 transaction logging，結果天差地遠：一個保留 DBIID、一個換掉 DBIID 害你備份鏈斷。這篇把官方維護手冊整理成實戰速查：先講三條語法規則（參數位置、大小寫 -b≠-B、關鍵字參數），再講 compact 的三種壓縮 style，最後給三種情境的完整指令序列——日常排程、資料庫損毀修復、工作時間不能停機——每一串都標明有無 transaction log 的差別。"
pubDate: 2026-10-08T07:30:00+08:00
lang: zh-TW
slug: domino-maintenance-commands-playbook
tags:
  - "Domino Server"
  - "Admin"
  - "Tutorial"
sources:
  - title: "Domino 伺服器維護的管理員手冊（updall/compact/fixup 完整選項與情境程序）— HCL Customer Support（官方 KB0030639）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0030639"
  - title: "伺服器維護清單（任務頻率 + transaction log 分支）— HCL Customer Support（官方 KB0030754）"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0030754"
  - title: "Compact options — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/12.0.2/admin/tune_compactoptions_r.html"
  - title: "Fixup options — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/admn_fixupoptions_r.html"
relatedJava: []
relatedSsjs: []
---

你要對一個 NSF 做維護，上網抓了一串 `load compact ...` 貼進 console。看起來有跑，但你未必知道：同一個 `compact`，下 `-b` 還是 `-B` 差很多——一個保留 `DBIID`、一個把 `DBIID` 換掉，而換掉 `DBIID` 會讓你跟認證備份工具之間的那條備份鏈斷掉。再加上有沒有開 transaction logging（交易日誌），該下的參數整組不一樣。

這不是「指令記不住」的問題，是**參數配錯會出事**的問題。這篇把 HCL 官方的維護手冊整理成一份實戰速查：先講三條語法規則，再把 `compact` 的壓縮方式分清楚，最後給三種情境的完整指令序列——每一串都標明「有沒有開 transaction log」的差別。想先搞懂「哪個症狀該跑哪個指令」的概念層，先看[這一篇](/domino-news/posts/domino-updall-fixup-compact/)；這篇接著講「那實際上要怎麼下參數」。

---

## 重點摘要

- **三條語法規則**：參數放資料庫路徑前後都行；`compact` 的重複字母**區分大小寫**（`-b` ≠ `-B`），`updall` 不分；少數參數要帶關鍵字（如 `-LargeSummary on`）。
- **`compact` 有三種壓縮 style**，先選對再談參數：就地壓縮保留 `DBIID`（`-b`，最快、transaction log 安全）、就地壓縮縮檔但換 `DBIID`（`-B`）、copy-style 重建新檔（`-c`，治損毀／結構變更／ODS 升級）、以及線上背景 replica 式（`-REPLICA`）。
- **transaction log 是貫穿全文的分支**：開了日誌，routine 不要跑 `fixup`（當機重啟會自動復原）、compact 用 `-b` 不要用 `-B`／`-c`（保留 `DBIID`）；任何換掉 `DBIID` 的壓縮做完要立刻做一次完整備份。
- **三種情境各一串**（完整指令在下方）：日常排程、資料庫損毀、工作時間不能停機。
- **`fixup` 不是常規保養**：官方建議只在有損毀跡象時跑，單機非叢集更不建議常跑。

## 三條語法規則

下指令前，先記住官方手冊裡這三條容易踩的規則：

1. **參數位置可前可後**。`load updall -R sales.nsf` 和 `load updall sales.nsf -R` 都能跑，資料庫路徑和參數的先後不影響。
2. **`compact` 區分大小寫，`updall` 不分**。這是最容易出事的一條：`compact` 裡 `-b` 和 `-B` 是**兩個不同功能**（就地壓縮 vs 就地壓縮並縮檔），大小寫寫錯就是另一個行為。`updall` 的選項字母不分大小寫——HCL 自己的文件 `-R` 和 `-r`、`-X` 和 `-x` 混著用，指的是同一件事。
3. **部分參數要帶 `on`／`off` 關鍵字才生效**，例如官方 Compact options 裡的 `-daos on|off`（附件整併 DAOS）、`-nifnsf on|off`（view 索引外置）都得接 `on` 或 `off`：`load compact -nifnsf on dbname.nsf`，只寫旗標本身不會動作。

## `compact`：先選對壓縮 style，再談參數

`compact` 的選項之所以亂，是因為它底下其實是**三種（嚴格說四種）不同的壓縮方式**，參數先決定你用的是哪一種（[官方 Compact options](https://help.hcl-software.com/domino/12.0.2/admin/tune_compactoptions_r.html)）：

| 方式 | 參數 | 會不會換 `DBIID` | 線上/離線 | 什麼時候用 |
|---|---|---|---|---|
| 就地、只回收空間 | `-b` | **不換** | 線上 | 最常用、最快、對系統影響最小；**transaction log 安全** |
| 就地、回收並縮檔 | `-B` | **換** | 線上 | 要讓檔案實際變小、節省磁碟時 |
| copy-style（複製重建） | `-c` | 換 | 離線（除非 `-L`） | 治損毀、結構性變更、ODS 升級 |
| replication-style | `-REPLICA` | 建新 replica | 線上背景 | 大型／系統資料庫要壓縮又想幾乎不停機 |

幾個關鍵點：

- **`-b` vs `-B` 的核心差別是 `DBIID`**。`-b` 就地回收未用空間、但**不縮小檔案**，保留原本的 `DBIID`，所以它跟 transaction log 的關係不會斷；`-B` 會縮檔、但**重新配一個 `DBIID`**。只要有開 transaction log，routine 壓縮用 `-b`；真的要縮檔用 `-B`，而且做完要立刻對所有資料庫做一次完整備份。
- **`-c` 是 copy-style**：它複製出一份新檔、壓完再刪掉舊檔，所以磁碟要有足夠空間放這份複本，也因此是**解損毀**的首選（整份重寫會順手修掉一些毛病）。結構性變更（例如改資料庫屬性、ODS 升級）Domino 也會自動改走 copy-style。
- **搭配參數**：`-S nn` 只壓縮「未用空間達 nn% 以上」的資料庫（例如 `-S 10`）；`-D` 丟掉已建好的 view 索引（copy-style，常用在備份上磁帶前，代價是下次開 view 要重建、第一次開比較慢）；`-i` 忽略錯誤繼續（只在 copy-style 有效）；`-L` 讓使用者在 copy-style 壓縮期間還能存取（但使用者一編輯，壓縮就取消）。

## `updall`：分清楚「更新」還是「重建」

`updall` 預設每晚跑（notes.ini 的 `ServerTasksAt2`），把需要更新的 view 與全文索引刷新、順便清掉刪除標記與久未使用的 view 索引。手動跑時，重點是分清楚「更新」和「重建」（[官方 Updall options](https://help.hcl-software.com/domino/11.0.1/admin/admn_updalloptions_r.html)）：

- **更新**：`-V` 只更新 view 索引（不碰全文）、`-F` 只更新全文索引（不碰 view）。這是日常的輕量操作。
- **重建**：`-R` 重建所有用過的 view、`-X` 重建全文索引。重建**很吃資源**，官方把它列為「解資料庫損毀的最後一招」，不是日常會跑的東西。常見的損毀修復尾段就是 `updall -R -X`（view 和全文都重建）。

## `fixup`：只在該用的時候用

`fixup` 做的是**一致性檢查**：伺服器重啟時會掃那些因為當機、斷電、硬體錯誤而沒正常關閉的資料庫，試著修掉寫一半造成的不一致。它不是拿來當常規保養的（[官方 Fixup options](https://help.hcl-software.com/domino/14.0.0/admin/admn_fixupoptions_r.html)）：

- 常用參數：`-F` 掃所有文件（不加只掃上次之後改過的）、`-O` 把開著的資料庫先下線再修、`-C` 只檢查報告**不修改**（verify only）、`-N` 不清除損毀文件、`-J` 對**開了 transaction log** 的資料庫跑（沒這參數 `fixup` 通常跳過日誌資料庫）、`-L` 把所有檢查過的庫都記進 log。
- **最重要的一條**：開了 transaction log，就**不需要**拿 `fixup` 來保持一致性——當機重啟時 Domino 會用日誌自動復原。官方明講 `fixup` 不建議當常規維護，單機非叢集伺服器更是只在「因資料庫損毀而當機」時才跑。

## 情境 playbook

把上面拼起來，官方維護手冊（[KB0030639](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0030639)）其實給了幾套現成的指令序列。直接照抄、按你有沒有開 transaction log 選那一行：

### 情境一：日常排程（預防性）

- `updall` 本來就每晚自動跑，不用自己排。
- 每週（週末離峰）壓縮一次，節省磁碟：
  - 沒開 transaction log：`load compact -B -S 10`
  - 有開 transaction log：`load compact -b -S 10`
  （`-S 10` = 只壓縮未用空間 ≥ 10% 的庫；`-b` 保留 `DBIID`、`-B` 會換掉。）
- **`fixup` 不排進日常**。沒遇過「因資料庫損毀而當機」就別固定跑。

### 情境二：資料庫損毀、開不起來

當 console 冒出 `database.nsf is damaged` / `is CORRUPT - Now Read-Only!` 這類訊息，照官方的還原序列跑——**先看有沒有 transaction log**：

- **有開 transaction log**：
  ```
  load fixup database.nsf -J -F
  load compact database.nsf -b
  load updall database.nsf -R -X
  ```
- **沒開 transaction log**：
  ```
  load fixup database.nsf -F
  load compact database.nsf -c -i
  load updall database.nsf -R -X
  ```
- 還是修不好：**建一個 replica 去取代原本的資料庫**——建 replica 會強制整份重建，能修掉一些 `fixup`／`compact` 清不掉的損毀。

（這些步驟會改掉跟 transaction log 相關的 `DBIID`，所以若你跑的是 archive 式日誌，做完要立刻做一次完整備份。）

### 情境三：工作時間不能停機

白天不能把資料庫下線，但又要處理：

1. 先只診斷、不動資料：`load fixup database.nsf -L -F -O -C`（`-C` verify only，只報告不修改）。
2. 真的得處理、又不能等離峰：`load compact database.nsf -c -L -i`（`-L` 讓使用者壓縮期間還能存取）。
3. 上面跑完，等離峰再 `load updall database.nsf -R -X` 重建 view 與全文。

## transaction log 改變一切

如果整篇只記一件事，記這個：**有沒有開 transaction log，決定你該下哪組參數。**

- **開了日誌**：routine 不要跑 `fixup`（重啟自動復原）；要對日誌資料庫跑 `fixup` 得加 `-J`；壓縮用 `-b`（保留 `DBIID`），**不要**用 `-B` 或 `-c`——它們會換 `DBIID`、害你的備份鏈要重來。
- **任何換 `DBIID` 的壓縮**（`-B`、`-c`，以及建新 replica 的 `-REPLICA`）做完，若你用認證備份工具，立刻做一次完整備份，讓備份工具重新認得這份資料庫。

## 什麼時候不該跑（尤其 fixup）

官方特別提醒，`fixup` 常常是「不該跑卻跑了」：

- **第一次當機**：當機雖然會造成不一致，但沒開 transaction log 的話，Domino 重啟時本來就會做一致性檢查、自動修。沒有錯誤就不用再手動 `fixup`。
- **當機跟資料庫無關**：如果 NSD／crash stack 裡沒有任何資料庫相關訊息，基本可以排除資料庫損毀，不用去修。
- **反覆當機且 NSD 指向某個庫**：這時才真的需要 `fixup`，而且建議在**伺服器停止**的狀態下跑。

## 小結

Domino 的維護指令不難，難在參數配對。三條語法規則先守住（位置可前後、`compact` 分大小寫、關鍵字參數）；`compact` 先選對壓縮 style（`-b` 留 `DBIID`、`-B` 縮檔換 `DBIID`、`-c` copy-style 治損毀、`-REPLICA` 線上背景）；`updall` 分清「更新 `-V`／`-F`」和「重建 `-R`／`-X`」；`fixup` 只在該用時用。情境來了就照 playbook 的序列跑、按有沒有 transaction log 選那一行。而貫穿全部的那條線，永遠是 transaction log——它決定你能不能跑 `fixup`、該用哪個 compact style、以及做完要不要補一次完整備份。
