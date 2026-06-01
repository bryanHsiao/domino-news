/**
 * Generate PNG fallback copies of every cover image, for use as
 * og:image / twitter:image where consumers don't reliably support
 * WebP (LinkedIn in particular, plus some chat preview generators).
 *
 * Site uses .webp for actual page rendering (5/30 migration); this
 * script adds parallel .png files so social share previews stay
 * reliable across all platforms.
 *
 * Reads every .webp in public/covers/ and writes a sibling .png.
 * Idempotent — re-running just overwrites the .png files.
 *
 * Usage: npx tsx scripts/generate-png-cover-fallback.ts
 */

import { readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COVERS_DIR = join(__dirname, '..', 'public', 'covers');

async function main() {
  const files = await readdir(COVERS_DIR);
  const webps = files.filter((f) => f.endsWith('.webp'));
  console.log(`[png-fallback] Found ${webps.length} WebP covers in ${COVERS_DIR}`);

  let webpTotal = 0;
  let pngTotal = 0;
  for (const webp of webps) {
    const webpPath = join(COVERS_DIR, webp);
    const pngPath = webpPath.replace(/\.webp$/, '.png');
    const webpBytes = (await stat(webpPath)).size;
    // Re-encode WebP → PNG. Quality of the WebP source is already locked
    // in (5/30 used quality 85); PNG is lossless wrapping on top of that.
    // PNG will typically be 3-5x larger than the WebP source on this kind
    // of illustrative cover, but still much smaller than the original
    // pre-WebP-migration PNGs.
    await sharp(webpPath).png({ compressionLevel: 9 }).toFile(pngPath);
    const pngBytes = (await stat(pngPath)).size;
    webpTotal += webpBytes;
    pngTotal += pngBytes;
    console.log(
      `[png-fallback] ${webp}: ${(webpBytes / 1024).toFixed(0)} KB → ${(pngBytes / 1024).toFixed(0)} KB png`
    );
  }
  console.log(
    `\n[png-fallback] Total: ${(webpTotal / 1024 / 1024).toFixed(1)} MB webp + ${(pngTotal / 1024 / 1024).toFixed(1)} MB png fallback`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
