---
slug: domino-iq-rag-remote-mode
title: "Domino IQ RAG 在 14.5.1 FP1 支援 Remote mode"
lang: [zh-TW, en]
pubDate: 2026-09-23
status: staged（原 9/18 Path B 誤發 posts/ → 2026-09-19 發現與 8/13 撞頭條，重寫定位 + git mv 回 _pending 排 2026-09-23）
tags: [Domino IQ, AI, Domino Server]
requester: 使用者 (bryan，貼 conf_iq_rag_support.html 問「適合寫文章嗎」→ 評估後我誤判「全新」，實際 8/13 已寫過；改走「純設定/憑證信任 deep-dive」切角承接 8/13)
author_model: claude-opus-4-8
review_model: general-purpose（獨立 fact-check subagent，對「原 remote-mode 版」）→ PASS。全部 verbatim 引用對得上官方、GA vs FP1 歸因正確、certstore 側有據、未冠 FP1 日期、未捏造 embedding 遠端欄位名。修 1 nit：en/zh「實作提醒」原把輕度改寫的 LLM 描述用引號框成像逐字 → 改成明確 paraphrase（呼應 feedback_no_vague_community_consensus）。重寫成「設定 deep-dive」版後保留同樣的 verbatim 引用，未新增未驗證主張。
created: 2026-09-18
updated: 2026-09-19
---

# 研究軌跡 — domino-iq-rag-remote-mode

## 重大修正（2026-09-19）：與 8/13 撞頭條 → 重寫定位 + 改期

- **原始誤判**：使用者貼 conf_iq_rag_support.html 問「適合寫嗎」，我 coverage 只 glob 檔名 `*iq*`/`*rag*`，判定「FP1 remote-mode 是全新、站上沒有」並這樣回報 → **錯**。
- **實際**：`domino-1451-fp1`（2026-08-13 FP1 總覽）**頭條就是「RAG 能接遠端模型」**，且引同一份官方頁。slug 不含 iq/rag 所以被漏。使用者自己翻出來的。教訓另立 [[feedback_coverage_check_not_filename_glob]]。
- **處置（使用者選 Option 2）**：不撤文，但**重寫定位**——從「FP1 改了什麼(remote-mode)」改成「**遠端端點怎麼設 + 憑證信任**」的純設定 deep-dive，把 what-changed 讓給 8/13、明確承接它。核心價值＝**certstore.nsf 信任根 vs DRAPI 走的 JVM truststore**（8/13 沒寫）。
- **改期**：原 9/18 Path B 誤發（且當天已 3 篇太擠）→ git mv 回 `_pending` 排 **2026-09-23**（空日）。cover（risograph）已 backfill、slug 不變故沿用。
- **連動修正**：5/5 的前向連結原指本篇（會 404 到 9/23）→ 改指 8/13（已上線）。webinar 筆記（8/4）補一條 → 8/13 的交叉連（雙向補齊）。

## 定位（重寫後）

純設定/憑證 deep-dive。承 [[domino-1451-fp1]]（what-changed）+ [[domino-iq-rag]]（本機管線深入）。
只講：Remote-mode 設定文件（HTTPS-only／API Key／Status）、**certstore 信任那一關 + certstore≠JVM truststore**、
一個 embedding 遠端欄位未逐字驗證的 caveat。不重講 RAG 介紹、不重講 FP1 改了什麼（避免撞 8/13/5-5）。

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
