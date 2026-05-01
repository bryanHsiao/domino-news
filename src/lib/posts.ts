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
