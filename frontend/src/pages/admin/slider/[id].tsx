// =============================================================
// FILE: src/pages/admin/slider/[id].tsx
// konigsmassage – Slider Düzenleme Sayfası
// =============================================================

'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/router';

import { useGetSliderAdminQuery } from '@/integrations/rtk/hooks';
import { useAdminLocales } from '@/components/common/useAdminLocales';

import SliderFormPage from '@/components/admin/slider/SliderFormPage';
import type { SliderAdminDto } from '@/integrations/types';

const AdminSliderEditPage: React.FC = () => {
  const router = useRouter();
  const rawId = router.query.id;

  const id = useMemo(() => {
    if (typeof rawId === 'string') return rawId;
    if (Array.isArray(rawId)) return rawId[0];
    return '';
  }, [rawId]);

  // ✅ locale source priority: query.locale > router.locale > DB default
  const rawLocaleFromQuery = router.query.locale;
  const rawLocaleFromRouter = router.locale;

  const { coerceLocale, defaultLocaleFromDb, loading: localesLoading } = useAdminLocales();

  const effectiveLocale = useMemo(() => {
    const q =
      typeof rawLocaleFromQuery === 'string'
        ? rawLocaleFromQuery
        : Array.isArray(rawLocaleFromQuery)
        ? rawLocaleFromQuery[0]
        : undefined;

    return coerceLocale(q ?? rawLocaleFromRouter, defaultLocaleFromDb);
  }, [rawLocaleFromQuery, rawLocaleFromRouter, coerceLocale, defaultLocaleFromDb]);

  // locale hazır olmadan veya id yokken query atma
  const shouldSkip = !router.isReady || !id || localesLoading;

  const { data, isLoading, isFetching } = useGetSliderAdminQuery(
    { id, locale: effectiveLocale || undefined },
    { skip: shouldSkip },
  );

  const loading = isLoading || isFetching || shouldSkip;

  const handleDone = () => {
    router.push('/admin/slider');
  };

  return (
    <SliderFormPage
      mode="edit"
      initialData={(data as SliderAdminDto) ?? null}
      loading={loading}
      onDone={handleDone}
    />
  );
};

export default AdminSliderEditPage;
