/**
 * One-time migration: convert public/covers/*.png to .webp (quality 85),
 * delete the originals, and rewrite frontmatter `cover:` references in
 * src/content/posts/{zh-TW,en}/*.md from .png to .webp.
 *
 * Why: Cover PNGs were averaging 2.6 MB each (37 files = 96 MB total);
 * the homepage card grid loads 9 of them so the cold-load was ~23 MB.
 * WebP at quality 85 typically shrinks gpt-image-1 1536x1024 output by
 * 65-80%, so the homepage should drop to ~5-9 MB after this script runs.
 *
 * After this runs, also:
 *   - update scripts/lib/cover-prompt.ts to emit .webp directly
 *   - update scripts/backfill-covers.ts hasCoverOnDisk check
 *   - update src/layouts/BaseLayout.astro defaultOgImage extension
 *
 * Usage: npx tsx scripts/convert-covers-to-webp.ts
 */

import { readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const COVERS_DIR = join(ROOT, 'public', 'covers');
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');

const QUALITY = 85;

async function convertOne(png: string): Promise<{ before: number; after: number }> {
  const pngPath = join(COVERS_DIR, png);
  const webpPath = pngPath.replace(/\.png$/, '.webp');
  const before = (await stat(pngPath)).size;
  await sharp(pngPath).webp({ quality: QUALITY }).toFile(webpPath);
  const after = (await stat(webpPath)).size;
  await unlink(pngPath);
  return { before, after };
}

async function rewriteFrontmatterCovers(lang: 'zh-TW' | 'en'): Promise<number> {
  const dir = join(POSTS_DIR, lang);
  const files = await readdir(dir);
  let updated = 0;
  for (const f of files) {
    if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
    const filepath = join(dir, f);
    const text = await readFile(filepath, 'utf8');
    if (!/cover:\s*"?\/covers\/[^"\n]*\.png"?/.test(text)) continue;
    const rewritten = text.replace(
      /(cover:\s*"?\/covers\/[^"\n]*)\.png("?)/g,
      '$1.webp$2'
    );
    if (rewritten !== text) {
      await writeFile(filepath, rewritten, 'utf8');
      updated += 1;
    }
  }
  return updated;
}

async function main() {
  // Phase 1: convert all PNGs to WebP
  const files = await readdir(COVERS_DIR);
  const pngs = files.filter((f) => f.endsWith('.png'));
  console.log(`[convert] Found ${pngs.length} PNGs in ${COVERS_DIR}`);

  let beforeTotal = 0;
  let afterTotal = 0;
  for (const png of pngs) {
    const { before, after } = await convertOne(png);
    beforeTotal += before;
    afterTotal += after;
    const pct = Math.round((1 - after / before) * 100);
    console.log(
      `[convert] ${png}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (-${pct}%)`
    );
  }

  if (pngs.length > 0) {
    const totalPct = Math.round((1 - afterTotal / beforeTotal) * 100);
    console.log(
      `\n[convert] Total: ${(beforeTotal / 1024 / 1024).toFixed(1)} MB → ${(afterTotal / 1024 / 1024).toFixed(1)} MB (-${totalPct}%)`
    );
  }

  // Phase 2: rewrite frontmatter cover: references
  const zh = await rewriteFrontmatterCovers('zh-TW');
  const en = await rewriteFrontmatterCovers('en');
  console.log(`\n[frontmatter] Rewrote ${zh} zh-TW posts + ${en} en posts.`);

  console.log('\n[done]');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
