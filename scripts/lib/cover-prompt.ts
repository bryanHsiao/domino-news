/**
 * Shared cover-image prompt + generation helper.
 *
 * Design intent: avoid the "all covers look the same" failure by
 * (1) randomly rotating the visual style per cover instead of pinning
 *     "photorealistic 3D render with warm lighting" — gpt-image-1 funnels
 *     that combo straight into "wooden desk + brass + amber glow", and
 * (2) keeping a negative list to ban patterns we over-use.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import OpenAI from 'openai';

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
const IMAGE_QUALITY = (process.env.OPENAI_IMAGE_QUALITY ?? 'medium') as
  | 'low'
  | 'medium'
  | 'high'
  | 'auto';

const STYLE_VARIANTS = [
  'photorealistic 3D render, soft cinematic lighting, shallow depth of field, premium editorial photo aesthetic',
  'editorial illustration with bold flat colors and clean geometric shapes, like a contemporary magazine opinion column header — no photorealism',
  'hand-painted watercolor on textured paper, cream and dusty-blue palette, visible brush strokes and slight pigment bleed — no photorealism',
  'paper-craft diorama with layered cut paper, crisp shadow lines, overhead studio lighting — sculptural, not photographic',
  'high-contrast black-and-white macro photography, sharp tonal separation, cool tones only, almost graphic-novel feel',
  'isometric vector illustration with three pastel colors and subtle line work — flat, no gradients, no photorealism',
  'risograph print aesthetic with slightly misregistered two-color overprint and grainy paper texture',
  'minimalist single-subject composition on a saturated solid color background, dramatic side lighting, almost surreal stillness',
];

function pickStyle(): string {
  return STYLE_VARIANTS[Math.floor(Math.random() * STYLE_VARIANTS.length)];
}

export function buildCoverPrompt(title: string, primaryTag: string): string {
  const style = pickStyle();
  return `Create a cover image for an editorial tech blog post.

Article subject: "${title}"
Primary tag: ${primaryTag}

Your job: imagine ONE cohesive scene that is a visual metaphor for THIS
specific subject. Great editorial covers show a concrete moment or
arrangement that surprises the reader. Be specific. Pick a scene that
ONLY makes sense for this subject — if the same image could illustrate
any tech article, it is too generic and you must try again.

Examples of strong editorial scene-thinking (use the IDEA, not the
materials — never echo "wooden / brass / oak / leather / desk lamp"
unless the chosen STYLE for this cover happens to call for it):
- "Query language" → a card-catalog drawer half-open, one index card
  being lifted out under a single light source.
- "Sort/categorise results" → marbles flowing through a tilted tray into
  separated channels.
- "Data migration" → a nautical chart spread out with a sextant, compass,
  and a half-rolled scroll.
- "Security / authentication" → a chained ledger and a row of keys hanging
  on hooks.
- "AI integration" → one teapot pouring into many small cups arranged in
  perfect symmetry.
- "Release notes / changelog" → freshly printed letterpress proofs hanging
  on a clothesline.
- "Performance / benchmarking" → a stopwatch next to a precision balance
  scale weighing weights.

STYLE for this specific cover: ${style}.
Landscape composition that fills the frame. Treat the STYLE as binding —
do not collapse back into "warm wooden desk with brass props" unless the
chosen style explicitly calls for that.

ABSOLUTE bans (must NOT appear):
- Text, words, letters, numbers, logos, brand marks
- Visible UI / screens / code listings / terminal output
- Vintage CRT monitors
- Domino tiles (unless the article is literally about the domino game)
- Generic "workshop with gears, cables, robot figurine, miniature figure"
- Orange ethernet cables piled on a desk
- Real human faces

The scene must look like a deliberately art-directed cover for one
specific story, not a stock image of "tech stuff".`;
}

export async function generateCoverImage(
  client: OpenAI,
  title: string,
  primaryTag: string,
  slug: string,
  coversDir: string
): Promise<string | null> {
  const prompt = buildCoverPrompt(title, primaryTag);
  console.log(`[cover] Calling ${IMAGE_MODEL} (quality=${IMAGE_QUALITY}) for "${slug}"`);
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
      console.warn(`[cover] No b64_json returned for ${slug}`);
      return null;
    }
    await mkdir(coversDir, { recursive: true });
    const filename = `${slug}.png`;
    const filepath = join(coversDir, filename);
    await writeFile(filepath, Buffer.from(b64, 'base64'));
    console.log(`[cover]   saved -> ${filepath}`);
    return `/covers/${filename}`;
  } catch (err) {
    console.warn(`[cover] Generation FAILED for ${slug}:`, err);
    return null;
  }
}
