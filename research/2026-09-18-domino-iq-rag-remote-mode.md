---
slug: domino-iq-rag-remote-mode
title: "Domino IQ RAG 在 14.5.1 FP1 支援 Remote mode"
lang: [zh-TW, en]
pubDate: 2026-09-18
status: published（9/18 同日 Path B 直發 posts/；與 5/5 domino-iq-rag 的 retrofit 更正同批上線，避免 forward-link dangle）
tags: [Domino IQ, AI, Release Notes]
requester: 使用者 (bryan，貼 conf_iq_rag_support.html 問「適合寫文章嗎」→ 評估後定案：不重寫介紹，只寫 FP1 remote-mode 這個新角度 + 修 5/5 過時 claim)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent）→ PASS。全部 verbatim 引用對得上官方、GA vs FP1 歸因正確、對照表無誇大 remote 範圍、certstore 側有據、未冠 FP1 日期、未捏造 embedding 遠端欄位名。修 1 nit：en/zh「實作提醒」原把輕度改寫的 LLM 描述用引號框成像逐字 → 改成明確 paraphrase、拿掉誤導引號（呼應 feedback_no_vague_community_consensus）。另 fact-check 指出可選：guard model 也能遠端、prereq 未列——刻意略（窄篇、不誇大）。
created: 2026-09-18
updated: 2026-09-18
---

# 研究軌跡 — domino-iq-rag-remote-mode

release-note/update 型。承 [[domino-iq-rag]]（5/5 深入篇，同一份 conf_iq_rag_support.html 是它 source #1）。
本篇只聚焦 **14.5.1 FP1 把 RAG 從 local-only 放寬成 Local+Remote** 這一個轉變，不重覆 RAG 介紹（避免撞題/saturated-source）。

## 為什麼不重寫、只寫 FP1 角度

- 5/5 domino-iq-rag 已把 conf_iq_rag_support.html 整頁走過（RAG 概念、local 執行、ACL/Readers、prereq、dominoiq.nsf 兩段設定、Command doc RAG 欄位、updall 向量化、disable 流程）。再寫介紹＝重複。
- 但該頁在 GA 之後新增 FP1 段落，**直接推翻 5/5 列為「三大差異」之一的「Local mode is mandatory」**。→ 這是真・新內容 + 順手修舊文錯誤。
- 使用者原框「類似 Hybrid Search」是類比、非官方用詞；已在評估回覆與文中校正為官方定位「RAG（餵 AI command 的語意檢索）」，不包裝成「Domino 出了 Hybrid Search」。

## NotebookLM 決策（研究流程偏離，已向使用者揭露）

- **本篇未跑 NotebookLM**。理由：IQ RAG notebook 為 14.5.1 GA 期建置，FP1 remote-mode 是 GA 之後的新內容，notebook 必 dry-hole／或觸發跨主題污染（本 session 稍早 9/17 批亦記錄 NotebookLM 卡登入）。
- 依 CLAUDE.md 研究鏈 step 2「WebFetch where NotebookLM is thin」的逃生口：**全篇改以第一手官方 doc WebFetch 逐字取證**（見下）。此為 release-note breakdown、主源本就是官方 what's-new/doc。已在給使用者的訊息與此 sidecar 揭露此偏離，待使用者若要求再補跑。

## 來源（全部第一手 WebFetch，逐字）

- **conf_iq_rag_support.html**（[14.5.1 官方](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html)）逐字：
  - GA：「In Domino 14.5.1, RAG support is available only when the Domino IQ server is configured in **Local** mode.」
  - FP1：「Starting in release 14.5.1FP1, RAG support is available in both **Local** and **Remote** modes.」
  - 「the vector database is always hosted locally on the Domino IQ server.」
  - 「While the LLM and embedding models can be hosted on remote endpoints, the vector database is always hosted locally…」
  - remote 端點須相容 OpenAI API standard。
  - prereq（兩模式共用）：dominoiq.ntf 更新、transaction logging、`FT_SKIP_IGNORE_FIELD=1`。
  - 設定文件：Embedding Model / Embedding and Vector database Configuration / Command document / Domino IQ Configuration (Remote mode)。
