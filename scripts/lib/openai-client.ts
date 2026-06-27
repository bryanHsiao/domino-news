/**
 * Construct an OpenAI client that uses Node's native fetch (undici)
 * instead of the node-fetch@2 shim the SDK (v4) otherwise reaches for.
 *
 * Why this exists: openai@4 depends on node-fetch@2.7.0, whose Gunzip
 * stream throws `ERR_STREAM_PREMATURE_CLOSE` ("Premature close") on
 * large gzip-compressed response bodies. gpt-image-1 returns exactly
 * that — a multi-MB base64 PNG, gzip-encoded — so cover generation hit
 * the bug consistently and silently shipped posts on the fallback
 * gradient for days (2026-06-27 notes-property-broker was the one that
 * surfaced it). undici (Node 18+ global fetch) decompresses gzip
 * correctly and does not have the bug.
 *
 * This is the surgical fix; the longer-term option is bumping to
 * openai@5, which drops the node-fetch dependency entirely.
 *
 * Requires Node >= 18 (global fetch). Throws early if it's missing so
 * the failure is loud rather than silently falling back to the broken
 * node-fetch path.
 */
import OpenAI from 'openai';

type ClientOptions = ConstructorParameters<typeof OpenAI>[0];

export function createOpenAIClient(options?: ClientOptions): OpenAI {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error(
      'Native global fetch is required (Node >= 18). Refusing to fall back ' +
        'to node-fetch, which throws ERR_STREAM_PREMATURE_CLOSE on large ' +
        'gzip image responses.'
    );
  }
  return new OpenAI({
    // Cast: openai@4's `Fetch` type is structurally compatible with the
    // global fetch but declared from node-fetch's lib, so TS sees a nominal
    // mismatch. The runtime contract (url, init) => Promise<Response> holds.
    fetch: ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args)) as never,
    ...options,
  });
}
