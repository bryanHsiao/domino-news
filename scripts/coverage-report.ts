/**
 * Coverage report — emits docs/coverage.md from the latest published posts
 * and the cached OpenNTF LotusScript class catalogue.
 *
 * Usage: npm run coverage
 *
 * Output:
 *   docs/coverage.md  — the human-facing markdown report (committed to repo).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCoverageReport, type ClassRef, type PostMeta } from './lib/coverage.js';
import { loadMapPosts, computeMapLanguages } from './lib/mapLanguages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'docs', 'coverage.md');

function bar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function postLink(p: PostMeta): string {
  // Local site link to the post — works when reading the markdown rendered
  // on GitHub (it goes to the source file) AND on the deployed site if you
  // ever expose this report there.
  return `[${p.slug}](https://bryanhsiao.github.io/domino-news/posts/${p.slug}/)`;
}

function classLink(c: ClassRef): string {
  return `[${c.id}](${c.docUrl})`;
}

function statusEmoji(pct: number): string {
  if (pct >= 70) return '🟩';
  if (pct >= 30) return '🟨';
  if (pct > 0) return '🟧';
  return '🟥';
}

async function main() {
  const r = await buildCoverageReport();
  const lines: string[] = [];

  const totalClasses = r.classes.length;
  const coveredClassCount = r.coverage.size;
  const pct = (coveredClassCount / totalClasses) * 100;

  lines.push('# LotusScript Class Coverage');
  lines.push('');
  lines.push(`*Generated: ${r.generatedAt.toISOString().split('T')[0]} · Posts scanned: ${r.posts.length} · Classes catalogued: ${totalClasses}*`);
  lines.push('');
  lines.push(`> Source data: [OpenNTF/ls-classmap](https://github.com/OpenNTF/ls-classmap), 14.5.1 catalogue.`);
  lines.push('');
  lines.push(`**Overall: ${coveredClassCount} / ${totalClasses} classes covered (${pct.toFixed(1)}%)**`);
  lines.push('');
  lines.push('```');
  lines.push(`${bar(pct, 40)} ${pct.toFixed(1)}%`);
  lines.push('```');
  lines.push('');

  // Coverage by category
  lines.push('## Coverage by category');
  lines.push('');
  lines.push('| Category | Covered | Total | % | |');
  lines.push('|---|---:|---:|---:|---|');

  const byCategory = new Map<string, { covered: number; total: number }>();
  for (const c of r.classes) {
    const cat = c.category || '?';
    if (!byCategory.has(cat)) byCategory.set(cat, { covered: 0, total: 0 });
    const entry = byCategory.get(cat)!;
    entry.total++;
    if (r.coverage.has(c.id)) entry.covered++;
  }
  const sortedCategories = [...byCategory.entries()].sort((a, b) => {
    const pa = a[1].covered / a[1].total;
    const pb = b[1].covered / b[1].total;
    return pb - pa;
  });
  for (const [cat, { covered, total }] of sortedCategories) {
    const cpct = (covered / total) * 100;
    lines.push(`| ${cat} | ${covered} | ${total} | ${cpct.toFixed(0)}% | ${statusEmoji(cpct)} \`${bar(cpct, 12)}\` |`);
  }
  lines.push('');

  // Covered classes
  const coveredEntries = r.classes
    .filter((c) => r.coverage.has(c.id))
    .map((c) => ({ classRef: c, posts: r.coverage.get(c.id)! }));
  lines.push(`## ✓ Covered classes (${coveredEntries.length})`);
  lines.push('');
  lines.push('| Class | Category | Posts | First mention |');
  lines.push('|---|---|---|---|');
  for (const { classRef, posts } of coveredEntries) {
    const sorted = [...posts].sort((a, b) => a.pubDate.localeCompare(b.pubDate));
    const postList = sorted.map(postLink).join(', ');
    const first = sorted[0]?.pubDate.split('T')[0] ?? '';
    lines.push(`| ${classLink(classRef)} | ${classRef.category} | ${postList} | ${first} |`);
  }
  lines.push('');

  // Uncovered classes
  const uncovered = r.classes.filter((c) => !r.coverage.has(c.id));
  lines.push(`## ⨯ Uncovered classes (${uncovered.length})`);
  lines.push('');
  lines.push('| Class | Category | Description |');
  lines.push('|---|---|---|');
  for (const c of uncovered.sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id))) {
    const shortDesc = (c.description || '').slice(0, 90).replace(/\n/g, ' ');
    lines.push(`| ${classLink(c)} | ${c.category} | ${shortDesc} |`);
  }
  lines.push('');

  // Cross-language tracker.
  //
  // Two separate things, kept apart so the "gap" stays accurate as single-
  // language articles land:
  //   - DEDICATED articles: a class that has its own Java / SSJS deep-dive,
  //     from `coversClass` + `apiLang` frontmatter (via mapLanguages). This is
  //     the authoritative "already written" signal.
  //   - REFERENCED counterparts: Java / SSJS counterparts an LS post points to
  //     via relatedJava / relatedSsjs. On its own that does NOT mean an article
  //     exists — it's just a pointer. The gap = referenced − dedicated.
  const mapLang = computeMapLanguages(await loadMapPosts(), new Set(r.classes.map((c) => c.id)));
  const postBySlug = new Map(r.posts.map((p) => [p.slug, p]));
  const slugLink = (slug: string): string => {
    const p = postBySlug.get(slug);
    return p ? postLink(p) : `[${slug}](https://bryanhsiao.github.io/domino-news/posts/${slug}/)`;
  };
  const writtenJavaNodes = new Set([...mapLang.lamps].filter(([, l]) => l.java.length).map(([id]) => id));
  const writtenSsjsNodes = new Set([...mapLang.lamps].filter(([, l]) => l.ssjs.length).map(([id]) => id));

  // Map a relatedJava / relatedSsjs counterpart NAME to its catalogue node id,
  // so we can tell whether that counterpart already has a dedicated article.
  // Names drop the `Notes` prefix and vary in case (`DxlExporter` vs node
  // `NotesDXLExporter`); SSJS names are lowercase (`session`). A few can't be
  // derived by rule and need an explicit alias.
  const NAME_NODE_ALIASES: Record<string, string> = {
    llmreq: 'NotesLLMRequest',
    llmres: 'NotesLLMRequest',
  };
  const classIdsLower = new Map(r.classes.map((c) => [c.id.toLowerCase(), c.id]));
  const nodeIdForCounterpart = (name: string): string | null => {
    const lc = name.toLowerCase();
    return NAME_NODE_ALIASES[lc] ?? classIdsLower.get(lc) ?? classIdsLower.get('notes' + lc) ?? null;
  };
  const isWritten = (name: string, writtenNodes: Set<string>): boolean => {
    const id = nodeIdForCounterpart(name);
    return id != null && writtenNodes.has(id);
  };

  lines.push('## Cross-language tracker');
  lines.push('');
  lines.push('**Dedicated** = the class has its own Java / SSJS deep-dive (`coversClass` + `apiLang` frontmatter — the authoritative "already written" list). **Gap** = Java / SSJS counterparts that LS posts point to (via `relatedJava` / `relatedSsjs`) but that do **not** yet have a dedicated article — the natural pool of "topics worth a single-language deep-dive next." A `relatedJava` pointer alone is NOT an article; only `coversClass` + `apiLang` counts as written.');
  lines.push('');

  const javaGap = [...r.javaMentions.entries()].filter(([name]) => !isWritten(name, writtenJavaNodes)).sort();
  const ssjsGap = [...r.ssjsMentions.entries()].filter(([name]) => !isWritten(name, writtenSsjsNodes)).sort();
  // Off-shore islands (coversIsland): posts about a layer with no LS back-end
  // class. computeMapLanguages returns these grouped by island id.
  const ISLAND_LABELS: Record<string, string> = { xpages: 'XPages / web layer', 'java-runtime': 'Java runtime' };
  const islandEntries = Object.entries(mapLang.islands).filter(([, posts]) => posts.length);
  const offshoreCount = islandEntries.reduce((n, [, posts]) => n + posts.length, 0);
  lines.push(
    `**Summary** — Java: **${writtenJavaNodes.size}** classes have a dedicated article, **${javaGap.length}** referenced counterparts still in the gap. ` +
      `SSJS: **${writtenSsjsNodes.size}** dedicated, **${ssjsGap.length}** in the gap` +
      (offshoreCount ? `, plus **${offshoreCount}** off-shore island posts (XPages / Java-runtime, not tied to a backend class)` : '') +
      '.'
  );
  if (mapLang.unknownClassIds.length) {
    lines.push('');
    lines.push(`> ⚠️ \`coversClass\` ids that are not catalogue nodes (fix the frontmatter): ${mapLang.unknownClassIds.map((s) => `\`${s}\``).join(', ')}`);
  }
  lines.push('');

  // Dedicated articles (authoritative, node-keyed).
  const dedicated = [...mapLang.lamps.entries()].filter(([, l]) => l.java.length || l.ssjs.length);
  if (dedicated.length) {
    lines.push('### Dedicated Java / SSJS articles');
    lines.push('');
    lines.push('| Class | Java | SSJS |');
    lines.push('|---|---|---|');
    dedicated.sort((a, b) => a[0].localeCompare(b[0]));
    for (const [id, l] of dedicated) {
      const java = l.java.length ? l.java.map(slugLink).join(', ') : '—';
      const ssjs = l.ssjs.length ? l.ssjs.map(slugLink).join(', ') : '—';
      lines.push(`| \`${id}\` | ${java} | ${ssjs} |`);
    }
    lines.push('');
  }

  if (offshoreCount) {
    lines.push(`### Off-shore island posts (${offshoreCount})`);
    lines.push('');
    lines.push('These cover a layer with no LotusScript back-end class in the catalogue, so they light an off-shore island on the map rather than a class node.');
    lines.push('');
    lines.push('| Post | Island | Lang |');
    lines.push('|---|---|---|');
    for (const [island, posts] of islandEntries) {
      const label = ISLAND_LABELS[island] ?? island;
      for (const { slug, apiLang } of [...posts].sort((a, b) => a.slug.localeCompare(b.slug))) {
        lines.push(`| ${slugLink(slug)} | ${label} | ${apiLang} |`);
      }
    }
    lines.push('');
  }

  // Gap pool (referenced but not yet written).
  if (javaGap.length) {
    lines.push(`### Java counterparts still in the gap (${javaGap.length})`);
    lines.push('');
    lines.push('| Java class | LS posts that point to it |');
    lines.push('|---|---|');
    for (const [name, posts] of javaGap) {
      lines.push(`| \`${name}\` | ${posts.map(postLink).join(', ')} |`);
    }
    lines.push('');
  }

  if (ssjsGap.length) {
    lines.push(`### SSJS counterparts still in the gap (${ssjsGap.length})`);
    lines.push('');
    lines.push('| SSJS class | LS posts that point to it |');
    lines.push('|---|---|');
    for (const [name, posts] of ssjsGap) {
      lines.push(`| \`${name}\` | ${posts.map(postLink).join(', ')} |`);
    }
    lines.push('');
  }

  // Per-post summary
  lines.push('## Per-post coverage summary');
  lines.push('');
  lines.push('| Post | Classes covered | Java mentions | SSJS mentions |');
  lines.push('|---|---|---|---|');
  for (const post of r.posts) {
    const classIds: string[] = [];
    for (const [id, posts] of r.coverage) {
      if (posts.includes(post)) classIds.push(id);
    }
    const classCol = classIds.length > 0 ? classIds.map((id) => `\`${id}\``).join(', ') : '—';
    const javaCol = post.relatedJava.length > 0 ? post.relatedJava.map((j) => `\`${j}\``).join(', ') : '—';
    const ssjsCol = post.relatedSsjs.length > 0 ? post.relatedSsjs.map((s) => `\`${s}\``).join(', ') : '—';
    lines.push(`| ${postLink(post)} | ${classCol} | ${javaCol} | ${ssjsCol} |`);
  }
  lines.push('');

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, lines.join('\n'), 'utf8');
  console.log(`[coverage] wrote ${OUT}`);
  console.log(`[coverage] ${coveredClassCount}/${totalClasses} classes covered (${pct.toFixed(1)}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
