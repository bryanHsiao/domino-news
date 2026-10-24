/**
 * Generate 1200x630 JPEG fallback copies of every cover image, for use as
 * og:image / twitter:image where consumers don't reliably support
 * WebP (LinkedIn in particular, plus some chat preview generators).
 *
 * Site uses .webp for actual page rendering (5/30 migration); this
 * script adds parallel .jpg files so social share previews stay
 * reliable across all platforms. It replaces the earlier lossless .png
 * fallback (~3 MB each), which made up ~90% of the Pages artifact.
 *
 * Reads every .webp in public/covers/ and writes a sibling .jpg.
 * Idempotent — re-running just overwrites the .jpg files.
 *
 * Usage: npx tsx scripts/generate-og-cover-fallback.ts
 */

import { readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { OG_WIDTH, OG_HEIGHT, OG_JPEG_QUALITY } from './lib/cover-prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COVERS_DIR = join(__dirname, '..', 'public', 'covers');

async function main() {
  const files = await readdir(COVERS_DIR);
  const webps = files.filter((f) => f.endsWith('.webp'));
  console.log(`[og-fallback] Found ${webps.length} WebP covers in ${COVERS_DIR}`);

  let webpTotal = 0;
  let jpgTotal = 0;
  for (const webp of webps) {
    const webpPath = join(COVERS_DIR, webp);
    const jpgPath = webpPath.replace(/\.webp$/, '.jpg');
    const webpBytes = (await stat(webpPath)).size;
    // Re-encode WebP → JPEG, center-of-interest cropped to the 1.91:1
    // share-card ratio so platforms don't apply their own crop.
    await sharp(webpPath)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: OG_JPEG_QUALITY, mozjpeg: true })
      .toFile(jpgPath);
    const jpgBytes = (await stat(jpgPath)).size;
    webpTotal += webpBytes;
    jpgTotal += jpgBytes;
    console.log(
      `[og-fallback] ${webp}: ${(webpBytes / 1024).toFixed(0)} KB → ${(jpgBytes / 1024).toFixed(0)} KB jpg`
    );
  }
  console.log(
    `\n[og-fallback] Total: ${(webpTotal / 1024 / 1024).toFixed(1)} MB webp + ${(jpgTotal / 1024 / 1024).toFixed(1)} MB jpg fallback`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
