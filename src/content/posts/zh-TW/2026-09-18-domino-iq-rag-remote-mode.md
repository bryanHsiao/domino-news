---
title: "Domino IQ RAG 不再只能 Local mode：14.5.1 FP1 讓模型搬遠端、向量庫仍守本機"
description: "Domino 14.5.1 GA 時，Domino IQ 的 RAG 只能跑在 Local mode。14.5.1 FP1 放寬了：RAG 在 Local 與 Remote 兩種模式都支援——LLM 與 embedding 模型可 host 在遠端 OpenAI-相容端點，但向量資料庫一律留在本機 Domino IQ server 上。本文整理這個轉變改了什麼、哪些留本機哪些能搬遠端、Remote 端點怎麼設（HTTPS、API Key、信任憑證進 certstore.nsf），以及什麼時候該用 Remote。"
pubDate: 2026-09-18T09:30:00+08:00
lang: zh-TW
slug: domino-iq-rag-remote-mode
tags:
  - "Domino IQ"
  - "AI"
  - "Release Notes"
sources:
  - title: "RAG for the Domino IQ server — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html"
  - title: "What's new in 14.5.1 Fixpack 1 — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html"
  - title: "Adding a Domino IQ Configuration for Remote mode — HCL Domino Admin Help（官方）"
    url: "https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/domino-iq-rag-remote-mode.webp"
coverStyle: "risograph"
---

> 📚 這篇是 [Domino IQ RAG 深入篇](/domino-news/posts/domino-iq-rag)的一則更新。要看 RAG 在 Domino IQ 的完整設定（embedding／vector DB 兩段設定、Command document 的 RAG 欄位、`updall` 向量化、ACL／Readers 安全性），先讀那篇；這裡只聚焦 **14.5.1 FP1 放寬 local-only 限制**這一個轉變。

## 重點摘要

- **14.5.1 GA 時，Domino IQ 的 RAG[^rag]「只能」跑在 Local mode**：整條龍（LLM[^llm] 推論、embedding[^embedding]、向量庫）都在本機 server。
- **14.5.1 FP1 起，RAG 在 Local 與 Remote 兩種模式都支援。** 官方逐字：LLM 與 embedding 模型可 host 在遠端端點，**但向量資料庫一律留在本機 Domino IQ server 上**。
- **遠端端點必須相容 OpenAI API 標準**、只走 HTTPS、認證只支援 API Key。
- **遠端 AI server 的信任憑證要加進 `certstore.nsf`**——這跟 DRAPI 對外只吃 JVM truststore 是**兩套不同的信任庫**，別搞混。
- 意義：吃 GPU 的模型推論可外包遠端，但**資料落地的關鍵——向量索引與其上的 ACL／Readers 過濾——仍不出你的機器**。

## 改了什麼：local-only 的限制沒了

[Domino 14.5.1 GA 的 RAG 支援](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html)當初白紙黑字寫「只在 Domino IQ server 設成 Local mode 時可用」。這條在 **[14.5.1 Fixpack 1](https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html)** 被放寬，官方 what's new 逐字：

> Starting with 14.5.1FP1, RAG support is available in both Local and Remote modes. While the LLM and embedding models can be hosted on remote endpoints, the vector database is always hosted locally on the Domino IQ server.

一句話：**模型可以走遠端，向量庫不行**。之前要用 RAG，就得把整台 Domino IQ 架在能跑 GGUF 模型的 GPU 機器上；FP1 之後，你可以把「拿 prompt＋context 去算生成」這段重活丟給遠端的推論服務。

## 哪些留本機、哪些能搬遠端

| 元件 | Local mode | Remote mode（14.5.1 FP1 起） |
|---|---|---|
| LLM 推論 | 本機 `llama-server` | 可放遠端 OpenAI-相容端點 |
| embedding 模型 | 本機 `llama-server` | 可放遠端 |
| 向量資料庫 | 本機 | **一律本機** |
| ACL／Readers 過濾 | 本機 session 的 Notes DN | 本機（跟著向量庫） |

重點在最後兩列：向量庫留本機，代表你的 NSF 內容被轉成的**向量索引**、以及查詢時「這個 user 能看哪些文件」的 **ACL／Readers 過濾**，都還在你自己 server 上跑；搬到遠端的只是模型推論那一步。[深入篇](/domino-news/posts/domino-iq-rag)裡講的 local 執行優勢——尤其權限原生繼承——大部分在 Remote mode 依然成立。

## Remote 端點怎麼設

FP1 沒有為 RAG 另立一套遠端設定，而是讓 RAG 跑在**既有的 [Domino IQ Remote mode 設定](https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html)**之上。在 `dominoiq.nsf` 開 Remote mode 的 Configuration document，關鍵幾點（官方逐字）：

- **端點只走 HTTPS**：「The endpoint supported is HTTPS only」，例：`https://endpoint-serv.example.com/v1/chat/completions`。
- **認證只支援 API Key**：「This is the only form of authentication supported by HCL to the remote AI endpoint/server」。
- **信任憑證進 certstore**：「Add the Trusted roots for the remote AI server to Domino's Certstore database」——遠端走 HTTPS，Domino 得先信任對方的 CA，這步漏了連線就會失敗。這裡用的是 Domino 的 [`certstore.nsf`](/domino-news/posts/certstore-getting-started)，**不是** JVM cacerts——那是 DRAPI／Java 那條路才吃的（見 [DRAPI 對外只吃 JVM truststore 的 OIDC 實測](/domino-news/posts/drapi-keycloak-oidc)）。同是「Domino 要信任外部 server」，不同子系統走不同信任庫，這是最容易踩的坑。
- **Status 設 Enabled**，Domino IQ task 才會在 server 載入。

> 實作提醒：官方 Remote mode 設定頁主要是圍繞「遠端 AI 推論引擎所用的那顆 LLM」在講；embedding 也能走遠端這件事，是 RAG support 頁另外提的。兩者如何在設定裡各自指向遠端端點，建議在小環境先接一次、對照實際行為再上線，別照命名慣例硬猜欄位。

## 什麼時候用 Remote、什麼時候留 Local

- 不想在本機備 GPU、想把模型推論交給既有的遠端推論服務（自架或供應商，只要相容 OpenAI API）→ **Remote**。
- 連模型推論都不能出網（最嚴的資料落地要求）→ **Local**，整條龍留本機。
- **無論哪種**，向量索引與 ACL／Readers 過濾都在本機——這是 FP1 沒動、也是 Domino IQ RAG 跟「把資料 ETL 給外部 SaaS」最本質的差別。

[^rag]: RAG（Retrieval-Augmented Generation，檢索增強生成）：LLM 生成回答前，先從指定資料源取回語意相關的文件當 context，讓回應更貼近你的領域與當下資料。
[^llm]: LLM（Large Language Model，大型語言模型）是以海量文字訓練的神經網路模型，能依輸入提示生成自然語言回應。
[^embedding]: Embedding 模型把文字轉成固定維度的向量，讓語意相近的句子在向量空間中也接近——RAG 用它把 NSF 文件變成可被語意搜尋的索引。
