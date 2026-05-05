---
title: "Domino IQ RAG：把 NSF 直接掛上本地 LLM 的內建管線"
description: "Domino 14.5.1 在 Domino IQ 加入 RAG（Retrieval-Augmented Generation）支援，把 LLM 推論、Embedding 模型、向量資料庫全部跑在 Domino server 上，本地處理、原生繼承 ACL 與 Readers field 權限。本文整理啟用前提、dominoiq.nsf 兩階段設定、updall 向量化、LotusScript 怎麼呼叫 LLMReq，以及為什麼這跟「外接 OpenAI + Pinecone」是不同物種。"
pubDate: 2026-05-05T07:30:00+08:00
lang: zh-TW
slug: domino-iq-rag
tags:
  - "Domino IQ"
  - "AI"
  - "Domino Server"
  - "Tutorial"
sources:
  - title: "RAG support in Domino 14.5.1 — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html"
  - title: "Configuring the Command document for RAG — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_command_doc_for_rag.html"
  - title: "Security considerations for Domino IQ — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_security_considerations_for_iq.html"
  - title: "Domino IQ — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/domino_iq_server.html"
cover: "/covers/domino-iq-rag.png"
coverStyle: "art-deco"
---

> 📚 這篇是 Domino IQ 雙篇系列的「深入篇」。沒看過 Domino IQ 整體架構、安裝流程、與 `NotesLLMRequest` / `NotesLLMResponse` 怎麼從應用程式呼叫的，建議先讀 [Domino IQ 入門：把 LLM 跑進 Domino server 是什麼概念](/domino-news/posts/domino-iq) 再回來看 RAG 怎麼運作。

## RAG 在 Domino IQ 是怎麼一回事

[Domino 14.5.1 開始支援 RAG](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html)（Retrieval-Augmented Generation）—— LLM[^llm] 在生成回答前，先從你指定的 NSF 取回語意相關的文件當 context，回應因此「更貼近你的領域、更貼近你的當下資料」。一般 RAG 你可能聽過 OpenAI + Pinecone + LangChain 那條龍，Domino IQ 把這整條全部內建到 server 任務裡。

當你把一個 Command document 設成 RAG 模式，Domino IQ 任務在 server 程序裡會啟動：

- 一個 `llama-server` instance 跑 LLM 推論模型
- 一個 `llama-server` instance 跑 Embedding 模型[^embedding]
- 一個 vector database server
- 可選：一個 `llama-server` instance 跑 guard model[^guard]

使用者送 prompt 進來時，prompt 先被語意搜尋打到 vector DB，命中的 RAG source NSF 文件被取出，與 prompt 一起送給 LLM —— 全部在你自己的 Domino server 上跑完。

## 跟一般 RAG 比，三件事不一樣

**1. 必須是 Local mode**：Domino 14.5.1 的 RAG 支援「**只**在 Domino IQ server 設成 Local mode 時可用」。處理 RAG 內容的 LLM 跑在你 server 上，不打外部 cloud API。對怕資料外流的金融／法務／醫療場景，這條一勞永逸解決資料殘留風險。

**2. 原生繼承 NSF 的 ACL 與 Readers field**：當一個 DB 被 enable 成 RAG source，LLM command 處理請求時「會用認證 session 中的 Notes DN 同時套用 ACL 跟文件 Readers field」。也就是 — A 使用者問問題時，向量搜尋只會打到 A 看得到的文件，B 的 Readers 限制文件不會被當 context 漏給 A。這個整合一般 RAG pipeline 要做到很費工。

**3. DominoIQ task 一條龍**：Embedding 模型、vector DB、LLM 推論、向量化全部由 `DominoIQ` 跟 `updall` 兩個 server task 管理。沒有 Pinecone 帳號要管、沒有 ETL pipeline 要寫。

## 啟用前的準備

```
✓ dominoiq.nsf 用 14.5.1 shipped 的 dominoiq.ntf 升級
✓ Domino IQ server 上開啟 transaction logging
✓ RAG source DB 已 replicate 到 Domino IQ server
✓ RAG source DB 已建好 full-text index，且勾「Index attachments」
✓ 選好 GGUF 格式的 embedding model（mxbai-embed-large、bge-me、nomic-embed-text、snowflake-arctic-embed 等）
```

選 embedding model 時要看你的內容語言、想要的維度大小，以及它必須是 GGUF[^gguf] 格式（llama.cpp 生態系的標準分發格式）。

## 設定步驟

### Step A：dominoiq.nsf 加 Embedding & Vector DB

開 `dominoiq.nsf` → Add Configuration / Edit Configuration：

- **Embedding Model 分頁**：選你下載的 GGUF embedding model、status 設 Enabled、必要時改 port、若 model 支援更長的 context 可以從預設 1024 往上調
- **Vector Database 分頁**：必要時改 port 或 host（多 partition 環境會用到）

### Step B：Command document 設好 RAG 欄位

