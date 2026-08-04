---
slug: openntf-domino-iq-rag-webinar
title: "Field Notes from OpenNTF's Domino IQ RAG Webinar"
lang: [zh-TW, en]
pubDate: 2026-08-04
status: shipped                    # 新聞/社群，Path B 當日直接上站
tags: [Domino IQ, AI, Community]
requester: 使用者 (bryan)          # 誰提出這篇（印象 OpenNTF 有 RAG 影片→計畫 A）
author_model: claude-opus-4-8      # 寫作模型
review_model: claude-sonnet (獨立 reviewer subagent)  # 審查模型（獨立於寫作）
review_result: "獨立事實查核(Sonnet，對逐字稿) PASS；2 個小修（死連結、Llama 措辭）"
created: 2026-08-04
updated: 2026-08-04
---

# 研究軌跡 — openntf-domino-iq-rag-webinar

**類型：新聞 / 社群 recap**（非技術 class 深入文，走 CLAUDE.md 的 news 流程，
不進 coverage tracker）。執行 memory `project_openntf_rag_webinar_recap` 的計畫 A。

## 研究來源 (Research trail)

### 主來源：webinar 錄影逐字稿（**非** NotebookLM）
- 這是一場活動的回顧，**主來源就是錄影本身**，不是 NotebookLM notebook。
- 影片：OpenNTF Webinar「DominoIQ RAG」（講者 Brian Arnold, HCL），
  `https://www.youtube.com/watch?v=J26LvWtq8-Y`，上架 2026-08-03、片長 ~88 分。
- 用 `baoyu-youtube-transcript` skill 抓完整逐字稿（379 行）；文中每個技術主張
  都對得到逐字稿的時間戳（30 字元、三步驟、三旋鈕值、FP1 修 Readers、
  citations/側邊面板/MCP 皆 Brian 原話）。

### 框架事實：WebFetch 官方文件
- `conf_iq_rag_support.html`（14.5.1）— ✅ 存在（"RAG for the Domino IQ server"），
  RAG 內建行為的官方出處。
- OpenNTF blog（`openntf.org/blogs/openntf.nsf/`）— 確認活動存在。
- 交叉連結站上既有技術文 [domino-iq-rag](/domino-news/posts/domino-iq-rag)、
  [domino-iq](/domino-news/posts/domino-iq)。

### 死連結修正
原本引 `wn_dom_iq_rag.html`（「Domino IQ adds RAG capability」）——獨立審查
WebFetch 時**404**（該頁移位/移除）。已換成既有文章驗證過的
`conf_iq_rag_support.html`（frontmatter source + inline 皆改）。

## 獨立審查 (review)

**審查模型**：Claude Sonnet（獨立 reviewer subagent，與寫作模型分開）。
**方法特別**：給它**逐字稿檔案**，逐條核對「文中的 Brian 主張是否真的出自逐字稿」
——recap 最怕加油添醋，這是最關鍵的把關。

**VERDICT：PASS**（recap 忠實呈現逐字稿，無捏造、無把 future 講成 shipped、
數字無誇大）。逐條都對到時間戳（含 30 字元 ~[29:32]、三旋鈕值、
Readers FP1 修正 ~[57:28]「we thought we had it in place. It was not
functioning correctly. It is now.」）。兩個小修已處置：

- ✅ **死連結**：`wn_dom_iq_rag.html` 404 → 換 `conf_iq_rag_support.html`（已驗證）。
- ✅ **Llama 措辭略過**：Brian 是在「翻譯」問題脈絡說「我用 Llama 3.3、最喜歡這支」、
  且附「純翻譯有更專門的模型」的 caveat。原文寫「推薦當通用起點」偏放大，已改成
  「Brian 自己用、也最喜歡的」+ 保留 caveat（zh + en）。

## 查證 checklist
- [x] 主來源逐字稿完整抓取（379 行）並逐條核對
- [x] 框架事實 WebFetch 官方 RAG 文件（含替換死連結）
- [x] 三個 frontmatter source URL 皆驗證非 404
- [x] inline-link diversity 通過（各語言 3 個相異 URL 各 1 次 = 33%）
- [x] 雙語 build 通過（frontmatter schema）
- [x] humanizer-zh-tw pass（收斂 reveal 破折號）
- [x] 獨立事實查核（對逐字稿）PASS，2 小修已處置
- [x] future 功能（citations/側邊面板/MCP）皆標為「開發中」，未講成已 ship

## 異動日誌
- 2026-08-04 抓逐字稿、WebFetch 官方文件、雙語 recap、sidecar（Opus 4.8）
- 2026-08-04 humanizer pass（Opus 4.8）
- 2026-08-04 獨立事實查核（Sonnet，對逐字稿）→ PASS + 修死連結/Llama（Opus 4.8）
- 2026-08-04 Path B 當日直接上站（pubDate 15:00 +08:00）
