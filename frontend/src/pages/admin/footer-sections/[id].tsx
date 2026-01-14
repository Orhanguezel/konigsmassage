// =============================================================
// FILE: src/pages/admin/footer-sections/[id].tsx
// konigsmassage – Footer Section Düzenleme Sayfası (MenuItem pattern aligned)
// - locale priority: query.locale > router.locale > DB default
// - uses useAdminLocales()
// - Footer links are handled inside FooterSectionsFormPage
// =============================================================

'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/router';

import { useGetFooterSectionAdminQuery } from '@/integrations/rtk/hooks';
import { useAdminLocales } from '@/components/common/useAdminLocales';

import FooterSectionsFormPage from '@/components/admin/footer-sections/FooterSectionsFormPage';
import type { FooterSectionDto } from '@/integrations/types';

/* -------------------- helpers -------------------- */

function pickFirstString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return '';
}

const toShortLocale = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

/* -------------------- Page -------------------- */

const AdminFooterSectionEditPage: React.FC = () => {
  const router = useRouter();

  const id = useMemo(() => {
    const raw = router.query.id;
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) return raw[0] || '';
    return '';
  }, [router.query.id]);

  const { defaultLocaleFromDb, coerceLocale, loading: localesLoading } = useAdminLocales();

  const effectiveLocale = useMemo(() => {
    const q = pickFirstString(router.query.locale);
    const r = typeof router.locale === 'string' ? router.locale : '';
    const resolved = coerceLocale(q || r, defaultLocaleFromDb) || q || r || defaultLocaleFromDb;
    return toShortLocale(resolved) || 'de';
  }, [router.query.locale, router.locale, coerceLocale, defaultLocaleFromDb]);

  const shouldSkip = !router.isReady || localesLoading || !id || !effectiveLocale;

  const { data, isLoading, isFetching } = useGetFooterSectionAdminQuery(
    { id: String(id), locale: effectiveLocale } as any,
    { skip: shouldSkip } as any,
  );

  const loading = isLoading || isFetching || shouldSkip;

  const handleDone = () => {
    const qs = effectiveLocale ? `?locale=${encodeURIComponent(effectiveLocale)}` : '';
    router.push(`/admin/footer-sections${qs}`);
  };

  return (
    <FooterSectionsFormPage
      mode="edit"
      initialData={(data as FooterSectionDto) ?? null}
      loading={loading}
      onDone={handleDone}
    />
  );
};

export default AdminFooterSectionEditPage;
