/**
 * /map/ multi-language data layer.
 *
 * Reads every post's frontmatter (both en and zh-TW) and turns the map fields
 * (coversClass / coversIsland / apiLang — see docs/map-3d-island-brief.md
 * "多語言架構") into the structural data the islands view renders:
 *
 *   - which catalogue node each Java / SSJS post lights up (its "language
 *     lamp"), as node id -> { java: slugs, ssjs: slugs }
 *   - the off-shore islands' membership: every `coversIsland` post, per
 *     island ("xpages" = XPages / web layer, "java-runtime" = Java-only
 *     runtime topics)
 *
 * A coversClass value may be the node id ("NotesStream") or the Java class
 * name ("Stream", "DxlExporter", "LLMReq"); resolveClassId maps either onto
 * the catalogue node, case-insensitively.
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

/** The off-shore islands a post can join with `coversIsland`. */
export const MAP_ISLANDS = ['xpages', 'java-runtime'] as const;
export type MapIsland = (typeof MAP_ISLANDS)[number];

export interface MapPost {
  slug: string;
  lang: string; // 'en' | 'zh-TW'
  /** staged in _pending/ rather than published in src/content/posts/ */
  pending: boolean;
  coversClass: string[];
  coversIsland?: string;
  apiLang?: ApiLang;
}

// Java class names that aren't "Notes" + the name (HCL's Java index vs
// data/ls_classes.json). Keys are lower-case.
const JAVA_NAME_EXCEPTIONS: Record<string, string> = {
  llmreq: 'NotesLLMRequest',
  llmres: 'NotesLLMResponse',
};

/**
 * Map a coversClass value onto a catalogue node id, or null if nothing
 * matches. Tries, ignoring case: the node id itself, then "Notes" + the value
 * (the Java name: Stream → NotesStream, DxlExporter → NotesDXLExporter), then
 * the exception table (LLMReq → NotesLLMRequest).
 */
export function resolveClassId(value: string, classIds: Set<string>): string | null {
  const byLower = new Map([...classIds].map((id) => [id.toLowerCase(), id] as const));
  const v = value.trim().toLowerCase();
  return byLower.get(v) ?? byLower.get('notes' + v) ?? byLower.get(JAVA_NAME_EXCEPTIONS[v]?.toLowerCase() ?? '') ?? null;
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

/**
 * Every post (both languages) that sets a map field. `includePending` also
 * reads the staged queue in _pending/ — for the report, which checks a post's
 * map fields before the cron publishes it (the site build never sees
 * _pending/, so a mistake there would otherwise surface only on release day).
 */
export async function loadMapPosts({ includePending = false } = {}): Promise<MapPost[]> {
  const roots = [{ dir: join(ROOT, 'src', 'content', 'posts'), pending: false }];
  if (includePending) roots.push({ dir: join(ROOT, '_pending'), pending: true });
  const out: MapPost[] = [];
  for (const root of roots)
    for (const lang of LANGS) {
      const dir = join(root.dir, lang);
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
        out.push({ slug: getScalar(fm, 'slug') ?? f.replace(/\.(md|mdx)$/, ''), lang, pending: root.pending, coversClass, coversIsland, apiLang });
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
  /** off-shore island members per island: one entry per unique slug (caller resolves + orders) */
  islands: Record<MapIsland, { slug: string; apiLang: ApiLang }[]>;
  /** coversClass values that resolve to no catalogue node, and coversIsland
   * values that name no island (frontmatter mistakes) */
  unknownClassIds: string[];
  /** each coversClass value that was a Java name rather than the node id:
   * "Stream → NotesStream (in en/foo)", for the report */
  resolved: string[];
}

/**
 * Fold the map posts into per-node lamps and the off-shore island lists.
 * `classIds` is the set of real catalogue node ids (data/ls_classes.json),
 * so a stray coversClass value can be reported rather than silently dropped.
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
  const resolved = new Set<string>();
  const islandSlugs = new Map<MapIsland, Map<string, ApiLang>>(MAP_ISLANDS.map((i) => [i, new Map()]));
  const where = (p: MapPost) => `in ${p.pending ? '_pending/' : ''}${p.lang}/${p.slug}`;

  for (const p of posts) {
    for (const value of p.coversClass) {
      const id = resolveClassId(value, classIds);
      if (!id) { unknown.add(`coversClass ${value} (${where(p)})`); continue; }
      if (id !== value) resolved.add(`${value} → ${id} (${where(p)})`);
      if (p.apiLang === 'java' || p.apiLang === 'ssjs') {
        const key = p.apiLang + ':' + id + ':' + p.slug;
        if (seen[p.apiLang].has(key)) continue; // same slug in both langs
        seen[p.apiLang].add(key);
        lamp(id)[p.apiLang].push(p.slug);
      }
    }
    if (p.coversIsland) {
      const members = islandSlugs.get(p.coversIsland as MapIsland);
      if (!members) unknown.add(`coversIsland ${p.coversIsland} (${where(p)})`);
      else if ((p.apiLang === 'java' || p.apiLang === 'ssjs') && !members.has(p.slug)) members.set(p.slug, p.apiLang);
    }
  }

  const islands = Object.fromEntries(
    MAP_ISLANDS.map((i) => [
      i,
      [...islandSlugs.get(i)!.entries()]
        .map(([slug, apiLang]) => ({ slug, apiLang }))
        .sort((a, b) => a.slug.localeCompare(b.slug)), // deterministic; map.astro re-orders by pubDate
    ]),
  ) as MapLanguageData['islands'];

  return { lamps, islands, unknownClassIds: [...unknown], resolved: [...resolved] };
}
