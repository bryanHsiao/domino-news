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

import { mkdir, readdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { verifyAll, extractMarkdownLinks } from './lib/verify-urls.js';
import { reviewArticle, type ReviewIssue, type ReviewResult, type RecentPost } from './lib/review-article.js';
import { generateCoverImage } from './lib/cover-prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o';
const SKIP_IMAGE = process.env.SKIP_IMAGE === '1';
const TITLE_LOOKBACK_DAYS = 14;
const COVERS_DIR = join(ROOT, 'public', 'covers');
const DRAFTS_DIR = join(ROOT, '_drafts');

// Tag taxonomy is split across 4 axes. See README "Tag taxonomy" for the
// reasoning. Pick 2-4 tags per article, ideally one from each axis that
// applies. Avoid umbrella tags like "Domino" / "HCL" — every post is by
// definition Domino-related, so those add no signal.
const TAGS_PRODUCT = [
  'Domino Server',
  'Notes Client',
  'Domino Designer',
  'Domino REST API',
  'Volt MX',
  'Nomad',
  'AppDev Pack',
  'Sametime',
  'Domino IQ',
] as const;

const TAGS_TECH = [
  'LotusScript',
  'Formula',
  'Java',
  'XPages',
  'JavaScript',
  'DQL',
  'OIDC',
] as const;

const TAGS_TOPIC = [
  'Security',
  'Performance',
  'Migration',
  'Backup',
  'DevOps',
  'Admin',
] as const;

const TAGS_TYPE = ['Release Notes', 'Tutorial', 'News', 'Community'] as const;

const ALLOWED_TAGS = [
  ...TAGS_PRODUCT,
  ...TAGS_TECH,
  ...TAGS_TOPIC,
  ...TAGS_TYPE,
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
  cover?: string;
}

function todayIso(): string {
  // Stamp posts by Taipei calendar day so a 07:00 Taipei publish doesn't
  // get a UTC-yesterday date.
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
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
  const cutoff = Date.now() - TITLE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const titles: string[] = [];
  for (const f of files) {
    if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
    const datePart = f.slice(0, 10);
    const ts = Date.parse(datePart);
    if (Number.isNaN(ts) || ts < cutoff) continue;
    const raw = await readFile(join(dir, f), 'utf8');
    const m = raw.match(/^title:\s*"?([^"\n]+?)"?\s*$/m);
    if (m) titles.push(m[1].trim());
  }
  return titles;
}

/**
 * Returns recent posts (last TITLE_LOOKBACK_DAYS days) with the metadata
 * needed for semantic dedup by the Claude reviewer: slug + title + a short
 * description. We use the EN side preferentially (reviewer reads English).
 */
async function loadRecentPostsMeta(): Promise<RecentPost[]> {
  const dir = join(POSTS_DIR, 'en');
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  const cutoff = Date.now() - TITLE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const posts: RecentPost[] = [];
  for (const f of files) {
    if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
    const datePart = f.slice(0, 10);
    const ts = Date.parse(datePart);
    if (Number.isNaN(ts) || ts < cutoff) continue;
    const raw = await readFile(join(dir, f), 'utf8');
    const slug = raw.match(/^slug:\s*"?([^"\n]+?)"?\s*$/m)?.[1]?.trim();
    const title = raw.match(/^title:\s*"?([^"\n]+?)"?\s*$/m)?.[1]?.trim();
    const description = raw.match(/^description:\s*"?([^"\n]+?)"?\s*$/m)?.[1]?.trim();
    if (slug && title) posts.push({ slug, title, description: description ?? '' });
  }
  return posts;
}

/**
 * Returns every slug ever used across both languages (zh-TW + en union).
 * Slugs are URL identities and must be unique forever — no time window.
 * Used both as a soft hint in the prompt ("forbidden slugs") and as a
 * hard reject in validate().
 */
async function loadAllSlugs(): Promise<Set<string>> {
  const slugs = new Set<string>();
  for (const lang of ['zh-TW', 'en'] as const) {
    const dir = join(POSTS_DIR, lang);
    if (!existsSync(dir)) continue;
    const files = await readdir(dir);
    for (const f of files) {
      if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
      const raw = await readFile(join(dir, f), 'utf8');
      const m = raw.match(/^slug:\s*"?([^"\n]+?)"?\s*$/m);
      if (m) slugs.add(m[1].trim());
    }
  }
  return slugs;
}

