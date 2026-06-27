/**
 * Backfill cover images for posts that don't have one yet (or all of
 * them, when FORCE_REGEN=1).
 *
 * Per pair of zh-TW + en posts sharing a slug:
 *   - if neither has a cover that exists on disk, call gpt-image-1,
 *     convert PNG → WebP (quality 85), and save to
 *     public/covers/{slug}.webp
 *   - update both .md files to add `cover: /covers/{slug}.webp` and
 *     `coverStyle: <id>` to the frontmatter
 *
 * The `coverStyle` frontmatter field powers sampling without
 * replacement: when generating a new cover, we exclude the styles
 * already used by the N pubDate-nearest neighbours so consecutive
 * posts don't pile up on the same visual style.
 *
 * Required env: OPENAI_API_KEY
 * Optional env: OPENAI_IMAGE_MODEL (default gpt-image-1),
 *               OPENAI_IMAGE_QUALITY (default medium),
 *               FORCE_REGEN=1 to regenerate every cover.
 *
 * Usage: npm run backfill:covers
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOpenAIClient } from './lib/openai-client.js';
import { generateCoverImage } from './lib/cover-prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');
const COVERS_DIR = join(ROOT, 'public', 'covers');

const FORCE_REGEN = process.env.FORCE_REGEN === '1';

/** How many pubDate-nearest neighbours' styles to exclude when picking. */
const RECENT_WINDOW_HALF = 3; // ±3 = up to 6 neighbours

interface Frontmatter {
  title: string;
  slug: string;
  pubDate?: string;
  tags: string[];
  cover?: string;
  coverStyle?: string;
  raw: string;
  body: string;
}

function parseFrontmatter(text: string): Frontmatter | null {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const raw = m[1];
  const body = m[2];

  const get = (key: string): string | undefined => {
    const re = new RegExp(`^${key}:\\s*"?([^"\\n]*)"?\\s*$`, 'm');
    const found = raw.match(re);
    return found ? found[1].trim() : undefined;
  };
  const tagsBlock = raw.match(/^tags:\n((?:\s+-\s+.*\n?)+)/m);
  const tags = tagsBlock
    ? tagsBlock[1]
        .split('\n')
        .map((line) => line.replace(/^\s+-\s+"?/, '').replace(/"?\s*$/, '').trim())
        .filter(Boolean)
    : [];

  return {
    title: get('title') ?? '',
    slug: get('slug') ?? '',
    pubDate: get('pubDate'),
    tags,
    cover: get('cover'),
    coverStyle: get('coverStyle'),
    raw,
    body,
  };
}

/**
 * Replace or append a single-line frontmatter field. Operates only on
 * the YAML block at the top, leaves the body untouched.
 */
function setFrontmatterField(text: string, key: string, value: string): string {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return text;
  let fm = m[1];
  const body = m[2];

  const lineRe = new RegExp(`^${key}:.*$`, 'm');
  if (lineRe.test(fm)) {
    fm = fm.replace(lineRe, `${key}: "${value}"`);
  } else {
    fm = fm.replace(/\s*$/, '') + `\n${key}: "${value}"`;
  }
  return `---\n${fm}\n---\n${body}`;
}

async function processLang(
  lang: 'zh-TW' | 'en'
): Promise<Map<string, { file: string; fm: Frontmatter }>> {
  const dir = join(POSTS_DIR, lang);
  if (!existsSync(dir)) return new Map();
  const files = await readdir(dir);
  const map = new Map<string, { file: string; fm: Frontmatter }>();
  for (const f of files) {
    if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
    const filepath = join(dir, f);
    const text = await readFile(filepath, 'utf8');
    const fm = parseFrontmatter(text);
    if (!fm || !fm.slug) continue;
    map.set(fm.slug, { file: filepath, fm });
  }
  return map;
}

