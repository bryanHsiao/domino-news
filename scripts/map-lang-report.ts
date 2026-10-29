/**
 * /map/ multi-language lamp report.
 *
 * Reads every post's frontmatter (both en and zh-TW), pulls the map fields
 * (coversClass / coversIsland / apiLang), and prints:
 *   - a per-node lamp table: node id -> { ls, java, ssjs }
 *   - the XPages island membership list
 *   - summary counts, and any coversClass id that is NOT a catalogue node.
 *
 * This is a verification aid for the "回標現有語言文" work (see
 * docs/map-3d-island-brief.md "多語言架構"). It does NOT drive rendering yet —
 * the 3D lamps / island are a later PR. The "ls" column reuses the existing
 * URL-based coverage (scripts/lib/coverage.ts), so it shares that module's
 * known blind spots (see CLAUDE.md "Coverage tracker / Known limitations").
 *
 * Run: npm run map-lang-report
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCoverageReport, loadClassMap } from './lib/coverage.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LANGS = ['en', 'zh-TW'] as const;

interface MapMeta {
  slug: string;
  lang: string;
  coversClass: string[];
  coversIsland?: string;
  apiLang?: string;
}

/** Parse a YAML string value: `key: "X"` or `key: X`. */
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

async function loadMapMeta(): Promise<MapMeta[]> {
  const out: MapMeta[] = [];
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
      const apiLang = getScalar(fm, 'apiLang');
      if (coversClass.length === 0 && !coversIsland) continue;
      out.push({ slug: getScalar(fm, 'slug') ?? f, lang, coversClass, coversIsland, apiLang });
    }
  }
  return out;
}

async function main(): Promise<void> {
  const [mapMeta, report, { classes }] = await Promise.all([
    loadMapMeta(),
    buildCoverageReport(),
    loadClassMap(),
  ]);

  const classIds = new Set(classes.map((c) => c.id));
  const nameOf = new Map(classes.map((c) => [c.id, c.name] as const));

  // node id -> { ls, java, ssjs }
  interface Lamp { ls: boolean; java: boolean; ssjs: boolean; }
  const lamps = new Map<string, Lamp>();
  const lamp = (id: string): Lamp => {
    let l = lamps.get(id);
    if (!l) { l = { ls: false, java: false, ssjs: false }; lamps.set(id, l); }
    return l;
  };

  // LS lamp from existing URL-based coverage
  for (const id of report.coverage.keys()) lamp(id).ls = true;

  // java / ssjs lamps + island members from the new frontmatter
  const unknownIds = new Set<string>();
  const island = new Map<string, Set<string>>(); // island -> apiLangs' slugs
  for (const meta of mapMeta) {
    for (const id of meta.coversClass) {
      if (!classIds.has(id)) { unknownIds.add(`${id} (in ${meta.lang}/${meta.slug})`); continue; }
      if (meta.apiLang === 'java') lamp(id).java = true;
      else if (meta.apiLang === 'ssjs') lamp(id).ssjs = true;
    }
    if (meta.coversIsland) {
      if (!island.has(meta.coversIsland)) island.set(meta.coversIsland, new Set());
      island.get(meta.coversIsland)!.add(`${meta.slug} [${meta.apiLang}]`);
    }
  }

  // --- print ---
  console.log('\n=== /map/ language lamps (nodes with any java/ssjs lamp) ===\n');
  const lit = [...lamps.entries()]
    .filter(([, l]) => l.java || l.ssjs)
    .sort((a, b) => a[0].localeCompare(b[0]));
  console.log('node                          ls   java  ssjs');
  console.log('----------------------------  ---  ----  ----');
  const tick = (b: boolean) => (b ? ' ● ' : ' · ');
  for (const [id, l] of lit) {
    console.log(`${id.padEnd(28)} ${tick(l.ls)}  ${tick(l.java)}  ${tick(l.ssjs)}  (${nameOf.get(id)})`);
  }

  const javaNodes = lit.filter(([, l]) => l.java).length;
  const ssjsNodes = lit.filter(([, l]) => l.ssjs).length;

  console.log('\n=== XPages island members ===\n');
  for (const [name, members] of island) {
    console.log(`island "${name}" — ${members.size} posts`);
    for (const m of [...members].sort()) console.log(`  - ${m}`);
  }

  console.log('\n=== Summary ===');
  console.log(`  Java-lit nodes:  ${javaNodes}`);
  console.log(`  SSJS-lit nodes:  ${ssjsNodes}`);
  console.log(`  XPages members:  ${island.get('xpages')?.size ?? 0}`);
  if (unknownIds.size) {
    console.log(`\n  ⚠ coversClass ids NOT in catalogue:`);
    for (const u of unknownIds) console.log(`    - ${u}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ every coversClass id is a real catalogue node`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
