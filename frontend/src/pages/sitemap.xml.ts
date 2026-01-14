// src/pages/sitemap.xml.tsx
import type { GetServerSideProps, NextPage } from 'next';
import { getRequestBaseUrl } from '@/seo/serverBase';
import { FALLBACK_LOCALE } from '@/i18n/config';

// === Ayarlar ===
const revalidateSeconds = 3600;
const DEFAULT_LOCALE_PREFIXLESS = true;

type AppLocaleMeta = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

/* -------------------- helpers -------------------- */

function stripTrailingSlash(u: string) {
  return String(u || '')
    .trim()
    .replace(/\/+$/, '');
}

function normLocaleShort(x: any, fallback: string): string {
  const v = String(x || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  const short = (v.split('-')[0] || '').trim();
  const out =
    short ||
    String(fallback || '')
      .trim()
      .toLowerCase();
  return (out || '').slice(0, 2);
}

function normalizeDefaultLocaleValue(v: any): string {
  if (v && typeof v === 'object' && 'data' in v) return normLocaleShort((v as any).data, '');
  return normLocaleShort(v, '');
}

function normalizeAppLocalesValue(v: any): AppLocaleMeta[] {
  if (Array.isArray(v)) return v as AppLocaleMeta[];
  if (v && typeof v === 'object' && 'data' in v && Array.isArray((v as any).data)) {
    return (v as any).data as AppLocaleMeta[];
  }
  return [];
}

function computeActiveLocales(meta: AppLocaleMeta[] | null | undefined): string[] {
  const arr = Array.isArray(meta) ? meta : [];

  const active = arr
    .filter((x) => x && (x as any).is_active !== false)
    .map((x) => normLocaleShort((x as any).code, ''))
    .filter(Boolean) as string[];

  const uniq = Array.from(new Set(active));

  const def = arr.find((x) => (x as any)?.is_default === true && (x as any)?.is_active !== false);
  const defCode = def ? normLocaleShort((def as any).code, '') : '';

  const out = defCode ? [defCode, ...uniq.filter((x) => x !== defCode)] : uniq;

  const fb = normLocaleShort(FALLBACK_LOCALE, 'de') || 'de';
  return out.length ? out : [fb];
}

/** API BASE (backend origin → /api), yoksa public base */
function getApiBaseServer(): string {
  const raw =
    (process.env.API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_URL || '').trim() ||
    (process.env.BACKEND_ORIGIN || process.env.NEXT_PUBLIC_BACKEND_ORIGIN || '').trim();

  const base = stripTrailingSlash(raw);

  // Eğer BACKEND_ORIGIN gibi origin verildiyse /api ekle
  if (base && !/\/api$/i.test(base)) return `${base}/api`;
  return base;
}

async function fetchJsonSafe<T>(url: string): Promise<T | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function joinUrl(base: string, path: string) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${b}/${p}`;
}

function normPath(p: string): string {
  let x = String(p || '/').trim();
  if (!x.startsWith('/')) x = `/${x}`;
  if (x !== '/' && x.endsWith('/')) x = x.slice(0, -1);
  return x || '/';
}

function localizedPath(basePath: string, targetLocale: string, defaultLocale: string): string {
  const p = normPath(basePath);
  const loc = normLocaleShort(targetLocale, '');
  const def = normLocaleShort(defaultLocale, '');

  if (!loc) return p;

  if (DEFAULT_LOCALE_PREFIXLESS && loc === def) return p;
  if (p === '/') return `/${loc}`;
  return `/${loc}${p}`;
}

function safeIsoDate(x: any): string | null {
  const d = new Date(String(x || ''));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** slug okuma */
function pickSlug(rec: any, locale: string, defaultLocale: string) {
  const s = rec?.slug;
  if (typeof s === 'string' && s.trim()) return s.trim();

  if (s && typeof s === 'object') {
    const loc = s?.[locale] || s?.[defaultLocale];
    if (typeof loc === 'string' && loc.trim()) return loc.trim();
  }

  if (typeof rec?.slugCanonical === 'string' && rec.slugCanonical.trim()) {
    return rec.slugCanonical.trim();
  }

  return '';
}

async function fetchList(apiBase: string, path: string) {
  if (!apiBase) return [] as any[];
  const url = `${apiBase}/${path}?limit=500`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return [];
  const j = await r.json();
  const data = Array.isArray(j) ? j : j?.data;
  return Array.isArray(data) ? data : [];
}

/* -------------------- sitemap model -------------------- */

const MODULES: Array<{
  key: string;
  path: string; // URL segment
  api: string; // backend endpoint
  priority?: number;
  changefreq?: 'daily' | 'weekly' | 'monthly';
}> = [
  { key: 'about', path: 'about', api: 'about', priority: 0.7, changefreq: 'weekly' },
  { key: 'appointment', path: 'appointment', api: 'appointment', priority: 0.5, changefreq: 'monthly' },
  { key: 'services', path: 'services', api: 'services', priority: 0.6, changefreq: 'monthly' },
  { key: 'blog', path: 'blog', api: 'blog', priority: 0.6, changefreq: 'weekly' },
];

type UrlEntry = {
  loc: string; // canonical
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  alternates?: Record<string, string>; // hreflang map
};

function buildUrlTag(u: UrlEntry) {
  const alt = u.alternates || {};

  const altLinks = Object.entries(alt)
    .filter(([k]) => k !== 'x-default')
    .map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`)
    .join('');

  const xDefault = alt['x-default']
    ? `<xhtml:link rel="alternate" hreflang="x-default" href="${alt['x-default']}"/>`
    : '';

  return [
    '<url>',
    `<loc>${u.loc}</loc>`,
    u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '',
    u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : '',
    u.priority ? `<priority>${u.priority}</priority>` : '',
    altLinks,
    xDefault,
    '</url>',
  ].join('');
}

const SitemapPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { res } = ctx;

  // ✅ DOMAIN request’ten gelsin (localhost ise http zorlar)
  const SITE = getRequestBaseUrl(ctx).replace(/\/+$/, '');

  // ✅ Locales DB-driven
  const apiBase = getApiBaseServer();
  const [appLocalesRaw, defaultLocaleRaw] = await Promise.all([
    fetchJsonSafe<any>(apiBase ? `${apiBase}/site_settings/app-locales` : ''),
    fetchJsonSafe<any>(apiBase ? `${apiBase}/site_settings/default-locale` : ''),
  ]);

  const meta = normalizeAppLocalesValue(appLocalesRaw);
  const activeLocales = computeActiveLocales(meta.length ? meta : null);

  const fromDefaultEndpoint = normalizeDefaultLocaleValue(defaultLocaleRaw);
  const defaultLocale =
    fromDefaultEndpoint || activeLocales[0] || normLocaleShort(FALLBACK_LOCALE, 'de') || 'de';

  // hreflang map helper (SITE closure)
  function langAlt(basePath: string) {
    const map: Record<string, string> = {};
    for (const l of activeLocales) {
      const locPath = localizedPath(basePath, l, defaultLocale);
      map[l] = joinUrl(SITE, locPath);
    }
    map['x-default'] = joinUrl(SITE, localizedPath(basePath, defaultLocale, defaultLocale));
    return map;
  }

  const entries: UrlEntry[] = [];

  // ✅ canonical locale: default locale
  function canonicalLoc(basePath: string): string {
    return joinUrl(SITE, localizedPath(basePath, defaultLocale, defaultLocale));
  }

  // 1) Home (tek url + alternates)
  entries.push({
    loc: canonicalLoc('/'),
    changefreq: 'daily',
    priority: '1.0',
    alternates: langAlt('/'),
  });

  // 2) Static section list pages (tek url + alternates)
  const staticSections = [
    'about',
    'appointment',
    'services',
    'blog',
  ];
  for (const seg of staticSections) {
    const p = `/${seg}`;
    entries.push({
      loc: canonicalLoc(p),
      changefreq: seg === 'news' ? 'daily' : 'weekly',
      priority: seg === 'contact' ? '0.5' : '0.8',
      alternates: langAlt(p),
    });
  }

  // 3) Detail pages (API)
  if (apiBase) {
    const lists = await Promise.all(
      MODULES.map(async (m) => {
        try {
          const data = await fetchList(apiBase, m.api);
          return { mod: m, data };
        } catch {
          return { mod: m, data: [] as any[] };
        }
      }),
    );

    for (const { mod, data } of lists) {
      for (const rec of data) {
        // Her kaydın locale bazlı slug’ı olabilir.
        // Canonical olarak default locale slug’ını baz alıyoruz.
        const canonicalSlug = pickSlug(rec, defaultLocale, defaultLocale);
        if (!canonicalSlug) continue;

        const basePath = `/${mod.path}/${encodeURIComponent(canonicalSlug)}`;

        const alt: Record<string, string> = {};
        for (const l of activeLocales) {
          const slug = pickSlug(rec, l, defaultLocale);
          if (!slug) continue;
          const p = `/${mod.path}/${encodeURIComponent(slug)}`;
          alt[l] = joinUrl(SITE, localizedPath(p, l, defaultLocale));
        }
        alt['x-default'] = joinUrl(SITE, localizedPath(basePath, defaultLocale, defaultLocale));

        const last = rec?.updatedAt || rec?.publishedAt || rec?.createdAt || null;

        entries.push({
          loc: canonicalLoc(basePath),
          lastmod: safeIsoDate(last) || undefined,
          changefreq: mod.changefreq || 'weekly',
          priority: (mod.priority ?? 0.7).toFixed(1),
          alternates: alt,
        });
      }
    }
  }

  // ✅ Dedupe (deterministic)
  const seen = new Set<string>();
  const uniqueEntries = entries.filter((e) => {
    const k = e.loc;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // XML oluştur
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">` +
    uniqueEntries.map(buildUrlTag).join('') +
    `</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    `public, max-age=0, s-maxage=${revalidateSeconds}, stale-while-revalidate=86400`,
  );
  res.write(body);
  res.end();

  return { props: {} };
};

export default SitemapPage;
