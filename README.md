# Domino News

> HCL Domino 中英雙語新知站 — 技術深度文章 + 生態系動態。
> Traditional Chinese (default) + English.

🌐 **Site**: https://bryanhsiao.github.io/domino-news/

---

## 站長維護手冊（記得要做的事）

這段是寫給「以後忘了當初設過什麼」的自己看的。Claude 幫忙寫文章那些細節在 `CLAUDE.md` 跟 `.claude/skills/domino-news-tech-article/SKILL.md`，這節只列**人類站長要動手的**事。

### 📅 定期到期事項

| 項目 | 到期日 | 到期前症狀 | 怎麼續 |
|---|---|---|---|
| **`PAT_FOR_PUBLISH`** secret（GitHub fine-grained PAT） | **2027-05-19** | `publish-pending.yml` cron 開始 fail、文章卡在 `_pending/` 不會自動發布 | 1) [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta) 建新 token，scope 同舊版：`Contents: read/write` + `Actions: read/write` on `domino-news` only<br/>2) Repo Settings → Secrets → 更新 `PAT_FOR_PUBLISH` 為新 token<br/>3) `gh workflow run publish-pending.yml --ref main` 測一次確認 OK |
| `OPENAI_API_KEY` | 沒到期、依你帳號設定 | 封面圖生成 fail、daily-article cron fail | OpenAI dashboard 重發 key → Repo Settings → Secrets 更新 |
| `ANTHROPIC_API_KEY` | 沒到期、依你帳號設定 | daily-article 跨廠審稿步驟跳過（不致命，但少一層 fact check） | Anthropic console 重發 → Repo Settings → Secrets 更新 |

### 🔄 依需要做的事

| 情境 | 動作 |
|---|---|
| OpenNTF/ls-classmap 有更新（新版 Domino 出新 class）| 重跑 `data/README.md` 內的 curl 指令更新 `data/ls_classes.json`、再 `npm run coverage` 重生 `docs/coverage.md` |
| `_drafts/` 累積 daily-article 失敗草稿太多 | 用 `domino-news-tech-article` skill 救援（Claude 跑）或手動刪掉 |
| 要寫文章 | 開 Claude Code、跟 Claude 說主題 — skill 會走完研究 → 寫 → ship 流程；future-dated 文章自動進 `_pending/`，cron 到日子會自己發 |
| 寫好但想立刻發（不等明早 cron）| `gh workflow run publish-pending.yml --ref main` |

### 💰 成本提醒

| 項目 | 大約 |
|---|---|
| daily-article cron 每篇 | OpenAI ~$0.04（GPT-4o + 圖）+ Anthropic ~$0.024（審稿）≒ **$0.06/篇** |
| 手動 backfill-covers 重生封面 | $0.05/封面 |
| 完全停 daily cron | 在 `.github/workflows/daily-article.yml` disable cron schedule（保留 manual trigger）|

---

## 手動指令查表

```bash
# 立刻發布 _pending/ 內已到期的文章（不等 cron）
gh workflow run publish-pending.yml --ref main

# 為缺封面的文章補圖（少數情境用）
gh workflow run backfill-covers.yml --ref main

# 強制重生所有封面（FORCE_REGEN）— 慎用，會花錢
gh workflow run backfill-covers.yml --ref main -f FORCE_REGEN=1

# 立刻部署到 GitHub Pages（避開 cron 等待）
gh workflow run deploy.yml --ref main

# 重新算 docs/coverage.md（看哪些 LS class 還沒寫過）
npm run coverage

# 手動跑一次 daily-article cron（debug 用）
gh workflow run daily-article.yml --ref main
```

---

