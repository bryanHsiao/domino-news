# Domino News

> AI-curated daily news for HCL Domino and its ecosystem (Notes, Domino REST API, Volt MX, Nomad, AppDev Pack, Sametime…).
> Bilingual: Traditional Chinese (default) + English.

🌐 **Site**: https://bryanhsiao.github.io/domino-news/

## 架構

```
GitHub Actions (cron 每天 23:00 UTC ≒ 台灣 07:00)
        ↓
scripts/generate-article.ts
        ↓
[1] OpenAI Responses API + web_search_preview  ← 產出雙語 markdown
        ↓
[2] Claude (Anthropic) 跨廠審稿                ← critical 直接 fail
        ↓
[3] OpenAI gpt-image-1 產封面圖                ← public/covers/<slug>.png
        ↓
src/content/posts/{zh-TW,en}/YYYY-MM-DD-slug.md
        ↓
git commit & push → 觸發 deploy.yml
        ↓
Astro build → GitHub Pages
```

- **框架**：Astro 5（static site）
- **內容**：Markdown + Astro Content Collections（含 schema 驗證）
- **i18n**：路由式切換（`/` 繁中、`/en/` 英文）
- **產文 AI**：OpenAI Responses API（預設 `gpt-4o`，可改 `OPENAI_MODEL`）
- **審稿 AI**：Anthropic Claude（預設 `claude-sonnet-4-6`，可改 `ANTHROPIC_MODEL`）— 跨廠交叉檢查 API 名稱、版號、遺漏的替代方案；critical 等級會擋下發文
- **封面 AI**：OpenAI `gpt-image-1`（品質可改 `OPENAI_IMAGE_QUALITY`）
- **部署**：GitHub Pages

## 本地開發

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # 產生 dist/
npm run preview      # 預覽 build 結果
```

## 手動產生一篇文章（本地）

```bash
export OPENAI_API_KEY=sk-...
npm run generate:article
```

文章會寫入 `src/content/posts/zh-TW/` 與 `src/content/posts/en/`。

## GitHub Secrets / Variables 設定

到 repo Settings → Secrets and variables → Actions：

| 名稱 | 類型 | 說明 |
|---|---|---|
| `OPENAI_API_KEY` | Secret | 必填，OpenAI API key（產文 + 封面圖） |
| `OPENAI_MODEL` | Variable（可選） | 預設 `gpt-4o` |
| `OPENAI_IMAGE_MODEL` | Variable（可選） | 預設 `gpt-image-1` |
| `OPENAI_IMAGE_QUALITY` | Variable（可選） | `low` / `medium` / `high` / `auto`，預設 `medium` |
| `ANTHROPIC_API_KEY` | Secret（建議） | 跨廠審稿用 Claude，沒設就跳過審稿步驟 |
| `ANTHROPIC_MODEL` | Variable（可選） | 預設 `claude-sonnet-4-6` |

> 沒設 `ANTHROPIC_API_KEY` 也能跑，但少了第二層事實校對。建議加上，每篇審稿成本約 $0.024。

## 啟用 GitHub Pages

1. Settings → Pages → Source 選 **GitHub Actions**
2. 推一次 commit 到 `main`，`deploy.yml` 會自動部署
3. 完成後網址：`https://bryanhsiao.github.io/domino-news/`

## SEO / 索引

每頁 `<head>` 已內建：

- `<meta name="description">`、Open Graph、Twitter Card
- `<link rel="canonical">` + `hreflang` 中英互指
- 文章頁 JSON-LD（`BlogPosting`）結構化資料
- `<meta name="google-site-verification">`（綁定 Search Console）

build 時自動產生：

- `sitemap-index.xml`（含 `sitemap-0.xml`，所有中英頁面）
- `robots.txt` 指向上述 sitemap
- `rss-zh-TW.xml` / `rss-en.xml`

### Google Search Console

資源已驗證：`https://bryanhsiao.github.io/domino-news/`，sitemap 已提交。

新文章 push 後 1–7 天會被自動收錄。要立刻推某篇加速：Search Console → 網址審查 → 貼文章 URL → **要求建立索引**（每天配額 ~10 篇）。

## 兩段產文 + 失敗草稿救援

每天 07:00 (Taipei) 的流程允許**兩次嘗試**：

1. **Attempt 1** — 正常模式（TIER A/B/C 都可）。若 Claude 審稿過關（無 critical fact error 且無 topic overlap）→ 發布、收工。
2. **Attempt 2** — TIER C-only fallback。觸發條件是 Attempt 1 任一原因失敗。Prompt 強制 AI 從 HCL docs 挖一個沒寫過的 class/method/feature 寫深度教學。被 Attempt 1 退回的 slug 也加進 forbidden list，避免它再撞同主題。

**封面圖**只在 review pass 之後產，retry 不會浪費 $0.05。

### 失敗時：草稿救援區

當 **Attempt 2 也失敗**，workflow 會把兩次嘗試的草稿 commit 到 `_drafts/`：

