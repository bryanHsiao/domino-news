/**
 * Audit every external URL in every published post — both `sources:`
 * frontmatter entries and inline body links.
 *
 * Catches the case where the daily-article generator picked a plausible-
 * looking HCL doc URL that returns HTTP 200 but is actually the SPA's
 * "Page Not Found" view. verifyUrl knows about this for help.hcl-software.com.
 *
 * Exit code 0 when every URL resolves to a real page; non-zero when any
 * broken URL is found, with a per-URL report. Run via `npm run check:urls`
 * locally, or via the check-urls workflow on push / weekly schedule.
 */

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractMarkdownLinks, verifyAll } from './lib/verify-urls.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');

interface UrlOrigin {
  url: string;
  postFile: string; // relative path
  where: 'sources' | 'inline';
}

async function collectUrls(): Promise<UrlOrigin[]> {
  const out: UrlOrigin[] = [];
  for (const lang of ['zh-TW', 'en'] as const) {
    const dir = join(POSTS_DIR, lang);
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) {
      if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
      const rel = `${lang}/${f}`;
      const raw = await readFile(join(dir, f), 'utf8');

      // sources: frontmatter URLs
      const sourcesBlock = raw.match(/^sources:\s*\n((?:\s+.*\n)+)/m)?.[1];
      if (sourcesBlock) {
        for (const m of sourcesBlock.matchAll(/^\s+url:\s*"?([^"\n]+?)"?\s*$/gm)) {
          out.push({ url: m[1].trim(), postFile: rel, where: 'sources' });
        }
      }

      // body inline markdown links — strip frontmatter first
      const bodyStart = raw.indexOf('\n---', 4);
      const body = bodyStart > 0 ? raw.slice(bodyStart + 4) : raw;
      for (const u of extractMarkdownLinks(body)) {
        out.push({ url: u, postFile: rel, where: 'inline' });
      }
    }
  }
  return out;
}

async function main() {
  const origins = await collectUrls();
  const uniqueUrls = [...new Set(origins.map((o) => o.url))];
  console.log(
    `[check-urls] scanning ${uniqueUrls.length} unique URL(s) ` +
      `across ${origins.length} usage(s)...`
  );

  const results = await verifyAll(uniqueUrls);
  const byUrl = new Map(results.map((r) => [r.url, r]));

  const broken: { o: UrlOrigin; status: number; reason?: string }[] = [];
  for (const o of origins) {
    const r = byUrl.get(o.url);
    if (r && !r.ok) broken.push({ o, status: r.status, reason: r.reason });
  }

  if (broken.length === 0) {
    console.log(`[check-urls] ✓ all URLs resolve. (${uniqueUrls.length} checked)`);
    return;
  }

  console.error(`[check-urls] ✗ ${broken.length} broken URL usage(s):`);
  for (const b of broken) {
    console.error(
      `  [${b.o.where}] ${b.o.postFile}\n` +
        `    ${b.o.status} ${b.o.url}` +
        (b.reason ? `\n    reason: ${b.reason}` : '')
    );
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
