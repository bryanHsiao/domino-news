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

  // Cross-language: Java
  lines.push('## Cross-language tracker');
  lines.push('');
  lines.push('Class names recorded in posts\' `relatedJava` / `relatedSsjs` frontmatter — these are the Java / SSJS counterparts that LS posts already point to but that don\'t yet have their own dedicated article. They\'re the natural pool of "topics worth a single-language deep-dive next."');
  lines.push('');

  if (r.javaMentions.size > 0) {
    lines.push('### Java class mentions');
    lines.push('');
    lines.push('| Java class | LS posts that point to it |');
    lines.push('|---|---|');
    const sortedJava = [...r.javaMentions.entries()].sort();
    for (const [name, posts] of sortedJava) {
      lines.push(`| \`${name}\` | ${posts.map(postLink).join(', ')} |`);
    }
    lines.push('');
  }

  if (r.ssjsMentions.size > 0) {
    lines.push('### SSJS class mentions');
    lines.push('');
    lines.push('| SSJS class | LS posts that point to it |');
    lines.push('|---|---|');
    const sortedSsjs = [...r.ssjsMentions.entries()].sort();
    for (const [name, posts] of sortedSsjs) {
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
