// One-off diagnostic: is gpt-image-1 actually down, or does our larger /
// higher-quality request time out? Runs two variants and reports timing.
// Triggered via .github/workflows/test-image-gen.yml (workflow_dispatch).
import OpenAI from 'openai';

const client = new OpenAI(); // reads OPENAI_API_KEY from env

const SHORT = 'a simple flat minimalist illustration of a red circle on a white background';
// Approximate the length/complexity of a real cover prompt (style + subject +
// composition), to test whether a longer prompt pushes generation past the
// ~20s point where the connection gets cut ("Premature close").
const LONG =
  'Editorial paper-craft collage illustration, layered cut-paper textures with visible torn edges and soft drop shadows, muted earthy palette of ochre, teal and warm grey on a cream background. Subject: an abstract representation of a database view as a grid of columns, with one column highlighted and small paper tags labelling each column, a magnifying glass hovering over the structure. Balanced asymmetric composition with generous negative space, warm directional lighting, tactile handmade feel, no text, no letters, no words, high detail, professional magazine cover aesthetic.';

async function test(
  label: string,
  size: '1024x1024' | '1536x1024',
  quality: 'low' | 'medium' | 'high',
  prompt: string
): Promise<void> {
  const t0 = Date.now();
  try {
    const r = await client.images.generate({
      model: 'gpt-image-1',
      prompt,
      size,
      quality,
      n: 1,
    });
    const ms = Date.now() - t0;
    const len = r.data?.[0]?.b64_json?.length ?? 0;
    console.log(`[OK]   ${label} (${size}, ${quality}): ${ms}ms, b64 length=${len}`);
  } catch (e) {
    const ms = Date.now() - t0;
    console.log(`[FAIL] ${label} (${size}, ${quality}): ${ms}ms — ${e instanceof Error ? e.message : e}`);
  }
}

(async () => {
  console.log('=== gpt-image-1 single-point test ===');
  await test('A short/low      ', '1024x1024', 'low', SHORT);
  await test('B short/our-size  ', '1536x1024', 'medium', SHORT);
  await test('C LONG/our-size   ', '1536x1024', 'medium', LONG);
  await test('D LONG/low-quality', '1536x1024', 'low', LONG);
  console.log('=== done ===');
})();
