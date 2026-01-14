// =============================================================
// FILE: src/pages/admin/custompage/index.tsx
// konigsmassage – Admin Custompage List
// Route: /admin/custompage
//
// ADMIN RULE:
// - ✅ URL locale sync YOK
// - ✅ localizePath YOK
// - ✅ API locale: resolveAdminApiLocale (db default > first > 'tr')
// - ✅ Module dropdown dinamik: listeden unique module_key toplanır
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import { useAdminLocales } from '@/components/common/useAdminLocales';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';

import {
  useListCustomPagesAdminQuery,
  useReorderCustomPagesAdminMutation,
} from '@/integrations/rtk/hooks';

import type { CustomPageDto } from '@/integrations/types';

import {
  CustomPageHeader,
  type CustomPageFilters,
  type ModuleOption,
} from '@/components/admin/custompage/CustomPageHeader';
import { CustomPageList } from '@/components/admin/custompage/CustomPageList';

const AdminCustomPageIndex: NextPage = () => {
  const router = useRouter();

  const {
    localeOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
    fetching: localesFetching,
  } = useAdminLocales();

  // ✅ Admin API locale (URL'e yazılmaz)
  const apiLocale = useMemo(() => {
    return resolveAdminApiLocale(localeOptions as any, defaultLocaleFromDb, 'tr');
  }, [localeOptions, defaultLocaleFromDb]);

  const [filters, setFilters] = useState<CustomPageFilters>({
    search: '',
    moduleKey: '',
    publishedFilter: 'all',
    locale: '',
  });

  // Admin filtre locale initial (sadece UI + API args için; URL sync yok)
  useEffect(() => {
    if (!router.isReady) return;
    if (!localeOptions || localeOptions.length === 0) return;

    setFilters((prev) => {
      if (prev.locale) return prev;
      return { ...prev, locale: localeShortClientOr(apiLocale, 'tr') };
    });
  }, [router.isReady, localeOptions, apiLocale]);

  const is_published = useMemo(() => {
    if (filters.publishedFilter === 'all') return undefined;
    if (filters.publishedFilter === 'published') return 1;
    return 0;
  }, [filters.publishedFilter]);

  // ✅ Locale filtre: boşsa apiLocale kullan
  const effectiveLocale = useMemo(() => {
    const f = localeShortClient(filters.locale);
    return f || apiLocale;
  }, [filters.locale, apiLocale]);

  const queryParams = useMemo(
    () => ({
      q: filters.search || undefined,
      module_key: filters.moduleKey || undefined,
      is_published,
      locale: effectiveLocale || undefined,
      limit: 200,
      offset: 0,
    }),
    [filters.search, filters.moduleKey, is_published, effectiveLocale],
  );

  const { data, isLoading, isFetching, refetch } = useListCustomPagesAdminQuery(
    queryParams as any,
    { refetchOnMountOrArgChange: true } as any,
  );

  const items: CustomPageDto[] = useMemo(() => (data as any)?.items ?? [], [data]);
  const total: number = useMemo(() => (data as any)?.total ?? items.length, [data, items.length]);

  const [rows, setRows] = useState<CustomPageDto[]>([]);
  useEffect(() => setRows(items), [items]);

  // ✅ Module options: response items’dan unique module_key topla
  const moduleOptions: ModuleOption[] = useMemo(() => {
    const set = new Set<string>();

    for (const it of items) {
      const key = String(it.module_key || '').trim();
      if (key) set.add(key);
    }

    if (filters.moduleKey && !set.has(filters.moduleKey)) set.add(filters.moduleKey);

    const keys = Array.from(set).sort((a, b) => a.localeCompare(b));

    const labelOf = (k: string) => {
      const map: Record<string, string> = {
        blog: 'Blog',
        news: 'Haber / Duyuru',
        about: 'Hakkında / Statik',
        services: 'Hizmetler',
        products: 'Ürünler',
        solutions: 'Çözümler',
        library: 'Kütüphane',
        faq: 'SSS',
        contact: 'İletişim',
      };
      return map[k] || k;
    };

    return keys.map((k) => ({ value: k, label: labelOf(k) }));
  }, [items, filters.moduleKey]);

  const [reorder, { isLoading: isReordering }] = useReorderCustomPagesAdminMutation();
  const busy = isLoading || isFetching || localesLoading || localesFetching || isReordering;

  const handleSaveOrder = async () => {
    try {
      const payload = { items: rows.map((p, idx) => ({ id: p.id, display_order: idx })) };
      await reorder(payload as any).unwrap();
      toast.success('Sıralama kaydedildi.');
      await refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message || err?.message || 'Sıralama kaydedilirken hata oluştu.',
      );
    }
  };

  const handleCreate = () => {
    // ✅ URL sabit: /admin/custompage/new
    void router.push('/admin/custompage/new');
  };

  return (
    <div className="container-fluid py-3">
      <div className="mb-3 d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div style={{ minWidth: 0 }}>
          <h4 className="h5 mb-1">Custom Pages</h4>
          <p className="text-muted small mb-0">
            Özel sayfaları listele, filtrele ve sırala. (Admin URL sabittir.)
          </p>
        </div>

        <button type="button" className="btn btn-sm btn-primary" onClick={handleCreate}>
          Yeni Sayfa
        </button>
      </div>

      <CustomPageHeader
        filters={filters}
        total={total}
        onFiltersChange={setFilters}
        onRefresh={refetch}
        locales={localeOptions as any}
        localesLoading={localesLoading || localesFetching}
        allowAllOption={false}
        moduleOptions={moduleOptions}
      />

      <CustomPageList
        items={rows}
        loading={busy}
        onReorder={setRows}
        onSaveOrder={handleSaveOrder}
        savingOrder={isReordering}
        activeLocale={effectiveLocale}
      />
    </div>
  );
};

export default AdminCustomPageIndex;
