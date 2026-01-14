// =============================================================
// FILE: src/pages/admin/faqs/[id].tsx
// konigsmassage – FAQ Düzenleme Sayfası (References/SubCategory pattern)
// - locale priority: query.locale > router.locale > DB default
// - uses useAdminLocales()
// =============================================================

'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/router';

import { useGetFaqAdminQuery } from '@/integrations/rtk/hooks';
import { useAdminLocales } from '@/components/common/useAdminLocales';

import FaqsFormPage from '@/components/admin/faqs/FaqsFormPage';
import type { FaqDto } from '@/integrations/types';

function pickFirstString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}

const AdminFaqsEditPage: React.FC = () => {
  const router = useRouter();

  const rawId = router.query.id;

  const id = useMemo(() => {
    if (typeof rawId === 'string') return rawId;
    if (Array.isArray(rawId)) return rawId[0];
    return '';
  }, [rawId]);

  const { defaultLocaleFromDb, coerceLocale, loading: localesLoading } = useAdminLocales();

  // priority: query.locale > router.locale > db default
  const effectiveLocale = useMemo(() => {
    const q = pickFirstString(router.query.locale);
    const r = typeof router.locale === 'string' ? router.locale : undefined;
    return coerceLocale(q ?? r, defaultLocaleFromDb);
  }, [router.query.locale, router.locale, coerceLocale, defaultLocaleFromDb]);

  const shouldSkip = !router.isReady || !id || localesLoading || !effectiveLocale;

  const { data, isLoading, isFetching } = useGetFaqAdminQuery(
    { id: String(id), locale: effectiveLocale },
    { skip: shouldSkip },
  );

  const loading = isLoading || isFetching || shouldSkip;

  const handleDone = () => {
    // listeye dönerken seçili dili koru
    const qs = effectiveLocale ? `?locale=${encodeURIComponent(effectiveLocale)}` : '';
    router.push(`/admin/faqs${qs}`);
  };

  return (
    <FaqsFormPage
      mode="edit"
      initialData={(data as FaqDto) ?? null}
      loading={loading}
      onDone={handleDone}
    />
  );
};

export default AdminFaqsEditPage;
