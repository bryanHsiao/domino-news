/**
 * /map/ multi-language lamp report.
 *
 * Prints, for verification:
 *   - a per-node lamp table: node id -> { ls, java, ssjs }
 *   - each off-shore island's membership list (XPages, Java runtime)
 *   - summary counts, any coversClass value given as a Java name (and the
 *     node it resolved to), and any coversClass / coversIsland value that
 *     resolves to nothing.
 *
 * Covers the published posts AND the staged queue in _pending/ — the site
 * build never reads _pending/, so this is the check to run before staging a
 * Java / SSJS post. Exits 1 if any map value resolves to nothing.
 *
 * The java / ssjs / island computation lives in scripts/lib/mapLanguages.ts,
 * the shared data layer the islands render also uses — this CLI just prints
 * it. The "ls" column reuses the URL-based coverage (scripts/lib/coverage.ts),
 * so it shares that module's known blind spots (see CLAUDE.md "Coverage
 * tracker / Known limitations").
 *
 * Run: npm run map-lang-report
 */

import { buildCoverageReport, loadClassMap } from './lib/coverage.ts';
import { loadMapPosts, computeMapLanguages, MAP_ISLANDS } from './lib/mapLanguages.ts';

async function main(): Promise<void> {
  const [report, { classes }, mapPosts] = await Promise.all([
    buildCoverageReport(),
    loadClassMap(),
    loadMapPosts({ includePending: true }),
  ]);

  const classIds = new Set(classes.map((c) => c.id));
  const nameOf = new Map(classes.map((c) => [c.id, c.name] as const));
  const pendingSlugs = new Set(mapPosts.filter((p) => p.pending).map((p) => p.slug));
  const { lamps, islands, unknownClassIds, resolved } = computeMapLanguages(mapPosts, classIds);
  const mark = (slug: string) => (pendingSlugs.has(slug) ? ' (pending)' : '');

  // node id -> { ls, java, ssjs } booleans
  interface Lamp { ls: boolean; java: boolean; ssjs: boolean; }
  const merged = new Map<string, Lamp>();
  const at = (id: string): Lamp => {
    let l = merged.get(id);
    if (!l) { l = { ls: false, java: false, ssjs: false }; merged.set(id, l); }
    return l;
  };
  for (const id of report.coverage.keys()) at(id).ls = true; // LS from URL-based coverage
  for (const [id, lamp] of lamps) {
    if (lamp.java.length) at(id).java = true;
    if (lamp.ssjs.length) at(id).ssjs = true;
  }

  // --- print ---
  console.log('\n=== /map/ language lamps (nodes with any java/ssjs lamp) ===\n');
  const lit = [...merged.entries()]
    .filter(([, l]) => l.java || l.ssjs)
    .sort((a, b) => a[0].localeCompare(b[0]));
  console.log('node                          ls   java  ssjs');
  console.log('----------------------------  ---  ----  ----');
  const tick = (b: boolean) => (b ? ' ● ' : ' · ');
  for (const [id, l] of lit) {
    const lamp = lamps.get(id);
    const staged = [...(lamp?.java ?? []), ...(lamp?.ssjs ?? [])].some((s) => pendingSlugs.has(s)) ? '  [pending post]' : '';
    console.log(`${id.padEnd(28)} ${tick(l.ls)}  ${tick(l.java)}  ${tick(l.ssjs)}  (${nameOf.get(id)})${staged}`);
  }

  const javaNodes = lit.filter(([, l]) => l.java).length;
  const ssjsNodes = lit.filter(([, l]) => l.ssjs).length;

  console.log('\n=== Off-shore island members ===');
  for (const island of MAP_ISLANDS) {
    console.log(`\nisland "${island}" — ${islands[island].length} posts`);
    for (const m of islands[island]) console.log(`  - ${m.slug} [${m.apiLang}]${mark(m.slug)}`);
  }

  console.log('\n=== Summary ===');
  console.log(`  Java-lit nodes:  ${javaNodes}`);
  console.log(`  SSJS-lit nodes:  ${ssjsNodes}`);
  for (const island of MAP_ISLANDS) console.log(`  ${(island + ' members:').padEnd(22)}${islands[island].length}`);
  console.log(`  pending map posts: ${pendingSlugs.size}`);
  if (resolved.length) {
    console.log(`\n  coversClass given as a Java name (resolved):`);
    for (const r of resolved) console.log(`    - ${r}`);
  }
  if (unknownClassIds.length) {
    console.log(`\n  ⚠ map values that resolve to nothing (fix the frontmatter):`);
    for (const u of unknownClassIds) console.log(`    - ${u}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ every coversClass / coversIsland value resolves`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