```
_drafts/
  2026-04-29-attempt1-foo-bar.zh-TW.md
  2026-04-29-attempt1-foo-bar.en.md
  2026-04-29-attempt2-baz-qux.zh-TW.md
  2026-04-29-attempt2-baz-qux.en.md
```

每個草稿檔頭有一段 HTML 註解，列出 Claude 找到的 review issues，例如：

```html
<!--
REJECTED DRAFT — review: 3 critical fact issue(s)
attempt: 2
slug: domino-rest-api-quickstart
issues:
  [critical] Step 4: 'Create a schema … This can be done using Domino Designer.'
      problem: schemas are NOT created in Domino Designer ...
      fix:     Replace with: 'Create a schema using the Domino REST API Admin UI ...'
-->
```

### 救援方式 A — 用 Claude Code（推薦）

```bash
git pull           # 把 _drafts/ 拉下來
claude code        # 在 repo 目錄開
```

跟 Claude 說一句：

> 救 `_drafts/2026-04-29-attempt2-domino-rest-api-quickstart`，把所有重複的連結改成正確的（Postman→postman.com、OpenNTF Discord→discord.gg/openntf），schema 那段改成「在 Domino REST API Admin UI 建 schema」

Claude 會：
1. 讀草稿 + 內嵌的 review issues
2. 套用你的指示修文（zh + en 兩篇）
3. 移到 `src/content/posts/{zh-TW,en}/`（暫時不要寫 `cover:` 欄位）
4. 從 `_drafts/` 刪掉
5. commit + push → 部署
6. **觸發 backfill 補封面**：`gh workflow run backfill-covers.yml`（~45 秒，自動掃沒封面的 post 補上 + 寫回 `cover:` 欄位）

### 救援方式 B — 手動

1. 直接編輯 `_drafts/` 裡的 .md 檔
2. 拿掉 frontmatter 的 `draft: true`
3. 把檔名改成 `YYYY-MM-DD-<slug>.md`，搬到 `src/content/posts/{zh-TW,en}/`
4. 從 `_drafts/` 刪掉草稿
5. `git add` + `git commit` + `git push`
6. 觸發 `gh workflow run backfill-covers.yml` 補封面（同上）

### 失敗通知

| 機制 | 觸發時機 | 怎麼看 |
|---|---|---|
| GitHub Email | workflow 紅燈 | 你 GitHub 註冊信箱 |
| Step Summary | 每次 run 都寫 | run 頁面頂端 markdown 摘要：用了 fallback 嗎、失敗原因、發了什麼 |
| Commit message | 用了 fallback 但成功時 | `git log` 帶 `[fallback: ...]` 後綴 |
| `_drafts/` 增加檔案 | 兩次都失敗 | `git pull` 後本地就看到 |

## 文章 schema

每篇文章 frontmatter 必填欄位（見 `src/content.config.ts`）：

```yaml
title: "標題"
description: "60-100 字摘要"
pubDate: 2026-04-28
lang: zh-TW            # 或 en
slug: kebab-case-slug  # zh-TW 與 en 配對的 slug 必須相同
tags:
  - "Domino"
  - "REST API"
sources:
  - title: "Source title"
    url: "https://..."
```

## Tag 分類

Tag 是篩選器 —— 每篇都會有的 tag（例如 `Domino`、`HCL`）等於沒篩選力，不收。
每篇選 **2–4 個** tag，盡量從下列 4 軸各挑一個適用的；不適用就跳過該軸。

| 軸 | 顏色 | 用途 | Tag |
|---|---|---|---|
| **產品 / 模組** | 🔴 紅 | 這篇在講哪個東西 | `Domino Server`, `Notes Client`, `Domino Designer`, `Domino REST API`, `Volt MX`, `Nomad`, `AppDev Pack`, `Sametime`, `Domino IQ` |
| **技術 / 語言** | 🔵 藍 | 用什麼寫的 | `LotusScript`, `Formula`, `Java`, `XPages`, `JavaScript`, `DQL`, `OIDC` |
| **主題** | 🟣 紫 | 解決什麼問題 | `Security`, `Performance`, `Migration`, `Backup`, `DevOps`, `Admin` |
| **內容類型** | ⚪ 灰 | 哪種文 | `Release Notes`, `Tutorial`, `News`, `Community` |

範例：

- HCL Domino 2026 發布 → `Release Notes` `Domino Server` `Domino IQ` `OIDC`
- DQL 入門教學 → `Tutorial` `DQL` `LotusScript` `Domino REST API`
- ID vault 加固 → `Admin` `Security` `Domino Server`

要新增 tag 在 **3 處** 同步：

1. `scripts/generate-article.ts` 的 `TAGS_PRODUCT` / `TAGS_TECH` / `TAGS_TOPIC` / `TAGS_TYPE`
2. `src/lib/tags.ts` 的 `TAG_CATEGORIES`（決定顏色）
3. 本 README 表格

## License

Code: MIT. 文章內容由 AI 整理自公開來源，引用時請保留原始連結。
