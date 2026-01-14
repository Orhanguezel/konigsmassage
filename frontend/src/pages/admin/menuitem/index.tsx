// =============================================================
// FILE: src/pages/admin/menuitem/index.tsx
// konigsmassage – Admin Menu Items List Page (HEADER ONLY)
// Route: /admin/menuitem
// =============================================================

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import { MenuItemHeader, type MenuItemFilters } from '@/components/admin/menuitem/MenuItemHeader';
import { MenuItemList } from '@/components/admin/menuitem/MenuItemList';

import {
  useDeleteMenuItemAdminMutation,
  useListMenuItemsAdminQuery,
  useReorderMenuItemsAdminMutation,
} from '@/integrations/rtk/hooks';

import { useAdminLocales } from '@/components/common/useAdminLocales';

import type { AdminMenuItemDto } from '@/integrations/types';

/* -------------------- helpers -------------------- */

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

/* ============================================================ */
/*  Page                                                        */
/* ============================================================ */

const AdminMenuItemListPage: NextPage = () => {
  const router = useRouter();

  /* -------------------- Locales (dynamic) -------------------- */
  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const localeOptions = useMemo(
    () =>
      (adminLocaleOptions ?? []).map((x) => ({
        value: x.value,
        label: x.label,
      })),
    [adminLocaleOptions],
  );

  const localeLabelMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const x of localeOptions) m[x.value] = x.label;
    return m;
  }, [localeOptions]);

  const defaultLocale = useMemo(() => {
    const fromDb = defaultLocaleFromDb || '';
    if (fromDb) return fromDb;

    const routerLocale = (router.locale as string | undefined) ?? undefined;
    const coerced = coerceLocale(routerLocale, defaultLocaleFromDb);
    return coerced || toShortLocale(routerLocale) || 'de';
  }, [defaultLocaleFromDb, coerceLocale, router.locale]);

  /* -------------------- Filters (HEADER ONLY) -------------------- */
  const [filters, setFilters] = useState<MenuItemFilters>(() => ({
    search: '',
    // ✅ Bu modül sadece HEADER yönetir
    location: 'header',
    active: 'all',
    sort: 'display_order',
    order: 'asc',
    locale: '', // "" => tüm diller
  }));

  // İstersen ilk açılışta defaultLocale'i filtreye bas (şimdilik tüm diller)
  useEffect(() => {
    setFilters((prev) => {
      if (prev.locale) return prev;
      return { ...prev, locale: '' };
    });
  }, [defaultLocale]);

  /* -------------------- Data query -------------------- */
  const listParams = useMemo(() => {
    const p: any = {};

    if (filters.search?.trim()) p.q = filters.search.trim();

    // ✅ HEADER ONLY: paramı daima bas
    p.location = 'header';

    if (filters.active !== 'all') p.active = filters.active === 'active';
    if (filters.sort) p.sort = filters.sort;
    if (filters.order) p.order = filters.order;

    // locale: "" => gönderme; seçilmişse gönder
    const loc = toShortLocale(filters.locale);
    if (loc) p.locale = loc;

    return p;
  }, [filters]);

  const { data: listData, isFetching, refetch } = useListMenuItemsAdminQuery(listParams);

  const items = listData?.items ?? [];
  const total = listData?.total ?? items.length;

  /* -------------------- Mutations -------------------- */
  const [deleteItem, { isLoading: isDeleting }] = useDeleteMenuItemAdminMutation();
  const [reorderItems, { isLoading: isReordering }] = useReorderMenuItemsAdminMutation();

  /* -------------------- Reorder buffer -------------------- */
  const [draftRows, setDraftRows] = useState<AdminMenuItemDto[] | null>(null);

  useEffect(() => {
    setDraftRows(null);
  }, [listData?.items]);

  const rows = draftRows ?? items;
  const savingOrder = isReordering;

  const handleReorder = (next: AdminMenuItemDto[]) => {
    setDraftRows(next);
  };

  const handleSaveOrder = async () => {
    if (!draftRows || draftRows.length === 0) return;

    try {
      const payload = {
        items: draftRows.map((x, idx) => ({
          id: x.id,
          display_order: idx + 1,
        })),
      } as any;

      await reorderItems(payload).unwrap();
      toast.success('Sıralama kaydedildi.');
      setDraftRows(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Sıralama kaydedilemedi.');
    }
  };

  /* -------------------- Actions -------------------- */

  const goToCreate = () => {
    router.push('/admin/menuitem/new');
  };

  const goToEdit = (item: AdminMenuItemDto) => {
    router.push(`/admin/menuitem/${encodeURIComponent(item.id)}`);
  };

  const handleDelete = async (item: AdminMenuItemDto) => {
    const ok = window.confirm(`"${item.title || 'Bu kayıt'}" silinsin mi?`);
    if (!ok) return;

    try {
      await deleteItem({ id: item.id }).unwrap();
      toast.success('Menü öğesi silindi.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silme başarısız.');
    }
  };

  const loading = isFetching || localesLoading || isDeleting;

  /* -------------------- Render -------------------- */

  return (
    <div className="container-fluid py-4">
      <MenuItemHeader
        filters={filters}
        total={total}
        loading={loading}
        locales={localeOptions}
        localesLoading={localesLoading}
        defaultLocale={defaultLocale}
        onFiltersChange={setFilters}
        onRefresh={() => refetch()}
        onCreateClick={goToCreate}
      />

      <MenuItemList
        items={rows}
        loading={loading}
        onEdit={goToEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onSaveOrder={draftRows ? handleSaveOrder : undefined}
        savingOrder={savingOrder}
        localeLabelMap={localeLabelMap}
        dateLocale="tr-TR"
        // ✅ HEADER ONLY: listede location kolonu gösterilmesin
        hideLocationColumn
      />

      {draftRows && (
        <div className="mt-2 small text-muted">
          Sıralama değişti. Kalıcı yapmak için <strong>Sıralamayı Kaydet</strong> butonunu kullan.
        </div>
      )}
    </div>
  );
};

export default AdminMenuItemListPage;
