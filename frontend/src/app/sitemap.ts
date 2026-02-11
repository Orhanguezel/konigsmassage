import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { fetchActiveLocales, fetchSetting, getDefaultLocale } from '@/i18n/server';
import { getServerApiBase } from '@/i18n/apiBase.server';
import { normalizeLocalhostOrigin, stripTrailingSlash } from '@/seo/helpers';
import { absUrlJoin, localizedPath, normLocaleShort, normPath, uniq } from '@/seo/helpers';

export const revalidate = 3600;

const API = getServerApiBase();

type AnyObj = Record<string, any>;

async function getBaseUrl(): Promise<string> {
  const env = stripTrailingSlash(String(process.env.NEXT_PUBLIC_SITE_URL || '').trim());
  if (env) return normalizeLocalhostOrigin(env);

  const publicBase = await fetchSetting('public_base_url', '*', { revalidate: 600 });
  const fromDb = stripTrailingSlash(String(publicBase?.value || '').trim());
  if (fromDb && /^https?:\/\//i.test(fromDb)) return normalizeLocalhostOrigin(fromDb);

  const h = await headers();

  const xfProto = String(h.get('x-forwarded-proto') || '')
    .split(',')[0]
    ?.trim();
  const xfHost = String(h.get('x-forwarded-host') || '')
    .split(',')[0]
    ?.trim();

  const host = xfHost || String(h.get('host') || '').trim();
  const proto = (xfProto || 'https').trim();
  if (host) return normalizeLocalhostOrigin(stripTrailingSlash(`${proto}://${host}`));

  return 'http://localhost:3000';
}

function apiUrl(path: string): string {
  const base = API.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchApiJson<T>(path: string): Promise<T | null> {
  if (!API) return null;
  try {
    const res = await fetch(apiUrl(path), { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toList(raw: unknown): AnyObj[] {
  if (Array.isArray(raw)) return raw as AnyObj[];
  const anyRaw = raw as any;
  if (anyRaw && Array.isArray(anyRaw.items)) return anyRaw.items as AnyObj[];
  return [];
}

async function fetchServicesByLocale(args: {
  locale: string;
  defaultLocale: string;
}): Promise<Array<{ id: string; slug: string; updated_at?: string }>> {
  const qs = new URLSearchParams({
    locale: args.locale,
    default_locale: args.defaultLocale,
    limit: '500',
    sort: 'updated_at',
    orderDir: 'desc',
  });

  const raw = await fetchApiJson<any>(`/services?${qs.toString()}`);
  const list = toList(raw);

  return list
    .map((x) => ({
      id: String(x?.id || '').trim(),
      slug: String(x?.slug || '').trim(),
      updated_at: typeof x?.updated_at === 'string' ? x.updated_at : undefined,
    }))
    .filter((x) => x.id && x.slug);
}

async function fetchBlogPagesByLocale(args: {
  locale: string;
  defaultLocale: string;
}): Promise<Array<{ id: string; slug: string; updated_at?: string }>> {
  const qs = new URLSearchParams({
    module_key: 'blog',
    locale: args.locale,
    default_locale: args.defaultLocale,
    limit: '500',
    sort: 'updated_at',
    orderDir: 'desc',
    is_published: '1',
  });

  const raw = await fetchApiJson<any>(`/custom_pages?${qs.toString()}`);
  const list = toList(raw);

  return list
    .map((x) => ({
      id: String(x?.id || '').trim(),
      slug: String(x?.slug || '').trim(),
      updated_at: typeof x?.updated_at === 'string' ? x.updated_at : undefined,
    }))
    .filter((x) => x.id && x.slug);
}

function localizedAbsUrl(baseUrl: string, locale: string, pathname: string, defaultLocale: string): string {
  const loc = normLocaleShort(locale, defaultLocale);
  const path = normPath(pathname);
  return absUrlJoin(baseUrl, localizedPath(loc, path, defaultLocale));
}

function buildAlternates(baseUrl: string, locales: string[], pathname: string, defaultLocale: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = localizedAbsUrl(baseUrl, l, pathname, defaultLocale);
  }
  languages['x-default'] = localizedAbsUrl(baseUrl, defaultLocale, pathname, defaultLocale);
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();
  const activeLocales = uniq((await fetchActiveLocales()).map((l) => normLocaleShort(l)));
  const defaultLocale = normLocaleShort(await getDefaultLocale());

  const staticPaths = [
    '/',
    '/about',
    '/services',
    '/blog',
    '/appointment',
    '/faqs',
    '/terms',
    '/privacy-policy',
    '/privacy-notice',
    '/legal-notice',
    '/cookie-policy',
    '/kvkk',
  ];

  // --------- Dynamic slugs (id -> per-locale slug map) ---------
  const servicesByLocale = await Promise.all(
    activeLocales.map(async (l) => [l, await fetchServicesByLocale({ locale: l, defaultLocale })] as const),
  );

  const serviceSlugById: Record<string, Record<string, { slug: string; updated_at?: string }>> = {};
  for (const [loc, list] of servicesByLocale) {
    for (const it of list) {
      serviceSlugById[it.id] = serviceSlugById[it.id] || {};
      serviceSlugById[it.id]![loc] = { slug: it.slug, updated_at: it.updated_at };
    }
  }

  const blogByLocale = await Promise.all(
    activeLocales.map(async (l) => [l, await fetchBlogPagesByLocale({ locale: l, defaultLocale })] as const),
  );

  const blogSlugById: Record<string, Record<string, { slug: string; updated_at?: string }>> = {};
  for (const [loc, list] of blogByLocale) {
    for (const it of list) {
      blogSlugById[it.id] = blogSlugById[it.id] || {};
      blogSlugById[it.id]![loc] = { slug: it.slug, updated_at: it.updated_at };
    }
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const pathname of staticPaths) {
    for (const loc of activeLocales) {
      entries.push({
        url: localizedAbsUrl(baseUrl, loc, pathname, defaultLocale),
        alternates: buildAlternates(baseUrl, activeLocales, pathname, defaultLocale),
      });
    }
  }

  for (const perLocale of Object.values(serviceSlugById)) {
    for (const loc of activeLocales) {
      const found = perLocale[loc] || perLocale[defaultLocale];
      if (!found?.slug) continue;
      const path = `/services/${found.slug}`;
      entries.push({
        url: localizedAbsUrl(baseUrl, loc, path, defaultLocale),
        alternates: buildAlternates(baseUrl, activeLocales, path, defaultLocale),
        ...(found.updated_at ? { lastModified: found.updated_at } : {}),
      });
    }
  }

  for (const perLocale of Object.values(blogSlugById)) {
    for (const loc of activeLocales) {
      const found = perLocale[loc] || perLocale[defaultLocale];
      if (!found?.slug) continue;
      const path = `/blog/${found.slug}`;
      entries.push({
        url: localizedAbsUrl(baseUrl, loc, path, defaultLocale),
        alternates: buildAlternates(baseUrl, activeLocales, path, defaultLocale),
        ...(found.updated_at ? { lastModified: found.updated_at } : {}),
      });
    }
  }

  return entries;
}
