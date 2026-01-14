// =============================================================
// FILE: src/pages/admin/faqs/index.tsx
// konigsmassage – Admin FAQ Sayfası (Liste + filtreler)
// - Locales: useAdminLocales()
// - locale: "" => all locales
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  useListFaqsAdminQuery,
  useUpdateFaqAdminMutation,
  useDeleteFaqAdminMutation,
} from '@/integrations/rtk/hooks';

import { useAdminLocales } from '@/components/common/useAdminLocales';

import type { FaqDto, FaqListQueryParams } from '@/integrations/types';

import {
  FaqsHeader,
  type LocaleOption,
  type FaqOrderField,
} from '@/components/admin/faqs/FaqsHeader';
import { FaqsList } from '@/components/admin/faqs/FaqsList';

/* Param type'ı locale ile genişletiyoruz (BE için ekstra param sorun değil) */
type FaqListQueryWithLocale = FaqListQueryParams & {
  locale?: string;
};

const FaqsAdminPage: React.FC = () => {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const [orderBy, setOrderBy] = useState<FaqOrderField>('display_order');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');

  // "" => all locales
  const [locale, setLocale] = useState<string>('');

  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const baseLocales: LocaleOption[] = useMemo(() => {
    const arr = adminLocaleOptions ?? [];
    return arr.map((x) => ({
      value: String(x.value).toLowerCase(),
      label: x.label,
    }));
  }, [adminLocaleOptions]);

  // Header kendi içinde option ekliyorsa da, dışarıdan da verebilirsin.
  // Burada UI tutarlılık için "Tüm diller" başa ekliyoruz.
  const localeOptions: LocaleOption[] = useMemo(() => {
    return [{ value: '', label: 'Tüm diller' }, ...baseLocales];
  }, [baseLocales]);

  // locale state’i URL’den initialize et (listeye ?locale= ile gelince)
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.locale;
    const qLocale = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : '';
    const normalized = (qLocale || '').trim().toLowerCase();
    if (!normalized) return;

    // list filtresi all destekli: all değilse coerce
    const coerced = coerceLocale(normalized, defaultLocaleFromDb) || normalized;
    setLocale(String(coerced).toLowerCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Seçili locale, liste dışına çıkarsa normalize et (all'a dön)
  useEffect(() => {
    if (!baseLocales.length) return;
    if (!locale) return;

    const valid = new Set(baseLocales.map((x) => x.value));
    if (!valid.has(locale)) setLocale('');
  }, [baseLocales, locale]);

  const handleLocaleChange = (next: string) => {
    const raw = (next ?? '').trim().toLowerCase();
    if (!raw) {
      setLocale('');
      // URL’den locale’yi kaldır
      const nextQuery = { ...router.query };
      delete (nextQuery as any).locale;
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
      return;
    }

    const coerced = coerceLocale(raw, defaultLocaleFromDb) || raw;
    const nextLocale = String(coerced).toLowerCase();
    setLocale(nextLocale);

    // URL sync: listeye geri dönünce dil hatırlansın
    router.replace(
      { pathname: router.pathname, query: { ...router.query, locale: nextLocale } },
      undefined,
      { shallow: true },
    );
  };

  const listParams = useMemo<FaqListQueryWithLocale>(
    () => ({
      q: search || undefined,
      is_active: showOnlyActive ? '1' : undefined,
      sort: orderBy,
      orderDir,
      limit: 200,
      offset: 0,
      locale: locale || undefined, // "" => all
    }),
    [search, showOnlyActive, orderBy, orderDir, locale],
  );

  const { data: listData, isLoading, isFetching, refetch } = useListFaqsAdminQuery(listParams);

  const [rows, setRows] = useState<FaqDto[]>([]);
  useEffect(() => {
    setRows(listData ?? []);
  }, [listData]);

  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqAdminMutation();
  const [deleteFaq, { isLoading: isDeleting }] = useDeleteFaqAdminMutation();

  const loading = isLoading || isFetching;
  const busy = loading || isUpdating || isDeleting;

  const handleCreateClick = () => {
    // listte seçili dil varsa new sayfasına taşı
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : '';
    router.push(`/admin/faqs/new${qs}`);
  };

  const handleEditRow = (item: FaqDto) => {
    // listte seçili dil varsa edit sayfasına da taşı
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : '';
    router.push(`/admin/faqs/${encodeURIComponent(String(item.id))}${qs}`);
  };

  const handleDelete = async (item: FaqDto) => {
    const label = item.question || item.slug || item.id;

    if (!window.confirm(`"${label}" kayıtlı içeriği silmek üzeresin. Devam etmek istiyor musun?`)) {
      return;
    }

    try {
      await deleteFaq(item.id).unwrap();
      toast.success(`"${label}" silindi.`);
      await refetch();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Kayıt silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleToggleActive = async (item: FaqDto, value: boolean) => {
    try {
      await updateFaq({
        id: item.id,
        patch: { is_active: value ? '1' : '0' },
      }).unwrap();

      setRows((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, is_active: value ? 1 : 0 } : r)),
      );
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.message ||
        'Aktiflik durumu güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  return (
    <div className="container-fluid py-4">
      <FaqsHeader
        search={search}
        onSearchChange={setSearch}
        locale={locale}
        onLocaleChange={handleLocaleChange}
        locales={localeOptions}
        localesLoading={localesLoading}
        showOnlyActive={showOnlyActive}
        onShowOnlyActiveChange={setShowOnlyActive}
        orderBy={orderBy}
        orderDir={orderDir}
        onOrderByChange={setOrderBy}
        onOrderDirChange={setOrderDir}
        loading={busy}
        onRefresh={refetch}
        onCreateClick={handleCreateClick}
      />

      <div className="row">
        <div className="col-12">
          <FaqsList
            items={rows}
            loading={busy}
            onEdit={handleEditRow}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        </div>
      </div>
    </div>
  );
};

export default FaqsAdminPage;
