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
import { getPostsByLang } from './posts';
import { localizedPath, type Lang } from '../i18n/ui';

export interface ClassArticle {
  lang: 'ls';
  title: string;
  desc: string;
  url: string;
  date: string; // YYYY-MM-DD, Taipei time
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
