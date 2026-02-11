// =============================================================
// FILE: src/i18n/activeLocales.ts
// (DYNAMIC LOCALES) - FIXED (/api tolerant + stable normalization)
// =============================================================

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FALLBACK_LOCALE } from '@/i18n/config';
import { normLocaleTag, normalizeLocales } from '@/i18n/localeUtils';
import { fetchJsonNoStore, getPublicApiBase, unwrapMaybeData } from '@/i18n/publicMetaApi';

type AppLocaleMeta = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

function computeLocales(meta: AppLocaleMeta[] | null | undefined): string[] {
  const fb = normLocaleTag(FALLBACK_LOCALE) || 'de';
  const normalized = normalizeLocales(meta);
  return normalized.length ? normalized : [fb];
}

// ✅ Minimal in-memory cache (page lifetime)
let __cache: { at: number; meta: AppLocaleMeta[] | null } | null = null;
const CACHE_TTL_MS = 60_000;

export function useActiveLocales() {
  const [meta, setMeta] = useState<AppLocaleMeta[] | null>(() => {
    if (__cache && Date.now() - __cache.at < CACHE_TTL_MS) return __cache.meta;
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    // cache validse fetch yok
    if (__cache && Date.now() - __cache.at < CACHE_TTL_MS) {
      setMeta(__cache.meta);
      return;
    }

    const base = getPublicApiBase();
    if (!base) {
      __cache = { at: Date.now(), meta: null };
      setMeta(null);
      return;
    }

    setIsLoading(true);

    (async () => {
      // ✅ Varsayım: GET {API_BASE}/site_settings/app-locales
      // API_BASE burada .../api ile biter.
      const raw = await fetchJsonNoStore<any>(`${base}/site_settings/app-locales`);
      const unwrapped = unwrapMaybeData<any>(raw);
      const arr = Array.isArray(unwrapped) ? (unwrapped as AppLocaleMeta[]) : [];

      const next = arr.length ? arr : null;
      __cache = { at: Date.now(), meta: next };

      setMeta(next);
      setIsLoading(false);
    })();
  }, []);

  const locales = useMemo<string[]>(() => computeLocales(meta), [meta]);

  return { locales, isLoading };
}
