---
title: "Domino REST API 的 scope 與 schema：一個 NSF 怎麼變成 REST 端點（而且預設什麼都不開）"
description: "把一個 NSF 開上 REST，不是打開開關就全部曝露。DRAPI 是 secure-by-default：你要先寫一份 schema（白名單，決定哪些 form、view、folder、agent、欄位對外），再建一個 scope（把 schema 活化成 REST mapping 的那層）。scope 的名字就是上一篇 JWT 裡 scopes claim 認的那個名字，而底下 Domino 的 ACL、Readers 欄位一樣還在算。這篇把 schema 與 scope 拆清楚。DRAPI 系列第三篇。"
pubDate: 2026-08-21T07:30:00+08:00
lang: zh-TW
slug: domino-rest-api-scope-schema
tags:
  - "Domino REST API"
  - "Security"
sources:
  - title: "Domino REST API — Schema components"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/schemacomponents/index.html"
  - title: "Domino REST API — Using the Domino REST API"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html"
  - title: "Domino REST API — How-to guides"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/howto/index.html"
cover: "/covers/domino-rest-api-scope-schema.webp"
coverStyle: "collage"
---

[第一篇](/domino-news/posts/domino-rest-api-getting-started)說過「一個 NSF 不會自動全部曝露成 REST」，[第二篇](/domino-news/posts/domino-rest-api-auth)的 JWT 裡帶了一個 `scopes` claim。這一篇把這兩件事接起來：一個原本只有 Notes client 看得到的 NSF，到底是**怎麼**變成一組 REST 端點的——答案是兩個東西：**schema** 和 **scope**。

最該先建立的觀念是：DRAPI 是 **secure-by-default**。你裝好、登入拿到 token，也**不會**因此就能打 NSF 裡的資料。什麼都不開，直到你明確地把某些東西**列進白名單**。

---

## 重點摘要

- **schema 是白名單**：一份決定「這個 NSF 裡哪些 form、view、folder、agent、欄位對外」的定義，用 JSON 描述、存在資料庫的 design 資源裡，在 Admin UI（官方稱 Schema and Scope Management UI）編、也能匯出成 JSON 檔。
- **scope 是啟用開關**：官方一句話——「Activate the schema by creating a scope (Rest mapping)」。scope 把 schema **活化**成真正可打的 REST mapping。
- **scope 有名字**，而那個名字，就是上一篇 JWT `scopes` claim 裡認的那個——[兩者是同一個東西](https://opensource.hcltechsw.com/Domino-rest-api/references/usingdominorestapi/index.html)的兩端。
- **底下 Domino 的安全還在算**：scope 的作用是「specify and limit the resources an API can access… based on the authenticated user's requirements and database access control」——ACL、Readers 欄位一樣管數。
- **流程**：建 schema → 勾選要開的 form/view/folder/agent/欄位 → 建 scope 活化 → 用 curl/Postman 測。

---

## schema：決定「什麼對外」

一個 NSF 裡有幾十個 form、上百個 view、一堆 agent。你不會想把它們全部無差別地開到網際網路上。[schema](https://opensource.hcltechsw.com/Domino-rest-api/references/schemacomponents/index.html) 就是那份**白名單**——官方把 schema components 定位成「essential for developers to configure and customize the API exposure of Domino applications」，白話說就是「用來決定這個 app 有哪些東西透過 API 露出去」。

一份 schema 可以挑著開這些元件：

- **form**：哪些表單的文件可以透過 API 讀寫。
- **view / folder**：哪些 view、folder 可以被查詢、被列出。
- **agent**：哪些 agent 可以被 API 觸發。
- **document item（欄位）**：一份文件裡，哪些欄位對外、叫什麼名字。

schema 本身是一份 JSON（存在資料庫的 design 資源裡）。你在 Admin UI（官方稱 Schema and Scope Management UI）上勾選、編輯，也可以把整份 schema「Export database schema as JSON file」帶著走、進版控。這一點對 DevOps 很有用——你的 API 曝露面本身就是一個可以 review、可以 diff 的檔案。

## scope：把 schema 活化成 REST mapping

光有 schema 還不能打——schema 只是「設計圖」。要讓它真的變成可呼叫的端點，你得建一個 **scope**。官方講得最精準的一句是：

> Activate the schema by creating a scope (Rest mapping).

scope 就是把某份 schema **掛上一個 REST mapping**、讓它活起來的那層。而 scope 有一個**名字**——這裡就跟上一篇接上了：你 JWT 裡那個 `scopes` claim（例如 `MAIL $DATA` 或某個資料庫的別名），認的正是這些 scope 的名字。（`$DATA` 是個萬用值，代表「使用者有權限的所有應用」，所以 token 不一定要逐一列出每個 scope 名。）**schema 決定「露出什麼形狀」，scope 決定「這道門叫什麼、開給誰」，而 JWT 的 scopes claim 決定「你手上有哪幾把鑰匙」。**

而且 scope 不是把安全整個交給自己重造。官方說 scope 是用來「specify and limit the resources an API can access to ensure secure and tailored permissions based on the authenticated user's requirements and **database access control**」——注意最後那句：**底下 Domino 的 ACL 與 Readers 欄位一樣在算**。DRAPI 的 scope 是加在既有 Domino 安全模型**之上**的一層，不是取代它。一個使用者透過 REST 能看到的，仍受他在那個 NSF 的 ACL／Readers 限制。

## 把一個 NSF 開出去：流程

官方 [how-to](https://opensource.hcltechsw.com/Domino-rest-api/howto/index.html) 把「Enable a database」拆成幾步，串起來就是：

1. **建 schema**：對目標 NSF 建一份 schema 設定（在 Admin UI，或直接編 schema JSON）。
2. **勾選要開的元件**：挑哪些 form、view、folder、agent、欄位對外。沒勾的，外面就碰不到。
3. **建 scope 活化**：為這份 schema 建一個 scope（REST mapping），給它一個名字。
4. **測**：用 curl / Postman，帶著 scope 名字在其中的 token，打打看。

做完這四步，這個 NSF 就有了一組受控的 REST 端點；而它露出多少、叫什麼名字、誰能進，全寫在 schema 與 scope 這兩份設定裡。

## 三層一起看

把前三篇疊起來，一個 REST 請求能不能拿到資料，是三層一起決定的：

- **Domino ACL / Readers**（最底層，本來就有的）——你這個身分在這個 NSF 本來能看什麼。
- **schema**（DRAPI）——這個 NSF 有哪些元件、欄位「被設計成對外」。
- **scope + JWT scopes claim**（DRAPI）——你手上的 token 帶了哪些 scope 的鑰匙。

三層任何一層擋下來，你就拿不到。下一篇進到真正的**文件 CRUD**——當這些都通了，怎麼用 JSON 對一份文件做增刪查改。
