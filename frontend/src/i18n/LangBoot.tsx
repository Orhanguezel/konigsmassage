// =============================================================
// FILE: src/i18n/LangBoot.tsx  (DYNAMIC via META endpoints)
// =============================================================
'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import HtmlLangSync from './HtmlLangSync';
import { KNOWN_RTL } from './config';
import { FALLBACK_LOCALE } from '@/i18n/config';
import { normLocaleTag, normalizeLocales, resolveDefaultLocale } from '@/i18n/localeUtils';
import {
  useGetAppLocalesPublicQuery,
  useGetDefaultLocalePublicQuery,
} from '@/integrations/rtk/hooks';

function readLocaleFromPath(asPath?: string | null): string {
  const p = String(asPath || '/').trim();
  const seg = p.replace(/^\/+/, '').split('/')[0] || '';
  return normLocaleTag(seg);
}

export default function LangBoot() {
  const pathname = usePathname();

  const { data: appLocalesMeta } = useGetAppLocalesPublicQuery();
  const { data: defaultLocaleMeta } = useGetDefaultLocalePublicQuery();

  const activeLocales = useMemo(
    () => {
      const fb = normLocaleTag(FALLBACK_LOCALE) || 'de';
      const arr = normalizeLocales(appLocalesMeta as any);
      return arr.length ? arr : [fb];
    },
    [appLocalesMeta],
  );

  const runtimeDefault = useMemo(() => {
    const fb = normLocaleTag(FALLBACK_LOCALE) || 'de';
    const resolved = resolveDefaultLocale(defaultLocaleMeta as any, appLocalesMeta as any);
    return normLocaleTag(resolved) || normLocaleTag(activeLocales[0]) || fb;
  }, [defaultLocaleMeta, appLocalesMeta, activeLocales]);

  const resolved = useMemo(() => {
    const fromPath = readLocaleFromPath(pathname);
    const activeSet = new Set(activeLocales.map(normLocaleTag));

    // ✅ active değilse path’i asla lang diye basma
    const lang = fromPath && activeSet.has(fromPath) ? fromPath : runtimeDefault;
    const dir = KNOWN_RTL.has(lang) ? 'rtl' : 'ltr';

    return { lang, dir };
  }, [pathname, activeLocales, runtimeDefault]);

  return <HtmlLangSync lang={resolved.lang} dir={resolved.dir as 'ltr' | 'rtl'} />;
}
