/**
 * Shared cover-image prompt + generation helper.
 *
 * Design intent: avoid the "all covers look the same" failure with a
 * two-pronged approach.
 *
 * (1) STYLE_VARIANTS is a curated pool of 12 visually-disjoint styles.
 *     Earlier iterations had several near-neighbors (editorial-flat /
 *     isometric-vector / risograph / paper-craft all collapsed into
 *     "flat illustration") which made covers look alike even when the
 *     STYLE id differed. The current set is intentionally one-per
 *     visual world (photoreal / oil / watercolor / pencil / B&W / paper
 *     / low-poly / risograph / chiaroscuro / collage / minimalist /
 *     art-deco), so even an accidental collision still produces obvious
 *     visual difference.
 *
 * (2) `pickStyle(recentStyles)` does sampling without replacement
 *     against a sliding window. Callers pass the styles used by the
 *     N most-recent neighbouring posts; pickStyle excludes those and
 *     picks from the remainder. With a 12-pool and N=6 there are
 *     always at least 6 styles to choose from.
 *
 * gpt-image-1 also gets an explicit "do not collapse to warm wooden
 * desk" instruction, since its prior was strong enough to override
 * STYLE direction in the previous iteration.
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

export interface StyleVariant {
  id: string;
  desc: string;
}

export const STYLE_VARIANTS: StyleVariant[] = [
  {
    id: 'photoreal-3d',
    desc: 'photorealistic 3D render with soft cinematic lighting and shallow depth of field — premium editorial photo aesthetic',
  },
  {
    id: 'oil-chiaroscuro',
    desc: 'dramatic chiaroscuro oil painting with one strong directional light source carving deep shadows; visible brush texture, no photorealism',
  },
  {
    id: 'watercolor',
    desc: 'hand-painted watercolor on textured paper, soft pigment bleed and visible brush strokes, cream and dusty-blue palette — no photorealism',
  },
  {
    id: 'pencil-sketch',
    desc: 'detailed pencil sketch on toned paper with crosshatching and realistic graphite shading; monochrome',
  },
  {
    id: 'bw-grain',
    desc: 'high-contrast black-and-white photograph with deliberate film grain, deep shadows and stark whites — no warm tones, almost graphic-novel feel',
  },
  {
    id: 'paper-craft',
    desc: 'paper-craft diorama with layered cut paper, crisp shadow lines, and overhead studio lighting — sculptural three-dimensional feel, not photographic',
  },
  {
    id: 'low-poly-3d',
    desc: 'low-poly 3D render with faceted geometry, matte color blocks and simple ambient occlusion — stylized, no photorealism',
  },
  {
    id: 'risograph',
    desc: 'risograph print aesthetic with slightly misregistered two-color overprint, halftone dot pattern, grainy paper texture — analog feel',
  },
  {
    id: 'minimalist-mono',
    desc: 'minimalist single-subject composition on a saturated solid color background, dramatic side lighting and almost surreal stillness',
  },
  {
    id: 'collage',
    desc: 'paper collage with cut-out magazine fragments, hand-torn edges, mixed-media texture — eclectic, intentionally imperfect',
  },
  {
    id: 'art-deco',
    desc: 'art deco poster style with strong bilateral symmetry, geometric ornament, and a tight palette of one metallic and one accent color',
  },
  {
    id: 'ukiyo-e',
    desc: 'Japanese ukiyo-e woodblock print style with flat color planes, bold outlines, and characteristic stylization — no photorealism',
  },
];

const STYLE_BY_ID: Record<string, StyleVariant> = Object.fromEntries(
  STYLE_VARIANTS.map((s) => [s.id, s])
);

/**
 * Pick a style id, excluding any that appear in `recentStyleIds`.
 * Falls back to the full pool only if every style has been used recently
 * (with N < 12 that should never actually happen).
 */
export function pickStyle(recentStyleIds: string[] = []): StyleVariant {
  const excluded = new Set(recentStyleIds);
  const available = STYLE_VARIANTS.filter((s) => !excluded.has(s.id));
  const pool = available.length > 0 ? available : STYLE_VARIANTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildCoverPrompt(
  title: string,
  primaryTag: string,
  recentStyleIds: string[] = []
): { prompt: string; styleId: string } {
  const style = pickStyle(recentStyleIds);
  const prompt = `Create a cover image for an editorial tech blog post.

Article subject: "${title}"
Primary tag: ${primaryTag}

Your job: imagine ONE cohesive scene that is a visual metaphor for THIS
specific subject. Great editorial covers show a concrete moment or
arrangement that surprises the reader. Be specific. Pick a scene that
ONLY makes sense for this subject — if the same image could illustrate
any tech article, it is too generic and you must try again.

Examples of strong editorial scene-thinking (use the IDEA, not the
materials — never echo "wooden / brass / oak / leather / desk lamp"
unless the chosen STYLE for this cover happens to call for that):
- "Query language" → a card-catalog drawer half-open, one index card
  being lifted out under a single light source.
- "Sort/categorise results" → marbles flowing through a tilted tray
  into separated channels.
- "Data migration" → a nautical chart spread out with a sextant,
  compass, and a half-rolled scroll.
- "Security / authentication" → a chained ledger and a row of keys
  hanging on hooks.
- "AI integration" → one teapot pouring into many small cups arranged
  in perfect symmetry.
- "Release notes / changelog" → freshly printed letterpress proofs
  hanging on a clothesline.
- "Performance / benchmarking" → a stopwatch next to a precision
  balance scale weighing weights.

STYLE for this specific cover: ${style.desc}.
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
  return { prompt, styleId: style.id };
}

export interface GeneratedCover {
  coverPath: string;
  styleId: string;
}

export async function generateCoverImage(
  client: OpenAI,
  title: string,
  primaryTag: string,
  slug: string,
  coversDir: string,
  recentStyleIds: string[] = []
): Promise<GeneratedCover | null> {
  const { prompt, styleId } = buildCoverPrompt(title, primaryTag, recentStyleIds);
  console.log(
    `[cover] Calling ${IMAGE_MODEL} (quality=${IMAGE_QUALITY}, style=${styleId}) for "${slug}"`
  );
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
    console.log(`[cover]   saved -> ${filepath} (style=${styleId})`);
    return { coverPath: `/covers/${filename}`, styleId };
  } catch (err) {
    console.warn(`[cover] Generation FAILED for ${slug}:`, err);
    return null;
  }
}

export function styleDescById(id: string): string | undefined {
  return STYLE_BY_ID[id]?.desc;
}
