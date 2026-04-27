# Domino News

> AI-curated daily news for HCL Domino and its ecosystem (Notes, Domino REST API, Volt MX, Nomad, AppDev Pack, Sametime…).
> Bilingual: Traditional Chinese (default) + English.

🌐 **Site**: https://bryanHsiao.github.io/domino-news/ (待 GitHub Pages 啟用)

## 架構

```
GitHub Actions (cron 每天 00:30 UTC)
        ↓
scripts/generate-article.ts
        ↓
OpenAI Responses API + web_search_preview
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
- **AI**：OpenAI Responses API（model 預設 `gpt-4o`，可改 `OPENAI_MODEL`）
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
3. 完成後網址：`https://bryanHsiao.github.io/domino-news/`

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

## 允許的 tag 列表

`Domino`, `Notes`, `REST API`, `Volt MX`, `Nomad`, `AppDev Pack`, `Sametime`, `HCL`, `Security`, `Performance`, `Migration`, `LotusScript`, `XPages`, `Java`, `DevOps`, `AI`, `Release Notes`, `Tutorial`, `Community`

要新增 tag 在兩處同步更新：
- `scripts/generate-article.ts` 的 `ALLOWED_TAGS`
- 視需要在 README 補充

## License

Code: MIT. 文章內容由 AI 整理自公開來源，引用時請保留原始連結。
