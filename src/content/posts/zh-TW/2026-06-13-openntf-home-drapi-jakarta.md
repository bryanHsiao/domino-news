---
title: "OpenNTF 把首頁 app 搬出 Domino：純靠 DRAPI 跑在 Open Liberty 上"
description: "Jesse Gallagher 把 OpenNTF 的首頁 app 從 XPages 改寫成 Jakarta EE，資料層完全走 DRAPI（Domino REST API），最後把它打包成 WAR、部署到 Open Liberty — 跑在 Domino 之外。這件事的意義不是「又一個改寫」，而是它驗證了一條路：為 Domino 寫的 Jakarta EE app 可以是可攜的，資料留在 NSF、執行環境卻不綁 Domino。本文整理他做了什麼、技術堆疊、為什麼值得關注，以及他自己點出的幾個還很粗糙的地方。"
pubDate: 2026-06-13T07:30:00+08:00
lang: zh-TW
slug: openntf-home-drapi-jakarta
tags:
  - "Domino"
  - "DRAPI"
  - "OpenNTF"
sources:
  - title: "Running the New OpenNTF Home With DRAPI — Jesse Gallagher (frostillic.us)"
    url: "https://frostillic.us/blog/posts/2026/5/13/running-the-new-openntf-home-outside-domino"
  - title: "OpenNTF"
    url: "https://www.openntf.org/"
  - title: "HCL Domino REST API Documentation"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/index.html"
relatedJava: []
relatedSsjs: []
---

Domino 開發者大概都被問過這個問題：你的 app 是不是被鎖死在 NSF 裡、離開 Domino 就動不了？2026 年 5 月，[Jesse Gallagher 在他的 blog 上](https://frostillic.us/blog/posts/2026/5/13/running-the-new-openntf-home-outside-domino)給了一個很具體的反例 —— 他把 [OpenNTF](https://www.openntf.org/) 的新首頁 app，整包搬到 Domino **之外**跑。

資料還是在 Domino 裡，但這支 app 本身是一個標準的 Jakarta EE 應用，跑在 Open Liberty 這個一般的 Java 應用伺服器上，透過 DRAPI[^drapi] 存取 Domino 的資料。換句話說：**資料留在 NSF、執行環境卻完全不綁 Domino。**

這件事值得寫，不是因為「又有人改寫了一個 app」，而是因為它把一條一直被講、但很少被完整走通的路 —— 「Domino 當資料後端、前端跑在別的地方」 —— 真的端到端跑起來了。

## 發生了什麼事

OpenNTF 的首頁本來是 XPages app。Jesse 把它改寫成 Jakarta EE 版本，當作一個「示範可攜 Java 程式」的測試場。關鍵動作是最後那一步：他把 NSF 裡的程式抽出來、打包成 Maven 的 WAR[^war] 檔，部署到 Open Liberty —— 一個跟 Domino 完全無關的 Java 伺服器。

能這樣搬的前提，是它的資料層走 DRAPI。app 不直接碰 NSF、不靠 Domino 的 Java runtime，而是把 Domino 當成一個 REST 資料來源來呼叫。這也是為什麼換掉執行環境後，資料端不用大改。

## 技術堆疊

| 層 | 用了什麼 |
|---|---|
| 應用框架 | Jakarta EE — Jakarta Pages、Servlet、REST、MVC 等標準 spec |
| 執行環境 | Open Liberty（標準 Java 應用伺服器） |
| 資料層 | DRAPI（Keep）當 NoSQL 資料來源 |
| 資料存取 | 自製的 Jakarta NoSQL[^jnosql] driver，對應到 DRAPI 端點（用 OpenAPI Generator 產生） |
| 認證 | Jakarta Security + OIDC[^oidc] |
| 授權 | JWT[^jwt] token；匿名使用者用自簽 token 取得唯讀存取 |

Jesse 形容這堆東西大多「就是同一套 specs」—— 因為 Jakarta EE 是標準規格，同一份程式換個合規的伺服器就能跑，這正是可攜性的來源。

## 為什麼這件事重要

對長期投資 DRAPI 的人來說，這是一個很有份量的訊號：**為 Domino 寫的 Jakarta EE app，可以是真正可攜的。** 同一份程式碼，可以在 Domino 內建的 Jakarta EE 支援上跑、也可以搬到 Open Liberty 上跑，靠的是標準 spec + DRAPI 這層抽象。

它也呼應了站上先前那條線 —— 從 [DRAPI 的 quickstart](/domino-news/posts/hcl-domino-rest-api-quickstart/) 到 [DRAPI 走 Keycloak OIDC 登入](/domino-news/posts/drapi-keycloak-oidc/) —— 一路講的都是「把 Domino 當現代 REST 後端」。這次是把同一個概念推到極致：連執行環境都拔掉 Domino。對想逐步把前端現代化、又不想丟掉 NSF 裡多年資料的團隊，這條路第一次有了完整、可參考的實作。

## 還很粗糙的地方

Jesse 自己很誠實地點出幾個現階段的限制，值得照抄下來提醒自己：

- **DRAPI 沒有暴露 replica ID 等 Domino 專屬屬性** —— 有些只有 NSF 才有的概念，REST 層拿不到。
- **app 的資料模型要跟 DRAPI 的 schema 持續同步** —— 兩邊的定義得自己維持一致，改了一邊要記得改另一邊。
- **認證若依賴 server 端的 OIDC 設定，可攜性就打折** —— 設定綁在伺服器上時，「換台機器就能跑」這個賣點會弱掉。

換句話說，這是一個強而有力的**概念驗證**，不是一個「拿去就能上 production」的範本。但它把可行性確立了。

## 對你的意義

如果你正在評估 DRAPI、或在想「Domino 的下一步前端長怎樣」，這篇實作很值得讀原文（連結見本文開頭）。它的價值在於：把「Domino 資料 + 非 Domino 執行環境」從一句口號，變成一個跑得起來、缺點也都攤開講的真實案例。DRAPI 本身的能力範圍，可對照 [HCL 官方文件](https://opensource.hcltechsw.com/Domino-rest-api/index.html)。

[^drapi]: DRAPI = Domino REST API，HCL 為 Domino 提供的現代 REST 介面，讓外部程式用標準 HTTP/JSON 存取 NSF 資料。
[^war]: WAR = Web Application Archive，Java 世界的標準 web 應用打包格式，可部署到任何相容的 Java 應用伺服器。
[^jnosql]: Jakarta NoSQL 是 Jakarta EE 的 NoSQL 資料存取標準 spec，讓程式用統一介面接不同的 NoSQL 資料來源。
[^oidc]: OIDC = OpenID Connect，建立在 OAuth 2.0 上的標準身份驗證協定，現代 IdP（Keycloak、Azure AD、Okta 等）都支援。
[^jwt]: JWT = JSON Web Token，一種帶簽章、可自我驗證的 token 格式，常用來在服務之間傳遞身份與授權資訊。
