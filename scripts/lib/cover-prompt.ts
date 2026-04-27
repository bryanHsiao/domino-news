/**
 * Shared cover-image prompt + generation helper.
 *
 * Design intent: avoid the "all covers look the same" failure by REMOVING
 * the prop list (which the model otherwise echoes) and instead asking it
 * to invent a scene that only makes sense for this specific topic, plus a
 * negative list that bans the patterns we have already over-used.
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

export function buildCoverPrompt(title: string, primaryTag: string): string {
  return `Create a cinematic 3D rendered cover photo for an editorial tech blog post.

Article subject: "${title}"
Primary tag: ${primaryTag}

Your job: imagine ONE cohesive scene that is a visual metaphor for THIS
specific subject. Great editorial covers show a concrete real-world moment
or arrangement that surprises the reader. Be specific. Pick props and a
setting that ONLY make sense for this subject — if the same image could
illustrate any tech article, it is too generic and you must try again.

Examples of strong editorial scene-thinking:
- "Query language" → a wooden library card-catalog drawer half-open, an
  index card being lifted by tweezers under a brass desk lamp.
- "Sort/categorise results" → marbles flowing through a tilted wooden tray
  into separated channels at golden hour.
- "Data migration" → a nautical chart spread out with a brass sextant,
  compass, ink well, and a half-rolled scroll.
- "Security / authentication" → an antique leather ledger chained to an
  oak desk, brass keys hanging on iron hooks.
- "AI integration" → a single porcelain teapot pouring into many small
  cups arranged in perfect symmetry on a black slate.
- "Release notes / changelog" → freshly printed letterpress proofs hanging
  on a clothesline with the ink still drying.
- "Performance / benchmarking" → a stopwatch on red felt next to a
  precision balance scale weighing brass weights.

Vary the SETTING per subject. Rotate among: craftsman workshop, library
archive, minimalist studio, outdoor blueprint table at dusk, kitchen
counter, game table, vintage office, clean modern lab, botanical still
life, observatory. Pick the one that fits the topic's mood, not the one
that fits "generic technology".

STYLE: photorealistic 3D render, soft cinematic lighting, shallow depth
of field, premium editorial photo. Landscape composition that fills frame.

ABSOLUTE bans (must NOT appear):
- Text, words, letters, numbers, logos, brand marks
- Visible UI / screens / code listings / terminal output
- Vintage CRT monitors
- Domino tiles (unless the article is literally about the domino game)
- Generic "workshop with gears, cables, robot figurine, miniature figure"
- Orange ethernet cables piled on a desk
- Real human faces

The scene must look like a real photograph staged for one specific story,
not a stock image of "tech stuff".`;
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
