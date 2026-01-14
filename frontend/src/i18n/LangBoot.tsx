// =============================================================
// FILE: src/i18n/LangBoot.tsx  (DYNAMIC via META endpoints)
// =============================================================
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/router';

import HtmlLangSync from './HtmlLangSync';
import { KNOWN_RTL } from './config';
import { FALLBACK_LOCALE } from '@/i18n/config';
import { normLocaleTag } from '@/i18n/localeUtils';
import {
  useGetAppLocalesPublicQuery,
  useGetDefaultLocalePublicQuery,
} from '@/integrations/rtk/hooks';

function readLocaleFromPath(asPath?: string): string {
  const p = String(asPath || '/').trim();
  const seg = p.replace(/^\/+/, '').split('/')[0] || '';
  return normLocaleTag(seg);
}

function computeActiveLocales(meta: any[] | undefined): string[] {
  const arr = Array.isArray(meta) ? meta : [];

  const active = arr
    .filter((x) => x && x.is_active !== false)
    .map((x) => normLocaleTag(x.code))
    .filter(Boolean) as string[];

  const uniq = Array.from(new Set(active));

  const def = arr.find((x) => x?.is_default === true && x?.is_active !== false);
  const defCode = def ? normLocaleTag(def.code) : '';
  const out = defCode ? [defCode, ...uniq.filter((x) => x !== defCode)] : uniq;

  return out.length ? out : [normLocaleTag(FALLBACK_LOCALE) || 'de'];
}

export default function LangBoot() {
  const router = useRouter();

  const { data: appLocalesMeta } = useGetAppLocalesPublicQuery();
  const { data: defaultLocaleMeta } = useGetDefaultLocalePublicQuery();

  const activeLocales = useMemo(
    () => computeActiveLocales(appLocalesMeta as any),
    [appLocalesMeta],
  );

  const runtimeDefault = useMemo(() => {
    const activeSet = new Set(activeLocales.map(normLocaleTag));

    const cand = normLocaleTag(defaultLocaleMeta);
    if (cand && activeSet.has(cand)) return cand;

    const first = normLocaleTag(activeLocales[0]);
    if (first) return first;

    return normLocaleTag(FALLBACK_LOCALE) || 'de';
  }, [defaultLocaleMeta, activeLocales]);

  const resolved = useMemo(() => {
    const fromPath = readLocaleFromPath(router.asPath);
    const activeSet = new Set(activeLocales.map(normLocaleTag));

    // ✅ active değilse path’i asla lang diye basma
    const lang = fromPath && activeSet.has(fromPath) ? fromPath : runtimeDefault;
    const dir = KNOWN_RTL.has(lang) ? 'rtl' : 'ltr';

    return { lang, dir };
  }, [router.asPath, activeLocales, runtimeDefault]);

  return <HtmlLangSync lang={resolved.lang} dir={resolved.dir as 'ltr' | 'rtl'} />;
}
