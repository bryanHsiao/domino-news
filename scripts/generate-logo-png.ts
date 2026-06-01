/**
 * One-time: render public/favicon.svg into a raster PNG at
 * public/logo.png for use as JSON-LD publisher.logo.
 *
 * Google's Article structured data spec requires a raster image
 * for publisher.logo (SVG is not accepted). Minimum 112×112,
 * width-to-height ratio must be ≤ 600/60.
 *
 * Output: 600×600 PNG (square, well within ratio limits).
 *
 * Usage: npx tsx scripts/generate-logo-png.ts
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const svg = await readFile(join(ROOT, 'public', 'favicon.svg'));
const png = await sharp(svg).resize(600, 600).png({ compressionLevel: 9 }).toBuffer();
const out = join(ROOT, 'public', 'logo.png');
await writeFile(out, png);
console.log(`Wrote ${out} (${png.length} bytes)`);
