---
title: "Domino 14.5 Mandated Port Encryption 啟用實務 — CheckPortEncryption agent、portenc 指令、退路"
description: "續 5/11 概念篇，本文把 HCL 官方 10 步驟啟用流程拆開講：升級 server address book design、簽 CheckPortEncryption 排程 agent、Directory Profile 關鍵欄位、server ini（DEBUG_MANDATED_ENCRYPTION、MANDATEDENC_ACTIVE_REFRESH_TIME）、Desktop policy（DISABLE_MANDATED_ENCRYPTION）、portenc refresh / show 指令，以及啟用後出問題時的退路。Pre-14.5 server 的特殊行為也獨立講清楚。"
pubDate: 2026-05-12T07:30:00+08:00
lang: zh-TW
slug: mandated-port-encryption-enabling
tags:
  - "Security"
  - "Release Notes"
sources:
  - title: "Enabling mandated NRPC port encryption — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption_enabling.html"
  - title: "Mandating level of port encryption — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption.html"
  - title: "Domino 14.5: Domino ディレクトリのサーバービューに「?」アイコンが表示される (KB0127764) — HCL Software Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0127764"
relatedJava: []
relatedSsjs: []
---

## 前情提要

[昨天的概念篇](/domino-news/posts/mandated-port-encryption) 解釋了 Domino 14.5 升級後 server view 的 `?` icon 是什麼、Mandated NRPC Port Encryption 為什麼存在、三種啟用模式（停用 / logging 觀察 / mandate 強制）的差別。本篇把 HCL 官方的 [Enabling mandated NRPC port encryption](https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption_enabling.html) 10 步驟拆開講，附 ini 名稱、指令、踩雷點。

## 前置條件

- **primary administration server 必須是 14.5 或更新** — domain 內其他 server 可以還是 pre-14.5（後面 `CheckPortEncryption` agent 會處理舊 server）
- 已經對升級 server address book design 到 14.5 版有規劃（步驟 1）
- 對「先 logging、再 enforce」的兩階段啟用有共識（不要直接跳到 enforce）

## 10 步驟啟用流程

### 1. 升級 server address book design 到 14.5

最基本前提 — Directory Profile 的「Mandated Port Encryption」section 是 14.5 版 design 才有的。

### 2. 簽好 `CheckPortEncryption` 排程 agent 並啟用

server address book 裡新增了一支排程 agent：`CheckPortEncryption`。Admin 必須：

- 用「能跑 unrestricted agent」的 ID 簽
- 啟用該 agent
- 確認 server document 的 Agent 段允許這個簽署人 unrestricted run

這支 agent **每天跑一次**，遍歷 domain 所有 server，**對 pre-14.5 vs 14.5+ 的行為不一樣**：

| Server 版本 | `CheckPortEncryption` 做什麼 |
|---|---|
| **Pre-14.5** | 讀 Directory Profile 的 mandate 設定，動態調整該 server 的 NRPC port encryption level，更新 `PORT_ENC_ADV` ini（不需重啟） |
| **14.5+** | **什麼都不做** — 14.5 server 自己內建有 mandate 處理邏輯 |

換句話說，這支 agent 是**過渡期 helper** — 為了讓 pre-14.5 server 也能配合 directory profile 的 mandate 設定。等所有 server 都升到 14.5+，agent 就退休了。

### 3. 建例外群組（可選）

不想被 mandate 管的 server 可以建一個 server group、加進 Directory Profile 的例外清單。**Passthru server 跟 ADPWSync 工具 server 預設自動排除**，不必手動加。

### 4. 建 14.5+ server 群組（可選）

可以建一個 server group 列出 14.5+ server，或用 `* - [All Servers]` 涵蓋。如果你準備手動管每個 server 的 ini 就跳過這步。

### 5. 設 server ini（需要重啟一次）

用 server configuration document 的 Notes.ini 段設：

| Ini key | 值 | 用途 |
|---|---|---|
| `DEBUG_MANDATED_ENCRYPTION` | `1` | 啟用 mandated encryption 的 debug log |
| `MANDATEDENC_ACTIVE_REFRESH_TIME` | 秒數（預設 24 小時） | 多久重抓一次 directory profile 設定，預設輪詢 60 分鐘 |
| `DEBUG_PORT_ENC_ADV` | `1` | 啟用 port encryption 細節 debug |

