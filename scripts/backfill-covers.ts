/**
 * Backfill cover images for posts that don't have one yet.
 *
 * For each pair of zh-TW + en posts sharing a slug:
 *   - If neither has a `cover:` line in its frontmatter, call gpt-image-1
 *     with the EN title and save the image to public/covers/{slug}.png
 *   - Update both .md files to add `cover: /covers/{slug}.png` to frontmatter
 *
 * Required env: OPENAI_API_KEY
 * Optional env: OPENAI_IMAGE_MODEL (default gpt-image-1),
 *               OPENAI_IMAGE_QUALITY (default medium)
 *
 * Usage: npm run backfill:covers
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
const COVERS_DIR = join(ROOT, 'public', 'covers');

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
const IMAGE_QUALITY = (process.env.OPENAI_IMAGE_QUALITY ?? 'medium') as
  | 'low'
  | 'medium'
  | 'high'
  | 'auto';

interface Frontmatter {
  title: string;
  slug: string;
  tags: string[];
  cover?: string;
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
    tags,
    cover: get('cover'),
    raw,
    body,
  };
}

function addCoverToFrontmatter(text: string, coverPath: string): string {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return text;
  let fm = m[1];
  const body = m[2];

  if (/^cover:/m.test(fm)) {
    fm = fm.replace(/^cover:.*$/m, `cover: "${coverPath}"`);
  } else {
    // Append at the end of frontmatter — safest for nested YAML blocks.
    fm = fm.replace(/\s*$/, '') + `\ncover: "${coverPath}"`;
  }

  return `---\n${fm}\n---\n${body}`;
}

async function generateCoverImage(
  client: OpenAI,
  title: string,
  primaryTag: string,
  slug: string
): Promise<string | null> {
  const prompt = `Cinematic 3D rendered cover image for a technical blog post.
Topic: "${title}"
Theme hint: ${primaryTag}, enterprise software, developer workflow, data systems.

Style:
- Photorealistic 3D render, soft cinematic lighting (golden hour or warm interior)
- Slight depth-of-field / shallow focus, rich textures, premium production quality
- Composition uses concrete props that suggest the topic (workshop tools, retro
  hardware, books, terminals on screens, gears, blueprints, network cables, chess
  pieces, robots, miniature figurines, etc.) staged like a designer set
- Warm, harmonious palette — avoid harsh neon. Think editorial / ad photography.
- Aspect: landscape, fills frame edge-to-edge.

ABSOLUTE rules (must follow):
- NO text, NO words, NO letters, NO numbers, NO logos, NO brand marks anywhere
- NO UI screenshots, NO chat bubbles, NO charts with axis labels
- NO recognizable real human faces

The image should look like a real photograph of a thoughtfully-staged scene
rather than an illustration.`;

  console.log(`[backfill] Generating cover for "${slug}" (${title})`);
  try {
    const result = await client.images.generate({
      model: IMAGE_MODEL,
      prompt,
      size: '1536x1024',
      quality: IMAGE_QUALITY,
      n: 1,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      console.warn(`[backfill] No b64_json returned for ${slug}`);
      return null;
    }
    await mkdir(COVERS_DIR, { recursive: true });
    const filename = `${slug}.png`;
    const filepath = join(COVERS_DIR, filename);
    await writeFile(filepath, Buffer.from(b64, 'base64'));
    console.log(`[backfill]   saved -> ${filepath}`);
    return `/covers/${filename}`;
  } catch (err) {
    console.warn(`[backfill] Cover generation FAILED for ${slug}:`, err);
    return null;
  }
}

async function processLang(lang: 'zh-TW' | 'en'): Promise<Map<string, { file: string; fm: Frontmatter }>> {
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

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY env var is required.');
  }
  const client = new OpenAI();

  const zh = await processLang('zh-TW');
  const en = await processLang('en');

  // collect slugs that need a cover
  const allSlugs = new Set([...zh.keys(), ...en.keys()]);
  const todo: { slug: string; title: string; primaryTag: string }[] = [];
  for (const slug of allSlugs) {
    const enEntry = en.get(slug);
    const zhEntry = zh.get(slug);
    const hasCover =
      (enEntry?.fm.cover && existsSync(join(ROOT, 'public', enEntry.fm.cover.replace(/^\//, '')))) ||
      (zhEntry?.fm.cover && existsSync(join(ROOT, 'public', zhEntry.fm.cover.replace(/^\//, '')))) ||
      existsSync(join(COVERS_DIR, `${slug}.png`));
    if (hasCover) {
      console.log(`[backfill] skip "${slug}" — already has cover`);
      continue;
    }
    const title = enEntry?.fm.title ?? zhEntry?.fm.title ?? slug;
    const primaryTag = enEntry?.fm.tags[0] ?? zhEntry?.fm.tags[0] ?? 'HCL Domino';
    todo.push({ slug, title, primaryTag });
  }

  console.log(`[backfill] ${todo.length} post(s) need a cover.`);
  for (const item of todo) {
    const coverPath = await generateCoverImage(client, item.title, item.primaryTag, item.slug);
    if (!coverPath) continue;
    // update both zh and en frontmatter
    for (const entry of [zh.get(item.slug), en.get(item.slug)]) {
      if (!entry) continue;
      const text = await readFile(entry.file, 'utf8');
      const updated = addCoverToFrontmatter(text, coverPath);
      await writeFile(entry.file, updated, 'utf8');
      console.log(`[backfill]   updated frontmatter -> ${entry.file}`);
    }
  }

  console.log('[backfill] Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
