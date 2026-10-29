// Articles per LotusScript class for the map's islands view. Starts from the
// coverage report (posts whose sources or inline links reach the class's HCL
// docs) and keeps a class's *main* articles: the class's own doc page is in
// the post's sources, or the class name is in its title. A post that only
// mentions the class in passing is not one of its articles here.
//
// Each class can carry several articles, each tagged with the code language
// it is about. Only LotusScript today; Java / SSJS articles can join later
// as more entries with their own `lang`.
import type { CoverageReport } from '../../scripts/lib/coverage';
import { loadMapPosts, computeMapLanguages } from '../../scripts/lib/mapLanguages';
import { getPostsByLang, type Post } from './posts';
import { localizedPath, type Lang } from '../i18n/ui';

/** The code language an article is written in (its door-person's colour). */
export type ArticleLang = 'ls' | 'java' | 'ssjs';

export interface ClassArticle {
  lang: ArticleLang;
  title: string;
  desc: string;
  url: string;
  date: string; // YYYY-MM-DD, Taipei time
}

/** A building on the XPages / web-layer island: one web-layer concept post. */
export interface XPagesMember {
  slug: string;
  name: string; // house name (the post title)
  desc: string;
  url: string;
  article: ClassArticle; // the post itself, previewed on its door-person
}

const basename = (u: string) => (u.split('#')[0].split('?')[0].split('/').pop() || '').toLowerCase();

export async function classArticles(report: CoverageReport, lang: Lang, max = 3): Promise<Record<string, ClassArticle[]>> {
  const published = new Map((await getPostsByLang(lang)).map((p) => [p.data.slug, p]));
  const out: Record<string, ClassArticle[]> = {};
  for (const c of report.classes) {
    const doc = basename(c.docUrl);
    const name = c.name.toLowerCase();
    const ranked = (report.coverage.get(c.id) || [])
      .map((p) => ({
        p,
        // the class in the title ranks above the class doc in the sources
        score: (p.title.toLowerCase().includes(name) ? 2 : 0) + (p.sourceUrls.some((u) => basename(u) === doc) ? 1 : 0),
      }))
      .filter((r) => r.score > 0 && published.has(r.p.slug))
      .sort((a, b) => b.score - a.score || b.p.pubDate.localeCompare(a.p.pubDate));
    const list = ranked.slice(0, max).map(({ p }) => {
      const post = published.get(p.slug)!;
      return {
        lang: 'ls' as const,
        title: post.data.title,
        desc: post.data.description,
        url: localizedPath(lang, `/posts/${p.slug}`),
        date: post.data.pubDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }),
      };
    });
    if (list.length) out[c.id] = list;
  }
  return out;
}

/**
 * The islands view's full multi-language payload for `lang`:
 *   - `articles`: per class id, its articles ordered LS → Java → SSJS (the LS
 *     ones from classArticles above; Java / SSJS from each post's coversClass +
 *     apiLang frontmatter, via scripts/lib/mapLanguages). Each carries its own
 *     `lang` so the scene can colour its door-person (the "language lamp").
 *   - `xpages`: the XPages / web-layer island's buildings (coversIsland posts).
 * Slugs that resolve to no published post in `lang` are dropped.
 */
export async function islandArticles(
  report: CoverageReport,
  lang: Lang,
): Promise<{ articles: Record<string, ClassArticle[]>; xpages: XPagesMember[] }> {
  const published = new Map((await getPostsByLang(lang)).map((p) => [p.data.slug, p]));
  const taipeiDate = (p: Post) => p.data.pubDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  const toArticle = (slug: string, articleLang: ArticleLang): ClassArticle | null => {
    const post = published.get(slug);
    if (!post) return null;
    return {
      lang: articleLang,
      title: post.data.title,
      desc: post.data.description,
      url: localizedPath(lang, `/posts/${slug}`),
      date: taipeiDate(post),
    };
  };

  // LS layer: reuse the URL-based coverage mapping (one person per LS article).
  const articles = await classArticles(report, lang);

  // Java / SSJS layer: light each node's lamp from the posts' own frontmatter.
  const classIds = new Set(report.classes.map((c) => c.id));
  const { lamps, xpages } = computeMapLanguages(await loadMapPosts(), classIds);
  for (const [id, lamp] of lamps) {
    const extra = [
      ...lamp.java.map((s) => toArticle(s, 'java')),
      ...lamp.ssjs.map((s) => toArticle(s, 'ssjs')),
    ].filter((a): a is ClassArticle => a !== null);
    if (extra.length) articles[id] = [...(articles[id] ?? []), ...extra];
  }

  // XPages island: one building per web-layer concept post, newest first.
  const members: XPagesMember[] = [];
  for (const m of xpages) {
    const post = published.get(m.slug);
    const article = toArticle(m.slug, m.apiLang);
    if (!post || !article) continue;
    members.push({ slug: m.slug, name: post.data.title, desc: post.data.description, url: article.url, article });
  }
  members.sort((a, b) => b.article.date.localeCompare(a.article.date));

  return { articles, xpages: members };
}
