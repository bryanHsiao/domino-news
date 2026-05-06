/**
 * Coverage data extraction.
 *
 * Reads the cached OpenNTF LotusScript class catalogue (data/ls_classes.json)
 * plus the en-language posts in src/content/posts/en/, and computes which
 * LotusScript classes have been "covered" by at least one post — where
 * "covered" means a post links to either the class's docUrl OR any of its
 * property/method/event docUrls.
 *
 * URLs are normalised by filename (last path segment) so a post that links
 * to the 14.0.0 version of a doc still matches OpenNTF's 14.5.1 catalogue.
 *
 * Cross-language data (relatedJava / relatedSsjs frontmatter arrays) is
 * also extracted so the report can show which Java / SSJS class names have
 * been "linked from an LS post but not yet written about."
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const POSTS_EN_DIR = join(ROOT, 'src', 'content', 'posts', 'en');
const CLASSMAP_FILE = join(ROOT, 'data', 'ls_classes.json');

export interface ClassRef {
  id: string;
  name: string;
  description: string;
  docUrl: string;
  isUI: boolean;
  category: string;
  notSupportedByCOM?: boolean;
}

export interface PostMeta {
  slug: string;
  title: string;
  pubDate: string;
  filename: string;
  sourceUrls: string[];
  inlineLinkUrls: string[];
  relatedJava: string[];
  relatedSsjs: string[];
}

export interface CoverageEntry {
  classRef: ClassRef;
  posts: PostMeta[]; // empty -> uncovered
}

export interface CoverageReport {
  generatedAt: Date;
  classes: ClassRef[];
  posts: PostMeta[];
  /** classId -> matching posts (only for classes with at least one match) */
  coverage: Map<string, PostMeta[]>;
  /** Java class name -> posts that mention it via relatedJava frontmatter */
  javaMentions: Map<string, PostMeta[]>;
  /** SSJS class name -> posts that mention it via relatedSsjs frontmatter */
  ssjsMentions: Map<string, PostMeta[]>;
}

/** Take the filename portion of a URL, lowercase it, drop any query/fragment. */
function normaliseUrl(url: string): string {
  const cleaned = url.split('?')[0].split('#')[0];
  const last = cleaned.split('/').pop() ?? '';
  return last.toLowerCase();
}

interface ClassMapNode extends ClassRef {
  props?: Array<{ docUrl?: string }>;
  methods?: Array<{ docUrl?: string }>;
  events?: Array<{ docUrl?: string }>;
}

export async function loadClassMap(): Promise<{
  classes: ClassRef[];
  /** normalised-url -> classId */
  urlToClass: Map<string, string>;
}> {
  if (!existsSync(CLASSMAP_FILE)) {
    throw new Error(
      `Missing ${CLASSMAP_FILE}. See data/README.md for how to refresh.`
    );
  }
  const text = await readFile(CLASSMAP_FILE, 'utf8');
  const data = JSON.parse(text) as { nodes: ClassMapNode[] };

  const classes: ClassRef[] = [];
  const urlToClass = new Map<string, string>();

  for (const node of data.nodes) {
    classes.push({
      id: node.id,
      name: node.name,
      description: node.description,
      docUrl: node.docUrl,
      isUI: node.isUI,
      category: node.category,
      notSupportedByCOM: node.notSupportedByCOM,
    });
    // Index every URL belonging to this class — class itself + props + methods + events
    if (node.docUrl) urlToClass.set(normaliseUrl(node.docUrl), node.id);
    for (const item of [...(node.props ?? []), ...(node.methods ?? []), ...(node.events ?? [])]) {
      if (item.docUrl) urlToClass.set(normaliseUrl(item.docUrl), node.id);
    }
  }
  return { classes, urlToClass };
}

