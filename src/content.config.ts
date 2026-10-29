import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    // Derive id from path (e.g. "zh-TW/2026-04-28-foo") so the same slug
    // can appear in both language directories without colliding.
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    lang: z.enum(['zh-TW', 'en']),
    slug: z.string(),
    tags: z.array(z.string()).default([]),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().url(),
        })
      )
      .default([]),
    cover: z.string().optional(),
    coverStyle: z.string().optional(),
    relatedJava: z.array(z.string()).default([]),
    relatedSsjs: z.array(z.string()).default([]),
    // --- /map/ multi-language island fields (see docs/map-3d-island-brief.md
    // "多語言架構"). These drive language lamps / the XPages island straight
    // from a post's own frontmatter — distinct from relatedJava/relatedSsjs,
    // which live on LS posts and point back at LS posts. ---
    // One or more data/ls_classes.json node ids (full class names, e.g.
    // "NotesSession"): this post teaches that Notes class, so light its lamp
    // for `apiLang`.
    coversClass: z.union([z.string(), z.array(z.string())]).optional(),
    // Web-layer concept post with no backing Notes class → the XPages island.
    // Currently the only value is "xpages".
    coversIsland: z.string().optional(),
    // Community post shown at a harbour on the /map/ islands view's shore
    // (not an island: the community supplies tools, it isn't part of the
    // API). Currently the only value is "openntf". Needs no apiLang.
    coversHarbour: z.enum(['openntf']).optional(),
    // Which programming language this post is written in. LS posts leave it
    // unset. Required whenever coversClass or coversIsland is set.
    apiLang: z.enum(['java', 'ssjs']).optional(),
    draft: z.boolean().default(false),
  }).superRefine((data, ctx) => {
    // A post maps to at most one of class/island, and if it maps at all it
    // must say which language it is.
    if (data.coversClass !== undefined && data.coversIsland !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Set at most one of coversClass or coversIsland, not both.',
        path: ['coversClass'],
      });
    }
    if ((data.coversClass !== undefined || data.coversIsland !== undefined) && data.apiLang === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'apiLang is required when coversClass or coversIsland is set.',
        path: ['apiLang'],
      });
    }
  }),
});

export const collections = { posts };
