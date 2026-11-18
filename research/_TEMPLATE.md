<!--
研究軌跡 sidecar 範本 —— 複製這個檔，改名成 research/<YYYY-MM-DD>-<slug>.md 再填。
（本檔名以 _ 開頭、無日期，/how-its-made 不會把它當成一張卡。）

⚠️ 這幾個「## 標題」是 /how-its-made.astro 的解析錨點，字不要改：
    ## 查證 checklist      ## 標題候選      ## 異動日誌      ## 獨立審查 (review)
  用別的字（例如「## 驗證清單」）頁面就抓不到，卡片會半空。

• 研究來源：內文只要出現官方 doc 檔名（H_xxx.html / r_domino_Xxx.html）就會自動列出。
• provenance 欄位（requester / author_model / review_model / review_result）——
  「有實際跑才填」。沒跑獨立審查就整欄留空，/how-its-made 會誠實留白，不要編造「審查 PASS」。
• 完整欄位說明見同目錄的 README.md。
-->
---
slug: <slug>
title: "<文章標題（與 zh 文一致）>"
lang: zh-TW · en
pubDate: <YYYY-MM-DDT07:30:00+08:00>
tags: ["<Tag1>", "<Tag2>"]
status: staged            # staged（在 _pending）→ promote 後改 shipped
requester: <使用者 / cron / 救援>
author_model: <寫作模型，例如 Opus 4.8>
review_model: <審查模型——獨立於寫作的那個；沒跑獨立審查就留空>
review_result: <humanizer 分數 + 獨立 fact-check verdict；沒跑就留空>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
---

# Research trail — <slug> (<YYYY-MM-DD>)

**Topic**: <一句話：這篇在講什麼、為什麼挑這題>

## 研究來源

- **NotebookLM**：<notebook URL> ｜ 完整問句：<...> ｜ 有無回答：<✅ / ⚠️ 污染→WebFetch / Missing Information> ｜ 取得：<...>
- **WebFetch**（逐一驗證非 404）：
  - <官方 doc URL，檔名含 H_xxx.html 或 r_domino_Xxx.html> — <取得什麼>
  - <...>
- **矛盾檢查**：<兩源有無衝突、怎麼收斂>

## 獨立審查 (review)

<用「不同於寫作」的模型重抓官方文件、逐條核對技術主張。沒跑這步就把整段留空或刪掉，不要填假的。>
- reviewer 模型：<...>
- verdict：<PASS / ISSUES → 已修>
- 抓到的問題：<...>

## 查證 checklist

- [ ] NotebookLM → WebFetch 研究鏈走完
- [ ] 交叉驗證無矛盾
- [ ] 所有 URL 非 404
- [ ] inline-link diversity（每語言 3 條不重複、單一 URL < 40%）
- [ ] build 通過
- [ ] humanizer-zh-tw
- [ ] 獨立審查（有跑才打勾）

## 標題候選

<候選放反引號 `…` 內，/how-its-made 的 parseTitleChoices 靠它解析。角度例：問題先行 / 好處先行 / 概念 hook。汰除的也保留，是稽核軌跡。>
- [汰除] 概念：`<候選標題>` — <為什麼沒選>
- [汰除] 好處先行：`<候選標題>` — <為什麼沒選>
- [選定] 問題先行：`<候選標題>` — <為什麼選它>

## 異動日誌

- <YYYY-MM-DD> 建檔 / 研究 / 草稿 / 獨立審查 / 標題優化 / 進 _pending / promote（who + when，一行一事）
