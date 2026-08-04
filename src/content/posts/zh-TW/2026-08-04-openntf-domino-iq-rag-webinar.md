---
title: "OpenNTF Domino IQ RAG webinar 筆記：30 字元的坑、向量化三步驟，與 FP1 修好的 Readers 安全"
description: "OpenNTF 請到 HCL 的 Brian Arnold 做了一場 Domino IQ RAG 深入 webinar。站上已寫過這條管線的技術原理，這篇補上「實戰層」——把短欄位資料 RAG 化的 30 字元限制與 concat 欄位解法、向量化的三個步驟、三個要調的旋鈕、Readers/Authors 欄位安全在 Domino 2026 FP1 才真正修好，以及開發中的 citations、側邊面板與 MCP。"
pubDate: 2026-08-04T15:00:00+08:00
lang: zh-TW
slug: openntf-domino-iq-rag-webinar
tags:
  - "Domino IQ"
  - "AI"
  - "Community"
sources:
  - title: "OpenNTF Webinar: DominoIQ RAG (Brian Arnold, HCL) — YouTube"
    url: "https://www.youtube.com/watch?v=J26LvWtq8-Y"
  - title: "OpenNTF Blog"
    url: "https://www.openntf.org/blogs/openntf.nsf/"
  - title: "Domino IQ RAG support — HCL Domino Admin Help"
    url: "https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html"
cover: "/covers/openntf-domino-iq-rag-webinar.webp"
coverStyle: "oil-chiaroscuro"
---

