// =============================================================
// FILE: src/i18n/activeLocales.ts
// (DYNAMIC LOCALES) - Uses RTK Query for deduplication
// =============================================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { FALLBACK_LOCALE } from '@/i18n/config';
import { normLocaleTag, normalizeLocales } from '@/i18n/localeUtils';
import { useGetAppLocalesPublicQuery } from '@/integrations/rtk/hooks';

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

export function useActiveLocales() {
  const { data: appLocalesData, isLoading } = useGetAppLocalesPublicQuery();

  // Hydration koruması: ilk client render'ı server ile eşleşmeli.
  // RTK Query server'da veri döndüremez ama client'ta hızlıca çözümler,
  // bu da <option> listesinde mismatch yaratır.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const locales = useMemo<string[]>(() => {
    if (!mounted || !appLocalesData || !Array.isArray(appLocalesData)) {
      return computeLocales(null);
    }
    return computeLocales(appLocalesData as AppLocaleMeta[]);
  }, [appLocalesData, mounted]);

  return { locales, isLoading: isLoading || !mounted };
}