在 Command document 裡，[幾個關鍵 RAG 欄位](https://help.hcl-software.com/domino/14.5.1/admin/conf_command_doc_for_rag.html)：

| 欄位 | 用途 | 預設 |
|---|---|---|
| `RAG enabled database` | RAG source DB 路徑（相對於 data dir） | — |
| `RAG enabled fields` | 哪些欄位要被向量化、寫進 vector DB | — |
| `RAG threshold` | 語意搜尋取回的最低分數 | 0.7 |
| `RAG maximum responses` | 一次最多取幾筆當 context | 25 |
| `Maximum tokens` | LLM prompt 的 token 上限（RAG 注入後 prompt 會變大，記得拉高） | — |

### Step C：啟用 + 向量化

1. **重啟 Domino IQ server** —— 才會把 embedding 跟 vector DB 子任務拉起來
2. Administrator 客戶端 → Files panel → 右鍵那個 RAG source DB → **Domino IQ** → **Enable**
3. server console 跑 `load updall -w <rag-dbname>` —— 把 NSF 文件 ingest 進 vector DB（這個動作叫 vectorization）

> **規模大的話 vectorization 會跑幾分鐘起跳**，文件量越多越久，文件中文／附件內容會抽出來算 embedding。

## 從應用程式呼叫：LLMReq

設定好後，從應用程式裡用 LotusScript 或 Java 的 `LLMReq` method 呼叫設好的 AI command。Method 拿到輸入 prompt → 走完 vector 搜尋 → 把 top-N 文件當 context → 餵 LLM → 回字串。對 caller 來說它就是一個普通 method call。

> 注意：截至 14.5.1 的官方 admin doc 沒有把 LLMReq 的完整 signature 完整列出（在 Designer help 裡），實作 LLMReq 用法時建議先在小資料集跑一遍對照預期。

## 安全性：ACL + Readers field 自動套用

[Domino IQ 安全性的核心](https://help.hcl-software.com/domino/14.5.1/admin/conf_security_considerations_for_iq.html)是「LLM command 用 authenticated session 的 Notes DN 同時套 ACL 跟 Readers」。一般 RAG 系統裡，「向量搜尋結果該不該給這個 user 看」要靠你在 應用層 自己過濾、極容易出包；Domino IQ 把這事內建成 server-side 強制執行，從架構上規避了「不小心把別人的私文件當 context 餵給 LLM」這種 leakage。

延伸：HCL 也建議你的 LLM 模型「應支援 paraphrase 能力」，讓 RAG 內容在被回應時不被原樣複製出來，進一步降低敏感原文外流風險。

## 容量與效能調優

RAG 模式下 prompt 變大，預設 LLM 上下文大小不夠用：到 dominoiq.nsf 的 Advanced 分頁，`Special parameters` 加類似 `-c 65000`、配合並行請求數量 —— 例如 10 個並行請求 + `-c 65000` 約等於每個請求 6500 token 的上下文。GPU 卸載參數也在同一頁可調。

「沒命中怎麼辦」也是要設定的：在 Command 對應的 system prompt 文件裡，明確告訴 LLM「找不到相關文件時要回什麼」—— 不寫的話 LLM 會自己編造一個合理但無依據的答案，這正是 RAG 想避免的。

## 收掉一個 RAG-enabled DB 的標準流程

1. Command document 把 RAG source DB 欄位清空、存檔
2. 重啟 Domino IQ server
3. server console 跑 `load updall -w -d <RAG-dbname>` 等它跑完 —— 這會清掉 vector DB 裡這個 NSF 對應的 entry
4. Administrator 客戶端 → Files panel → 右鍵那個 DB → **Domino IQ** → **Disable**

順序不能亂：先動 Command 文件再清 vector entries，不要反過來。

## 為什麼這比「外接 LLM SaaS」實際

純粹用 OpenAI / Anthropic API + 自己接 vector DB 蓋一條 RAG，技術上可行，但你會撞到：
- 資料要先 ETL 出 Domino → 違反法規／違反客戶合約常見 case
- ACL/Readers field 要在 應用層 重做一次過濾邏輯
- vector DB 帳號 / 流量 / 限額另外管
- LLM API call 計費跟 token usage 要監控

Domino IQ RAG 的設計把這 4 件事一起處理掉 —— 代價是你要在自己的 server 跑得起 GGUF 模型，也就是要備一張 NVIDIA GPU（最低 compute capability 5.2+，生產建議 8.0+）跑在 64-bit Windows / Linux 上（純 CPU 模式不支援，macOS 跟 ARM 也不行）。對 Domino 既有客戶來說，這個 trade-off 通常划算。

[^gguf]: GGUF（GPT-Generated Unified Format）是 llama.cpp 生態系常見的單檔二進位模型格式，把模型權重、tokenizer、metadata 打包成一個檔，可直接 mmap 載入記憶體 — 是 on-device 推論常用的分發格式。
[^llm]: LLM（Large Language Model，大型語言模型）是以海量文字訓練的神經網路模型 — 例如 GPT、Claude、Llama 等 — 能依輸入提示生成自然語言回應。
[^embedding]: Embedding 模型把文字轉成固定維度的向量（例如 768 或 1024 維），讓「語意相近」的句子在向量空間中也接近 — RAG 用它把 NSF 文件變成可被語意搜尋的索引。
[^guard]: Guard model 是另一個小型 LLM，跑在主 LLM 之前 / 之後當「過濾層」，攔截可能不適當的輸入（例如越獄提示、敏感問題）或輸出（例如有害內容、敏感原文外流）。
