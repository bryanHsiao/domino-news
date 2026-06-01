import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Post = CollectionEntry<'posts'>;

const READ_SPEED_CJK_PER_MIN = 400;
const READ_SPEED_EN_PER_MIN = 250;

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}>+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '');
}

export function postReadingStats(body: string, lang: Lang): { words: number; minutes: number } {
  const text = stripMarkdown(body);
  const cjk = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  const en = (text.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
  const words = lang === 'zh-TW' ? cjk + en : en + Math.round(cjk / 1.5);
  const minutes = Math.max(
    1,
    Math.round(cjk / READ_SPEED_CJK_PER_MIN + en / READ_SPEED_EN_PER_MIN)
  );
  return { words, minutes };
}

export async function getPostsByLang(lang: Lang): Promise<Post[]> {
  const now = new Date();
  const all = await getCollection(
    'posts',
    ({ data }) => !data.draft && data.lang === lang && data.pubDate <= now
  );
  return all.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/**
 * Pick related posts for a given post by tag overlap, then pubDate.
 *
 * Scoring: count of shared tags with the current post; ties broken
 * by most-recent pubDate. The current post itself is excluded.
 *
 * SEO benefit: internal linking density + dwell time + helps Google
 * cluster topically related content. Returns [] if no overlap candidates
 * exist (caller should hide the section).
 */
export async function getRelatedPosts(current: Post, lang: Lang, limit = 4): Promise<Post[]> {
  const all = await getPostsByLang(lang);
  const currentTags = new Set(current.data.tags);
  if (currentTags.size === 0) return [];

  const scored = all
    .filter((p) => p.data.slug !== current.data.slug)
    .map((p) => {
      const shared = p.data.tags.filter((t) => currentTags.has(t)).length;
      return { post: p, shared };
    })
    .filter((x) => x.shared > 0)
    .sort((a, b) => {
      if (b.shared !== a.shared) return b.shared - a.shared;
      return b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime();
    });

  return scored.slice(0, limit).map((x) => x.post);
}

export async function getAllTags(lang: Lang): Promise<{ tag: string; count: number }[]> {
  const posts = await getPostsByLang(lang);
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const tag of p.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