[OpenNTF](https://www.openntf.org/blogs/openntf.nsf/) 8 月初上架了一場很值得看的 webinar：HCL 的 Brian Arnold（做 Notes/Domino 剛滿 32 年、直接對接 Domino IQ 工程團隊）花了近 90 分鐘，把 Domino IQ 的 RAG 從概念一路示範到實際 app。

站上先前那篇 [Domino IQ RAG 技術拆解](/domino-news/posts/domino-iq-rag)講的是「這條管線在 server 裡怎麼運作」；這場 webinar 補上的是另一層：**實戰會踩到的坑、怎麼繞過、以及哪些東西還在開發中**。這篇把幾個對開發者最有用的點記下來（RAG 是什麼、為什麼跑在本機，那篇技術文有，這裡不重講）。

---

## 重點摘要

- **最實用的坑**：要 RAG 化的欄位，值**至少要 30 個字元**。很多應用的欄位只有 10–15 字，直接 RAG 不了。解法是加一個把多個欄位串起來的 concat 欄位。
- **向量化就三步**：資料庫先 full-text index → 在 Domino Administrator 右鍵啟用 Domino IQ 向量化 → 主控台跑 `load updall -w` 建向量資料。
- **三個要調的旋鈕**：`rag maximum responses`（撈幾份文件，約 20）、`rag threshold`（相似度門檻，Brian 用 0.4）、`temperature`（隨機度，要準就壓到 0.1–0.4）。
- **Readers/Authors 欄位安全，到 Domino 2026 FP1 才真正修好**——2026 GA 時其實壞的，FP1 修正。
- **開發中、即將來的**：回應附 **citations**（指出答案出自哪份文件、連 PDF 內容都行）、Notes client 的**側邊面板**（在任何地方問 RAG，不必改 app 設計）、**MCP server**（約 12 個月內）。

---

## 那個 30 字元的坑（與解法）

這是整場最實用的一段。Brian 直接點出：**RAG 化的欄位，其值至少要 30 個字元**，否則向量化拿不到足夠上下文。問題是很多 Domino 應用的欄位天生就短——他用一個玩具公司的庫存/銷售系統示範，客戶、數量、成本這些欄位各自只有十來個字，單獨都過不了門檻。

解法很 Domino：**加一個「abstract」欄位，把多個欄位串（concatenate）成一段有標籤的文字**，再讓 Domino IQ 只針對這個欄位向量化。Brian 的欄位長這樣——標明「這是一筆 sale」、成本、數量、產品名、公司名、聯絡資訊、地點，全部串在一起。這樣單一欄位就有足夠上下文，他當場對上千筆銷售問「最暢銷產品是哪個」，很快就回出正確答案。

兩個延伸提醒：
- **既有文件要 refresh** 才會補上這個新欄位——用 LotusScript、formula、或一支 compute-with-form 的 agent 重算即可。
- **串接的格式會影響品質**：純文字加欄位標籤可以，但 Q&A 時 Brian 與主持人都提到，**改用 JSON 效果明顯更好**；再進一步可以用類似 HTML 標籤的「AI tags」（`<cost>…</cost>` 這種），AI 系統很吃這套。要試出最適合你問法的結構。

## 向量化：三個步驟 + 三個旋鈕

Brian 把向量化拆成很清楚的三步（跟站上[技術文](/domino-news/posts/domino-iq-rag)的前置條件一致）：

1. **資料庫先做 full-text index**——向量化是「搭」在全文索引上建的。
2. **在 Domino Administrator 右鍵該資料庫 → Domino IQ → 啟用向量化**。
3. **主控台跑 `load updall -w`**——這個 `-w` 告訴索引器順便建向量資料。

（他說這步之後會自動化；他自己已經用 LotusScript 把「建全文索引 + 向量化」都寫成自動流程。）

三個常被問到的設定，Brian 給了他自己的實測值：

| 設定 | 作用 | Brian 的值 |
|---|---|---|
| `rag maximum responses` | 一次撈幾份文件來組答案；越多越慢 | 約 20 |
| `rag threshold` | 文件片段的最低相似度（品質過濾）；越高越精準但可能漏掉部分符合 | 0.4（40%） |
| `temperature` | 回應的隨機度；越高越有創意但越容易幻覺 | 0.1–0.4（要準就壓低） |

## Readers/Authors 欄位安全：FP1 才真正修好

這題是 Q&A 裡並列最多人問的其中一個，也是這場最值得記的「更新」：**RAG 會遵守 Domino 的文件層安全模型（Readers 欄位）**——一個只被授權看 4 萬份文件的使用者，不會從那 20 萬份的 RAG 來源撈到他不該看的內容。

站上[技術文](/domino-news/posts/domino-iq-rag)引[官方 RAG 文件](https://help.hcl-software.com/domino/14.5.1/admin/conf_iq_rag_support.html)寫過這是內建行為；webinar 補上的關鍵時間點是——**Domino 2026 GA 出貨時這功能其實沒正常運作，是到 2026 FP1 才修好**。如果你在 GA 版上試過 RAG 又擔心 Readers 有沒有被尊重，答案是：升到 FP1。

## 開發中、即將到來的

Brian 一開場就聲明有些畫面是開發版、細節會變，但概念會進近期版本。幾個值得期待的：

- **Citations（回應附出處）**：不只給你答案，還指出答案是從哪份文件來的——他示範的那份甚至是 **PDF**，Domino IQ 把 PDF 內容也向量化了，一樣能標出處。對開發者除錯與稽核很有用。
- **Notes client 側邊面板**：在 client 裡**任何地方**（不必待在那個資料庫、甚至不必改 app 設計）叫出 Domino IQ 問 RAG、做摘要或翻譯。
- **MCP server**：`model context protocol` 內建進 Domino IQ，讓 AI 不只回答、還能執行動作（開工單、寄信、改文件狀態）。Brian 說**約 12 個月內**會看到，未必落在 Domino 2027，但在路上。至於 AI agent——**今天就能做**，用一支 Domino agent（JavaScript / Java / LotusScript 都行）接 Domino IQ 的回應去執行動作即可。

硬體面順帶一提：本機 LLM 目前仍需 **Nvidia GPU**（非 Nvidia、ARM／Raspberry Pi 都在路上）；不想買 GPU 也可接第三方 LLM（OpenAI / Gemini），但要付 token 費——GPU 是一次性、token 是每月，Brian 花不少篇幅講這筆帳。想跑本機、又不知道挑哪個模型，Brian 自己用、也最喜歡的是 **Hugging Face 上的 Llama 3.3 8B instruct（Q5）**——不過他也提醒，純翻譯需求有更專門的模型。

---

想看完整示範（含那個 concat 欄位怎麼設、citations 與側邊面板長怎樣），[錄影在 OpenNTF 的 YouTube](https://www.youtube.com/watch?v=J26LvWtq8-Y)。想先懂這條 RAG 管線在 server 裡的技術原理，看站上的 [Domino IQ RAG 拆解](/domino-news/posts/domino-iq-rag)；想看 Domino IQ 的整體背景，則有 [Domino IQ 那篇](/domino-news/posts/domino-iq)。