function parseInlineArray(fm: string, key: string): string[] {
  // Inline form: `key: ["a", "b"]` (zod default may write as `key: []`)
  const inline = fm.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]\\s*$`, 'm'));
  if (inline) {
    return inline[1]
      .split(',')
      .map((s) => s.trim().replace(/^"(.*)"$/, '$1'))
      .filter(Boolean);
  }
  // Block form: `key:\n  - "..."`
  const block = fm.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.*\\n?)+)`, 'm'));
  if (block) {
    return block[1]
      .split('\n')
      .map((line) => line.replace(/^\s+-\s+"?/, '').replace(/"?\s*$/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function parsePost(filename: string, raw: string): PostMeta | null {
  // Normalise CRLF to LF — files committed on Windows have \r\n, our regex
  // anchors with \n. Without this every Windows-checkout file silently fails
  // to parse and the report shows 0/97 covered.
  const text = raw.replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const fm = m[1];
  const body = m[2];

  const get = (key: string): string | undefined => {
    const re = new RegExp(`^${key}:\\s*"?([^"\\n]*)"?\\s*$`, 'm');
    return fm.match(re)?.[1]?.trim();
  };
  const slug = get('slug') ?? '';
  const title = get('title') ?? '';
  const pubDate = get('pubDate') ?? '';

  // Frontmatter sources block: collect all url: lines
  const sourceUrls: string[] = [];
  const sourcesBlock = fm.match(/^sources:\s*\n([\s\S]*?)(?=^[a-zA-Z_]|\Z)/m);
  if (sourcesBlock) {
    for (const m of sourcesBlock[1].matchAll(/^\s+url:\s*"?([^"\n]+?)"?\s*$/gm)) {
      sourceUrls.push(m[1].trim());
    }
  }

  // Body inline links
  const inlineLinkUrls: string[] = [];
  for (const m of body.matchAll(/\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/g)) {
    inlineLinkUrls.push(m[1]);
  }

  return {
    slug,
    title,
    pubDate,
    filename,
    sourceUrls,
    inlineLinkUrls,
    relatedJava: parseInlineArray(fm, 'relatedJava'),
    relatedSsjs: parseInlineArray(fm, 'relatedSsjs'),
  };
}

export async function loadPosts(): Promise<PostMeta[]> {
  if (!existsSync(POSTS_EN_DIR)) return [];
  const files = await readdir(POSTS_EN_DIR);
  const posts: PostMeta[] = [];
  for (const f of files) {
    if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;
    const text = await readFile(join(POSTS_EN_DIR, f), 'utf8');
    const meta = parsePost(f, text);
    if (meta) posts.push(meta);
  }
  // Sort newest-first for stable output
  posts.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
  return posts;
}

export async function buildCoverageReport(): Promise<CoverageReport> {
  const [{ classes, urlToClass }, posts] = await Promise.all([
    loadClassMap(),
    loadPosts(),
  ]);

  // For each post, figure out which classIds it covers
  const coverage = new Map<string, PostMeta[]>();
  for (const post of posts) {
    const classIds = new Set<string>();
    for (const url of [...post.sourceUrls, ...post.inlineLinkUrls]) {
      const id = urlToClass.get(normaliseUrl(url));
      if (id) classIds.add(id);
    }
    for (const id of classIds) {
      if (!coverage.has(id)) coverage.set(id, []);
      coverage.get(id)!.push(post);
    }
  }

  // Cross-language: relatedJava / relatedSsjs roll-ups
  const javaMentions = new Map<string, PostMeta[]>();
  const ssjsMentions = new Map<string, PostMeta[]>();
  for (const post of posts) {
    for (const j of post.relatedJava) {
      if (!javaMentions.has(j)) javaMentions.set(j, []);
      javaMentions.get(j)!.push(post);
    }
    for (const s of post.relatedSsjs) {
      if (!ssjsMentions.has(s)) ssjsMentions.set(s, []);
      ssjsMentions.get(s)!.push(post);
    }
  }

  return {
    generatedAt: new Date(),
    classes,
    posts,
    coverage,
    javaMentions,
    ssjsMentions,
  };
}
