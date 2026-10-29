/**
 * /map/ multi-language lamp report.
 *
 * Prints, for verification:
 *   - a per-node lamp table: node id -> { ls, java, ssjs }
 *   - the XPages island membership list
 *   - summary counts, and any coversClass id that is NOT a catalogue node.
 *
 * The java / ssjs / XPages computation lives in scripts/lib/mapLanguages.ts,
 * the shared data layer the islands render also uses — this CLI just prints
 * it. The "ls" column reuses the URL-based coverage (scripts/lib/coverage.ts),
 * so it shares that module's known blind spots (see CLAUDE.md "Coverage
 * tracker / Known limitations").
 *
 * Run: npm run map-lang-report
 */

import { buildCoverageReport, loadClassMap } from './lib/coverage.ts';
import { loadMapPosts, computeMapLanguages } from './lib/mapLanguages.ts';

async function main(): Promise<void> {
  const [report, { classes }, mapPosts] = await Promise.all([
    buildCoverageReport(),
    loadClassMap(),
    loadMapPosts(),
  ]);

  const classIds = new Set(classes.map((c) => c.id));
  const nameOf = new Map(classes.map((c) => [c.id, c.name] as const));
  const { lamps, xpages, unknownClassIds } = computeMapLanguages(mapPosts, classIds);

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
    console.log(`${id.padEnd(28)} ${tick(l.ls)}  ${tick(l.java)}  ${tick(l.ssjs)}  (${nameOf.get(id)})`);
  }

  const javaNodes = lit.filter(([, l]) => l.java).length;
  const ssjsNodes = lit.filter(([, l]) => l.ssjs).length;

  console.log('\n=== XPages island members ===\n');
  console.log(`island "xpages" — ${xpages.length} posts`);
  for (const m of xpages) console.log(`  - ${m.slug} [${m.apiLang}]`);

  console.log('\n=== Summary ===');
  console.log(`  Java-lit nodes:  ${javaNodes}`);
  console.log(`  SSJS-lit nodes:  ${ssjsNodes}`);
  console.log(`  XPages members:  ${xpages.length}`);
  if (unknownClassIds.length) {
    console.log(`\n  ⚠ coversClass ids NOT in catalogue:`);
    for (const u of unknownClassIds) console.log(`    - ${u}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ every coversClass id is a real catalogue node`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
