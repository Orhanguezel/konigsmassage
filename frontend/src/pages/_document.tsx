// src/pages/_document.tsx
import Document, { Html, Head, Main, NextScript, type DocumentContext } from 'next/document';
import { FALLBACK_LOCALE } from '@/i18n/config';

/* -------------------- URL helpers -------------------- */

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

function firstHeader(v: unknown): string {
  return String(v || '')
    .split(',')[0]
    .trim();
}

function pickFirstNonEmpty(...vals: Array<unknown>): string {
  for (const v of vals) {
    const s = String(v || '').trim();
    if (s) return s;
  }
  return '';
}

function getHeader(ctx: DocumentContext, name: string): string {
  const req = ctx.req;
  if (!req?.headers) return '';
  const v = (req.headers as any)[name.toLowerCase()] ?? (req.headers as any)[name];
  return firstHeader(v);
}

/**
 * ✅ Canonical origin resolver (proxy + Cloudflare safe)
 * Öncelik:
 *  1) NEXT_PUBLIC_SITE_URL / SITE_URL (deterministik)
 *  2) x-forwarded-proto + x-forwarded-host
 *  3) cf-visitor scheme + host
 *  4) host + https fallback
 */
function getReqOrigin(ctx: DocumentContext): string {
  const forced = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
  if (forced) return normalizeLocalhostOrigin(stripTrailingSlash(forced));

  const xfProto = getHeader(ctx, 'x-forwarded-proto');
  const xfHost = getHeader(ctx, 'x-forwarded-host');
  const host = xfHost || getHeader(ctx, 'host');

  const cfVisitor = getHeader(ctx, 'cf-visitor');
  const cfScheme =
    cfVisitor && cfVisitor.includes('"scheme"')
      ? String(cfVisitor).match(/"scheme"\s*:\s*"([^"]+)"/i)?.[1] || ''
      : '';

  const xfSsl = getHeader(ctx, 'x-forwarded-ssl');

  const isLocal =
    (host || '').toLowerCase().startsWith('localhost') ||
    (host || '').toLowerCase().startsWith('127.0.0.1');

  const proto = isLocal
    ? 'http'
    : (xfProto || cfScheme || (xfSsl === 'on' ? 'https' : '') || 'https').trim();

  const origin = host ? `${proto}://${host}` : 'http://localhost';
  return normalizeLocalhostOrigin(origin);
}

/**
 * ✅ REWRITE/PROXY SAFE: public/original request URL (path+query)
 * - Prefer x-original-uri / x-forwarded-uri etc.
 * - Fallback to req.url
 * - If a full URL is provided, reduce to pathname+search
 *
 * IMPORTANT:
 * - x-matched-path KULLANILMAZ (route pattern / template dönebilir)
 */
function getPublicReqUrl(ctx: DocumentContext): string {
  const req = ctx.req;

  const cand = pickFirstNonEmpty(
    getHeader(ctx, 'x-original-uri'),
    getHeader(ctx, 'x-original-url'),
    getHeader(ctx, 'x-forwarded-uri'),
    getHeader(ctx, 'x-rewrite-url'),
    req?.url,
    '/',
  );

  const raw = String(cand || '/').trim();

  // Some proxies send absolute URL
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      return `${u.pathname}${u.search}`;
    }
  } catch {
    // ignore
  }

  // ensure it starts with /
  if (raw.startsWith('/')) return raw;
  return `/${raw}`;
}

function splitUrl(u: string): { pathname: string; search: string } {
  const raw = String(u || '/');
  const [noHash] = raw.split('#');
  const idx = noHash.indexOf('?');
  if (idx >= 0) return { pathname: noHash.slice(0, idx) || '/', search: noHash.slice(idx) || '' };
  return { pathname: raw || '/', search: '' };
}

function normPathname(p?: string): string {
  let x = String(p || '/').trim();
  if (!x.startsWith('/')) x = `/${x}`;
  if (x !== '/' && x.endsWith('/')) x = x.slice(0, -1);
  return x || '/';
}

