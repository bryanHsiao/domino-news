/**
 * URL liveness check. Returns one result per input URL.
 *   ok    — server returned a 2xx (or 3xx that resolved successfully)
 *   404   — definitely broken
 *   other — non-ok status (server error, blocked, timed out)
 *
 * Some sites refuse HEAD; we fall back to GET with a small range request.
 */

const TIMEOUT_MS = 12000;
const UA = 'domino-news-link-check/1.0 (+https://github.com/bryanHsiao/domino-news)';

export interface UrlCheckResult {
  url: string;
  status: number;
  ok: boolean;
  reason?: string;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }
}

export async function verifyUrl(url: string): Promise<UrlCheckResult> {
  const headers = { 'User-Agent': UA, Accept: '*/*' };
  try {
    let res = await fetchWithTimeout(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers,
    });
    // Some servers (esp. notes domino HTTP) reject HEAD with 404/405.
    if (res.status === 404 || res.status === 405 || res.status === 403) {
      res = await fetchWithTimeout(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { ...headers, Range: 'bytes=0-1023' },
      });
    }
    return {
      url,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export function extractMarkdownLinks(markdown: string): string[] {
  const found = new Set<string>();
  const re = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    found.add(m[1]);
  }
  return Array.from(found);
}

export async function verifyAll(urls: string[]): Promise<UrlCheckResult[]> {
  // Concurrency 5 to be polite.
  const queue = [...new Set(urls)];
  const results: UrlCheckResult[] = [];
  const inflight: Promise<void>[] = [];
  const next = async () => {
    const u = queue.shift();
    if (!u) return;
    const r = await verifyUrl(u);
    results.push(r);
    await next();
  };
  for (let i = 0; i < Math.min(5, queue.length); i++) inflight.push(next());
  await Promise.all(inflight);
  return results;
}