interface PostMeta {
  slug: string;
  /** ISO timestamp string for sorting. Falls back to slug for stability. */
  pubDateKey: string;
  /** What style is in use right now (in-memory; updated as we process). */
  coverStyle?: string;
  /** Files to write back to. */
  files: { lang: 'zh-TW' | 'en'; file: string }[];
  title: string;
  primaryTag: string;
  hasCoverOnDisk: boolean;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY env var is required.');
  }
  const client = createOpenAIClient();

  const zh = await processLang('zh-TW');
  const en = await processLang('en');

  // Build the unified post list, dedup by slug, capture pubDate + style.
  const allSlugs = new Set([...zh.keys(), ...en.keys()]);
  const posts: PostMeta[] = [];
  for (const slug of allSlugs) {
    const enEntry = en.get(slug);
    const zhEntry = zh.get(slug);
    const files: PostMeta['files'] = [];
    if (zhEntry) files.push({ lang: 'zh-TW', file: zhEntry.file });
    if (enEntry) files.push({ lang: 'en', file: enEntry.file });

    const hasCoverOnDisk =
      (enEntry?.fm.cover &&
        existsSync(join(ROOT, 'public', enEntry.fm.cover.replace(/^\//, '')))) ||
      (zhEntry?.fm.cover &&
        existsSync(join(ROOT, 'public', zhEntry.fm.cover.replace(/^\//, '')))) ||
      existsSync(join(COVERS_DIR, `${slug}.webp`)) ||
      // Legacy: covers generated before the WebP migration were saved as .png.
      // After scripts/convert-covers-to-webp.ts ran, the disk has only .webp,
      // but keep this fallback for any historical edge case.
      existsSync(join(COVERS_DIR, `${slug}.png`));

    posts.push({
      slug,
      pubDateKey: enEntry?.fm.pubDate ?? zhEntry?.fm.pubDate ?? slug,
      coverStyle: enEntry?.fm.coverStyle ?? zhEntry?.fm.coverStyle,
      files,
      title: enEntry?.fm.title ?? zhEntry?.fm.title ?? slug,
      primaryTag: enEntry?.fm.tags[0] ?? zhEntry?.fm.tags[0] ?? 'HCL Domino',
      hasCoverOnDisk: Boolean(hasCoverOnDisk),
    });
  }

  // Sort newest-first; this is the order we'll process and the basis
  // for the "neighbour styles" window.
  posts.sort((a, b) => b.pubDateKey.localeCompare(a.pubDateKey));

  // Decide what to (re)generate.
  const todoSlugs = new Set<string>();
  for (const p of posts) {
    if (!p.hasCoverOnDisk || FORCE_REGEN) todoSlugs.add(p.slug);
  }

  // In FORCE_REGEN, the existing styles are about to be discarded —
  // null them out so they don't pollute the neighbour exclusion set.
  if (FORCE_REGEN) {
    for (const p of posts) {
      if (todoSlugs.has(p.slug)) p.coverStyle = undefined;
    }
  }

  console.log(
    `[backfill] ${todoSlugs.size} post(s) need a cover. (FORCE_REGEN=${FORCE_REGEN ? '1' : '0'})`
  );

  const failedSlugs: string[] = [];
  for (let idx = 0; idx < posts.length; idx++) {
    const p = posts[idx];
    if (!todoSlugs.has(p.slug)) {
      console.log(`[backfill] skip "${p.slug}" — already has cover`);
      continue;
    }

    // Collect the styles already assigned to the N pubDate-nearest
    // neighbours so pickStyle excludes them.
    const start = Math.max(0, idx - RECENT_WINDOW_HALF);
    const end = Math.min(posts.length, idx + RECENT_WINDOW_HALF + 1);
    const recentStyles: string[] = [];
    for (let i = start; i < end; i++) {
      if (i === idx) continue;
      const s = posts[i].coverStyle;
      if (s) recentStyles.push(s);
    }

    // If the post has a coverStyle pinned in frontmatter and we're
    // NOT in FORCE_REGEN mode, honour it — useful for swapping a
    // single cover to a chosen style (set coverStyle, delete the PNG,
    // run backfill). FORCE_REGEN clears p.coverStyle earlier so this
    // becomes undefined and normal sampling resumes.
    const preferredStyle = p.coverStyle || undefined;
    const generated = await generateCoverImage(
      client,
      p.title,
      p.primaryTag,
      p.slug,
      COVERS_DIR,
      recentStyles,
      preferredStyle
    );
    if (!generated) {
      failedSlugs.push(p.slug);
      continue;
    }

    // Update in-memory so subsequent iterations see this style as taken.
    p.coverStyle = generated.styleId;

    // Write cover + coverStyle into both zh and en frontmatter.
    for (const f of p.files) {
      const text = await readFile(f.file, 'utf8');
      const withCover = setFrontmatterField(text, 'cover', generated.coverPath);
      const withStyle = setFrontmatterField(withCover, 'coverStyle', generated.styleId);
      await writeFile(f.file, withStyle, 'utf8');
      console.log(`[backfill]   updated frontmatter -> ${f.file}`);
    }
  }

  if (failedSlugs.length > 0) {
    // Surface the failure as a non-zero exit so the workflow goes RED.
    // Previously a cover-generation failure was swallowed (return null +
    // exit 0), so the post silently shipped on the fallback gradient and
    // the green check hid it — which is exactly how this went unnoticed for
    // days. Any successful covers from this run were already written to disk
    // and frontmatter, and the workflow's commit step runs with
    // `if: always()`, so those are still committed before the job fails.
    console.error(
      `[backfill] FAILED to generate covers for ${failedSlugs.length} post(s): ${failedSlugs.join(', ')}`
    );
    process.exit(1);
  }

  console.log('[backfill] Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
