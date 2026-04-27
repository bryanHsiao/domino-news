export const languages = {
  'zh-TW': '繁體中文',
  en: 'English',
} as const;

export const defaultLang = 'zh-TW' as const;

export type Lang = keyof typeof languages;

export const ui = {
  'zh-TW': {
    'site.title': 'Domino News',
    'site.tagline': 'HCL Domino 每日新知',
    'site.description': '由 AI 每日整理的 HCL Domino 新聞、技術與生態系動態。',
    'nav.home': '首頁',
    'nav.posts': '所有文章',
    'nav.tags': '標籤',
    'nav.about': '關於',
    'home.latest': '最新文章',
    'home.viewAll': '看所有文章 →',
    'post.published': '發布於',
    'post.updated': '更新於',
    'post.tags': '標籤',
    'post.sources': '參考來源',
    'post.backToList': '← 回到文章列表',
    'tags.title': '所有標籤',
    'tags.postsTagged': '標記為',
    'tags.posts': '篇文章',
    'about.title': '關於本站',
    'lang.switch': 'English',
    'footer.poweredBy': '由 Astro + GitHub Actions + OpenAI 驅動',
  },
  en: {
    'site.title': 'Domino News',
    'site.tagline': 'Daily HCL Domino Insights',
    'site.description': 'AI-curated daily news, technology, and ecosystem updates for HCL Domino.',
    'nav.home': 'Home',
    'nav.posts': 'All Posts',
    'nav.tags': 'Tags',
    'nav.about': 'About',
    'home.latest': 'Latest Posts',
    'home.viewAll': 'View all posts →',
    'post.published': 'Published',
    'post.updated': 'Updated',
    'post.tags': 'Tags',
    'post.sources': 'Sources',
    'post.backToList': '← Back to all posts',
    'tags.title': 'All Tags',
    'tags.postsTagged': 'Posts tagged',
    'tags.posts': 'posts',
    'about.title': 'About',
    'lang.switch': '繁體中文',
    'footer.poweredBy': 'Powered by Astro + GitHub Actions + OpenAI',
  },
} as const;

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)['zh-TW']): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

export function getLangFromUrl(url: URL): Lang {
  const [, segment] = url.pathname.split('/');
  if (segment in languages) return segment as Lang;
  return defaultLang;
}

export function localizedPath(lang: Lang, path: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  const localePart = lang === defaultLang ? '' : `/${lang}`;
  const combined = `${base}${localePart}${clean === '/' ? '/' : clean}`;
  return combined.replace(/\/{2,}/g, '/');
}
