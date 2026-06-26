// One-off diagnostic: is gpt-image-1 actually down, or does our larger /
// higher-quality request time out? Runs two variants and reports timing.
// Triggered via .github/workflows/test-image-gen.yml (workflow_dispatch).
import OpenAI from 'openai';

const client = new OpenAI(); // reads OPENAI_API_KEY from env

const PROMPT = 'a simple flat minimalist illustration of a red circle on a white background';

async function test(
  label: string,
  size: '1024x1024' | '1536x1024',
  quality: 'low' | 'medium' | 'high'
): Promise<void> {
  const t0 = Date.now();
  try {
    const r = await client.images.generate({
      model: 'gpt-image-1',
      prompt: PROMPT,
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
  await test('A small/low ', '1024x1024', 'low');
  await test('B our-actual', '1536x1024', 'medium');
  console.log('=== done ===');
})();
