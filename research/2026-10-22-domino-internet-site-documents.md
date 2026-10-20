---
slug: domino-internet-site-documents
title: "Internet Site documents vs Server 文件:開關、6 協定、dynamic、all-or-nothing、port 留 Server 文件"
lang: [zh-TW, en]
pubDate: 2026-10-22
status: Path A staged（_pending，排 2026-10-22，未來日期→cron 自動 promote）
tags: [Domino Server, Admin]（TYPE 留白：概念解說）
requester: 使用者「寫20~26的文章」；20~26「伺服器子系統」cluster 第 3 篇;grep 確認 Internet Site/web site document 無專文
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-20
updated: 2026-10-20
---

# 研究軌跡 — domino-internet-site-documents

admin web 設定子系統型。切入點=「改了 web 設定沒生效,因為改錯地方(兩套來源)」。為 10/23 web 認證鋪路(session auth 在 Web Site 的 Domino Web Engine 分頁)。

## 核心（官方 WebFetch）

- understanding-internet-site（10.0.1）:兩套來源;開關「Load Internet configurations from Server\Internet Sites documents」決定讀哪套、關則 default to Server document;6 協定 Web/IMAP/POP3/SMTP Inbound/LDAP/IIOP;存 Domino Directory 可跨伺服器;「Modifications...are dynamic」免重啟;all-or-nothing「You must also use Internet site documents for all Internet protocols on that server」;留 Server 文件:TCP/IP port+status、SSL port+status(含 TCP→SSL redirect)、server access。
- hosting-web-sites（11.0.1）+ setting-up-web-server:Server 文件 Basics 開開關→save→restart;Config>Web>Internet Sites→Add→Web。
- configuring-web-site（12.0.0）:Basics(site name/org/host names)、「servers that host this site」沒列到不載、Configuration(HTTP methods)、Domino Web Engine(session auth)、Security。
- HTTP 啟動/重啟 console 印用 Internet Sites 還是 Server document。

## 措辭守則

- 兩個「重啟」要分清:切換總開關(Server 文件)要重啟;改 Site 文件內容 dynamic 免重啟——別混成一句。
- all-or-nothing 是「同一台、所有協定」——別寫成全網域。
- port/SSL/access 留 Server 文件——別讓讀者去 Web Site 文件找 port。

## 站上互連

- 前接:本 cluster(mail 10/20、AMgr 10/21)。
- 後接:10/23 web 認證(session auth 在 Web Site 的 Domino Web Engine 分頁)——正文已前向點名「下一篇專講」。

## 標題候選

- [選定] 痛點＋機制:`Domino 的 web 設定到底讀哪裡:Internet Site documents vs Server 文件,all-or-nothing,以及為什麼 port 還是留在 Server 文件`
  en：`Where Domino Reads Its Web Config: Internet Site Documents vs the Server Document, the All-or-Nothing Rule, and Why Ports Stay in the Server Document`

## 查證 checklist

- [x] 兩套來源、Basics 開關、關=default Server document、切換要重啟
- [x] 6 協定、Domino Directory、可跨伺服器
- [x] 改內容 dynamic 免重啟(逐字)
- [x] all-or-nothing(逐字)
- [x] Web Site document 分頁、host servers 欄位
- [x] port/SSL/access 留 Server 文件
- [x] HTTP 啟動 console 訊息
- [x] inline-link diversity：3 相異官方 URL 各 33%（understanding／hosting／configuring）;每語 3 外部(初稿 2、已補 1)
- [x] TYPE 留白；tags Domino Server + Admin
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ **八條全對、零事實錯誤**。逐字命中:6 協定「Web (HTTP), IMAP, POP3, SMTP Inbound, LDAP, and IIOP」、「Modifications to Internet site documents...are dynamic」、「you must also use Internet site documents for all Internet protocols on that server」、留 Server 文件三項(TCP/IP port、SSL port 含 TCP→SSL redirect、server access)、關則「the server defaults to Server document settings」。三點措辭提醒、初稿已安全處理、未改內容:
  - ①「虛擬伺服器」是 R5 舊稱、官方現用「Web Server Configurations」→ 本文已框為「早期稱/早期叫虛擬伺服器」✓。
  - ②Basics 欄位官方標籤為「Descriptive name for this site/Organization/Host names or addresses mapped to this site」→ 本文用描述性說法、語意相符(未硬引,可接受)。
  - ③console 訊息官方未給逐字字串、只說「會印、指出來源/檢視」→ 本文只描述存在、未編造字面 ✓。
  - 另:切總開關要重啟 vs 改 Site 文件 dynamic 免重啟,本文已明確分開(讀者最易混處)✓。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據(fallback、已揭露)。官方頁 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-20 新建（排 2026-10-22）。cluster 第 3 篇;官方三文為據;humanizer 自審;Path A staged。（Opus 4.8）
