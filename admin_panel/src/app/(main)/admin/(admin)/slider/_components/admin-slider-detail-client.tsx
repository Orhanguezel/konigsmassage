'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/admin-slider-detail-client.tsx
// FINAL — Services pattern (App Router + RTK)
// - Locale priority: query.locale > DB default > first
// - RTK detail query runs ONLY when: edit + id + locale ready
// - Fix: "Yükleniyor..." stuck because skip was treated as loading
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useGetSliderAdminQuery } from '@/integrations/hooks';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';

import { SliderFormPage } from '@/app/(main)/admin/(admin)/slider/_components/SliderFormPage';
import type { SliderAdminDto } from '@/integrations/shared';

const normLocale = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

type Props = { mode: 'create'; id?: string } | { mode: 'edit'; id: string };

export default function AdminSliderDetailClient(props: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const id = props.mode === 'edit' ? String(props.id || '').trim() : '';

  // query.locale
  const rawLocaleFromQuery = sp.get('locale');

  // locales from DB
  const localesHook: any = useAdminLocales();
  const localesLoading: boolean =
    !!localesHook?.loading || !!localesHook?.isLoading || !!localesHook?.isFetching;

  const defaultLocaleFromDb = normLocale(
    localesHook?.defaultLocaleFromDb ??
      localesHook?.defaultLocale ??
      localesHook?.default_locale ??
      localesHook?.default ??
      '',
  );

  const localeOptions = React.useMemo(() => {
    const raw = Array.isArray(localesHook?.localeOptions)
      ? localesHook.localeOptions
      : Array.isArray(localesHook?.locales)
        ? localesHook.locales
        : Array.isArray(localesHook?.options)
          ? localesHook.options
          : [];

    return raw
      .map((x: any) => ({
        value: normLocale(x?.value ?? x?.code ?? x),
        label: String(x?.label ?? x?.name ?? x?.value ?? x?.code ?? x ?? '').trim(),
      }))
      .filter((x: any) => !!x.value);
  }, [localesHook]);

  // effective locale: query > db default > first
  const effectiveLocale = React.useMemo(() => {
    const q = normLocale(rawLocaleFromQuery || '');
    const set = new Set(localeOptions.map((o: any) => o.value));
    if (q && set.has(q)) return q;
    if (defaultLocaleFromDb && set.has(defaultLocaleFromDb)) return defaultLocaleFromDb;
    return localeOptions?.[0]?.value || '';
  }, [rawLocaleFromQuery, defaultLocaleFromDb, localeOptions]);

  // ✅ Only skip when we truly cannot query.
  const skipDetail = props.mode !== 'edit' || localesLoading || !id || !effectiveLocale;

  // ✅ IMPORTANT: use object arg-shape (matches old pages router code)
  const { data, isLoading, isFetching, isError } = useGetSliderAdminQuery(
    { id, locale: effectiveLocale || undefined } as any,
    { skip: skipDetail } as any,
  );

  // ✅ Fix stuck "loading": skipDetail should NOT be treated as loading forever
  const loading =
    localesLoading || (props.mode === 'edit' && !skipDetail && (isLoading || isFetching));

  const handleDone = () => {
    const loc = effectiveLocale || '';
    const href = loc ? `/admin/slider?locale=${encodeURIComponent(loc)}` : '/admin/slider';
    router.push(href);
  };

  return (
    <SliderFormPage
      mode={props.mode}
      locale={effectiveLocale}
      localeOptions={localeOptions}
      localesLoading={localesLoading}
      initialData={props.mode === 'edit' ? ((data as SliderAdminDto) ?? null) : null}
      loading={loading}
      // opsiyonel: error durumunda formu kilitleme
      // (UI tarafında boş data ile düzenleme yapılabilir; istersen burada toast basarız)
      onDone={handleDone}
    />
  );
}
