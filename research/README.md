# `research/` — 每篇技術文的研究軌跡 (source-verification trail)

每一篇技術深入文（走 `domino-news-tech-article` skill 產出的那種）在這裡
留一份**同 slug 的研究軌跡 sidecar**：`research/<YYYY-MM-DD>-<slug>.md`。

目的：日後任何人都能驗證這篇的技術主張怎麼來的——查了哪個 NotebookLM
notebook、問了什麼、有沒有走完 NotebookLM → WebFetch 研究鏈、來源有沒有
交叉驗證。這是內部稽核用，**不會上站**（Astro 只讀 `src/content/posts/`）。

## 為什麼有這個

2026-08 發現 NotebookLM 因 Google 改名（`notebooklm` → `notebook.google.com`）
一度查詢失效，卻沒有機制能事後確認「哪幾篇當時到底有沒有查證」。sidecar
就是把每篇的查證過程留成可稽核的痕跡，讓這種疑問永遠有答案。

## 格式

frontmatter（對應投影片那套「誰提出／用什麼模型／何時」的標示）：

| 欄位 | 意義 |
|---|---|
| `slug` / `title` / `lang` / `pubDate` / `tags` | 對應文章本身 |
| `status` | `staged`（在 `_pending`）→ `shipped`（已 promote） |
| `requester` | **誰提出**這篇（使用者 / cron / 救援…） |
| `author_model` | **寫作模型**（AI 用什麼模型寫的） |
| `review_model` | **審查模型**——獨立於寫作的那個模型（見下） |
| `review_result` | 審查結論（humanizer 分數 + 獨立事實查核 verdict） |
| `created` / `updated` | 建檔 / 最後更新日期 |

內文四段：

1. **研究來源**：NotebookLM（notebook URL + 完整問句 + 有沒有回答 + 取得什麼）；
   WebFetch（每個 URL + 驗證非 404 + 取得什麼）；矛盾檢查結論。
2. **獨立審查 (review)**：用**不同模型**的 reviewer 重新抓官方文件、逐條核對
   文章的技術主張，記下 verdict（通過 / 有疑點）與抓到的問題。刻意跟寫作模型
   分開，避免「同一個模型自己審自己」。
3. **查證 checklist**：研究鏈走完 / 交叉驗證無矛盾 / URL 非 404 /
   inline-link diversity / build / humanizer-zh-tw / 獨立審查。
4. **異動日誌**：who + when 時間軸——建檔、研究、草稿、獨立審查、進
   `_pending`、promote。

第一篇範例：[`2026-08-07-java-recycle-memory.md`](2026-08-07-java-recycle-memory.md)。

## 不含

沒有「修改範圍 / 依賴」那類欄位——那是給改 code 的 issue 用的，文章沒有
「動了哪些檔」。文章的 sidecar 專注在**來源查證**這一件事。
