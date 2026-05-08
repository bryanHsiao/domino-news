---
title: "Domino 14.5 那個 `?` icon 在說什麼 — Mandated NRPC Port Encryption 概念與啟用模式"
description: "升級到 Domino 14.5 後，Domino Directory 的 server view 最右欄會出現 `?` 圖示 — 不是 bug，是新功能 Mandated NRPC Port Encryption（強制端口加密）的合規狀態。本文整理：NRPC port encryption 的歷史、14.5 新增了什麼、`?` / 鎖頭等狀態 icon 怎麼解讀、預設行為跟三種啟用模式的差別。實務啟用步驟見隔日續篇。"
pubDate: 2026-05-11T07:30:00+08:00
lang: zh-TW
slug: mandated-port-encryption
tags:
  - "Security"
  - "Release Notes"
sources:
  - title: "Domino 14.5: Domino ディレクトリのサーバービューに「?」アイコンが表示される (KB0127764) — HCL Software Support"
    url: "https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0127764"
  - title: "What's new in Domino 14.5 — Security features (HCL admin docs)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html"
  - title: "Mandating level of port encryption — HCL Domino 14.5 Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption.html"
relatedJava: []
relatedSsjs: []
---

## 升級 14.5 後看到的 `?` icon

升級到 Domino 14.5 之後第一次打開 Domino Directory（`names.nsf`）的 [Server] - [Server] view，admin 會發現**最右邊出現了一欄、每筆 server document 上是「?」（unknown.png）圖示**。

[HCL 日文 KB0127764](https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0127764) 直接解答：這個 `?` 不是 bug、不是 error，是 14.5 新增的「**Mandated NRPC Port Encryption（強制 NRPC 端口加密）**」功能的合規狀態指示。`?` = 「功能停用、判定未跑、結果未知」。

## 先補一點背景：NRPC port encryption 一直都有

NRPC（Notes Remote Procedure Call）是 Domino server 之間、Notes client 連 server 都在跑的通訊協議。「**NRPC port encryption**」這件事本身在 Domino 早就存在很多版本了 — 你可以在 server document 的 Ports → Notes Network Ports → 設 `Encrypt network data` 來打開特定 port 的加密。

但 14.5 之前是「**雙方協商**」式：

- 兩邊都同意加密 → 加密
- 只有一邊要加密、另一邊不要 → **不加密**（為了相容性退讓）

這在合規 / 安全要求嚴格的環境很尷尬 — 你 server A 設好了，但只要 client / server B 沒設，連線就降級成明文。Admin 沒有「我這邊絕對要加密、你不接受就斷線」這種強制權。

14.5 把這個盲點補上。

## 14.5 新增：mandate + monitor

依 [14.5 安全功能 release note](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html)，這個功能做兩件事：

| 面向 | 做什麼 |
|---|---|
| **Mandate（強制）** | 一旦在 Directory Profile 設成「強制」，本端 14.5 server / client 對所有 authenticated NRPC session 都會要求加密 — 對方不接受就連不上 |
| **Monitor（監控）** | 不啟用強制、只先啟用 logging，可以先觀察「哪些連線目前是明文、啟用強制後會被斷掉」 — 給 admin 一個過渡期評估 |

也就是說 admin 可以走「**先看 → 再強制**」的安全升級流程，而不是「啟用後祈禱沒事」。

## `?` icon 是其中一個狀態，還有別的

[HCL Mandated Port Encryption 官方頁](https://help.hcl-software.com/domino/14.5.0/admin/mandated_port_encryption.html)說明這欄是合規狀態欄，依設定狀態顯示不同 icon。實務上 admin 會遇到的：

| 狀態 | icon | 意思 |
|---|---|---|
| 未啟用 | `?`（unknown） | 功能還是預設停用 — server 沒跑判定，狀態未測定。「正常」狀態 |
| 啟用 logging（觀察期） | 鎖頭 / 變化中 icon | 已啟用、狀態評估中 |
| 啟用 mandate（強制期） | 啟用狀態 icon | 強制中 |

**所以 `?` 不需要急著「修」**。如果你不打算啟用這個功能，`?` 永遠停在那裡也完全 OK，不影響 server 運作。

## 三種啟用模式（也是建議的升級路徑）

| 模式 | Directory Profile 設定 | server view 欄位顯示 | 用途 |
|---|---|---|---|
| **未啟用**（預設） | logging level = 停用、mandate = 停用 | `?` | 14.5 升級後預設狀態 |
| **觀察期** | logging level = 啟用、mandate = 停用 | 狀態變化中 icon | 蒐集 connection 紀錄、看哪些連線會被影響 |
| **強制期** | logging + mandate 都啟用 | 啟用 icon | NRPC 加密被強制 — 不接受加密的客戶端會連不上 |

官方建議的順序：**先 logging、觀察數天確認沒影響、再 mandate**。直接跳到 mandate 是常見踩雷模式（連不上的 server 才會發現原來有 legacy 沒升）。

## 跟 5/10 那篇 trust store 的關係

[5/10 那篇 NotesHTTPRequest 14.5 trust store 改動](/domino-news/posts/notes-httprequest-14-5-trust-store) 跟這篇都是 14.5 安全強化，但**作用範圍是兩條完全獨立的 channel**：

| 主題 | 範圍 | 加密 / 信任的對象 |
|---|---|---|
| 5/10 trust store 改動 | LotusScript NotesHTTPRequest 對外打 HTTPS | TLS 對外連的 cert chain |
| 5/11 / 5/12 mandated port encryption | NRPC（client-server / server-server 內部通訊） | NRPC port 的對稱加密 |

兩個都該設、不能互相代替。

## 下一篇：實務啟用

本文聚焦在「`?` icon 是什麼」「為什麼 14.5 引入這個」「啟用後會看到什麼狀態」三個概念問題。明天的續篇 [Mandated Port Encryption 啟用實務](/domino-news/posts/mandated-port-encryption-enabling) 會把官方文件的 10 步驟拆開講：

- `CheckPortEncryption` 排程 agent 的作用（特別是它對 pre-14.5 server 的特殊處理）
- Directory Profile 的關鍵欄位
- Server ini（`DEBUG_MANDATED_ENCRYPTION`、`MANDATEDENC_ACTIVE_REFRESH_TIME` 等）
- Desktop policy（`DISABLE_MANDATED_ENCRYPTION` 等）
- `portenc refresh` / `portenc show` console 指令
- 啟用後出問題的退路

## 結論

如果今天只記三件事：

1. **14.5 升級後 server view 那個 `?` icon 不是 bug** — 是 Mandated Port Encryption 預設停用、未測定的正常狀態
2. **這個功能補上了 14.5 之前 NRPC encryption「雙方協商」的盲點** — admin 終於有「強制加密」的選項
3. **建議走「先 logging、再 mandate」過渡** — 直接 enforce 容易把 legacy 連線鎖出去

Admin 暫時不打算啟用？可以放著不管。打算啟用？看明天的實務篇。
