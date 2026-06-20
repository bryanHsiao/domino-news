---
title: "開發者很少注意的 ODS：Domino 資料庫格式版本演進，與「什麼時候會升、由什麼決定」"
description: "你整天寫 LotusScript / XPages，大概從來沒在意過資料庫的 ODS（on-disk structure）版本 — 直到某個功能（像 LargeSummary）需要特定 ODS，或你把一顆舊 DB 在 server 之間搬動，搞不清楚 ODS 會不會跟著變。本文從開發者角度整理 ODS 的版本對應、最反直覺的一點（升 server 版本不等於升 ODS），以及 ODS 到底「什麼時候會變、由什麼決定」，最後回答一個具體情境：R9 的 ODS51 資料庫用 R12 client 新複製到 R12 server，ODS 會自動異動嗎？"
pubDate: 2026-06-21T07:00:00+08:00
lang: zh-TW
slug: domino-ods-versions
tags:
  - "Domino Server"
  - "Admin"
  - "Tutorial"
sources:
  - title: "Domino on-disk structure (ODS) — HCL Domino 14.5"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/inst_dominoondiskstructure_t.html"
  - title: "Controlling the ODS versions of server-based databases — HCL Domino"
    url: "https://help.hcl-software.com/domino/12.0.0/admin/upgrading_ods_on_servers.html"
  - title: "Controlling the ODS version of client-based databases — HCL Domino"
    url: "https://help.hcl-software.com/domino/14.0.0/admin/upgrading_ods_on_clients.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-ods-versions.webp"
coverStyle: "oil-chiaroscuro"
---

身為開發者，你整天在寫 LotusScript、XPages、agent，大概從來沒主動想過一件事：你操作的那顆資料庫，**底層檔案格式是哪個版本**？這個版本就叫 **ODS（on-disk structure）**，平常它隱形，直到某天它突然變成問題 ——

- 你想用某個功能（例如站上[前一篇講的 LargeSummary](/domino-news/posts/domino-large-summary-field-too-large/)），結果它要求資料庫在某個 ODS 以上；
- 或者你把一顆舊 DB 在 server 之間搬來搬去，搞不清楚 ODS 會不會跟著變、什麼時候變。

這篇就從開發者角度，把 ODS 的版本演進、以及「**什麼時候會升、由什麼決定**」整理清楚，最後回答一個很具體、也很多人不確定的情境：**一顆 R9 時代、ODS 51 的資料庫，用 R12 client 手動新複製到 R12 的另一台 server，ODS 會自動異動嗎？**

---

## 重點摘要

- **ODS = 資料庫的檔案格式版本**。每個 Domino 版本有一個預設 ODS，較高的 ODS 解鎖較大的 DB、較多 ACL、LargeSummary 等能力。
- **最反直覺的一點：升 server 版本 ≠ 升 ODS。** 官方表上，Domino **12 / 14 新建資料庫的預設仍是 ODS 52**；要 ODS 55 必須設 `Create_R12_Databases=1`。
- **單純把舊 DB 開在新 server 上，不會自動升 ODS。** 只有 **複製式壓縮（copy-style compact，`compact -c` / dbmt `-ods`）** 會升 ——「複製式」指的是「整顆 DB 重寫成一個新檔」的那種壓縮。
- **目標 ODS 由 notes.ini `Create_Rx_Databases` 決定**（沒設 = 預設 52）。
- **新副本 / 新複本是「建一個新檔」** → 套用「檔案被建立在哪台」的建立-ODS 設定；**OS 層原始檔案複製則原樣保留 ODS**。
- Notes **client 啟動時**會自動把「低於預設 ODS」的**本機** DB 用 copy-style compact 升上來（這是 client 行為，server 沒有）。

---

## ODS 是什麼（開發者版）

官方定義很短：「Domino on-disk structure (ODS) refers to the file format of a database.」—— 就是資料庫的檔案格式版本。

對開發者來說，ODS 平常不用管，但它決定了「這顆 DB 撐得住什麼」。較高的 ODS 會解鎖一些較舊格式做不到的能力，例如更大的資料庫上限、更多 ACL 條目、以及前一篇講的 **LargeSummary**（把單份文件 summary 上限從 64K 拉到 16MB）。所以 ODS 不是純維運話題 —— 當你要用一個「需要某個 ODS 以上」的功能時，它就變成你的事。

## 版本對應：哪個 ODS 對哪個版本

