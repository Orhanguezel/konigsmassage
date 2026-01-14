// src/seo/pageSeo.ts
'use client';

const DEFAULT_LOCALE_PREFIXLESS = true;
const DEFAULT_LOCALE = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de').trim().toLowerCase();

function stripTrailingSlash(u: string) {
  return String(u || '')
    .trim()
    .replace(/\/+$/, '');
}

function normalizeLocalhostOrigin(origin: string): string {
  const o = stripTrailingSlash(origin);
  if (/^https?:\/\/localhost:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  if (/^https?:\/\/127\.0\.0\.1:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  return o;
}

function toLocaleShort(l: any): string {
  return (
    String(l || DEFAULT_LOCALE)
      .trim()
      .toLowerCase()
      .replace('_', '-')
      .split('-')[0] || DEFAULT_LOCALE
  );
}

function getBaseUrl(): string {
  const env = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (env) return normalizeLocalhostOrigin(env);

  if (typeof window !== 'undefined' && window?.location?.origin) {
    return normalizeLocalhostOrigin(window.location.origin);
  }

  return 'http://localhost';
}

/** absolute URL helper (client) */
export function absUrl(pathOrUrl: string): string {
  const base = getBaseUrl();
  const v = String(pathOrUrl || '').trim();
  if (!v) return base;
  if (/^https?:\/\//i.test(v)) return normalizeLocalhostOrigin(v);
  return `${base}${v.startsWith('/') ? v : `/${v}`}`;
}

/** "/x?y#z" -> "/x" */
export function stripHashQuery(asPath: string): string {
  const [pathOnly] = String(asPath || '/').split('#');
  const [pathname] = pathOnly.split('?');
  return pathname || '/';
}

/** Layout ve diğer yerler bunu kullanıyor: export olmalı */
export function asObj(x: any): Record<string, any> | null {
  return x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, any>) : null;
}

/** seo.open_graph.image veya seo.open_graph.images[0] */
export function pickFirstImageFromSeo(seo: any): string {
  const og = asObj(seo?.open_graph) || {};
  const image = typeof (og as any).image === 'string' ? String((og as any).image).trim() : '';
  const imagesArr =
    Array.isArray((og as any).images) && (og as any).images.length
      ? String((og as any).images[0]).trim()
      : '';
  return image || imagesArr || '';
}

/* ---------------- Canonical helpers ---------------- */

function splitPath(asPath: string): { pathname: string; search: string } {
  const s = String(asPath || '/');
  const [noHash] = s.split('#');
  const idx = noHash.indexOf('?');
  if (idx >= 0) {
    return { pathname: noHash.slice(0, idx) || '/', search: noHash.slice(idx) || '' };
  }
  return { pathname: noHash || '/', search: '' };
}

function normPath(pathname?: string): string {
  let p = (pathname ?? '/').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

function readLcFromSearch(search: string): string {
  const s = String(search || '');
  if (!s || s === '?') return '';
  try {
    const usp = new URLSearchParams(s.startsWith('?') ? s.slice(1) : s);
    return toLocaleShort(usp.get('__lc'));
  } catch {
    return '';
  }
}

/** "/en" veya "/en/..." => "en" */
function readLocaleFromPathPrefix(pathname: string): string {
  const p = normPath(pathname);
  const m = p.match(/^\/([a-zA-Z]{2})(\/|$)/);
  if (!m) return '';
  return toLocaleShort(m[1]);
}

/** "/en/x" -> "/x" , "/en" -> "/" (her locale için) */
function stripAnyLocalePrefix(pathname: string): string {
  const p = normPath(pathname);
  const m = p.match(/^\/([a-zA-Z]{2})(\/|$)/);
  if (!m) return p;
  const rest = p.slice(m[1].length + 1); // "/en" => "" , "/en/x" => "/x"
  return normPath(rest || '/');
}

function ensureLocalePrefix(pathname: string, localeShort: string): string {
  const loc = toLocaleShort(localeShort);
  const p = normPath(pathname);
  if (p === '/') return `/${loc}`;
  if (p === `/${loc}`) return p;
  if (p.startsWith(`/${loc}/`)) return p;
  return `/${loc}${p}`;
}

/**
 * Canonical (CLIENT/Pages Router):
 * - asPath -> pathname + search ayrılır
 * - effectiveLocale = __lc || pathPrefix || resolvedLocale
 * - canonicalPath = (stripAnyLocalePrefix(pathname)) üzerine kurulur
 * - default locale prefixless ise "/tr/.." => "/.."
 * - non-default ise "/en/.." garanti edilir
 *
 * NOT: localizePath canonical için şart değil; URL zaten gerçeğin kendisi.
 */
export function buildCanonical(args: {
  asPath?: string;
  locale: string;
  fallbackPathname: string;
  lcHint?: string; // ✅ YENİ: router.query.__lc gibi
}): string {
  const { pathname, search } = splitPath(args.asPath || args.fallbackPathname || '/');
  const pathOnly = normPath(pathname);

  const lcFromQuery = readLcFromSearch(search);
  const lcFromPath = readLocaleFromPathPrefix(pathOnly);
  const lcFromHint = toLocaleShort(args.lcHint);

  // ✅ Öncelik: __lc(query) > __lc(hint) > pathPrefix > resolvedLocale
  const effectiveLocale = lcFromQuery || lcFromHint || lcFromPath || toLocaleShort(args.locale);

  const def = toLocaleShort(DEFAULT_LOCALE);
  const loc = toLocaleShort(effectiveLocale);

  const basePath = stripAnyLocalePrefix(pathOnly); // "/en/product" -> "/product"

  // ✅ Default locale + prefixless: "/product"
  if (DEFAULT_LOCALE_PREFIXLESS && loc === def) {
    return absUrl(basePath);
  }

  // ✅ Non-default: "/en/product"
  return absUrl(ensureLocalePrefix(basePath, loc));
}
