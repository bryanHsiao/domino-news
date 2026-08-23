---
title: "Domino REST API 上線前：安全模型、rich text 單向、CORS 與 admin port"
description: "系列收尾。你已經會認證、開 scope、CRUD、查詢了；把它交給真實使用者之前，Domino 開發者最該問兩件事：它會不會繞過我的 Readers 欄位安全？以及上正式環境會踩到什麼。答案：DRAPI 是分層安全（JWT + scope + 底層 Domino 的 ACL/Readers 照算），不會漏；但有幾個很實在的限制——rich text 只能單向轉出、沒配置的欄位碰不到、同名 form/view 選哪個沒保證——加上 CORS、port 這些上線前要收的口。DRAPI 系列第六篇（完結）。"
pubDate: 2026-08-24T07:30:00+08:00
lang: zh-TW
slug: domino-rest-api-security-limits
tags:
  - "Domino REST API"
  - "Security"
  - "DevOps"
sources:
  - title: "Domino REST API — Security"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/security/index.html"
  - title: "Domino REST API — Limitations"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/limitation.html"
  - title: "Domino REST API — Troubleshooting"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/troubleshooting.html"
---

這是 DRAPI 系列的最後一篇。前五篇你已經走完：[概觀](/domino-news/posts/domino-rest-api-getting-started)、[認證](/domino-news/posts/domino-rest-api-auth)、[scope/schema](/domino-news/posts/domino-rest-api-scope-schema)、[文件 CRUD](/domino-news/posts/domino-rest-api-document-crud)、[DQL 查詢](/domino-news/posts/domino-rest-api-query-dql)。功能都通了，但把它交給真實使用者之前，Domino 開發者心裡通常有兩個問號：

1. **它會不會繞過我辛苦設的 Readers 欄位安全，把不該看的文件漏出去？**
2. **上正式環境，會踩到什麼？**

這一篇就回答這兩題。

---

## 重點摘要

- **不會漏**：DRAPI 是分層安全——[JWT](/domino-news/posts/domino-rest-api-auth)（官方說「All Domino REST API access is authorized using a signed JWT claim」、且「No anonymous access is granted for REST data」）、scope（只有管理員設定過的庫才對外），而**底層 Domino 的 ACL 與 Readers／Authors 欄位照算**。
- **secure-by-default**：官方明講「Databases aren't automatically exposed on REST when you run Domino REST API. Only the ones configured by the administrators」。
- **rich text 是單向的**：官方說 rich text 會轉成 HTML/MIME 出去，但**不會**把 MIME 轉回 rich text。
- **沒配置的欄位碰不到、item 不存在就不回傳**——「absent ≠ empty」的老規矩在 REST 這端一樣成立。
- **上線前要收的口**：CORS 設定、把 admin 用的 port（console 8889、metrics 8890、health 8886）鎖好，別跟資料 port 8880 一起裸奔。

---

## 一、它會不會漏掉 Readers 保護的文件？

這是 Domino 開發者對任何「把 NSF 開上網」的東西最先問、也最該問的一題。答案是：**不會——只要你沒把安全自己拆掉**。DRAPI 的安全是**疊起來的三層**：

