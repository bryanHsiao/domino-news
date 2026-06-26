// One-off: generate the notes-view-column cover with a short, reliable prompt
// (the full 2200-char editorial prompt keeps failing today). On success, save
// the webp/png and write the cover frontmatter so the workflow can commit it.
// Triggered via .github/workflows/gen-one-cover.yml. Remove after use.
import OpenAI from 'openai';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SLUG = 'notes-view-column';
const STYLE = 'collage';
const PROMPT =
  'A bold cut-paper collage editorial cover illustration: an abstract grid representing the columns of a database view, with one column highlighted and small paper tags labelling each column, and a magnifying glass hovering over the grid. Muted earthy palette of ochre, teal and warm grey on a cream background, layered torn-paper textures, generous negative space. No text, no letters, no words.';

const client = new OpenAI();

async function genOnce(quality: 'low' | 'medium'): Promise<Buffer | null> {
  try {
    const r = await client.images.generate({
      model: 'gpt-image-1',
      prompt: PROMPT,
      size: '1536x1024',
      quality,
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    return b64 ? Buffer.from(b64, 'base64') : null;
  } catch (e) {
    console.warn('  attempt failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

(async () => {
  let buf: Buffer | null = null;
  for (let i = 1; i <= 6 && !buf; i++) {
    console.log(`attempt ${i} (quality=${i <= 2 ? 'medium' : 'low'})...`);
    buf = await genOnce(i <= 2 ? 'medium' : 'low');
    if (!buf && i < 6) await new Promise((r) => setTimeout(r, 8000));
  }
  if (!buf) {
    console.error('ALL ATTEMPTS FAILED — OpenAI image API is still failing right now.');
    process.exit(1);
  }

  const coversDir = 'public/covers';
  await mkdir(coversDir, { recursive: true });
  await sharp(buf).webp({ quality: 85 }).toFile(join(coversDir, `${SLUG}.webp`));
  await sharp(buf).png({ compressionLevel: 9 }).toFile(join(coversDir, `${SLUG}.png`));
  console.log('saved cover images');

  for (const lang of ['zh-TW', 'en']) {
    const p = `src/content/posts/${lang}/2026-06-26-${SLUG}.md`;
    if (!existsSync(p)) {
      console.warn('  missing post:', p);
      continue;
    }
    const txt = readFileSync(p, 'utf8');
    if (/^cover:/m.test(txt)) {
      console.log('  already has cover:', p);
      continue;
    }
    const lines = txt.split('\n');
    let count = 0;
    let idx = -1;
    for (let k = 0; k < lines.length; k++) {
      if (lines[k].trim() === '---') {
        count++;
        if (count === 2) {
          idx = k;
          break;
        }
      }
    }
    if (idx < 0) {
      console.warn('  no frontmatter end in', p);
      continue;
    }
    lines.splice(idx, 0, `cover: "/covers/${SLUG}.webp"`, `coverStyle: "${STYLE}"`);
    writeFileSync(p, lines.join('\n'));
    console.log('  wrote cover frontmatter:', p);
  }
  console.log('DONE');
})();
