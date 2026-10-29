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

/**
 * Hosts that serve a single-page app: every URL returns HTTP 200 with the
 * SPA shell. If the route doesn't match a real document, the SPA renders a
 * "Page Not Found" view inside that 200 — soft 404. We need to GET the body
 * and check the title to know if it's a real page.
 *
 * help.hcl-software.com is the headline offender (HCL Domino docs). Add
 * other SPAs here when we cite them.
 */
const SPA_HOSTS_NEED_TITLE_CHECK = new Set(['help.hcl-software.com']);
const SPA_404_TITLE_PATTERNS: RegExp[] = [
  /404\s*Page/i, // HCL: "<title>HCL Software 404 Page</title>"
  /Page\s*Not\s*Found/i,
];

/**
 * Hosts behind bot protection (e.g. StackOverflow via Cloudflare) that
 * refuse non-browser requests with 403/429 no matter the User-Agent — the
 * page is fine for real visitors, but an automated checker can never see it.
 * For these hosts a 403/429 is treated as reachable instead of broken. A 404
 * is still broken, so a genuinely deleted page (e.g. a removed SO question)
 * is still caught. Match is exact-host or any subdomain.
 */
const BOT_BLOCKED_HOSTS = new Set(['stackoverflow.com']);
const BOT_BLOCK_STATUSES = new Set([403, 429]);

function isBotBlockedHost(host: string): boolean {
  return [...BOT_BLOCKED_HOSTS].some(
    (h) => host === h || host.endsWith(`.${h}`)
  );
}

async function deepCheckSpa404(url: string): Promise<UrlCheckResult | null> {
  const headers = { 'User-Agent': UA, Accept: 'text/html,*/*' };
  try {
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      redirect: 'follow',
      headers,
    });
    if (res.status >= 400) {
      return { url, status: res.status, ok: false };
    }
    const body = await res.text();
    const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? '';
    const isSoft404 = SPA_404_TITLE_PATTERNS.some((re) => re.test(title));
    if (isSoft404) {
      return {
        url,
        status: res.status,
        ok: false,
        reason: `SPA soft-404 (page title: "${title}")`,
      };
    }
    return { url, status: res.status, ok: true };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function verifyUrl(url: string): Promise<UrlCheckResult> {
  // SPA hosts need a body-level check because every path returns 200.
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    /* fall through to normal check */
  }
  if (SPA_HOSTS_NEED_TITLE_CHECK.has(host)) {
    const r = await deepCheckSpa404(url);
    if (r) return r;
  }

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
    const ok = res.status >= 200 && res.status < 400;
    // Bot-protected hosts return 403/429 to any non-browser fetch; can't be
    // verified programmatically, so treat those statuses as reachable. A 404
    // from them is still a real broken link and falls through to ok=false.
    if (!ok && BOT_BLOCK_STATUSES.has(res.status) && isBotBlockedHost(host)) {
      return {
        url,
        status: res.status,
        ok: true,
        reason: `${res.status} from bot-protected host; not machine-verifiable, assumed reachable`,
      };
    }
    return {
      url,
      status: res.status,
      ok,
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
