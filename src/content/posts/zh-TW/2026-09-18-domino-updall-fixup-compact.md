---
title: "updall、fixup、compact：資料庫壞了、肥了、view 不對，該跑哪一個"
description: "Domino 三個資料庫維護指令最容易被亂槍打鳥：view 顯示過期就想 fixup、資料庫肥了就 fixup、開不起來就 compact——結果白跑一場。其實它們各治不同的病：updall 管索引（view／全文），fixup 修損毀（文件／結構），compact 收空間（變肥就它）。這篇按「什麼症狀跑哪個」講清楚，並附官方的損毀升級順序：先 updall、再 fixup、最後 compact -c。"
pubDate: 2026-09-18T07:30:00+08:00
lang: zh-TW
slug: domino-updall-fixup-compact
tags:
  - "Domino Server"
  - "Admin"
sources:
  - title: "Fixing corrupted databases（損毀升級順序）— HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_fixingcorrupteddatabases_r.html"
  - title: "Updall options — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_updalloptions_r.html"
  - title: "Fixup options — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/admn_fixupoptions_r.html"
  - title: "Running the database maintenance tool from a Program document — HCL Domino（官方）"
    url: "https://help.hcl-software.com/domino/11.0.1/admin/admn_running_the_database_maintenance_tool_from_a_program_document_t.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-updall-fixup-compact.webp"
coverStyle: "bw-grain"
---

資料庫出狀況，最常見的是**拿錯工具**：view 顯示過期就想 `fixup`、檔案越來越肥就 `fixup`、開不起來就 `compact`——然後跑了半天沒解決。`updall`、`fixup`、`compact` 是三個**治不同病**的維護指令，搞清楚「什麼症狀跑哪個」，比亂試省時間得多。

## 重點摘要

- **`updall` = 索引**（view／全文索引）。view 顯示過期、排序亂、少資料 → 先跑它。
- **`fixup` = 修損毀**（文件／資料庫結構）。資料庫開不起來、有 corruption 錯誤 → 找它；伺服器不正常關機時，開機會自動對受影響的庫跑 fixup。
- **`compact` = 收空間**（檔案變肥、想瘦身）。也用來換壓縮樣式、開啟某些功能。
- **損毀時的官方升級順序**：先 `updall` → 再 `fixup` → 最後 `compact -c`。
- 開了 **transaction logging**，損毀會大幅變少。

## `updall`：view 或全文索引不對，跑它

`updall` 管的是**索引**——它更新／重建 view 索引與全文索引。**症狀**：view 顯示的資料是舊的、排序不對、該有的文件沒出現、或全文搜尋結果怪怪的。這通常不是資料壞了，是**索引過期或損壞**，重建索引就好，不必動到文件。

- `updall`（不帶參數）更新伺服器上所有庫需要更新的索引。
- `updall <資料庫>` 只處理某個庫。
- 想**強制重建**（而非只是更新）某庫的 view，用 [`updall` 的 rebuild 參數](https://help.hcl-software.com/domino/11.0.1/admin/admn_updalloptions_r.html)（例如 `-r`）；全文索引相關另有參數（如 `-f`）。

在用戶端要重建單一 view 可按 <kbd>Shift+F9</kbd>、重建整個庫的所有 view 按 <kbd>Ctrl+Shift+F9</kbd>——那背後就是 updall 在做的事。

## `fixup`：資料庫損毀、開不起來，找它

`fixup` 是**修損毀**的工具——檢查並修復資料庫的文件與結構層級毀損。**症狀**：資料庫開不起來、出現「database is corrupt」之類錯誤、或伺服器不正常關機後某些庫怪怪的（這種情況 Domino **開機時會自動**對受影響的庫跑 fixup）。

要留意 fixup 是**偏後段的手段**：它為了讓庫能開，可能會**丟掉修不好的文件**。所以遇到損毀，**優先考慮從備份還原**、或靠 transaction logging 回復，`fixup` 是「還是開不了才上」的選項。各種 [fixup 參數](https://help.hcl-software.com/domino/12.0.0/admin/admn_fixupoptions_r.html)（`-f` 全面檢查、`-j` 對 logged 庫等）依情況選。

## `compact`：檔案肥了、要瘦身，用它

`compact` 的本職是**回收未用空間、縮小檔案**——刪了很多文件後檔案不會自己變小，那些空洞要靠 compact 收回。**症狀**：`.nsf` 一直長大、佔空間、或你剛清掉大量文件想讓它瘦回來。

常見樣式：

- **`-B`（in-place，回收空間）**：就地壓縮並把空間還給 OS，多數情況可在**線上（伺服器運作中）**跑。
- **`-c`（copy-style，複製式）**：另開一份暫存副本重建——需要額外磁碟空間，但能做結構性的改動，也是損毀升級順序的最後一棒（見下）。

compact 也用來**開啟某些功能**（如 DAOS、document IDs）或改變壓縮設定，這些常需要 `-c`。

## 損毀時：官方的升級順序

上面三個各有本職，但當你面對「一個損毀的庫」時，[官方](https://help.hcl-software.com/domino/12.0.0/admin/admn_fixingcorrupteddatabases_r.html)給了一條清楚的升級路徑，照順序試：

1. **先 `updall`**：「Run Updall to fix corrupted views and full-text indexes; **if a corrupted view is the problem, try Updall before trying Fixup**.」——若只是 view 壞，updall 就夠，不必動 fixup。
2. **再 `fixup`**：「Run Fixup to fix corrupted views and documents.」——updall 解不掉、牽涉到文件層級，才上 fixup。
3. **最後 `compact -c`**：「Run Compact with the `-c` option to fix corruption problems that Fixup doesn't correct.」——fixup 都修不好的，用複製式 compact 重建整個庫當最後一招。

官方也點明：這些手段「**primarily used for solving corruption problems in unlogged databases**」——開了 transaction logging，損毀本來就少很多，這也是最省事的預防。

## 排程與線上

這三個都能從 **Program document** 排程定時跑（[官方說明](https://help.hcl-software.com/domino/11.0.1/admin/admn_running_the_database_maintenance_tool_from_a_program_document_t.html)），例如夜間 `updall` 更新索引、定期 `compact -B` 回收空間。能不能線上跑依工具與參數而定：`updall`、`compact -B` 多半可線上；`fixup` 的部分操作需要庫沒被開著。

## 小結

一句話分工：**view／全文不對 → `updall`（索引）；開不起來／損毀 → `fixup`（修文件，但優先想備份）；檔案肥了 → `compact`（收空間）**。真的碰到損毀，照官方升級順序 updall → fixup → compact -c 一路試。平時開好 transaction logging，這三支你會少跑很多。伺服器出狀況時該先看什麼，見[伺服器 console 排錯指令](/domino-news/posts/domino-console-troubleshooting)。
