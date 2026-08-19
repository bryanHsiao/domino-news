---
title: "Domino REST API 上手：把 NSF 資料變成任何語言都能呼叫的 REST 端點"
description: "想讓一個現代前端、一支 Python 服務、或一條 Power Automate 流程讀寫 Domino 資料，傳統答案（XPages、DIIOP、自己寫 LotusScript web agent 吐 JSON）都得讓對方遷就 Domino。Domino REST API（DRAPI，KEEP 專案）把它反過來：在你的 NSF 之上架一層標準的 REST/JSON API，任何會講 HTTP 的語言都能呼叫。這是 DRAPI 系列的第一篇——它是什麼、跟傳統存取差在哪、三個要先懂的積木（scope/schema、JWT、OpenAPI/Swagger），以及怎麼開始。"
pubDate: 2026-08-19T07:30:00+08:00
lang: zh-TW
slug: domino-rest-api-getting-started
tags:
  - "Domino REST API"
  - "DevOps"
sources:
  - title: "Domino REST API — Overview (HCL opensource)"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/index.html"
  - title: "Domino REST API — Tutorial / Getting started"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html"
  - title: "Domino REST API — Topic guides"
    url: "https://opensource.hcltechsw.com/Domino-rest-api/topicguides/index.html"
cover: "/covers/domino-rest-api-getting-started.webp"
coverStyle: "art-deco"
---

你想讓一個現代前端——React、Vue、一支 Python 服務、一條 Power Automate 流程——去讀寫 Domino 裡的資料。傳統上有幾條路：用 XPages 把資料包成網頁、用 DIIOP 讓遠端 Java 走 CORBA 進來、或自己寫一支 LotusScript web agent 手工吐 JSON。三條路都能通，但都得讓**對方來遷就 Domino 的規矩**。

[Domino REST API](https://opensource.hcltechsw.com/Domino-rest-api/index.html)（DRAPI，原專案代號 KEEP）把這件事反過來：它在你的 NSF 之上，架一層**標準的 REST/JSON API**，任何會講 HTTP 的語言都能呼叫，不必懂 Notes、不必裝 Notes client。這是 DRAPI 系列的第一篇，先把全局講清楚。（它是 Domino 的商用附加元件，要另外安裝；只有文件是開源的。）

---

## 重點摘要

- **DRAPI 是一層跑在 Domino 上的 REST API**：官方定義它「provides a secure REST API with access to HCL Domino servers and databases」，支援 Windows、Linux、Mac。
- **它是中介層，不是取代品**：官方說它「functions as middleware, connecting Notes and Domino to a contemporary REST like API consuming and producing mostly JSON data」——你的 NSF、設計、安全模型都還在，DRAPI 只是幫它們開一扇 REST 門。
- **三個要先懂的積木**：**scope／schema**（把一個 NSF 對應成 REST 端點）、**JWT**（拿一個 bearer token 才能呼叫）、**OpenAPI/Swagger**（整套 API 自我描述、可用 Swagger UI 探索）。
- **語言無關**：呼叫端是 curl、Postman、JavaScript、Python 都行——這正是它跟 XPages／DIIOP／手寫 agent 最大的差別。
- **API 基底路徑是 `/api/v1`**，走的是 OpenAPI 3.0.x 規格。

---

## DRAPI 是什麼

一句官方定義說得最清楚——它「provides a secure REST API with access to HCL Domino servers and databases while running on HCL Domino」。拆開來看兩個重點：它**跑在 Domino 上**（不是另一台獨立服務），而它給出去的是一套**標準 REST API**。

架構上，官方把它定位成中介層：「functions as middleware, connecting Notes and Domino to a contemporary REST like API consuming and producing **mostly JSON data**」。也就是說，你原本的 NSF、表單、view、Readers 欄位安全——全都不動；DRAPI 站在前面，把「讀一份文件」「跑一個查詢」翻譯成 REST 呼叫與 JSON，再把 Domino 的回應翻回 JSON 給呼叫端。

## 跟傳統存取差在哪

Domino 要對外開資料，以前的選項各有各的包袱：

- **XPages**：伺服器端把資料算成 HTML 網頁。適合做網頁 UI，但它不是一套乾淨的、給程式消費的 API——外部系統要的是 JSON，不是一頁 HTML。
- **DIIOP（CORBA）**：讓遠端 Java 用 CORBA 連進 Domino。能拿到完整後端物件，但客戶端很重、協定老，是條愈來愈少人走的舊路。
- **LotusScript web agent 吐 JSON**：你自己寫一支 agent，手工組 JSON、自己管路由、自己接驗證。能動，但等於在**手刻一套 API**，每個端點都是你的維護債。

DRAPI 的差別是：它是一套**由 HCL 維護、用 OpenAPI 描述的標準 REST API**。端點長什麼樣、要傳什麼、回什麼，全寫在 [OpenAPI 定義](https://opensource.hcltechsw.com/Domino-rest-api/topicguides/index.html)裡；呼叫端不必懂 Notes，用它熟悉的 HTTP 工具就能接。你不再是「把 Domino 翻譯給每個外部系統」，而是「開一個標準門，讓大家自己進來」。

## 三個要先懂的積木

往下深入之前，有三個名詞會一直出現，先建立印象：

1. **scope / schema**——這是 DRAPI 的核心概念。一個 NSF 不會自動全部曝露成 REST；你要先定義一個 **schema**（決定哪些表單、view、欄位對外），再把它掛成一個 **scope**（一個對外的存取範圍）。scope 就是「這個 NSF 用這組規則對外開放」的那層設定。這一篇先記得它，系列後面會專講。
2. **JWT（bearer token）**——DRAPI 的呼叫幾乎都要帶一個 token。你先向認證端點登入拿到一個 JWT，之後每個請求都在 header 帶著它。認證那篇會細講。
3. **OpenAPI / Swagger**——整套 API 依 **OpenAPI 3.0.x** 規格自我描述，還附一個 **Swagger UI** 讓你在瀏覽器裡直接看端點、填參數、按下去試打。上手階段，Swagger UI 是你最好的探索工具。

## 怎麼開始

DRAPI 不是裝好 Domino 就有——它是額外的一塊，要另外安裝設定。官方的[上手指引](https://opensource.hcltechsw.com/Domino-rest-api/tutorial/index.html)把路徑鋪得很清楚：

1. **安裝與設定**：跟著「Installation and configuration」把 DRAPI（KEEP server）裝起來、做完 production 該有的設定。
2. **登入拿 token**：Capability Walkthrough 的第一課就是「Lab 01 - Log in to the REST API」——先把認證跑通。
3. **用 Swagger UI 探索**：打開 Swagger UI，端點一覽無遺，可以直接在上面試打第一個請求。
4. **接工具**：官方示範用 command line、Postman、curl、以及 Admin UI 逐步操作——挑你順手的。

API 的基底路徑是 `/api/v1`；認證、資料庫、文件、查詢這些端點都掛在它底下。

## 這個系列接下來

這一篇是全局。接下來幾篇會一塊一塊拆開：先是**認證與 token**（怎麼拿、怎麼帶、scope 權限怎麼算），再來是 **scope 與資料庫存取**（schema 怎麼把 NSF 對應成端點）、**文件 CRUD**（用 JSON 增刪查改，item 怎麼對應）、**DQL 與查詢**（在 REST 上跑 DQL、讀 view），最後收在**錯誤處理與安全**（Readers 欄位在 REST 上還算不算數、常見的坑）。跟著走完，你就能把一個 NSF 乾淨地開成一組現代 API。