把常見的對應整理出來（現代幾個版本以 [HCL 官方 ODS 文件](https://help.hcl-software.com/domino/14.5.0/admin/inst_dominoondiskstructure_t.html)為準）：

| ODS | 約對應版本 | 備註 |
|---|---|---|
| 43 | R6 / R7 | 歷史格式 |
| 48 | R8.0 | |
| 51 | R8.5 | 本文情境那顆老 DB 的格式 |
| 52 | R9 | **沿用為 R10 / R11 / R12 / R14 的「預設」新建 ODS** |
| 53 | R10 | 需 `Create_R10_Databases=1`；支援更大的 DB / folder |
| 55 | R12 | 需 `Create_R12_Databases=1`；LargeSummary / 更大欄位的結構基礎；R14 / 14.5 最高也是 55 |

注意那個 **52 橫跨好幾代** —— 這正是下一段最反直覺的點的來源。

## 最反直覺的一點：升 server 版本 ≠ 升 ODS

很多人以為「server 升上 R12 / R14，資料庫的 ODS 就自動是最新」。**不是。**

[控制 server 端 ODS 的官方文件](https://help.hcl-software.com/domino/12.0.0/admin/upgrading_ods_on_servers.html)講得很清楚：Domino 12 / 14 **新建**資料庫的**預設 ODS 仍然是 52**；要用 ODS 55，必須明確設定：

```text
Create_R12_Databases=1
```

而且，**單純把一顆舊 ODS 的 DB「開在」新 server 上、或日常使用它，都不會自動升級它的 ODS。** 官方原文：existing databases 只有在「**are compacted using copy-style compacting**」時才會被升到目標版本。換句話說 —— ODS 不會因為你換了台新 server、或開了它幾次，就自己往上跳。

## 那 ODS 什麼時候真的會變？

把觸發條件整理成三類，這是這篇最該記住的表：

**不會變 ODS：**

- **OS 層的原始檔案複製**（直接 copy `.nsf`）—— 沒有重寫檔案，ODS 原樣保留。
- **單純開啟 / 使用 / 複寫資料**。
- **就地式維護（in-place）**：`fixup`、`updall`、就地式壓縮（in-place compact，直接在原檔上整理、不重建成新檔的那種）。

**會變 ODS：**

- **Copy-style compact**（`load compact -c`，或建議用 `load dbmt … -ods`）—— 它會把整顆 DB 重寫成「目的端的建立-ODS」。這是官方文件唯一明講的升級路徑。
- **建立 New Copy / New Replica（新副本 / 新複本）** —— 這是「建一個新的資料庫檔」，新檔會套用「它被建立在哪台機器」的建立-ODS 設定。
- **[Notes client 啟動時的自動升級](https://help.hcl-software.com/domino/14.0.0/admin/upgrading_ods_on_clients.html)** —— client 開機後會檢查**本機**有沒有低於預設 ODS 的 DB，有的話自動做 copy-style compact 升到 client 預設（這是 client 專屬行為，server 端沒有）。

**目標 ODS 由什麼決定：**

不管是新檔還是 copy-style compact，最後落在哪個 ODS，都由「**檔案被建立 / 重寫的那台機器**」的 notes.ini `Create_Rx_Databases` 決定：

| 設定 | 新檔 / copy-style compact 後的 ODS |
|---|---|
| （未設） | 預設 **52** |
| `Create_R10_Databases=1` | 53 |
| `Create_R12_Databases=1` | 55 |

## 回到你的情境：ODS51 用 R12 client 新複製到 R12 ap02

現在可以精準回答了。一顆 R9 時代、停在 **ODS 51** 的資料庫（原本在 ap01），你從 **R12 client** 手動「**新複製**」到 **R12 的 ap02**，ODS 會不會變？

關鍵在「新複製」是哪一種動作：

- **如果是 New Copy / New Replica（透過 Notes 建立新副本）**：這是在 **ap02 上建立一個新檔**，所以新檔的 ODS = **ap02 的建立-ODS**：
  - ap02 沒設 `Create_R12_Databases=1` → 新檔是 **ODS 52**（**離開了 51、但不會是 55**）。
  - ap02 有設 `Create_R12_Databases=1` → 新檔是 **ODS 55**。
  - 不論哪種，結果都**不會留在 ODS 51** —— 因為它是「建新檔」、套的是目的端設定，不是沿用來源。
- **如果是 OS 層的原始檔案複製**（直接搬 `.nsf` 檔）：沒有重寫，**ODS 51 原樣保留**。
- **如果這顆是落在 client 本機**（建在 client 的 data 目錄）：client 下次啟動會自動把它 copy-style compact 升到 **client 的預設 ODS**。

所以「會不會自動異動」這題，答案是：**取決於你做的是「建新副本」還是「複製檔案」，以及目的端的 `Create_Rx_Databases` 設定。** 很多人「以為升了 R12 就有最新 ODS」、或「以為複製一定保留原 ODS」，兩種直覺都會在不同情況下出錯 —— 真正的決定權在「**新檔被建立在哪、那台怎麼設定**」。

## 怎麼查、怎麼控

- **查某顆 DB 的 ODS**：資料庫內容（Database properties）裡有顯示；server 端也可用 `show database <db>` 之類指令查看格式資訊。
- **想升級既有 DB**：在目的 server 設好 `Create_Rx_Databases=1`，再對 DB 做 **copy-style compact**（建議 `load dbmt … -ods`，`-ods` 會略過已經是目標 ODS 的 DB，不做白工）。
- **想刻意維持舊 ODS**（相容性考量）：就別跑 copy-style compact、也別在高設定的 server 上 New Copy；用原始檔案複製可保留格式。

## 跟 LargeSummary 的關係

這也補上了[前一篇 LargeSummary](/domino-news/posts/domino-large-summary-field-too-large/) 留下的那條因果鏈。那篇講到一個陷阱：客戶的 DB 從 R9 升到 R12、ODS 看起來是 55，**LargeSummary 卻沒開**。

把兩篇接起來看，完整的層次是這樣：

```text
server 版本（R12/R14）
   ↓ 不會自動升 ODS
ODS 版本（要 Create_R12_Databases=1 + copy-style compact 才到 55）
   ↓ ODS55 只是「結構撐得住」，不等於功能已開
LargeSummary（還要 compact -LargeSummary on 才真正啟用）
```

每一層都是「必要但不充分」 —— 升了上一層，不代表下一層自動跟上。**ODS 是這整條鏈最底下、最容易被開發者忽略、卻決定了上面能不能解鎖的那一層。** 下次你發現某個功能「版本明明夠了卻不能用」，先往下檢查 ODS 與它的建立設定，往往答案就在那裡。
