// =============================================================
// FILE: src/seo/alternates.ts
// =============================================================
import 'server-only';

import { headers } from 'next/headers';
import { fetchActiveLocales, getDefaultLocale } from '@/i18n/server';

const DEFAULT_LOCALE_PREFIXLESS = true;

const stripTrailingSlash = (u: string) =>
  String(u || '')
    .trim()
    .replace(/\/+$/, '');

const normalizeLocalhostOrigin = (origin: string): string => {
  const o = stripTrailingSlash(origin);
  if (/^https?:\/\/localhost:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  if (/^https?:\/\/127\.0\.0\.1:\d+$/i.test(o)) return o.replace(/:\d+$/i, '');
  return o;
};

const firstHeader = (v: unknown): string =>
  String(v || '')
    .split(',')[0]
    .trim();

function normLocale(l: any, fallback: string): string {
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
  return short || fb || 'de';
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function normPath(pathname?: string): string {
  let p = (pathname ?? '/').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

function localizedPath(locale: string, pathname: string, defaultLocale: string): string {
  const def = normLocale(defaultLocale, defaultLocale);
  const loc = normLocale(locale, def);
  const p = normPath(pathname);

  // ✅ default locale prefixsiz
  if (DEFAULT_LOCALE_PREFIXLESS && loc === def) return p;

  if (p === '/') return `/${loc}`;
  return `/${loc}${p}`;
}

async function getRuntimeBaseUrl(): Promise<string> {
  // 1) env (prod deterministik)
  const env = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (env) return normalizeLocalhostOrigin(env);

  // 2) SSR headers (proxy-safe)
  const h = await headers();
  const xfProto = firstHeader(h.get('x-forwarded-proto') || '');
  const xfHost = firstHeader(h.get('x-forwarded-host') || '');
  const host = xfHost || firstHeader(h.get('host') || '');

  const proto = (xfProto || 'https').trim() || 'https';
  const base = host ? `${proto}://${host}` : 'http://localhost:3000';

  return normalizeLocalhostOrigin(stripTrailingSlash(base));
}

function absUrl(baseUrl: string, pathOrUrl: string): string {
  const v = String(pathOrUrl || '').trim();
  if (!v) return baseUrl;
  if (/^https?:\/\//i.test(v)) return normalizeLocalhostOrigin(v);
  const p = v.startsWith('/') ? v : `/${v}`;
  return `${baseUrl}${p}`;
}

/** hreflang için mutlak URL haritası üretir (DB app_locales) */
export async function languagesMap(pathname?: string) {
  const baseUrl = await getRuntimeBaseUrl();

  const defaultLocaleRaw = await getDefaultLocale();
  const def = normLocale(defaultLocaleRaw, 'de');

  const activeRaw = await fetchActiveLocales();
  const active = uniq(activeRaw.map((l) => normLocale(l, def))).filter(Boolean);

  // default locale mutlaka listede olsun
  if (!active.includes(def)) active.unshift(def);

  const p = normPath(pathname);

  const map: Record<string, string> = {};
  for (const l of active) {
    map[l] = absUrl(baseUrl, localizedPath(l, p, def));
  }

  // ✅ x-default: default locale canonical
  map['x-default'] = absUrl(baseUrl, localizedPath(def, p, def));

  return map as Readonly<Record<string, string>>;
}

/** Canonical URL (mutlak) – seçilen dil için */
export async function canonicalFor(locale: string, pathname?: string) {
  const baseUrl = await getRuntimeBaseUrl();

  const defaultLocaleRaw = await getDefaultLocale();
  const def = normLocale(defaultLocaleRaw, 'de');

  const p = normPath(pathname);
  const loc = normLocale(locale, def);

  return absUrl(baseUrl, localizedPath(loc, p, def));
}
