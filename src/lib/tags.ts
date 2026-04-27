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
  Domino: PRODUCT,
  Notes: PRODUCT,
  'Volt MX': PRODUCT,
  Nomad: PRODUCT,
  Sametime: PRODUCT,
  'AppDev Pack': PRODUCT,
  HCL: PRODUCT,

  'REST API': TECH,
  LotusScript: TECH,
  XPages: TECH,
  Java: TECH,

  Security: TOPIC,
  Performance: TOPIC,
  AI: TOPIC,
  DevOps: TOPIC,
  Migration: TOPIC,

  'Release Notes': META,
  Tutorial: META,
  Community: META,
};

export function tagPalette(tag: string): TagPalette {
  return TAG_CATEGORIES[tag] ?? META;
}

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
