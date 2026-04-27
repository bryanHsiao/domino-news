import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPostsByLang } from '../lib/posts';
import { useTranslations, localizedPath } from '../i18n/ui';

export async function GET(context: APIContext) {
  const lang = 'en' as const;
  const t = useTranslations(lang);
  const posts = await getPostsByLang(lang);
  return rss({
    title: t('site.title'),
    description: t('site.description'),
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: localizedPath(lang, `/posts/${p.data.slug}`),
      categories: p.data.tags,
    })),
  });
}
