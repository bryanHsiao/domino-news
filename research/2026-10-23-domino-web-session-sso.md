---
slug: domino-web-session-sso
title: "Domino web 認證:basic vs session、single vs multi-server SSO、Web SSO Configuration、開 Internet Sites 停用 SSO"
lang: [zh-TW, en]
pubDate: 2026-10-23
status: Path A staged（_pending，排 2026-10-23，未來日期→cron 自動 promote）
tags: [Domino Server, Admin, Security]（TYPE 留白：概念解說）
requester: 使用者「寫20~26的文章」；20~26「伺服器子系統」cluster 第 4 篇;接 10/22(session auth 在 Web Site 的 Domino Web Engine 分頁)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）+ humanizer-zh-tw（自審）
created: 2026-10-20
updated: 2026-10-20
---

# 研究軌跡 — domino-web-session-sso

admin web 認證子系統型。grep 確認 LTPA/web SSO/session auth 近乎零覆蓋(≈2 皆順帶提)。接 10/22:session auth 設在 Web Site 的 Domino Web Engine 分頁;且「開 Internet Sites 自動停用 SSO」直接扣回 10/22。

## 核心（官方 WebFetch）

- multi-server-sso（12.0.0）:「the authentication token...sent to the browser in a cookie」;瀏覽器要接受 cookie;cookie 的 DNS domain 要跟 server URL 相符、cookie 不能跨 TCP/IP domain;「log in once to a Domino or WebSphere server」;Web SSO Configuration domain-wide、複寫到所有參與伺服器、「contains a shared secret key used by servers for verifying user credentials」;匯 WebSphere key「you cannot specify an SSO idle timeout」;**「any existing SSO configuration is automatically disabled」當 Server 文件啟用 Internet Sites**;「Multi-servers (SSO)」在 Web Site 或 Server 文件設。
- setting-up-session-auth（10.0.1）:Disabled / Single Server / Multiple Servers 模式。
- creating-web-sso（9.0.1）:DNS domain 以句點開頭(.example.com)、只能列 Domino 伺服器、所有 SSO 伺服器同一種 Internet-access 方式、LTPA realm 一致、跨 domain 匯同一 WebSphere token。

## 措辭守則

- LtpaToken 這個 cookie 實際名稱官方該頁未給 → **不硬掛 LtpaToken 名稱**,只說「token 放進 cookie / LTPA token」(避免過度宣稱)。✓ 本文已如此。
- basic vs session 的比較在另一頁(session-based name-and-password),本文簡述方向正確、未硬引該頁逐字。
- 「開 Internet Sites 自動停用 SSO」方向別反——是「停用既有 SSO」。

## 站上互連

- 前接 10/22 Internet Site(session auth 位置＋自動停用 SSO 的雷,hook＋兩處)。

## 標題候選

- [選定]:`Domino web 登入怎麼運作:basic vs session 認證、單機 vs 多機 SSO、那把 shared secret,以及切到 Internet Sites 會自動停用 SSO 的雷`
  en：`How Domino Web Login Works: Basic vs Session Authentication, Single- vs Multi-Server SSO, the Shared Secret, and the Trap Where Enabling Internet Sites Disables SSO`

## 查證 checklist

- [x] basic vs session(token 入 cookie 逐字、要接受 cookie)
- [x] 三模式 Disabled/Single/Multiple
- [x] single cookie 限本機、multi「log in once」同 DNS domain
- [x] Web SSO Configuration domain-wide/複寫/shared secret(逐字)
- [x] 硬條件:DNS domain 句點開頭、FQDN、cookie 不跨 TCP/IP domain、只列 Domino、同一 Internet-access 方式
- [x] 開 Internet Sites 自動停用 SSO(逐字)
- [x] WebSphere/LTPA:匯 key 無 idle timeout、realm 一致、跨 domain 匯同一 token
- [x] 未硬掛 LtpaToken cookie 實際名稱(官方該頁未給)
- [x] inline-link diversity：3 相異官方 URL 各 33%；每語 3 外部
- [x] TYPE 留白；tags Domino Server + Admin + Security
- [x] 雙語 temp-build 通過
- [x] humanizer 自審（實戰語氣、無宣傳套話,未強改）
- [x] fact-check（獨立 subagent）→ **七條全對、零事實錯誤**。逐字命中:「the authentication token...sent to the browser in a cookie」、「log in once to a Domino or WebSphere server」、「Groups, wildcards, and the names of WebSphere servers are not allowed」、「They must either all use Internet Site documents, or...Server document」、「any existing SSO configuration is automatically disabled」、「Websphere cannot use Domino LTPA tokens」、「you cannot specify an SSO idle timeout」、「realm must be the same for all participating servers」。三處措辭已收斂:
  - ①basic auth「彈窗/每次重送」是 HTTP Basic 一般行為、非 Domino 官方原文(官方只說 challenge/response)→ 改標「官方描述為 challenge/response 協定;以 HTTP Basic 標準行為來說…」,不掛成官方說法。
  - ②多份 Web SSO 文件:官方說「limited circumstances」+每份要 unique name → 改掉原「不是所有協定都認得多份」。
  - ③跨 domain:官方 9.0.1 用詞「same key information」→ 補該用詞,匯 token 標為具體作法。
  - 另:session auth 欄位 Web Site 與 Server 文件(Domino Web Engine 分頁)都有 ✓。

## NotebookLM 說明（CLAUDE.md 研究鏈揭露）

admin/security 網域;NotebookLM 本 session 不可用;官方 HCL 文件 WebFetch 為據(fallback、已揭露)。官方頁 WebFetch/WebSearch 驗證非 404。

## 異動日誌

- 2026-10-20 新建（排 2026-10-23）。cluster 第 4 篇;官方三文為據;humanizer 自審;Path A staged。（Opus 4.8）
