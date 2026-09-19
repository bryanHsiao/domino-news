---
title: "把 Domino IQ RAG 接上遠端模型：certstore 信任、API Key、HTTPS 端點怎麼設"
description: "Domino 14.5.1 FP1 讓 RAG 多了 Remote 模式——站上 FP1 總覽那篇已經介紹過「改了什麼」。這篇不重講，只補實際接線的那一段：Remote mode 設定文件怎麼填、HTTPS-only 端點與 API Key、以及最容易踩的一關——遠端 AI server 的信任根要加進 certstore.nsf，而不是 DRAPI 那條路吃的 JVM truststore。"
pubDate: 2026-09-23T07:30:00+08:00
lang: zh-TW
slug: domino-iq-rag-remote-mode
tags:
  - "Domino IQ"
  - "AI"
  - "Domino Server"
sources:
  - title: "Adding a Domino IQ Configuration for Remote mode — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html"
  - title: "RAG for the Domino IQ server — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html"
  - title: "What's new in 14.5.1 Fixpack 1 — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html"
relatedJava: []
relatedSsjs: []
---

> 📚 這篇承接兩篇：[14.5.1 FP1 總覽](/domino-news/posts/domino-1451-fp1)宣布了「RAG 多了 Remote 模式」這個轉變、[Domino IQ RAG 深入篇](/domino-news/posts/domino-iq-rag)講這條管線在 server 裡怎麼運作。這裡只補一件它們沒細講的事：**實際怎麼把遠端端點接起來**，尤其憑證信任那一關。

## 先一句話定位（其餘見 FP1 總覽）

[14.5.1 FP1](https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html) 讓 RAG[^rag] 同時支援 Local 與 Remote：LLM 與 embedding 模型可以放遠端 OpenAI-相容端點，而[官方 RAG 說明](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html)明訂**向量資料庫一律留在本機** Domino IQ server。這個轉變的來龍去脈、以及 FP1 那 49 個修正、JVM 更新，[站上的 FP1 總覽](/domino-news/posts/domino-1451-fp1)都寫了，這裡不重講。本篇只回答一個實務問題：**遠端端點到底怎麼設、憑證怎麼讓 Domino 信任。**

## 遠端端點怎麼設

Remote 模式沿用既有的 [Domino IQ Remote mode 設定文件](https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html)。在 `dominoiq.nsf` 開 Remote mode 的 Configuration document，關鍵幾點（官方逐字）：

- **端點只走 HTTPS**：「The endpoint supported is HTTPS only」，例：`https://endpoint-serv.example.com/v1/chat/completions`。
- **認證只支援 API Key**：「This is the only form of authentication supported by HCL to the remote AI endpoint/server」——沒有其他認證方式，就是一把 key 走 TLS。
- **Status 設 Enabled**，Domino IQ task 才會在 server 載入。

到這裡都還算直覺。真正會卡住人的是下一關——憑證信任。

## 最容易踩的一關：信任走 certstore，不是 JVM truststore

端點是 HTTPS，Domino 這端要先**信任遠端 AI server 的憑證鏈**，否則連線直接失敗。官方逐字：

> Add the Trusted roots for the remote AI server to Domino's Certstore database.

也就是把遠端的信任根放進 Domino 的 [`certstore.nsf`](/domino-news/posts/certstore-getting-started)。這一步漏了，端點、API Key 全填對也連不上。

這裡有個**很容易搞混的點**：Domino 裡不只一套信任庫。Domino IQ 這條路（server 端的 C++ task）對外走 **`certstore.nsf`**；但 DRAPI／Java 那條路對外是吃 **JVM 的 cacerts truststore**（我們在 [DRAPI 只吃 JVM truststore 的 OIDC 實測](/domino-news/posts/drapi-keycloak-oidc)裡踩過）。同樣一句「Domino 要信任某個外部 server」，落在不同子系統，要放憑證的地方完全不同——把遠端 AI 的信任根放去 JVM cacerts，Domino IQ 是看不到的。設定 Remote mode 前先認清你在跟哪個子系統打交道。

## 一個實作提醒

官方 Remote mode 設定頁主要是圍繞「遠端 AI 推論引擎所用的那顆 LLM」在講；embedding 也能走遠端這件事，是 RAG support 頁另外提的。兩者如何在設定裡各自指向遠端端點，建議在小環境先接一次、對照實際行為再上線，別照命名慣例硬猜欄位。

想看 RAG 在 Domino IQ 的完整設定（embedding／vector DB 兩段設定、Command document 的 RAG 欄位、`updall` 向量化、ACL／Readers 安全性），見 [Domino IQ RAG 深入篇](/domino-news/posts/domino-iq-rag)；想看 FP1 這一包還修了什麼，見 [FP1 總覽](/domino-news/posts/domino-1451-fp1)。

[^rag]: RAG（Retrieval-Augmented Generation，檢索增強生成）：LLM 生成回答前，先從指定資料源取回語意相關的文件當 context，讓回應更貼近你的領域與當下資料。
