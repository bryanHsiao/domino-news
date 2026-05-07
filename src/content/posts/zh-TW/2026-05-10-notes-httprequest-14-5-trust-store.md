---
title: "Domino 14.5 NotesHTTPRequest 換了預設信任 CA 來源 — 升級前該知道的細節"
description: "Domino 14.5 起，server 端 LotusScript 跑 NotesHTTPRequest 時，預設從 Domino Directory 拿信任的 root CA，不再讀 data 目錄裡的 cacerts.pem。Notes client 不受影響、有 NotesHTTPRequest_Use_CACerts=1 這個 .ini 後門可以暫時退回舊行為，但長期該把自簽 CA 匯到 Domino Directory。本文整理這個改動的細節、影響範圍、過渡步驟，跟 5/7 那篇 NotesHTTPRequest 工具鏈深度文一起看。"
pubDate: 2026-05-10T07:30:00+08:00
lang: zh-TW
slug: notes-httprequest-14-5-trust-store
tags:
  - "LotusScript"
  - "Security"
  - "Release Notes"
sources:
  - title: "A LotusScript NotesHTTPRequest Change in Domino 14.5 You Should Know — Daniel Nashed (blog.nashcom.de, 2025-08-26)"
    url: "https://blog.nashcom.de/nashcomblog.nsf/dx/a-lotusscript-noteshttprequest-change-in-domino-14.5-you-should-know.htm"
  - title: "What's new in Domino 14.5 — Security features (HCL admin docs)"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html"
  - title: "NotesHTTPRequest class (LotusScript) — HCL Domino 14.0 Designer Help"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTES_HTTPREQUEST_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-httprequest-14-5-trust-store.png"
coverStyle: "low-poly-3d"
---

## TL;DR

Domino 14.5 起，**server 端 LotusScript 跑 [`NotesHTTPRequest`](https://help.hcl-software.com/dom_designer/14.0.0/basic/H_NOTES_HTTPREQUEST_CLASS.html) 時，預設從 Domino Directory 拿信任的 root CA**，不再讀 data 目錄裡的 `cacerts.pem`。Notes client 沒變。如果你環境裡有自簽 CA 沒匯進 Domino Directory，14.5 升級當天 LS 的 HTTPS 呼叫就會 cert verify 失敗。

懶得遷的人 `notes.ini` 加：

```
NotesHTTPRequest_Use_CACerts=1
```

退回舊行為（讀 `cacerts.pem`）。

## 改動細節

[Daniel Nashed 在 2025 年 8 月寫了篇 blog](https://blog.nashcom.de/nashcomblog.nsf/dx/a-lotusscript-noteshttprequest-change-in-domino-14.5-you-should-know.htm) 把這個 14.5 改動講得很清楚 — 我整理成表格：

| 項目 | 14.5 之前 | 14.5 起（預設） |
| --- | --- | --- |
| 預設 root CA 來源 | data dir/`cacerts.pem` | Domino Directory（server 端） |
| Notes client 行為 | 不受影響 | 不受影響 |
| 退回舊行為 | n/a | `notes.ini` 加 `NotesHTTPRequest_Use_CACerts=1` |
| 範圍 | LotusScript NotesHTTPRequest | LotusScript NotesHTTPRequest |

依 [HCL 14.5 安全功能 release note](https://help.hcl-software.com/domino/14.5.0/admin/wn_145_security_features.html)，14.5 把 trusted CA 集中到 directory — 跟 `certstore.nsf`、TLS internet site 同一個管理面板的方向一致。

## 為什麼要改

`cacerts.pem` 是 server 上的本機檔案 — 多台 Domino server 環境每台都要 sync 是維運痛點。改用 Domino Directory 集中管理後：

- 變更走 server document、跟著 directory replication 自動散到所有 server
- 跟 `certstore.nsf` / TLS internet site doc 同一個管理面板
- 不用再 ssh 上每台 server 改檔案、確認 hash 一致

這個方向確實是「對的方向」（原 blog 用語） — 跟近幾年 HCL 把 ID file、TLS、credential、CA 統統往 directory / `certstore.nsf` 集中的整體 roadmap 對得上。

## 升級 14.5 前要做什麼

依序：

1. **盤點現有 `cacerts.pem`** — 看有沒有「不在 Domino 預設 CA 集合裡」的自簽 / 私有企業 CA
2. **匯到 Domino Directory** — 用 Domino Administrator client 的 Trusted Roots 介面，或建對應的 trusted-CA document（依 14.5 admin 文件指引）
3. **驗證** — 跑一次有 HTTPS NotesHTTPRequest 的 agent，確認 cert verify 通過
4. **還沒準備好遷的話** — 暫時 `NotesHTTPRequest_Use_CACerts=1` 撐著，把遷移當技術債列入下次 server upgrade window

## 跟 5/7 那篇深度文的關係

[5/7 那篇 NotesHTTPRequest + NotesJSONNavigator 工具鏈](/domino-news/posts/lotusscript-http-json) 講的是內建 LS 工具鏈的全貌 — 那篇所有範例在 14.5 上跑都還會 work，但**目標 endpoint 用自簽 CA** 時就會撞到這個改動。實務上分兩類：

- **公司內部 API、staging、self-hosted 服務**通常用自簽 CA → **升 14.5 前先把 root cert 匯到 Domino Directory**，否則 agent 會 silently 502
- **公開 API**（OpenAI、銀行 API、政府 API）走公認 CA → 不受影響，因為公認 CA 在 Domino 預設 CA 集合裡

## What about Java and SSJS?

Java agent 跟 XPages SSJS 走的是 **JVM 自己的 trust store**（`cacerts` keystore，位於 `$JAVA_HOME/jre/lib/security/`），跟 LotusScript NotesHTTPRequest 是完全獨立的 trust path — Java 端**完全不受 14.5 這個改動影響**。

| 環境 | trust store 在哪 |
| --- | --- |
| LotusScript NotesHTTPRequest（≤ 14.0，server） | data dir 的 `cacerts.pem` |
| LotusScript NotesHTTPRequest（14.5+ 預設，server） | Domino Directory |
| LotusScript NotesHTTPRequest（Notes client，all） | client 端 keystore（不受 14.5 改動影響） |
| Java agent / SSJS | JVM `cacerts` KeyStore |

也就是同一台 Domino server 上，LS HTTPRequest 跟 Java 拿到的 trusted CA 集合是**兩條獨立配置**。要全平台統一信任某個自簽 CA，兩邊都得設。

## 結論

14.5 把 NotesHTTPRequest server-side trust store 從 file-based 改成 directory-based 是好事 — multi-server 環境終於不用每台 sync `cacerts.pem`。但**升級前一定要把自簽 CA 匯到 Domino Directory**，否則跑 [`NotesHTTPRequest`](/domino-news/posts/lotusscript-http-json) 的 agent 會在你最不想壞的時機壞掉。`NotesHTTPRequest_Use_CACerts=1` 可以暫時退回舊行為當救援用，但長期該照新方式遷。
