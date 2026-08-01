/**
 * Per-tag color palette. Each tag maps to a category that drives chip color.
 * If a tag isn't listed it falls back to the "meta" palette.
 */

export type TagPalette = {
  bg: string;
  fg: string;
  bgDark: string;
  fgDark: string;
};

const PRODUCT: TagPalette = {
  bg: '#fee2e2',
  fg: '#b91c1c',
  bgDark: '#451a1a',
  fgDark: '#fca5a5',
};
const TECH: TagPalette = {
  bg: '#dbeafe',
  fg: '#1d4ed8',
  bgDark: '#172554',
  fgDark: '#93c5fd',
};
const TOPIC: TagPalette = {
  bg: '#f3e8ff',
  fg: '#7e22ce',
  bgDark: '#3b0764',
  fgDark: '#d8b4fe',
};
const META: TagPalette = {
  bg: '#f1f5f9',
  fg: '#475569',
  bgDark: '#1e293b',
  fgDark: '#cbd5e0',
};

const TAG_CATEGORIES: Record<string, TagPalette> = {
  // Product / module
  'Domino Server': PRODUCT,
  'Notes Client': PRODUCT,
  'Domino Designer': PRODUCT,
  'Domino REST API': PRODUCT,
  'Volt MX': PRODUCT,
  Nomad: PRODUCT,
  'AppDev Pack': PRODUCT,
  Sametime: PRODUCT,
  'Domino IQ': PRODUCT,

  // Technology / language
  LotusScript: TECH,
  Formula: TECH,
  Java: TECH,
  XPages: TECH,
  JavaScript: TECH,
  DQL: TECH,
  OIDC: TECH,
  'Notes UI': TECH,

  // Topic
  Security: TOPIC,
  Performance: TOPIC,
  Migration: TOPIC,
  Backup: TOPIC,
  DevOps: TOPIC,
  Admin: TOPIC,

  // Content type
  'Release Notes': META,
  Tutorial: META,
  News: META,
  Community: META,

  // Additional tags in use (kept in sync with tagAxis below)
  Domino: PRODUCT,
  DRAPI: PRODUCT,
  OpenNTF: PRODUCT,
  AI: TOPIC,
  Container: TOPIC,
};

export function tagPalette(tag: string): TagPalette {
  return TAG_CATEGORIES[tag] ?? META;
}

/**
 * Which of the four taxonomy axes a tag belongs to. Drives the grouped
 * filter bar on the "all posts" page. Kept consistent with the palette
 * above: PRODUCT/TECH/TOPIC map to their colours, TYPE uses the META
 * (slate) palette. Unknown tags fall to TYPE so they still group somewhere.
 */
export type TagAxis = 'TECH' | 'PRODUCT' | 'TOPIC' | 'TYPE';

const TAG_AXIS: Record<string, TagAxis> = {
  'Domino Server': 'PRODUCT',
  'Notes Client': 'PRODUCT',
  'Domino Designer': 'PRODUCT',
  'Domino REST API': 'PRODUCT',
  'Volt MX': 'PRODUCT',
  Nomad: 'PRODUCT',
  'AppDev Pack': 'PRODUCT',
  Sametime: 'PRODUCT',
  'Domino IQ': 'PRODUCT',
  Domino: 'PRODUCT',
  DRAPI: 'PRODUCT',
  OpenNTF: 'PRODUCT',

  LotusScript: 'TECH',
  Formula: 'TECH',
  Java: 'TECH',
  XPages: 'TECH',
  JavaScript: 'TECH',
  DQL: 'TECH',
  OIDC: 'TECH',
  'Notes UI': 'TECH',

  Security: 'TOPIC',
  Performance: 'TOPIC',
  Migration: 'TOPIC',
  Backup: 'TOPIC',
  DevOps: 'TOPIC',
  Admin: 'TOPIC',
  AI: 'TOPIC',
  Container: 'TOPIC',

  'Release Notes': 'TYPE',
  Tutorial: 'TYPE',
  News: 'TYPE',
  Community: 'TYPE',
};

export function tagAxis(tag: string): TagAxis {
  return TAG_AXIS[tag] ?? 'TYPE';
}

/** Display order + labels for the axis groups, per language. */
export const TAG_AXIS_ORDER: TagAxis[] = ['TECH', 'PRODUCT', 'TOPIC', 'TYPE'];

export const TAG_AXIS_LABEL: Record<TagAxis, { 'zh-TW': string; en: string }> = {
  TECH: { 'zh-TW': '技術', en: 'Tech' },
  PRODUCT: { 'zh-TW': '產品/模組', en: 'Product' },
  TOPIC: { 'zh-TW': '主題', en: 'Topic' },
  TYPE: { 'zh-TW': '類型', en: 'Type' },
};

/**
 * Deterministic gradient pair from a slug, used as a fallback cover when no
 * generated image exists. Maps the slug hash to two HSL colors.
 */
export function slugGradient(slug: string): { from: string; to: string } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const hue1 = h % 360;
  const hue2 = (hue1 + 35) % 360;
  return {
    from: `hsl(${hue1}, 65%, 55%)`,
    to: `hsl(${hue2}, 70%, 45%)`,
  };
}