1. **JWT**：[官方](https://opensource.hcltechsw.com/Domino-rest-api/references/security/index.html)說「All Domino REST API access is authorized using a signed JWT claim」，而且「No anonymous access is granted for REST data」——沒有匿名存取，每個請求都得帶一個簽章過的 token。
2. **scope**：官方明講「Databases aren't automatically exposed on REST when you run Domino REST API. Only the ones configured by the administrators」——沒被設定的庫，REST 這端根本看不到。
3. **Domino 自己的文件層安全**：這是關鍵。你 JWT 的 `sub` 是一個 Domino 名稱（第二篇講過），DRAPI 就是**以那個 Domino 使用者的身分**去讀資料——所以那個 NSF 的 **ACL、Readers／Authors 欄位一樣在算**。一個只被授權看 A 群文件的使用者，透過 REST（不管是 CRUD、`/lists` 還是 DQL）也只拿得到 A 群；Readers 欄位擋掉的，REST 這端一樣拿不到。

換句話說，DRAPI 沒有另立一套安全去繞過 Domino，而是**疊在 Domino 既有的安全模型之上**。這也是為什麼前面第三篇會說「三層一起算」——scope 決定門開不開，Domino 的 ACL/Readers 決定門後面你這個人到底看得到什麼。

（站上[更早那篇 RAG webinar 筆記](/domino-news/posts/openntf-domino-iq-rag-webinar)提過一個相關教訓：Domino IQ 的 RAG 也遵守 Readers 欄位——但那個功能是到 2026 FP1 才真正修好。文件層安全「有沒有被尊重」值得你在自己的環境實測確認，不要只憑文件。）

## 二、幾個很實在的限制

功能通、安全也在，但有幾個限制最好在設計階段就知道，別上線才發現：

- **rich text 只能單向轉出**。[官方](https://opensource.hcltechsw.com/Domino-rest-api/references/limitation.html)寫得很白：「The Domino REST API translates Rich Text to HTML/MIME. This is one way. The Domino REST API doesn't translate MIME back to Rich Text.」——你讀一個 rich text 欄位，拿到的是 HTML/MIME；但你**不能**用同樣的路把 rich text 寫回去。要處理富文本的雙向編輯，這是個硬限制。
- **只有配置過的欄位能碰**：「Only configured fields can be created, read, or updated.」沒放進 schema／KeepConfig 的欄位，就算文件上真的有，REST 這端也存取不到。
- **item 不存在就不回傳**：「If an item doesn't exist in a document, it doesn't get returned.」——所以回來的 JSON 裡少了某個鍵，可能是「這份文件沒這個欄位」，不是「值是空的」。這跟 Java 那端 `getItemValue` 的「absent ≠ empty」是同一個老規矩。
- **同名 form／view 選哪個沒保證**：「When you have multiple views with the same name, the Admin UI selects the first one found.」——庫裡有同名設計元件時，別假設它挑的是你以為的那個。

## 三、上線前要收的口

- **CORS**：你的前端多半跑在別的網域，瀏覽器會擋跨來源請求。DRAPI 的 [troubleshooting](https://opensource.hcltechsw.com/Domino-rest-api/references/troubleshooting.html) 把 CORS 列為存取 Admin UI／打 API 時的常見錯誤——上線前要把允許的來源設對。
- **鎖 admin port**：資料走 8880，但 console（8889）、metrics（8890）、health check（8886）這些管理／監控 port（第二篇 functional accounts 那段提過）不該對外裸奔，正式環境要用防火牆收好。
- **其他運維常客**：啟動時 `Address already in use`（port 撞了）、`OutOfMemoryError`（Java heap 不夠）、`keepconfig.d` 裡的 JSON 打錯——這些 troubleshooting 頁都列了，部署時心裡有個底。

## 系列回顧：看到 X，通常是 Y

六篇走下來，把最會踩的坑收成一張對照表：

| 症狀 | 通常是 |
|---|---|
| 呼叫回 401 | token 過期，或 server 重啟換了簽章金鑰（[第二篇](/domino-news/posts/domino-rest-api-auth)） |
| 有 token 卻被擋 | 你的 scope 不在 token 裡，或 Domino ACL／Readers 擋下（[第三篇](/domino-news/posts/domino-rest-api-scope-schema)） |
| DQL 沒寫錯卻查不到 | 那個 form 少了 `dql` mode（[第五篇](/domino-news/posts/domino-rest-api-query-dql)） |
| rich text 寫不回去 | 那是單向轉換，設計上就不支援（本篇） |
| 瀏覽器前端打不通 | CORS 沒設對（本篇） |

DRAPI 把一個 NSF 變成一組現代、標準、語言無關的 REST API——但它不是把 Domino 的安全與規矩丟掉，而是**疊在上面**。搞懂這六篇，你就能把手上的 NSF 乾淨、安全地開出去。系列完結。
