/**
 * /map/ multi-language data layer.
 *
 * Reads every post's frontmatter (both en and zh-TW) and turns the map fields
 * (coversClass / coversIsland / apiLang — see docs/map-3d-island-brief.md
 * "多語言架構") into the structural data the islands view renders:
 *
 *   - which catalogue node each Java / SSJS post lights up (its "language
 *     lamp"), as node id -> { java: slugs, ssjs: slugs }
 *   - the XPages island's membership: every `coversIsland: "xpages"` post
 *
 * The output is language-agnostic: a post's `slug` is the same in both the
 * en and zh-TW files, so a Set of slugs dedupes the two language copies. The
 * caller (map.astro) resolves those slugs to the display language's published
 * post for titles / descriptions / urls, exactly as classArticles does for LS.
 *
 * This module is the shared "計算邏輯" behind both the islands render and the
 * `npm run map-lang-report` CLI (scripts/map-lang-report.ts) — it must NOT be
 * confused with coverage.ts's javaMentions / ssjsMentions, which come from LS
 * posts' relatedJava / relatedSsjs and point back at LS posts (see CLAUDE.md
 * "Cross-language linking strategy").
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const LANGS = ['en', 'zh-TW'] as const;

export type ApiLang = 'java' | 'ssjs';

export interface MapPost {
  slug: string;
  lang: string; // 'en' | 'zh-TW'
  coversClass: string[];
  coversIsland?: string;
  apiLang?: ApiLang;
}

/** Parse a scalar YAML value: `key: "X"` or `key: X`. */
function getScalar(fm: string, key: string): string | undefined {
  const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?\\s*$`, 'm'));
  return m?.[1]?.trim() || undefined;
}

/** Parse coversClass: single string, inline array, or block array. */
function getCoversClass(fm: string): string[] {
  const inline = fm.match(/^coversClass:\s*\[(.*?)\]\s*$/m);
  if (inline) {
    return inline[1].split(',').map((s) => s.trim().replace(/^"(.*)"$/, '$1')).filter(Boolean);
  }
  const single = fm.match(/^coversClass:\s*"?([^"\n[][^"\n]*)"?\s*$/m);
  if (single) return [single[1].trim().replace(/^"(.*)"$/, '$1')];
  const block = fm.match(/^coversClass:\s*\n((?:\s+-\s+.*\n?)+)/m);
  if (block) {
    return block[1].split('\n').map((l) => l.replace(/^\s+-\s+"?/, '').replace(/"?\s*$/, '').trim()).filter(Boolean);
  }
  return [];
}

/** Every post (both languages) that sets a map field. */
export async function loadMapPosts(): Promise<MapPost[]> {
  const out: MapPost[] = [];
  for (const lang of LANGS) {
    const dir = join(ROOT, 'src', 'content', 'posts', lang);
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) {
      if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
      const raw = (await readFile(join(dir, f), 'utf8')).replace(/\r\n/g, '\n');
      const m = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!m) continue;
      const fm = m[1];
      const coversClass = getCoversClass(fm);
      const coversIsland = getScalar(fm, 'coversIsland');
      const apiLang = getScalar(fm, 'apiLang') as ApiLang | undefined;
      if (coversClass.length === 0 && !coversIsland) continue;
      out.push({ slug: getScalar(fm, 'slug') ?? f.replace(/\.(md|mdx)$/, ''), lang, coversClass, coversIsland, apiLang });
    }
  }
  return out;
}

export interface NodeLamp {
  /** slugs of Java posts that cover this node (unique across languages) */
  java: string[];
  /** slugs of SSJS posts that cover this node */
  ssjs: string[];
}

export interface MapLanguageData {
  /** node id -> which Java / SSJS posts light its lamp (only lit nodes present) */
  lamps: Map<string, NodeLamp>;
  /** XPages island members: one entry per unique slug (caller resolves + orders) */
  xpages: { slug: string; apiLang: ApiLang }[];
  /** coversClass ids that are NOT catalogue nodes (a frontmatter mistake) */
  unknownClassIds: string[];
}

/**
 * Fold the map posts into per-node lamps and the XPages island list.
 * `classIds` is the set of real catalogue node ids (data/ls_classes.json),
 * so a stray coversClass id can be reported rather than silently dropped.
 */
export function computeMapLanguages(posts: MapPost[], classIds: Set<string>): MapLanguageData {
  const lamps = new Map<string, NodeLamp>();
  const lamp = (id: string): NodeLamp => {
    let l = lamps.get(id);
    if (!l) { l = { java: [], ssjs: [] }; lamps.set(id, l); }
    return l;
  };
  const seen = { java: new Set<string>(), ssjs: new Set<string>() };
  const unknown = new Set<string>();
  const islandSlugs = new Map<string, ApiLang>();

  for (const p of posts) {
    for (const id of p.coversClass) {
      if (!classIds.has(id)) { unknown.add(`${id} (in ${p.lang}/${p.slug})`); continue; }
      if (p.apiLang === 'java' || p.apiLang === 'ssjs') {
        const key = p.apiLang + ':' + id + ':' + p.slug;
        if (seen[p.apiLang].has(key)) continue; // same slug in both langs
        seen[p.apiLang].add(key);
        lamp(id)[p.apiLang].push(p.slug);
      }
    }
    if (p.coversIsland === 'xpages' && (p.apiLang === 'java' || p.apiLang === 'ssjs')) {
      if (!islandSlugs.has(p.slug)) islandSlugs.set(p.slug, p.apiLang);
    }
  }

  const xpages = [...islandSlugs.entries()]
    .map(([slug, apiLang]) => ({ slug, apiLang }))
    .sort((a, b) => a.slug.localeCompare(b.slug)); // deterministic; map.astro re-orders by pubDate

  return { lamps, xpages, unknownClassIds: [...unknown] };
}
