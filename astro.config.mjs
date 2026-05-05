import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

/**
 * Localise the footnote section heading and back-reference aria labels.
 * remark-gfm renders "Footnotes" / "Back to reference N" by default; for
 * zh-TW posts we rewrite those to 註 / 回到參照 N. Detection is by source
 * file path — zh-TW files live under content/posts/zh-TW/.
 */
function rehypeLocaliseFootnotes() {
  return (tree, file) => {
    const filePath = String(file?.history?.[0] ?? file?.path ?? '');
    const isZh = filePath.includes('/zh-TW/') || filePath.includes('\\zh-TW\\');
    const labels = isZh
      ? { footnotes: '註', backref: '回到參照' }
      : { footnotes: 'Footnotes', backref: 'Back to reference' };

    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'element' && node.properties) {
        if (node.properties.id === 'footnote-label') {
          node.children = [{ type: 'text', value: labels.footnotes }];
        }
        const aria = node.properties.ariaLabel;
        if (typeof aria === 'string' && aria.startsWith('Back to reference')) {
          const num = aria.replace('Back to reference', '').trim();
          node.properties.ariaLabel = num ? `${labels.backref} ${num}` : labels.backref;
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}

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
      rehypeLocaliseFootnotes,
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