- **whats_new_in_1451FP1.html**（[官方](https://help.hcl-software.com/domino/14.5.1/admin/whats_new_in_1451FP1.html)）：FP1 列 Remote LLM with RAG（逐字同上）、OTS UNID、OIDC_PROVIDER_PROXY_PORT=443。**頁面未載明 FP1 精確發布日期** → 文中不冠日期（brandlrainer.info 2026-07-17 提到 FP1 available，但非官方日期，不引為事實）。
- **conf_add_dom_iq_config_remote_mode.html**（[14.5.0 官方](https://help.hcl-software.com/domino/14.5.0/admin/conf_add_dom_iq_config_remote_mode.html)）逐字：
  - 「The endpoint supported is HTTPS only. For example: https://endpoint-serv.example.com/v1/chat/completions」
  - 「Provide an API Key… This is the only form of authentication supported by HCL to the remote AI endpoint/server」
  - 「Add the Trusted roots for the remote AI server to Domino's Certstore database.」→ 交叉連 [[certstore-getting-started]]（certstore.nsf）。
  - 「Set the Status field to Enabled…」
  - 「For remote AI endpoints, the Advanced tab… doesn't contain any settings that apply」
  - 頁面把此文件描述成設定「an LLM (model) used by the AI inferencing engine running on the remote server」——**未細列 embedding/guard 各自的遠端 endpoint 欄位**（此頁 predates RAG）。

## 未能證實 / 刻意不寫（不猜）

- **RAG remote 模式下，embedding 遠端端點的欄位級設定**：RAG support 頁說「embedding 可遠端」，但 remote-mode 設定頁是 LLM-inference 導向、未明列 embedding 專屬遠端欄位。→ 文中**不杜撰欄位名**，只寫已驗證的（HTTPS/API Key/certstore/Status），並加「實作提醒」請讀者小環境先驗、別照命名慣例猜。呼應 [[feedback_no_vague_community_consensus]] 教訓（別把猜測當事實）。
- **FP1 精確發布日期**：官方頁未載 → 不寫日期。

## 交叉連（已驗證 en/zh slug 皆存在）

- 內部：[[domino-iq-rag]]（深入篇，前向+回連已互通）、[[certstore-getting-started]]（信任根進 certstore）、[[drapi-keycloak-oidc]]（對比：DRAPI 只吃 JVM truststore ≠ Domino IQ 吃 certstore）。
- **精準對比點（本篇價值之一）**：同是「Domino 信任外部 server」，Domino IQ（C++ server task）走 `certstore.nsf`、DRAPI（Java）走 JVM cacerts——兩套信任庫，易混。此區別 certstore 由本頁逐字證實；JVM 側引自站上既有 OIDC 實測文/memory reference_drapi_oidc_repo。

## 5/5 retrofit 更正（同批）

- zh/en 兩版「三件事不一樣」第 1 點：原「必須是 Local mode / Local mode is mandatory」→ 改「向量庫永遠留在本機」，補 FP1 起 Local/Remote 皆可、向量庫一律本機、Remote 只搬模型推論；並前向連本篇。

## 查證 checklist

- [x] GA local-only vs FP1 both modes 逐字對照官方
- [x] 「vector DB always local」逐字
- [x] remote 端點 HTTPS/API Key/certstore/Status 逐字（remote-mode 設定頁）
- [x] OpenAI API standard 要求
- [x] 用詞校正：RAG（非「Hybrid Search」）
- [x] certstore vs JVM truststore 對比精準、certstore 側逐字有據
- [x] 不杜撰 embedding 遠端欄位、不冠 FP1 日期
- [x] inline-link diversity：3 相異官方 URL（rag support / FP1 whatsnew / remote-mode config）各 1 次/語言 = 33% <40%；另內部 3 連（不計入）
- [ ] 雙語 build 驗證
- [ ] humanizer-zh-tw pass
- [ ] independent fact-check subagent

## 異動日誌

- 2026-09-18 評估使用者貼的 conf_iq_rag_support.html → 判定「不重寫、只寫 FP1 remote-mode + 修 5/5」；WebFetch 逐字取證（3 官方頁）；雙語成稿；5/5 retrofit 更正；sidecar。（Opus 4.8）