function buildPrompt(
  recentTitles: string[],
  forbiddenSlugs: string[],
  forceTierC: boolean
): string {
  const tierConstraint = forceTierC
    ? `MODE: TIER-C-ONLY FALLBACK
The previous attempt failed (either the topic overlapped with a recent post,
or the article had factual errors). Skip TIER A and TIER B entirely. Pick
ONE under-covered class / method / @Formula function from the HCL doc roots
listed in TIER C below and write a focused, hands-on tutorial. Do not retry
the same news topic — go to the docs.

`
    : '';
  return `${tierConstraint}You are an editor for a daily HCL Domino news site. Your standards are:
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

CONTENT TIERS (pick the highest tier you can fully source — but NEVER reuse a
forbidden slug or rewrite a topic from "Recent topics" below):
  TIER A — News from the last 14 days (release, security advisory, official announcement, conference recap)
  TIER B — Technical post / tutorial / OpenNTF project from the last 60 days
  TIER C — Deep-dive tutorial on an under-covered Notes/Domino API or feature.
           This is the FALLBACK when TIER A and B yield only stories already
           covered. Pick ONE class / method / @Formula function / admin task
           from the official docs and write a focused, hands-on explainer.

           Doc roots to mine (search inside these for under-covered topics):
             - help.hcl-software.com/dom_designer/14.0.0/basic/   (LotusScript classes & methods)
             - help.hcl-software.com/dom_designer/14.0.0/Java/    (Java back-end classes)
             - help.hcl-software.com/dom_designer/14.0.0/Formula/ (@Formula functions)
             - help.hcl-software.com/dom_designer/14.0.0/XPages/  (XPages controls & SSJS)
             - help.hcl-software.com/domino_rest_api/             (Domino REST API endpoints)
             - help.hcl-software.com/domino/14.0.0/admin/         (server admin tasks)

           The class / method / function name in kebab-case is the slug.
           Examples that look NOT covered yet (verify against forbidden slugs!):
             notes-view-navigator, notes-xml-processor, notes-note-collection,
             db-column-formula, picklist-formula, notes-directory-navigator,
             nsf-replication-events, drapi-bulk-operations, etc.

           Cite 2+ official doc URLs and (if possible) one community article.

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

FORBIDDEN SLUGS — your "slug" output MUST NOT equal any of these (every slug
ever published, both languages). The script will hard-reject the article if
you reuse one. Pick a different topic / angle:
${forbiddenSlugs.length === 0 ? '(none yet)' : forbiddenSlugs.map((s) => `- ${s}`).join('\n')}

Recent topics (last ${TITLE_LOOKBACK_DAYS} days) — your title and angle should
be substantially different from these so readers don't see the same story
twice in two weeks:
${recentTitles.length === 0 ? '(none yet)' : recentTitles.map((t) => `- ${t}`).join('\n')}

Only return {"error":"insufficient_sources"} as a LAST resort. If TIER A and B
yield only forbidden topics, fall back to TIER C — the doc roots above contain
hundreds of un-covered classes/methods. There is essentially always a TIER C
topic available; refusing to write one is almost never the right call.

REQUIRED OUTPUT — STRICT JSON, no markdown fences, no commentary:

type Output =
  | { error: "insufficient_sources"; reason: string; queriesTried: string[] }
  | {
      slug: string;             // kebab-case ascii, max 60 chars, descriptive
      tags: string[];           // 2-4 tags, see TAG SELECTION below
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

TAG SELECTION — pick 2-4 tags drawn from these 4 axes. Prefer one from each
axis that genuinely applies; never tag with all of them just to fill the slot.
Tags are filters: a tag that fits every Domino post (e.g. "Domino", "HCL",
"Notes") is forbidden because it adds zero signal. Pick the most specific
tag that applies.

  Axis 1 — Product / module (which thing is this post about):
    ${TAGS_PRODUCT.join(', ')}

  Axis 2 — Technology / language (what is the code in):
    ${TAGS_TECH.join(', ')}

  Axis 3 — Topic (what problem does the post address):
    ${TAGS_TOPIC.join(', ')}

  Axis 4 — Content type (what kind of article is this):
    ${TAGS_TYPE.join(', ')}

Examples:
  - A Domino 2026 release announcement → ["Release Notes", "Domino Server", "Domino IQ"]
  - A DQL hands-on tutorial in LotusScript → ["Tutorial", "DQL", "LotusScript"]
  - A note on tightening ID vault security → ["Admin", "Security", "Domino Server"]

CRITICAL RULES:
- Use Traditional Chinese (zh-TW), NOT Simplified Chinese.
- Tags MUST be exact strings from the axes above.
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

function validate(article: BilingualArticle, forbiddenSlugs: Set<string>): void {
  const errors: string[] = [];

  if (forbiddenSlugs.has(article.slug)) {
    errors.push(
      `Slug collision: "${article.slug}" already exists. The model ignored ` +
        `the FORBIDDEN SLUGS list — refusing to overwrite an existing post.`
    );
  }

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

interface GenerateOptions {
  forbiddenSlugs: Set<string>;
  forceTierC: boolean;
}

async function generate(opts: GenerateOptions): Promise<BilingualArticle> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY env var is required.');
  }
  const client = new OpenAI();

  const recentTitlesZh = await loadRecentTitles('zh-TW');
  const recentTitlesEn = await loadRecentTitles('en');
  const recentTitles = [...new Set([...recentTitlesZh, ...recentTitlesEn])];

  const prompt = buildPrompt(recentTitles, [...opts.forbiddenSlugs].sort(), opts.forceTierC);
  console.log(
    `[generate] Calling ${MODEL} with web_search... ` +
      `(${opts.forbiddenSlugs.size} forbidden slugs, ${recentTitles.length} recent titles${
        opts.forceTierC ? ', forceTierC=true' : ''
      })`
  );

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
  if (article.tags.length === 0) article.tags = ['News'];

  article.slug = article.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  validate(article, opts.forbiddenSlugs);
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
    cover: data.cover,
  });
  await writeFile(filepath, `${fm}${langData.markdown.trim()}\n`, 'utf8');
  return filepath;
}

async function generateCover(
  client: OpenAI,
  article: BilingualArticle
): Promise<string | undefined> {
  if (SKIP_IMAGE) {
    console.log('[generate] SKIP_IMAGE=1, skipping cover image generation.');
    return undefined;
  }
  const primaryTag = article.tags[0] ?? 'HCL Domino';
  const cover = await generateCoverImage(
    client,
    article.en.title,
    primaryTag,
    article.slug,
    COVERS_DIR
  );
  return cover ?? undefined;
}

async function gateUrls(article: BilingualArticle): Promise<void> {
  const sourceUrls = article.sources.map((s) => s.url);
  const inlineUrls = [
    ...extractMarkdownLinks(article.zh.markdown),
    ...extractMarkdownLinks(article.en.markdown),
  ];
  const all = [...new Set([...sourceUrls, ...inlineUrls])];
  console.log(`[gate-urls] Verifying ${all.length} URL(s)...`);
  const results = await verifyAll(all);
  const broken = results.filter((r) => !r.ok);
  for (const r of results) {
    const tag = r.ok ? 'ok ' : 'BAD';
    console.log(`  [${tag}] ${r.status} ${r.url}${r.reason ? ' — ' + r.reason : ''}`);
  }
  const brokenSources = broken.filter((b) => sourceUrls.includes(b.url));
  if (brokenSources.length > 0) {
    throw new Error(
      `URL gate FAILED — ${brokenSources.length} source URL(s) are not reachable:\n` +
        brokenSources.map((b) => `  - ${b.status} ${b.url}`).join('\n')
    );
  }
  if (broken.length > 0) {
    console.warn(`[gate-urls] ${broken.length} inline link(s) broken (article still allowed).`);
  }
}

/** Run Claude review and log issues, but DO NOT throw. Caller decides. */
async function runReview(
  article: BilingualArticle,
  recentPosts: RecentPost[]
): Promise<ReviewResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[gate-review] ANTHROPIC_API_KEY not set — skipping AI review.');
    return null;
  }
  const result = await reviewArticle(
    article.en.title,
    article.en.markdown,
    article.sources.map((s) => s.url),
    recentPosts
  );
  const critical = result.issues.filter((i) => i.severity === 'critical');
  const major = result.issues.filter((i) => i.severity === 'major');
  const minor = result.issues.filter((i) => i.severity === 'minor');
  console.log(
    `[gate-review] ${critical.length} critical / ${major.length} major / ${minor.length} minor` +
      (result.topicOverlap ? `; topicOverlap=true (with: ${result.overlapWith ?? '?'})` : '')
  );
  for (const i of result.issues) console.log(formatIssue(i));
  return result;
}

function formatIssue(i: ReviewIssue): string {
  return `  [${i.severity}] ${i.location}\n      problem: ${i.problem}\n      fix:     ${i.suggestion}`;
}

function reviewBlocks(review: ReviewResult | null): { reasons: string[]; criticals: ReviewIssue[] } {
  if (!review) return { reasons: [], criticals: [] };
  const criticals = review.issues.filter((i) => i.severity === 'critical');
  const reasons: string[] = [];
  if (review.topicOverlap) {
    reasons.push(`topic overlap with **${review.overlapWith ?? 'a recent post'}**`);
  }
  if (criticals.length > 0) {
    reasons.push(`${criticals.length} critical fact issue(s)`);
  }
  return { reasons, criticals };
}

/**
 * Save a rejected article (zh + en, no cover) to _drafts/ so the workflow
 * can upload it as an artifact for human salvage.
 */
async function saveDraft(
  article: BilingualArticle,
  attempt: number,
  review: ReviewResult | null,
  reason: string
): Promise<void> {
  await mkdir(DRAFTS_DIR, { recursive: true });
  const date = todayIso();
  const stem = `${date}-attempt${attempt}-${article.slug}`;
  const note =
    `<!--\nREJECTED DRAFT — ${reason}\nattempt: ${attempt}\nslug: ${article.slug}\n` +
    (review
      ? `topicOverlap: ${review.topicOverlap}${
          review.overlapWith ? ` (overlapWith=${review.overlapWith})` : ''
        }\nissues:\n${review.issues.map(formatIssue).join('\n')}\n`
      : '') +
    `-->\n\n`;
  const fmZh = frontmatter({
    title: article.zh.title,
    description: article.zh.description,
    pubDate: date,
    lang: 'zh-TW',
    slug: article.slug,
    tags: article.tags,
    sources: article.sources,
    draft: true,
  });
  const fmEn = frontmatter({
    title: article.en.title,
    description: article.en.description,
    pubDate: date,
    lang: 'en',
    slug: article.slug,
    tags: article.tags,
    sources: article.sources,
    draft: true,
  });
  await writeFile(join(DRAFTS_DIR, `${stem}.zh-TW.md`), `${fmZh}${note}${article.zh.markdown.trim()}\n`, 'utf8');
  await writeFile(join(DRAFTS_DIR, `${stem}.en.md`), `${fmEn}${note}${article.en.markdown.trim()}\n`, 'utf8');
  console.log(`[draft] Saved rejected article to _drafts/${stem}.{zh-TW,en}.md`);
}

/** Append markdown to GITHUB_STEP_SUMMARY if the env var is set. */
async function appendStepSummary(md: string): Promise<void> {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  await appendFile(path, md + '\n', 'utf8');
}

/** Write a key=value pair to GITHUB_OUTPUT so the workflow can read it. */
async function setOutput(key: string, value: string): Promise<void> {
  const path = process.env.GITHUB_OUTPUT;
  if (!path) return;
  // Use heredoc form for safe multiline values
  await appendFile(path, `${key}<<__CCDEOF__\n${value}\n__CCDEOF__\n`, 'utf8');
}

interface AttemptResult {
  ok: boolean;
  article?: BilingualArticle;
  review?: ReviewResult | null;
  failure?: { stage: string; reason: string };
}

async function attempt(
  forbiddenSlugs: Set<string>,
  forceTierC: boolean,
  recentPosts: RecentPost[]
): Promise<AttemptResult> {
  let article: BilingualArticle;
  try {
    article = await generate({ forbiddenSlugs, forceTierC });
  } catch (err) {
    return { ok: false, failure: { stage: 'generate', reason: String(err instanceof Error ? err.message : err) } };
  }

  try {
    await gateUrls(article);
  } catch (err) {
    return {
      ok: false,
      article,
      failure: { stage: 'urls', reason: String(err instanceof Error ? err.message : err) },
    };
  }

  let review: ReviewResult | null;
  try {
    review = await runReview(article, recentPosts);
  } catch (err) {
    return {
      ok: false,
      article,
      failure: { stage: 'review', reason: String(err instanceof Error ? err.message : err) },
    };
  }

  const { reasons } = reviewBlocks(review);
  if (reasons.length > 0) {
    return {
      ok: false,
      article,
      review,
      failure: { stage: 'review', reason: reasons.join(' + ') },
    };
  }
  return { ok: true, article, review };
}

async function publish(article: BilingualArticle, fallbackReason: string | null): Promise<void> {
  const client = new OpenAI();
  article.cover = await generateCover(client, article);

  const pubDate = todayIso();
  const zhPath = await writePost('zh-TW', article.slug, article, pubDate);
  const enPath = await writePost('en', article.slug, article, pubDate);
  console.log(`[publish] Wrote:\n  ${zhPath}\n  ${enPath}`);
  if (article.cover) console.log(`[publish] Cover: ${article.cover}`);
  console.log(`[publish] Sources used:`);
  for (const s of article.sources) console.log(`  - ${s.title}: ${s.url}`);

  await setOutput('published', 'true');
  await setOutput('slug', article.slug);
  if (fallbackReason) {
    await setOutput('fallback', 'true');
    await setOutput('fallback_reason', fallbackReason);
  } else {
    await setOutput('fallback', 'false');
  }
}

async function main() {
  const recentPosts = await loadRecentPostsMeta();
  const forbiddenSlugs = await loadAllSlugs();
  const summary: string[] = ['# Daily article run\n'];

  // Attempt 1 — normal mode
  console.log('[main] Attempt 1: normal mode (TIER A/B/C all allowed)');
  const r1 = await attempt(forbiddenSlugs, false, recentPosts);
  if (r1.ok && r1.article) {
    summary.push(
      `**Result:** ✅ Published \`${r1.article.slug}\` on first try.`,
      '',
      `- Title (zh): ${r1.article.zh.title}`,
      `- Title (en): ${r1.article.en.title}`
    );
    await publish(r1.article, null);
    await appendStepSummary(summary.join('\n'));
    return;
  }

  // Attempt 1 failed — log + maybe save draft
  const reason1 = r1.failure?.reason ?? 'unknown';
  console.warn(`[main] Attempt 1 failed at "${r1.failure?.stage}": ${reason1}`);
  summary.push(
    `## Attempt 1 — failed at \`${r1.failure?.stage}\``,
    '',
    '```',
    reason1.length > 1500 ? reason1.slice(0, 1500) + '\n... [truncated]' : reason1,
    '```',
    ''
  );
  if (r1.article) {
    forbiddenSlugs.add(r1.article.slug);
    // Save draft if it was a content issue (review or urls), not just slug collision
    if (r1.failure?.stage !== 'generate') {
      await saveDraft(r1.article, 1, r1.review ?? null, reason1);
      summary.push(
        `Rejected draft saved to \`_drafts/\` and uploaded as workflow artifact.`,
        ''
      );
    }
  }

  // Attempt 2 — TIER C only, forbidden set extended
  console.log('[main] Attempt 2: TIER C-only fallback');
  summary.push('## Attempt 2 — TIER C-only fallback', '');
  const r2 = await attempt(forbiddenSlugs, true, recentPosts);
  if (r2.ok && r2.article) {
    summary.push(
      `**Result:** ✅ Published \`${r2.article.slug}\` via TIER C fallback.`,
      '',
      `- Title (zh): ${r2.article.zh.title}`,
      `- Title (en): ${r2.article.en.title}`
    );
    const fallbackReason = `attempt 1 rejected (${r1.failure?.stage}: ${reason1.split('\n')[0].slice(0, 200)})`;
    await publish(r2.article, fallbackReason);
    await appendStepSummary(summary.join('\n'));
    return;
  }

  const reason2 = r2.failure?.reason ?? 'unknown';
  console.error(`[main] Attempt 2 also failed at "${r2.failure?.stage}": ${reason2}`);
  summary.push(
    `**Result:** ❌ Both attempts failed.`,
    '',
    `- Attempt 1: \`${r1.failure?.stage}\` — ${reason1.split('\n')[0].slice(0, 200)}`,
    `- Attempt 2: \`${r2.failure?.stage}\` — ${reason2.split('\n')[0].slice(0, 200)}`,
    ''
  );
  if (r2.article) {
    await saveDraft(r2.article, 2, r2.review ?? null, reason2);
    summary.push(`Rejected draft saved to \`_drafts/\`. Both attempts available as workflow artifact.`, '');
  }
  await appendStepSummary(summary.join('\n'));
  await setOutput('published', 'false');
  throw new Error(
    `Both attempts failed.\n  attempt 1 (${r1.failure?.stage}): ${reason1}\n  attempt 2 (${r2.failure?.stage}): ${reason2}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
