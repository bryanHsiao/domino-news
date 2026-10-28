---
slug: domino-inbound-smtp-relay-controls
title: "inbound SMTP 管制:四欄位、enforcement 範圍、DNSBL、反向 DNS"
lang: [zh-TW, en]
pubDate: 2026-10-31
status: Path A staged（_pending，排 2026-10-31，未來日→cron 自動 promote）
tags: [Domino Server, Admin, Security]（TYPE 留白）
requester: 使用者「寫27~11/2的文」；郵件管理 cluster 第 5 篇（郵件安全面）
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check）+ humanizer-zh-tw（自審）
created: 2026-10-28
updated: 2026-10-28
---

# 研究軌跡 — domino-inbound-smtp-relay-controls

郵件管理 cluster 第 5 篇（安全面）。grep 確認 inbound relay/DNSBL/open relay 無專文。核心賣點=「別當 open relay」。

## 核心（官方 WebFetch）

- setting-inbound-relay（11.0.1）:SMTP Inbound Controls 分頁;四欄位(Allow/Deny × 目的網域/來源主機);* 用法;allow 優先於衝突 deny、同筆 deny 贏、空 allow=不限;查 original sender not just last hop。
- specifying-enforcement（10.0.1）:預設只對 local 網域外主機、認證使用者預設豁免、可改、relax 不建議;選項 external/all/none。
- enabling-dnsbl（10.0.1）:每連線查 DNSBL、動作 log only/log and tag/log and reject;只對受 relay 管制的主機。
- 補:私有黑名單/DNS 白名單只對受管制主機;反向 DNS PTR,解不到(DNS 不通/無 PTR)不收。

## 措辭守則

- allow/deny 規則:allow 優先於「衝突」deny,但「同筆」在兩邊 deny 贏——兩句都要寫、別只寫一半。
- 預設擋外部 relay——這是賣點、別寫反。
- DNSBL 三動作名稱照官方;只對受 relay 管制主機(豁免的不會被擋)。
- open relay 定義照官方「indiscriminately...outside local domain...another external destination」。

## 站上互連

- 鬆連 10/20 mail 路由（SMTP inbound listener）、10/28 mail rules（同 Restrictions and Controls 區）。正文未硬塞（diversity 用官方 3 URL 已足）。

## 標題候選

- [選定] 一句警示:`別讓 Domino 變成 open relay:inbound SMTP 管制`
  en：`Don't Let Domino Become an Open Relay: Inbound SMTP Controls`

## 查證 checklist

- [x] open relay 定義、預設擋外部 relay、SMTP Inbound Controls 分頁
- [x] 四欄位 + * 用法
- [x] allow 優先/同筆 deny 贏/空 allow 不限
- [x] 查 original sender
- [x] enforcement 預設範圍、認證豁免、relax 不建議
- [x] DNSBL 三動作、只對受管制主機、私有黑/白名單
- [x] 反向 DNS 無 PTR 不收
- [x] inline-link diversity：3 相異官方 URL 各 33%
- [x] TYPE 留白；tags Domino Server + Admin + Security
- [x] 雙語 temp-build 通過
- [x] humanizer 自審;標題精簡
- [x] fact-check（獨立 subagent）→ **七條全對、零錯誤**。逐字命中:open relay 定義、「By default, a new Domino SMTP server prevents external hosts from relaying mail to any destination」(非推論、有明文)、「the entry in the Allow field takes precedence」+「If the same entry appears in both an Allow and a Deny list, the Deny entry is honored」、「checks the original sender, not just the last hop domain」、enforcement 預設 External hosts、「Allow all authenticated users to relay (default)」、「relax enforcement entirely... (not recommended)」、DNSBL 三動作+「only on hosts that are subject to relay checks」。三處精修已補:
  - ①DNSBL **只查 IPv4**、IPv6 跳過 → 加一句。
  - ②反向 DNS「Verify connecting host name in DNS」**預設關**、拒收在 `MAIL FROM` 階段(非斷線)、官方警告合法主機不一定有 PTR 可能誤殺 → 雙語重寫該 bullet。

## NotebookLM 說明

admin/security 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據（fallback、已揭露）。

## 異動日誌

- 2026-10-28 新建（排 2026-10-31）。郵件管理 cluster 第 5 篇;官方三文為據;humanizer 自審;標題精簡;Path A staged。（Opus 4.8）
