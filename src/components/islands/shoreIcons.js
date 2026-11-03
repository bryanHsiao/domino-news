// The icon of each shore area (not a class): on its name plate, in the
// island list and on its card. Single-colour line drawings in the toolbar's
// style (16 × 16, 1.5 stroke, round ends), coloured by currentColor:
// Java's coffee cup for the Java runtime, a browser window (an address bar
// over a page) for XPages, the web layer, and an open package for OpenNTF's
// open-source projects and tools.
const ATTRS = 'viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
const PATHS = {
  'java-runtime':
    '<path d="M3 6.2h8v2.9a3.1 3.1 0 0 1-3.1 3.1H6.1A3.1 3.1 0 0 1 3 9.1z"/><path d="M11 7.2h.7a1.55 1.55 0 0 1 0 3.1H11"/><path d="M2 14.2h10.5"/><path d="M5.7 4.4c-.7-.7.7-1.4 0-2.4M8.3 4.4c-.7-.7.7-1.4 0-2.4"/>',
  xpages:
    '<rect x="1.75" y="2.5" width="12.5" height="11" rx="1.5"/><path d="M1.75 5.5h12.5"/><path d="M3.9 4h.01M5.7 4h.01"/><path d="M4.5 8.3h7M4.5 10.8h4.5"/>',
  openntf:
    '<path d="M2.75 7.2 8 9.6l5.25-2.4v5L8 14.6l-5.25-2.4z"/><path d="M8 9.6v5"/><path d="M2.75 7.2 1.2 4.6l5.2-2.2L8 4.8M13.25 7.2l1.55-2.6-5.2-2.2L8 4.8"/>',
};
export function shoreIcon(shore) {
  return '<svg class="shore-ic" ' + ATTRS + '>' + (PATHS[shore] || PATHS.openntf) + '</svg>';
}
