/**
 * Daily HCL Domino article generator.
 *
 * Strict source-grounded flow:
 *   1. Load recent post titles to avoid duplicates.
 *   2. Ask OpenAI (with web_search) to find ONE noteworthy story published in the
 *      last 72 hours, citing real sources only.
 *   3. Validate: >=2 real source URLs, body contains >=2 inline links, no banned
 *      placeholder hosts (example.com, etc.).
 *   4. Write zh-TW and en Markdown into src/content/posts/{lang}/YYYY-MM-DD-slug.md.
 *
 * Required env: OPENAI_API_KEY
 * Optional env: OPENAI_MODEL (default gpt-4o)
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o';
const LOOKBACK_DAYS = 30;

const ALLOWED_TAGS = [
  'Domino',
  'Notes',
  'REST API',
  'Volt MX',
  'Nomad',
  'AppDev Pack',
  'Sametime',
  'HCL',
  'Security',
  'Performance',
  'Migration',
  'LotusScript',
  'XPages',
  'Java',
  'DevOps',
  'AI',
  'Release Notes',
  'Tutorial',
  'Community',
] as const;

const BANNED_HOSTS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'foo.com',
  'bar.com',
  'test.com',
  'placeholder.com',
  'yoursite.com',
]);

const TRUSTED_HOST_HINTS = [
  'hcl-software.com',
  'hcltechsw.com',
  'hcltech.com',
  'hcl.com',
  'planetlotus.org',
  'openntf.org',
  'github.com',
  'github.io',
  'medium.com',
  'wordpress.com',
  'youtube.com',
  'csi-international.com',
  'panagenda.com',
  'prominic.net',
  'belsoft.com',
];

interface BilingualArticle {
  slug: string;
  tags: string[];
  zh: { title: string; description: string; markdown: string };
  en: { title: string; description: string; markdown: string };
  sources: { title: string; url: string }[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function frontmatter(data: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
        continue;
      }
      if (typeof value[0] === 'object') {
        lines.push(`${key}:`);
        for (const item of value) {
          const entries = Object.entries(item as Record<string, unknown>);
          const [firstKey, firstVal] = entries[0];
          lines.push(`  - ${firstKey}: ${JSON.stringify(firstVal)}`);
          for (const [k, v] of entries.slice(1)) {
            lines.push(`    ${k}: ${JSON.stringify(v)}`);
          }
        }
      } else {
        lines.push(`${key}:`);
        for (const item of value) lines.push(`  - ${JSON.stringify(item)}`);
      }
    } else if (value instanceof Date) {
      lines.push(`${key}: ${value.toISOString()}`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

async function loadRecentTitles(lang: 'zh-TW' | 'en'): Promise<string[]> {
  const dir = join(POSTS_DIR, lang);
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  const cutoff = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const titles: string[] = [];
  for (const f of files) {
    if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
    const datePart = f.slice(0, 10);
    const ts = Date.parse(datePart);
    if (Number.isNaN(ts) || ts < cutoff) continue;
    const raw = await readFile(join(dir, f), 'utf8');
    const m = raw.match(/^title:\s*"?([^"\n]+)"?/m);
    if (m) titles.push(m[1].trim());
  }
  return titles;
}

function buildPrompt(recentTitles: string[]): string {
  return `You are an editor for a daily HCL Domino news site. Your standards are:
NEVER fabricate. EVERY factual claim must come from a real source you opened via
the web_search tool in THIS session. Sources must be real URLs that load.

TASK: Find material for ONE article about HCL Domino or its ecosystem
(HCL Notes, Domino REST API, Volt MX, HCL Nomad, AppDev Pack, Sametime, OpenNTF, etc.).

YOU MUST INVOKE web_search AT LEAST 3 TIMES with different queries before deciding
there is nothing to write about. Suggested queries to rotate through:
  - HCL Domino release 2025 OR 2026
  - HCL Domino REST API
  - HCL Nomad update
  - OpenNTF project announcement
  - HCL Volt MX
  - HCL Sametime
  - site:hcl-software.com Domino
  - site:openntf.org
  - HCL Ambassador blog Domino
  - planetlotus.org

CONTENT TIERS (pick the highest tier you can fully source):
  TIER A — News from the last 14 days (release, security advisory, official announcement, conference recap)
  TIER B — Technical post / tutorial / OpenNTF project from the last 60 days
  TIER C — Deep-dive explainer on a HCL Domino topic, citing 2+ authoritative current sources (official docs published or updated within the last 12 months, plus a recent community article)

ACCEPTABLE SOURCE TYPES (rough priority):
  1. Official HCL pages: hcl-software.com, hcltechsw.com, hcl.com, support.hcl-software.com
  2. HCL official documentation / help center pages
  3. HCL Ambassador or HCL Master blogs
  4. OpenNTF project pages and openntf.org articles
  5. planetlotus.org aggregated posts (cite the original blog when possible)
  6. GitHub release notes / READMEs from hcl-org or recognized community repos
  7. Reputable HCL business partners (panagenda, prominic, csi-international, belsoft, factor101, etc.)
  8. Conference recordings or slide decks (Engage, CollabSphere, OpenNTF webinars)

UNACCEPTABLE:
  - Made-up version numbers, dates, quotes, or URLs
  - Speculation with no source ("might", "could be")
  - AI-generated content farms
  - Sources you did not actually open during web_search

DEDUP — REJECT topics whose title is similar to any of these recent posts:
${recentTitles.length === 0 ? '(none yet)' : recentTitles.map((t) => `- ${t}`).join('\n')}

Only return {"error":"insufficient_sources"} if AFTER 3+ different web_search calls
you genuinely cannot find 2 quality sources for any of Tier A, B, or C.

REQUIRED OUTPUT — STRICT JSON, no markdown fences, no commentary:

type Output =
  | { error: "insufficient_sources"; reason: string; queriesTried: string[] }
  | {
      slug: string;             // kebab-case ascii, max 60 chars, descriptive
      tags: string[];           // 3-5 tags, choose ONLY from: ${ALLOWED_TAGS.join(', ')}
      sources: { title: string; url: string }[]; // MINIMUM 2, MAXIMUM 6 real URLs you actually consulted
      zh: {
        title: string;          // 繁體中文標題, 25 字以內
        description: string;    // 繁體中文摘要, 60-100 字
        markdown: string;       // 繁體中文正文, 600-1200 字 Markdown, 含小標, 內文必須用 [描述](url) 格式內嵌至少 2 個來源
      };
      en: {
        title: string;          // English title, under 80 chars
        description: string;    // English summary, 25-45 words
        markdown: string;       // English body 500-1000 words Markdown, with subheadings, MUST embed >= 2 inline source links [text](url)
      };
    };

CRITICAL RULES:
- Use Traditional Chinese (zh-TW), NOT Simplified Chinese.
- Tags MUST be exact strings from the allowed list above.
- Every URL in "sources" MUST be a real URL you opened during web_search.
- Both zh.markdown and en.markdown MUST contain at least 2 inline links of the form [text](https://...).
- The zh and en versions cover the same story but read naturally — do not produce literal translation.
- If unsure of any fact (date, version number, name), omit it entirely instead of guessing.`;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (BANNED_HOSTS.has(u.hostname.toLowerCase())) return false;
    return true;
  } catch {
    return false;
  }
}

function countInlineLinks(markdown: string): number {
  const matches = markdown.match(/\[[^\]]+\]\(https?:\/\/[^\s)]+\)/g);
  return matches ? matches.length : 0;
}

function validate(article: BilingualArticle): void {
  const errors: string[] = [];

  if (!article.sources || article.sources.length < 2) {
    errors.push(`Need >= 2 sources, got ${article.sources?.length ?? 0}.`);
  }

  for (const s of article.sources ?? []) {
    if (!s.url || !isValidUrl(s.url)) {
      errors.push(`Invalid or banned source URL: ${s.url}`);
    }
  }

  const trustedCount = (article.sources ?? []).filter((s) => {
    try {
      const host = new URL(s.url).hostname.toLowerCase();
      return TRUSTED_HOST_HINTS.some((h) => host.endsWith(h));
    } catch {
      return false;
    }
  }).length;
  if (trustedCount === 0) {
    errors.push(
      `At least one source should come from a trusted Domino-related host. Got: ${(article.sources ?? [])
        .map((s) => s.url)
        .join(', ')}`
    );
  }

  const zhLinks = countInlineLinks(article.zh?.markdown ?? '');
  const enLinks = countInlineLinks(article.en?.markdown ?? '');
  if (zhLinks < 2) errors.push(`zh body must have >= 2 inline links, got ${zhLinks}.`);
  if (enLinks < 2) errors.push(`en body must have >= 2 inline links, got ${enLinks}.`);

  if (errors.length > 0) {
    throw new Error(`Article validation failed:\n  - ${errors.join('\n  - ')}`);
  }
}

async function generate(): Promise<BilingualArticle> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY env var is required.');
  }
  const client = new OpenAI();

  const recentTitlesZh = await loadRecentTitles('zh-TW');
  const recentTitlesEn = await loadRecentTitles('en');
  const recentTitles = [...new Set([...recentTitlesZh, ...recentTitlesEn])];

  const prompt = buildPrompt(recentTitles);
  console.log(`[generate] Calling ${MODEL} with web_search...`);

  const response = await client.responses.create({
    model: MODEL,
    tools: [{ type: 'web_search_preview' }],
    input: prompt,
  });

  const text = response.output_text?.trim() ?? '';
  if (!text) throw new Error('Empty response from OpenAI.');

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('[generate] Failed to parse JSON. Raw output:\n', text);
    throw err;
  }

  if (parsed && typeof parsed === 'object' && 'error' in parsed) {
    const errObj = parsed as { reason?: string; queriesTried?: string[] };
    const reason = errObj.reason ?? 'unspecified';
    const tried = errObj.queriesTried?.length
      ? `\n  queries tried: ${errObj.queriesTried.join(' | ')}`
      : '\n  (model did not report which queries it tried — likely searched 0 times)';
    throw new Error(`Model declined to write an article: ${reason}${tried}`);
  }

  const article = parsed as BilingualArticle;

  if (!article.slug || !article.zh?.markdown || !article.en?.markdown) {
    throw new Error('Generated article is missing required fields.');
  }

  article.tags = (article.tags ?? [])
    .filter((t): t is string => typeof t === 'string')
    .filter((t) => (ALLOWED_TAGS as readonly string[]).includes(t));
  if (article.tags.length === 0) article.tags = ['Domino'];

  article.slug = article.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  validate(article);
  return article;
}

async function writePost(
  lang: 'zh-TW' | 'en',
  slug: string,
  data: BilingualArticle,
  pubDate: string
): Promise<string> {
  const langDir = join(POSTS_DIR, lang);
  await mkdir(langDir, { recursive: true });
  const filename = `${pubDate}-${slug}.md`;
  const filepath = join(langDir, filename);
  const langData = data[lang === 'zh-TW' ? 'zh' : 'en'];
  const fm = frontmatter({
    title: langData.title,
    description: langData.description,
    pubDate,
    lang,
    slug,
    tags: data.tags,
    sources: data.sources,
  });
  await writeFile(filepath, `${fm}${langData.markdown.trim()}\n`, 'utf8');
  return filepath;
}

async function main() {
  const article = await generate();
  const pubDate = todayIso();
  const zhPath = await writePost('zh-TW', article.slug, article, pubDate);
  const enPath = await writePost('en', article.slug, article, pubDate);
  console.log(`[generate] Wrote:\n  ${zhPath}\n  ${enPath}`);
  console.log(`[generate] Sources used:`);
  for (const s of article.sources) console.log(`  - ${s.title}: ${s.url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