設完**這次需要 server 重啟**。

### 6. 設 Desktop policy（給 client 端）

client 端用 desktop policy → Custom Settings → Notes.ini tab 設：

| Ini key | 設成 |
|---|---|
| `DISABLE_MANDATED_ENCRYPTION` | `0` |
| `DISABLE_OUTBOUND_MANDATED_ENCRYPTION` | `0` |

這兩個是「退出 mandate」開關 — 設 `0` 表示「不退出、要遵守 mandate」。**保留這兩個 ini 在 desktop policy 裡很重要** — 萬一 client 啟用後出大問題，遠端把 desktop policy 改成 `1` 就能讓那台 client 退出 mandate，不必親跑去現場改。

### 7. 啟用 logging（先進觀察期）

進 Directory Profile → Security tab → 把 mandated port encryption 的 **logging 啟用**，但**先不要 enforce**。

這時 server view 對應 server 的 icon 會從 `?` 變成「狀態評估中」icon。

### 8. 跑 `portenc refresh`

primary admin server 的 console 跑：

```
portenc refresh
```

更新所有 server 的 mandate 設定 cache、跑一次合規檢查。驗證結果用：

```
portenc show
```

看每台 server 目前在哪個狀態。

### 9. 觀察數天

logging mode 期間，看 log（前面 ini 啟用的那些 debug entries）有沒有「會被 mandate 斷掉」的連線。**典型踩雷**：

- 某台老 server 跑 R9 client 連進來、不接受加密 → log 會記下，但連線還會通（因為還沒 enforce）
- 某個 partition 設定誤配 → 會看到不預期的 plaintext 連線

把這些先處理掉再進步驟 10。

### 10. 啟用 enforce

確認 logging 觀察期沒有意外，回 Directory Profile 把設定改成「**Enforce port encryption mandate**」、再跑一次 `portenc refresh`。

server view 的 icon 會變成「強制中」狀態。從這刻起，不接受加密的連線會被斷掉。

## 啟用後出問題的退路

如果 enforce 後出包（某個重要 client 連不上、某台 partner server 突然 cluster fail）：

| 緊急程度 | 退路 |
|---|---|
| **快速回退**（domain 級） | Directory Profile 把 mandate 改回 logging-only（保留紀錄），跑 `portenc refresh` |
| **特定 server / client**（局部） | 把該 server 加進步驟 3 的例外群組、或把那台 client 的 desktop policy 改 `DISABLE_MANDATED_ENCRYPTION=1` |
| **完全退出** | Directory Profile 把整個 mandate 設定關掉，server view 上對應 icon 會變回 `?` |

預先把退路想好、寫進升級 runbook，比啟用當天才查文件來得從容。

## 常被忽略的細節

- **`CheckPortEncryption` agent 沒簽 → 整個機制不會作用** — 但不會噴錯。Admin 啟用了 logging、跑了 refresh，但 server view 的 icon 都不變，一查才發現是 agent 沒簽。先檢查 agent 設定是 debug 第一站
- **MANDATEDENC_ACTIVE_REFRESH_TIME 預設 24 小時很長** — 觀察期想加速 iteration 可以調短到例如 300 秒（5 分鐘）
- **Pre-14.5 server 上的設定改動是透過 ini，不是 server 配置 doc** — 這支 agent 直接寫 `PORT_ENC_ADV` 進 notes.ini

## 結論

Mandated Port Encryption 的啟用本身**不複雜，但步驟多** — 10 步少做一步（特別是步驟 2 的 agent 簽署）就會「看似啟用了、其實沒效果」。建議：

1. **抄一份 runbook**：把這 10 步驟跟 ini 名稱、指令、退路都寫進升級文件
2. **logging 觀察期至少 1 週**：看遍 weekly cron / monthly batch 都跑過再 enforce
3. **退路先準備好** — `DISABLE_MANDATED_ENCRYPTION=1` 走 desktop policy 是 client 端最快的緊急閥

跟 [5/10 NotesHTTPRequest trust store 改動](/domino-news/posts/notes-httprequest-14-5-trust-store) 一起看 — 那篇是「對外 HTTPS 的信任 store」搬家，這篇是「內部 NRPC 的加密強制」上線。兩個都做才完整。
