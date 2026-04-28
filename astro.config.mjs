import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  site: 'https://bryanhsiao.github.io',
  base: '/domino-news',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    rehypePlugins: [
      // Open external links in a new tab so readers don't lose their place
      // in the article when they click a citation. Internal anchors and
      // same-origin links are left alone.
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
        },
      ],
    ],
  },
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      useDarkModeMediaQuery: true,
      styleOverrides: {
        borderRadius: '10px',
        borderColor: 'var(--color-border)',
        codeFontSize: '0.9rem',
        codeFontFamily: 'var(--font-mono)',
        codePaddingBlock: '1rem',
        codePaddingInline: '1.25rem',
        frames: {
          shadowColor: 'transparent',
        },
      },
      defaultProps: {
        showLineNumbers: false,
      },
    }),
    mdx(),
    sitemap(),
  ],
});