function normLocaleShort(x: any, fallback: string): string {
  const v = String(x || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  const short = (v.split('-')[0] || '').trim();
  const fb = String(fallback || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0];
  return (short || fb || '').slice(0, 2);
}

function readLcFromSearch(search: string): string {
  const s = String(search || '');
  if (!s || s === '?') return '';
  try {
    const usp = new URLSearchParams(s.startsWith('?') ? s.slice(1) : s);
    return normLocaleShort(usp.get('__lc'), '');
  } catch {
    return '';
  }
}

/** "/en" veya "/en/..." => "en" */
function readLocaleFromPathPrefix(pathname: string): string {
  const p = normPathname(pathname);
  const m = p.match(/^\/([a-zA-Z]{2})(\/|$)/);
  return normLocaleShort(m?.[1], '');
}

/**
 * Strict locale strip:
 * - Prefix bir locale ise ve activeSet içindeyse strip eder.
 * - Değilse dokunmaz (örn: /api, /wp, /xx olmayan prefixler)
 */
function stripLocalePrefixStrict(pathname: string, activeSet: Set<string>): string {
  const p = normPathname(pathname);
  const m = p.match(/^\/([a-zA-Z]{2})(\/|$)/);
  if (!m) return p;

  const cand = normLocaleShort(m?.[1], '');
  if (!cand) return p;

  if (activeSet.size > 0 && !activeSet.has(cand)) return p;

  const rest = p.slice(cand.length + 1); // "/en" => "" , "/en/x" => "/x"
  return normPathname(rest || '/');
}

function ensureLocalePrefix(pathname: string, localeShort: string): string {
  const loc = normLocaleShort(localeShort, '');
  const p = normPathname(pathname);
  if (!loc) return p;
  if (p === '/') return `/${loc}`;
  if (p === `/${loc}`) return p;
  if (p.startsWith(`/${loc}/`)) return p;
  return `/${loc}${p}`;
}

function abs(origin: string, path: string): string {
  const o = stripTrailingSlash(origin);
  const p = normPathname(path);
  return `${o}${p}`;
}

/* -------------------- DB-driven locale fetch (server) -------------------- */

type AppLocaleMeta = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

function getApiBaseServer(): string {
  const raw =
    (process.env.API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_URL || '').trim();

  const base = stripTrailingSlash(raw);
  if (base && !/\/api$/i.test(base)) return `${base}/api`;
  return base;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T | null> {
  if (!url) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: ctrl.signal,
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
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

let __docLocaleCache: null | {
  at: number;
  defaultLocale: string;
  activeLocales: string[];
} = null;

const DOC_CACHE_TTL_MS = 60_000;
const DOC_FETCH_TIMEOUT_MS = 1200;

async function resolveLocalesFromDb(): Promise<{ defaultLocale: string; activeLocales: string[] }> {
  if (__docLocaleCache && Date.now() - __docLocaleCache.at < DOC_CACHE_TTL_MS) {
    return {
      defaultLocale: __docLocaleCache.defaultLocale,
      activeLocales: __docLocaleCache.activeLocales,
    };
  }

  const base = getApiBaseServer();
  if (!base) {
    const fb = normLocaleShort(FALLBACK_LOCALE, 'de') || 'de';
    const out = { defaultLocale: fb, activeLocales: [fb] };
    __docLocaleCache = { at: Date.now(), ...out };
    return out;
  }

  const [appLocalesRaw, defaultLocaleRaw] = await Promise.all([
    fetchJsonWithTimeout<any>(`${base}/site_settings/app-locales`, DOC_FETCH_TIMEOUT_MS),
    fetchJsonWithTimeout<any>(`${base}/site_settings/default-locale`, DOC_FETCH_TIMEOUT_MS),
  ]);

  const appArr = normalizeAppLocalesValue(appLocalesRaw);
  const activeLocales = computeActiveLocales(appArr.length ? appArr : null);

  const fromDefaultEndpoint = normalizeDefaultLocaleValue(defaultLocaleRaw);
  const defaultLocale =
    fromDefaultEndpoint || activeLocales[0] || normLocaleShort(FALLBACK_LOCALE, 'de') || 'de';

  const out = { defaultLocale, activeLocales };
  __docLocaleCache = { at: Date.now(), ...out };
  return out;
}

/* -------------------- hreflang builder -------------------- */

const DEFAULT_LOCALE_PREFIXLESS = true;

function localizedPathFor(basePath: string, targetLocale: string, defaultLocale: string): string {
  const p = normPathname(basePath);
  const loc = normLocaleShort(targetLocale, '');
  const def = normLocaleShort(defaultLocale, '');
  if (!loc) return p;

  if (DEFAULT_LOCALE_PREFIXLESS && loc === def) return p;
  if (p === '/') return `/${loc}`;
  return `/${loc}${p}`;
}

/* -------------------- Document -------------------- */

type HreflangLink = { hrefLang: string; href: string };

export default class MyDocument extends Document<{
  canonicalAbs?: string;
  htmlLang?: string;
  hreflangLinks?: HreflangLink[];

  // debug
  debugLocale?: string;
  debugReqUrl?: string;
  debugDefaultLocale?: string;
  debugActiveLocales?: string;
}> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);

    const origin = getReqOrigin(ctx);

    // ✅ public/original URL (rewrite/proxy safe)
    const reqUrl = getPublicReqUrl(ctx);
    const { pathname: rawPathname, search } = splitUrl(reqUrl);
    const pathname = normPathname(rawPathname);

    const { defaultLocale: dbDefault, activeLocales: dbActives } = await resolveLocalesFromDb();
    const dbDefaultShort = normLocaleShort(
      dbDefault,
      normLocaleShort(FALLBACK_LOCALE, 'de') || 'de',
    );

    const activeLocalesShort = Array.from(
      new Set((dbActives || []).map((x) => normLocaleShort(x, '')).filter(Boolean)),
    );
    const activeSet = new Set(activeLocalesShort);

    // ✅ effective locale priority
    const lcFromQuery = readLcFromSearch(search);
    const lcFromCtx = normLocaleShort((ctx as any).locale, '');
    const lcFromPath = readLocaleFromPathPrefix(pathname);

    const effectiveLocale = normLocaleShort(
      lcFromQuery || lcFromCtx || lcFromPath || dbDefaultShort || FALLBACK_LOCALE,
      dbDefaultShort || normLocaleShort(FALLBACK_LOCALE, 'de') || 'de',
    );

    const safeLocale =
      activeSet.size > 0 && activeSet.has(effectiveLocale) ? effectiveLocale : dbDefaultShort;

    // basePath: locale prefix strip (strict; only known active locales)
    const basePath = stripLocalePrefixStrict(pathname, activeSet);

    // canonicalPath: default prefixless policy
    const canonicalPath =
      DEFAULT_LOCALE_PREFIXLESS && safeLocale === dbDefaultShort
        ? basePath
        : ensureLocalePrefix(basePath, safeLocale);

    const canonicalAbs = normalizeLocalhostOrigin(abs(origin, canonicalPath));

    // hreflang
    const hreflangLinks: HreflangLink[] = [];
    const activesOrdered = activeLocalesShort.length
      ? activeLocalesShort
      : [dbDefaultShort || normLocaleShort(FALLBACK_LOCALE, 'de') || 'de'];

    // default locale listede yoksa ekle
    const activesFinal = Array.from(new Set([dbDefaultShort, ...activesOrdered].filter(Boolean)));

    for (const l of activesFinal) {
      if (activeSet.size > 0 && !activeSet.has(l) && l !== dbDefaultShort) continue;
      const href = normalizeLocalhostOrigin(
        abs(origin, localizedPathFor(basePath, l, dbDefaultShort)),
      );
      hreflangLinks.push({ hrefLang: l, href });
    }

    hreflangLinks.push({
      hrefLang: 'x-default',
      href: normalizeLocalhostOrigin(
        abs(origin, localizedPathFor(basePath, dbDefaultShort, dbDefaultShort)),
      ),
    });

    // uniq
    const seen = new Set<string>();
    const hreflangLinksUniq = hreflangLinks.filter((x) => {
      const k = `${x.hrefLang}|${x.href}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return {
      ...initialProps,
      canonicalAbs,
      htmlLang: safeLocale || dbDefaultShort || FALLBACK_LOCALE,
      hreflangLinks: hreflangLinksUniq,

      // debug
      debugLocale: safeLocale,
      debugReqUrl: reqUrl,
      debugDefaultLocale: dbDefaultShort,
      debugActiveLocales: Array.from(activeSet).join(','),
    };
  }

  render() {
    const { canonicalAbs, htmlLang, hreflangLinks } = this.props as any;

    return (
      <Html lang={htmlLang || FALLBACK_LOCALE}>
        <Head>
          <link rel="preconnect" href="https://res.cloudinary.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

          {canonicalAbs ? <link rel="canonical" href={canonicalAbs} /> : null}
          {canonicalAbs ? <meta property="og:url" content={canonicalAbs} /> : null}

          {Array.isArray(hreflangLinks) && hreflangLinks.length
            ? hreflangLinks.map((x: HreflangLink) => (
                <link
                  key={`alt:${x.hrefLang}:${x.href}`}
                  rel="alternate"
                  hrefLang={x.hrefLang}
                  href={x.href}
                />
              ))
            : null}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
