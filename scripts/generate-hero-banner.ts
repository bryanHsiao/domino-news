/**
 * One-shot hero-banner image generator for the homepage.
 *
 * Calls OpenAI gpt-image-1 with a hand-crafted scene prompt that matches
 * the site's "consultant at work" positioning, and writes the result to
 * public/hero/home-banner.png.
 *
 * Run via the generate-hero.yml workflow (workflow_dispatch). Requires
 * OPENAI_API_KEY in the workflow environment. Idempotent — overwrites
 * any existing banner. Trigger again whenever you want to regenerate.
 *
 * Generates at 1536×1024 (the widest size gpt-image-1 supports). The
 * homepage CSS crops it to a 3:1 banner via object-fit: cover, so we
 * keep the full pixel data on disk in case we want to reframe later.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const HERO_DIR = join(ROOT, 'public', 'hero');
const HERO_FILENAME = 'home-banner.png';

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
const IMAGE_QUALITY = (process.env.OPENAI_IMAGE_QUALITY ?? 'high') as
  | 'low'
  | 'medium'
  | 'high'
  | 'auto';

const PROMPT = `Create a cinematic 3D rendered photograph of a Domino developer
consultant's workspace, taken from a slightly elevated 3/4 angle. The scene shows:

- A wooden desk with an open hardcover notebook covered in hand-drawn architecture
  sketches: arrows linking small icons (a server, a few client laptops, a stack
  of documents), a tree diagram with branches, a list of bullet points — all
  drawn with a fountain pen, all sketches and symbols only, never legible words
- A vintage Lotus-yellow ceramic mug full of black coffee, in the front-left
  corner
- A stack of well-thumbed technical reference books, slightly out of focus on
  the right
- A small brass desk lamp casting warm afternoon light from the left
- A few loose index cards with hand-drawn icons (no readable text), arranged
  as if the consultant just finished sorting them
- A potted succulent in the background, slightly blurred
- Pen and pencil resting beside the notebook

Mood: a real consultant's desk in the middle of writing something — lived-in,
deliberate, calm. Late afternoon golden-hour light through an unseen window
casts soft warm highlights and long shadows. The whole scene feels like
photographic evidence of a real human at work, not a stock illustration.

STYLE: photorealistic 3D render, warm cinematic lighting, shallow depth of
field, premium editorial photograph. Wide landscape composition that fills
the frame edge to edge.

ABSOLUTE bans:
- No legible text, words, letters, numbers, logos, or brand marks
  (any writing in the notebook must be symbols / sketches / squiggles only,
  never readable as language)
- No visible monitors, screens, terminals, or UI
- No real human faces or hands in the frame
- No domino game tiles (this is a metaphor only, not the literal game)
- No "robot figurine in a workshop with gears" trope
- No orange ethernet cables
- No CRT monitors or vintage tech kitsch`;

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY env var is required.');
  }
  const client = new OpenAI();
  console.log(`[hero] Calling ${IMAGE_MODEL} (quality=${IMAGE_QUALITY}) for home banner`);
  const result = await client.images.generate({
    model: IMAGE_MODEL,
    prompt: PROMPT,
    size: '1536x1024',
    quality: IMAGE_QUALITY,
    n: 1,
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('No b64_json returned from image generation.');
  }
  await mkdir(HERO_DIR, { recursive: true });
  const filepath = join(HERO_DIR, HERO_FILENAME);
  await writeFile(filepath, Buffer.from(b64, 'base64'));
  console.log(`[hero] Saved -> ${filepath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
