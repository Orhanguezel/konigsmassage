// =============================================================
// FILE: src/i18n/locale.ts  (DYNAMIC via META endpoints) - PROVIDER SAFE
// FIX: avoid "useInsertionEffect must not schedule updates"
//      by using useSyncExternalStore instead of setState in location listeners
// FIX: Replace per-component raw fetch() with RTK Query hooks to
//      deduplicate app-locales / default-locale across all components.
//      Previously each component instance fired 2 separate fetch() calls,
//      causing 20+ duplicate requests → 429 rate-limit errors.
// =============================================================
'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { FALLBACK_LOCALE } from '@/i18n/config';
import { normLocaleTag, normalizeLocales, resolveDefaultLocale } from '@/i18n/localeUtils';
import { ensureLocationEventsPatched } from '@/i18n/locationEvents';
import {
  useGetAppLocalesPublicQuery,
  useGetDefaultLocalePublicQuery,
} from '@/integrations/rtk/hooks';

type AppLocaleMeta = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

function readLocaleFromPath(pathname: string): string {
  const p = String(pathname || '/').trim();
  const seg = p.replace(/^\/+/, '').split('/')[0] || '';
  return normLocaleTag(seg);
}

function readLocaleFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return m ? normLocaleTag(decodeURIComponent(m[1])) : '';
}

function readLocaleFromQuery(): string {
  if (typeof window === 'undefined') return '';
  try {
    const usp = new URLSearchParams(window.location.search || '');
    return normLocaleTag(usp.get('__lc'));
  } catch {
    return '';
  }
}

function computeActiveLocales(meta: any[] | undefined): string[] {
  const fb = normLocaleTag(FALLBACK_LOCALE) || 'de';
  const normalized = normalizeLocales(meta);
  return normalized.length ? normalized : [fb];
}

/** External store snapshot (pathname) */
function getPathnameSnapshot(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

/** Subscribe to navigation-ish changes without calling setState ourselves */
function subscribePathname(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // Patch pushState/replaceState to emit 'locationchange'
  ensureLocationEventsPatched();

  window.addEventListener('locationchange', onStoreChange);
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener('hashchange', onStoreChange);

  return () => {
    window.removeEventListener('locationchange', onStoreChange);
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener('hashchange', onStoreChange);
  };
}

export function useResolvedLocale(explicitLocale?: string | null): string {
  // ✅ No setState in listeners -> no "useInsertionEffect must not schedule updates"
  const pathname = useSyncExternalStore(subscribePathname, getPathnameSnapshot, () => '/');

  // ✅ RTK Query: tüm component'ler aynı cache'i paylaşır, duplicate istek yok
  const { data: appLocalesData } = useGetAppLocalesPublicQuery();
  const { data: defaultLocaleData } = useGetDefaultLocalePublicQuery();

  const appLocalesMeta = useMemo<AppLocaleMeta[] | null>(() => {
    if (!appLocalesData || !Array.isArray(appLocalesData)) return null;
    return appLocalesData.length ? (appLocalesData as AppLocaleMeta[]) : null;
  }, [appLocalesData]);

  const defaultLocaleMeta = useMemo<string | null>(() => {
    if (defaultLocaleData == null) return null;
    if (typeof defaultLocaleData === 'string') return normLocaleTag(defaultLocaleData) || null;
    return null;
  }, [defaultLocaleData]);

  return useMemo(() => {
    // pathname dependency is needed to re-evaluate query/cookie rules on navigation
    void pathname;

    const activeLocales = computeActiveLocales((appLocalesMeta || []) as any);
    const activeSet = new Set(activeLocales.map(normLocaleTag));

    // 0) PATH PREFIX (source of truth in /[locale]/... routing)
    const fromPath = readLocaleFromPath(pathname);
    if (fromPath && activeSet.has(fromPath)) return fromPath;

    // 1) __lc query (rewrite source)
    const fromQuery = readLocaleFromQuery();
    if (fromQuery && activeSet.has(fromQuery)) return fromQuery;

    // 2) cookie
    const fromCookie = readLocaleFromCookie();
    if (fromCookie && activeSet.has(fromCookie)) return fromCookie;

    // 3) explicit
    const fromExplicit = normLocaleTag(explicitLocale);
    if (fromExplicit && activeSet.has(fromExplicit)) return fromExplicit;

    // 4) DB default (validated against app_locales)
    const candDefault =
      resolveDefaultLocale(defaultLocaleMeta, appLocalesMeta) || normLocaleTag(defaultLocaleMeta);
    if (candDefault && activeSet.has(normLocaleTag(candDefault))) return normLocaleTag(candDefault);

    // 5) first active
    const firstActive = normLocaleTag(activeLocales[0]);
    if (firstActive) return firstActive;

    // 6) fallback
    return normLocaleTag(FALLBACK_LOCALE) || 'de';
  }, [pathname, explicitLocale, appLocalesMeta, defaultLocaleMeta]);
}
