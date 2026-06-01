export const languages = {
  'zh-TW': '繁體中文',
  en: 'English',
} as const;

export const defaultLang = 'zh-TW' as const;

export type Lang = keyof typeof languages;

export const ui = {
  'zh-TW': {
    'site.title': 'HCL Domino Daily',
    'site.tagline': 'HCL Domino 日報 — 每日新知與技術深度',
    'site.description': 'HCL Domino 中英雙語日報，每日整理生態系最新動態與技術深度文章。',
    'nav.home': '首頁',
    'nav.posts': '所有文章',
    'nav.tags': '標籤',
    'nav.search': '搜尋',
    'nav.about': '關於',
    'home.latest': '最新文章',
    'home.viewAll': '看所有文章 →',
    'post.published': '發布於',
    'post.updated': '更新於',
    'post.tags': '標籤',
    'post.sources': '參考來源',
    'post.backToList': '← 回到文章列表',
    'post.wordCount': '約 {n} 字',
    'post.readingTime': '約 {n} 分鐘',
    'breadcrumb.home': '首頁',
    'breadcrumb.posts': '文章列表',
    'tags.title': '所有標籤',
    'tags.postsTagged': '標記為',
    'tags.posts': '篇文章',
    'pagination.prev': '上一頁',
    'pagination.next': '下一頁',
    'pagination.pageOf': '第 {n} / {m} 頁',
    'about.title': '關於本站',
    'search.title': '搜尋',
    'search.heading': '搜尋文章',
    'search.hint': '輸入關鍵字搜尋所有已發布的文章。支援中英文、模糊匹配、code block 內容。',
    'lang.switch': 'English',
    'footer.poweredBy': '由 Astro 與 GitHub Actions 驅動',
  },
  en: {
    'site.title': 'HCL Domino Daily',
    'site.tagline': 'Daily HCL Domino Insights & Technical Deep-Dives',
    'site.description': 'A bilingual daily HCL Domino publication — fresh ecosystem news and technical deep-dives, every day.',
    'nav.home': 'Home',
    'nav.posts': 'All Posts',
    'nav.tags': 'Tags',
    'nav.search': 'Search',
    'nav.about': 'About',
    'home.latest': 'Latest Posts',
    'home.viewAll': 'View all posts →',
    'post.published': 'Published',
    'post.updated': 'Updated',
    'post.tags': 'Tags',
    'post.sources': 'Sources',
    'post.backToList': '← Back to all posts',
    'post.wordCount': '{n} words',
    'post.readingTime': '{n} min read',
    'breadcrumb.home': 'Home',
    'breadcrumb.posts': 'All Posts',
    'tags.title': 'All Tags',
    'tags.postsTagged': 'Posts tagged',
    'tags.posts': 'posts',
    'pagination.prev': 'Previous',
    'pagination.next': 'Next',
    'pagination.pageOf': 'Page {n} of {m}',
    'about.title': 'About',
    'search.title': 'Search',
    'search.heading': 'Search posts',
    'search.hint': 'Search across all published posts. Supports English + Chinese, fuzzy matching, and code-block content.',
    'lang.switch': '繁體中文',
    'footer.poweredBy': 'Powered by Astro and GitHub Actions',
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
