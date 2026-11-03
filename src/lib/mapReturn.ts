// "Back to the class map" on an article page: when a reader opens an article
// from /map/, the map's address at that moment (with its ?cls= / ?island= /
// ?lens=) is kept for this tab, keyed to the article it opened. The article
// page shows the link only for that article, so readers who arrive from
// anywhere else (home, search, an outside link) never see it, and leaving
// for any page other than the map drops it. Storage may be
// unavailable (private mode, blocked site data): then nothing is kept and no
// link shows.
const KEY = 'domino-news:map-return';

const trim = (p: string) => p.replace(/\/+$/, '');

export function rememberMap(articleHref: string): void {
  try {
    const to = new URL(articleHref, location.href);
    sessionStorage.setItem(KEY, JSON.stringify({ from: location.pathname + location.search, to: to.pathname }));
  } catch (e) {
    /* no storage: no way back, and that's fine */
  }
}

export function forgetMap(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch (e) {
    /* nothing kept */
  }
}

/** the map address to go back to from this page, or null */
export function mapReturnFor(path: string): string | null {
  try {
    const r = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!r || typeof r.from !== 'string' || typeof r.to !== 'string') return null;
    if (trim(r.to) !== trim(path)) return null;
    // only ever back to the map, on this site
    const from = new URL(r.from, location.origin);
    if (from.origin !== location.origin || !/\/map\/?$/.test(from.pathname)) return null;
    return from.pathname + from.search;
  } catch (e) {
    return null;
  }
}