## 本地開發

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # 產生 dist/
npm run preview      # 預覽 build 結果
```

需要本機產文章時：

```bash
export OPENAI_API_KEY=sk-...
npm run generate:article
```

---

## 架構速覽

| 元件 | 在哪 |
|---|---|
| **框架** | Astro 5（static site，輸出到 GitHub Pages） |
| **內容** | Markdown + Astro Content Collections（schema 在 `src/content.config.ts`） |
| **i18n** | 路徑式（`/` 繁中、`/en/` 英文） |
| **發布排程** | `_pending/{zh-TW,en}/` 排隊 → `publish-pending.yml` cron 每天 23:30 UTC 升上 `src/content/posts/`（細節在 `CLAUDE.md` 的 Scheduling pattern 段） |
| **寫文流程** | Claude Code + `.claude/skills/domino-news-tech-article/SKILL.md` |
| **研究 source** | NotebookLM 5 本 + WebFetch fallback（notebook 清單見 `CLAUDE.md` 的 NotebookLM usage 段） |
| **封面生成** | OpenAI `gpt-image-1`、12 種風格 sampling-without-replacement、`scripts/lib/cover-prompt.ts` |
| **每日 AI 產文（自動）** | `scripts/generate-article.ts` + `daily-article.yml`（目前狀態見 CLAUDE.md） |

---

## GitHub Secrets 完整清單

Repo Settings → Secrets and variables → Actions：

| 名稱 | 類型 | 必填 | 說明 |
|---|---|---|---|
| **`PAT_FOR_PUBLISH`** | Secret | ✅ | fine-grained PAT、給 `publish-pending.yml` cron commit 使用、attribution 才會掛到你帳號下。2027-05-19 到期、見上面維護表 |
| `OPENAI_API_KEY` | Secret | ✅ | 產文 + 封面圖 |
| `ANTHROPIC_API_KEY` | Secret | 建議 | 跨廠審稿（少了 fact-check 不致命） |
| `OPENAI_MODEL` | Variable | 可選 | 預設 `gpt-4o` |
| `OPENAI_IMAGE_MODEL` | Variable | 可選 | 預設 `gpt-image-1` |
| `OPENAI_IMAGE_QUALITY` | Variable | 可選 | `low`/`medium`/`high`/`auto`、預設 `medium` |
| `ANTHROPIC_MODEL` | Variable | 可選 | 預設 `claude-sonnet-4-6` |

---

## 文章 frontmatter schema

完整定義在 `src/content.config.ts`，必填欄位：

```yaml
title: "標題"
description: "60-100 字摘要"
pubDate: 2026-05-20T07:30:00+08:00   # 用 +08:00 對齊 nightly-rebuild cron
lang: zh-TW                          # 或 en
slug: kebab-case-slug                # zh + en 必須相同
tags:
  - "Tutorial"
  - "LotusScript"
sources:
  - title: "Source title"
    url: "https://..."
relatedJava: ["ClassName"]           # Java 對位 class、無對位寫 []
relatedSsjs: ["className"]           # SSJS 對位、無對位寫 []
```

`cover` / `coverStyle` 由 `backfill-covers.yml` 自動寫入、人類不用手動填。

---

## Tag 分類

每篇選 **2–4 個** tag、盡量從 4 軸各挑一個適用的；不適用就跳過該軸。

| 軸 | 顏色 | 用途 | Tag |
|---|---|---|---|
| **產品 / 模組** | 🔴 紅 | 在講哪個東西 | `Domino Server`, `Notes Client`, `Domino Designer`, `Domino REST API`, `Volt MX`, `Nomad`, `AppDev Pack`, `Sametime`, `Domino IQ` |
| **技術 / 語言** | 🔵 藍 | 用什麼寫的 | `LotusScript`, `Formula`, `Java`, `XPages`, `JavaScript`, `DQL`, `OIDC` |
| **主題** | 🟣 紫 | 解決什麼問題 | `Security`, `Performance`, `Migration`, `Backup`, `DevOps`, `Admin`, `Container`, `Community` |
| **內容類型** | ⚪ 灰 | 哪種文 | `Release Notes`, `Tutorial`, `News` |

要新增 tag 三處同步：
1. `scripts/generate-article.ts` 的 `TAGS_PRODUCT` / `TAGS_TECH` / `TAGS_TOPIC` / `TAGS_TYPE`
2. `src/lib/tags.ts` 的 `TAG_CATEGORIES`（決定顏色）
3. 本 README 表格

---

## SEO

每頁內建：`<meta description>`、Open Graph、Twitter Card、`<link rel="canonical">` + `hreflang`、文章頁 JSON-LD（`BlogPosting`）、`google-site-verification`。

build 時自動產生：`sitemap-index.xml`、`robots.txt`、`rss-zh-TW.xml`、`rss-en.xml`。

Google Search Console 已綁定、sitemap 已提交。新文章 push 後 1–7 天會自動收錄；要急可走 Search Console → 網址審查 → 要求建立索引。

---

## License

Code: MIT。文章內容引用公開來源、引用時請保留原始連結。
