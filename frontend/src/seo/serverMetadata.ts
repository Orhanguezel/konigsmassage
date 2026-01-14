// =============================================================
// FILE: src/seo/serverMetadata.ts
// konigsmassage – Server Metadata Builder (DB-driven locales/default)
//   - Active locales: site_settings.app_locales (DB)
//   - Default locale: getDefaultLocale() (DB)
//   - Canonical + hreflang SSR tek kaynak (alternates)
//   - GLOBAL defaults (locale='*') first-class
//   - NO hardcoded locale unions
// =============================================================
import 'server-only';

import type { Metadata } from 'next';
import { headers } from 'next/headers';

import {
  fetchSetting,
  fetchActiveLocales,
  getDefaultLocale,
  type JsonLike,
  DEFAULT_LOCALE_FALLBACK,
} from '@/i18n/server';

/**
 * Default locale prefix kuralı:
 * - true  => default locale URL’leri prefix’siz: "/" , "/blog"
 * - false => default locale de prefix’li: "/tr", "/tr/blog"
 */
const DEFAULT_LOCALE_PREFIXLESS = true;

/* -------------------- utils -------------------- */

function normLocale(l: any): string {
  const v = String(l || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  const short = (v.split('-')[0] || '').trim();
  return short || DEFAULT_LOCALE_FALLBACK;
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function asStr(x: any): string | null {
  return typeof x === 'string' && x.trim() ? x.trim() : null;
}
function asBool(x: any): boolean | null {
  return typeof x === 'boolean' ? x : null;
}
function asObj(x: any): Record<string, any> | null {
  return x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, any>) : null;
}
function asStrArr(x: any): string[] {
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

/**
 * ✅ Server runtime base URL (proxy-safe).
 * Öncelik:
 *  1) NEXT_PUBLIC_SITE_URL (varsa sabit)
 *  2) x-forwarded-proto + x-forwarded-host
 *  3) host + https (fallback)
 */
async function getRuntimeBaseUrl(): Promise<string> {
  const env = String(process.env.NEXT_PUBLIC_SITE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (env) return env;

  const h = await headers();

  const xfProto = String(h.get('x-forwarded-proto') || '')
    .split(',')[0]
    ?.trim();
  const xfHost = String(h.get('x-forwarded-host') || '')
    .split(',')[0]
    ?.trim();

  const host = xfHost || String(h.get('host') || '').trim();
  const proto = (xfProto || 'https').trim();

  if (host) return `${proto}://${host}`.replace(/\/+$/, '');

  return 'http://localhost:3000';
}

/**
 * OpenGraph locale formatına çevir:
 * - "pt-br" -> "pt_BR"
 * - "de"    -> "tr_TR" (region yoksa LANG_LANG)
 */
function toOgLocale(l: string): string {
  const raw = String(l || '').trim();
  if (!raw) return `${DEFAULT_LOCALE_FALLBACK}_${DEFAULT_LOCALE_FALLBACK.toUpperCase()}`;

  const normalized = raw.replace('_', '-').toLowerCase();
  const [langRaw, regionRaw] = normalized.split('-');

  const lang = (langRaw || DEFAULT_LOCALE_FALLBACK).toLowerCase().slice(0, 2);
  const region = (regionRaw || '').toUpperCase();

  return `${lang}_${region || lang.toUpperCase()}`;
}

/** Path normalizasyonu: başında / olsun; kök dışı ise sonda / olmasın */
function normPath(pathname?: string): string {
  let p = (pathname ?? '/').trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/**
 * "/{locale}/..." path üretimi
 * - defaultPrefixless=true ise defaultLocale için "/blog" üretilir ("/tr/blog" değil).
 */
function localizedPath(locale: string, pathname: string, defaultLocale: string): string {
  const loc = normLocale(locale);
  const def = normLocale(defaultLocale);
  const p = normPath(pathname);

  if (DEFAULT_LOCALE_PREFIXLESS && loc === def) return p;
  if (p === '/') return `/${loc}`;
  return `/${loc}${p}`;
}

function absUrl(baseUrl: string, pathOrUrl: string): string {
  const v = String(pathOrUrl || '').trim();
  if (!v) return baseUrl;
  if (/^https?:\/\//i.test(v)) return v;
  const p = v.startsWith('/') ? v : `/${v}`;
  return `${baseUrl}${p}`;
}

/* -------------------- SEO fetch (GLOBAL '*' aware, deterministic) -------------------- */

async function resolveActiveLocales(provided?: string[]) {
  const list = provided && provided.length ? provided : await fetchActiveLocales();
  const normalized = uniq(list.map(normLocale)).filter(Boolean);
  if (!normalized.length) normalized.push(DEFAULT_LOCALE_FALLBACK);
  return normalized;
}

/**
 * NEW STANDARD: seo/site_seo için fallback kuralı
 * Öncelik:
 *  1) requested locale
 *  2) global '*'   (kritik: başka locale’a düşmeden önce!)
 *  3) default locale
 *  4) (opsiyonel) diğer active locale’ler
 */
function buildSeoLocaleTryOrder(args: {
  requestedLocale: string;
  defaultLocale: string;
  activeLocales: string[];
}): string[] {
  const req = normLocale(args.requestedLocale);
  const def = normLocale(args.defaultLocale);

  const act = uniq((args.activeLocales || []).map(normLocale)).filter(Boolean);

  // requested -> '*' -> default -> others -> fallback
  return uniq([req, '*', def, ...act, DEFAULT_LOCALE_FALLBACK].filter(Boolean));
}

async function fetchSeoRowWithFallback(locale: string, providedActiveLocales?: string[]) {
  const loc = normLocale(locale);

  // key priority: seo -> site_seo
  const tryKeys = ['seo', 'site_seo'] as const;

  const defaultLocale = await getDefaultLocale();
  const activeLocales = await resolveActiveLocales(providedActiveLocales);

  const tryLocales = buildSeoLocaleTryOrder({
    requestedLocale: loc,
    defaultLocale,
    activeLocales,
  });

  // ✅ Key önce (seo > site_seo), locale sonra
  for (const k of tryKeys) {
    for (const l of tryLocales) {
      const row = await fetchSetting(k, l, { revalidate: 600 });
      if (row?.value != null) return row;
    }
  }

  return null;
}

export async function fetchSeoObject(
  locale: string,
  providedActiveLocales?: string[],
): Promise<Record<string, any>> {
  const row = await fetchSeoRowWithFallback(locale, providedActiveLocales);
  const v = row?.value as JsonLike;
  const obj = asObj(v);
  return obj ?? {};
}

/* -------------------- Metadata builder -------------------- */

type BuildMetadataArgs = {
  locale: string;
  pathname?: string; // locale-prefixsiz path: "/" veya "/blog"
  activeLocales?: string[];
};

export async function buildMetadataFromSeo(
  seo: Record<string, any>,
  args: BuildMetadataArgs,
): Promise<Metadata> {
  const baseUrl = await getRuntimeBaseUrl();

  const active = await resolveActiveLocales(args.activeLocales);
  const defaultLocale = await getDefaultLocale();
  const locale = normLocale(args.locale);

  // Defaults (DB-driven)
  const siteName = asStr(seo.site_name) || 'konigsmassage';
  const titleDefault = asStr(seo.title_default) || siteName;
  const titleTemplate = asStr(seo.title_template) || `%s | ${siteName}`;
  const description = asStr(seo.description) || '';

  // Open Graph
  const og = asObj(seo.open_graph) || {};
  const ogType = (asStr(og.type) || 'website') as any;

  // ✅ SINGLE SOURCE: og.images[]
  // Legacy support: og.image varsa images[0] gibi davran
  const legacyOne = asStr(og?.image);
  const ogImages = uniq([...(legacyOne ? [legacyOne] : []), ...asStrArr(og?.images)])
    .map((u) => absUrl(baseUrl, u))
    .filter(Boolean);

  // Twitter
  const tw = asObj(seo.twitter) || {};
  const twitterCard = (asStr(tw.card) || 'summary_large_image') as any;
  const twitterSite = asStr(tw.site);
  const twitterCreator = asStr(tw.creator);

  // Robots
  const rb = asObj(seo.robots) || {};
  const robotsNoindex = asBool(rb.noindex) ?? false;
  const robotsIndex = asBool(rb.index) ?? true;
  const robotsFollow = asBool(rb.follow) ?? true;

  const pathname = normPath(args.pathname);

  // ✅ canonical SSR tek kaynak
  const canonical = absUrl(baseUrl, localizedPath(locale, pathname, defaultLocale));

  // ✅ hreflang SSR tek kaynak
  const languages: Record<string, string> = {};
  for (const l of active) {
    languages[l] = absUrl(baseUrl, localizedPath(l, pathname, defaultLocale));
  }
  languages['x-default'] = absUrl(baseUrl, localizedPath(defaultLocale, pathname, defaultLocale));

  const ogLocale = toOgLocale(locale);
  const ogAltLocales = active
    .filter((l) => normLocale(l) !== normLocale(locale))
    .map((l) => toOgLocale(l));

  const metadata: Metadata = {
    metadataBase: new URL(baseUrl),

    title: { default: titleDefault, template: titleTemplate },
    ...(description ? { description } : {}),

    alternates: {
      canonical,
      languages,
    },

    // ✅ og:url = canonical (SSR)
    openGraph: {
      type: ogType,
      siteName,
      url: canonical,
      title: titleDefault,
      ...(description ? { description } : {}),
      locale: ogLocale,
      ...(ogAltLocales.length ? { alternateLocale: ogAltLocales } : {}),
      ...(ogImages.length ? { images: ogImages.map((url) => ({ url })) } : {}),
    },

    twitter: {
      card: twitterCard,
      ...(twitterSite ? { site: twitterSite } : {}),
      ...(twitterCreator ? { creator: twitterCreator } : {}),
      ...(ogImages[0] ? { images: [ogImages[0]] } : {}),
    },

    robots: robotsNoindex
      ? { index: false, follow: false }
      : { index: robotsIndex, follow: robotsFollow },
  };

  return metadata;
}
