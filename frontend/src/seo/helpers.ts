// =============================================================
// FILE: src/seo/helpers.ts
// SEO helpers (shared) — single place for URL/locale normalization.
// Routing rule: App Router uses "/[locale]/..." ALWAYS (no prefixless default locale).
// =============================================================

export const DEFAULT_LOCALE_FALLBACK = 'de';

// ✅ App Router: src/app/[locale]/... => always prefix locale
export const DEFAULT_LOCALE_PREFIXLESS = false;

export function stripTrailingSlash(u: string) {
  return String(u || '')
    .trim()
    .replace(/\/+$/, '');
}

export function normalizeLocalhostOrigin(origin: string): string {
  const o = stripTrailingSlash(origin);
  if (/^https?:\/\/localhost:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  if (/^https?:\/\/127\.0\.0\.1:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  return o;
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function asStr(x: unknown): string | null {
  return typeof x === 'string' && x.trim() ? x.trim() : null;
}

export function asBool(x: unknown): boolean | null {
  return typeof x === 'boolean' ? x : null;
}

export function asObj(x: unknown): Record<string, any> | null {
  return x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, any>) : null;
}

export function asStrArr(x: unknown): string[] {
  if (!x) return [];
  if (Array.isArray(x)) {
    return x
      .map((v) => String(v))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const s = asStr(x);
  return s ? [s] : [];
}

export function normLocaleShort(l: unknown, fallback = DEFAULT_LOCALE_FALLBACK): string {
  const v = String(l || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  const short = (v.split('-')[0] || '').trim();
  const fb = String(fallback || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0];
  return short || fb || DEFAULT_LOCALE_FALLBACK;
}

/** Path normalizasyonu: başında / olsun; kök dışı ise sonda / olmasın */
export function normPath(pathname?: string): string {
  let p = (pathname ?? '/').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

export function absUrlJoin(baseUrl: string, pathOrUrl: string): string {
  const base = normalizeLocalhostOrigin(stripTrailingSlash(baseUrl || ''));
  const v = String(pathOrUrl || '').trim();
  if (!v) return base || 'http://localhost';
  if (/^https?:\/\//i.test(v)) return normalizeLocalhostOrigin(v);
  const p = v.startsWith('/') ? v : `/${v}`;
  return `${base}${p}`;
}

/** Site'nin temel URL'si (örn: https://www.koenigsmassage.com) */
export function siteUrlBase(): string {
  const envUrl = stripTrailingSlash(String(process.env.NEXT_PUBLIC_SITE_URL || '').trim());
  if (envUrl) return normalizeLocalhostOrigin(envUrl);

  if (typeof window !== 'undefined' && window?.location?.origin) {
    return normalizeLocalhostOrigin(stripTrailingSlash(window.location.origin));
  }

  return 'http://localhost';
}

/** Verilen path'i tam URL'e çevirir. Zaten http(s) ise dokunmaz. */
export function absoluteUrl(pathOrUrl: string): string {
  const base = siteUrlBase();
  return absUrlJoin(base, pathOrUrl);
}

/**
 * "/{locale}/..." path üretimi
 * - App Router: ALWAYS prefix locale (no prefixless default).
 * - pathname: locale-prefixsiz path: "/" veya "/blog"
 */
export function localizedPath(locale: string, pathname: string, defaultLocale: string): string {
  const def = normLocaleShort(defaultLocale, DEFAULT_LOCALE_FALLBACK);
  const loc = normLocaleShort(locale, def);
  const p = normPath(pathname);

  if (DEFAULT_LOCALE_PREFIXLESS && loc === def) return p;

  if (p === '/') return `/${loc}`;
  return `/${loc}${p}`;
}

/** "/x?y#z" -> "/x" */
export function stripHashQuery(asPath: string): string {
  const [pathOnly] = String(asPath || '/').split('#');
  const [pathname] = pathOnly.split('?');
  return pathname || '/';
}

/** Compact object (remove null/undefined/empty string/empty array/empty object) */
export function compact<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj || {})) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue;
    }
    out[key] = value;
  }

  return out as T;
}
