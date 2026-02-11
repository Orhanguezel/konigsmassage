// =============================================================
// FILE: src/i18n/url.ts  (FINAL)
//  - Always prefixed locale URLs: "/{locale}/..."
//  - No default-locale prefixless behavior
//  - Strip/localize works with runtime activeLocales when provided
// =============================================================

export type RuntimeLocale = string;

function toShortLocale(v: unknown): string {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

function splitPath(asPath: string) {
  const s = String(asPath || '/');
  const [pathAndQuery, hash = ''] = s.split('#');
  const [pathname = '/', query = ''] = pathAndQuery.split('?');
  return {
    pathname: pathname || '/',
    query: query ? `?${query}` : '',
    hash: hash ? `#${hash}` : '',
  };
}

function buildActiveSet(activeLocales?: string[]) {
  return new Set((activeLocales || []).map((x) => toShortLocale(x)).filter(Boolean));
}

function looksLikeLocale(seg: string): boolean {
  const s = toShortLocale(seg);
  return /^[a-z]{2}$/.test(s) || /^[a-z]{3}$/.test(s);
}

/**
 * Strips "/{locale}" prefix from a pathname.
 * - If activeLocales provided: strips only if prefix exists in activeLocales (strict).
 * - Else: strips if first segment looks like locale (heuristic).
 */
export function stripLocalePrefix(pathname: string, activeLocales?: string[]): string {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const seg = p.replace(/^\/+/, '').split('/')[0] || '';
  const cand = toShortLocale(seg);
  if (!cand) return p;

  const activeSet = buildActiveSet(activeLocales);

  const shouldStrip =
    activeSet.size > 0 ? activeSet.has(cand) : looksLikeLocale(cand);

  if (!shouldStrip) return p;

  const rest = p.replace(new RegExp(`^/${seg}(?=/|$)`), '');
  return rest ? (rest.startsWith('/') ? rest : `/${rest}`) : '/';
}

export type LocalizePathOptions = {
  defaultLocale?: string;
};

/**
 * Localizes a path using URL-prefix routing ALWAYS:
 *   /{locale}/...
 * Removes existing locale prefix first.
 */
export function localizePath(
  locale: RuntimeLocale,
  asPath: string,
  activeLocales?: string[],
  opts?: LocalizePathOptions,
): string {
  const { pathname, query, hash } = splitPath(asPath);

  const clean = stripLocalePrefix(pathname, activeLocales);
  const base = clean === '/' ? '' : clean;

  const target = toShortLocale(locale);
  const def = toShortLocale(opts?.defaultLocale) || toShortLocale(activeLocales?.[0]) || 'de';

  const lc = target || def;

  // ✅ ALWAYS prefix locale
  const path = `/${lc}${base || ''}` || `/${lc}`;

  return `${path}${query}${hash}`;
}
