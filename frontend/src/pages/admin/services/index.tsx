// =============================================================
// FILE: src/pages/admin/services/index.tsx (FIXED)
// konigsmassage – Admin Hizmetler (Services) Liste + Filtre + Reorder
// Locale source: site_settings.app_locales + default_locale (same as site-settings page)
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  ServicesHeader,
  type ServicesFilterState,
} from '@/components/admin/services/ServicesHeader';
import { ServicesList } from '@/components/admin/services/ServicesList';

import {
  useListServicesAdminQuery,
  useUpdateServiceAdminMutation,
  useDeleteServiceAdminMutation,
  useReorderServicesAdminMutation,
  useListSiteSettingsAdminQuery,
} from '@/integrations/rtk/hooks';

import type { ServiceListAdminQueryParams, ServiceDto } from '@/integrations/types';

import type { AdminLocaleOption } from '@/components/common/AdminLocaleSelect';

/* -------------------- Helpers (same spirit as site-settings page) -------------------- */

type AppLocaleItem = {
  code: string;
  label?: string;
  is_active?: boolean;
  is_default?: boolean;
};

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

function uniqByCode(items: AppLocaleItem[]): AppLocaleItem[] {
  const seen = new Set<string>();
  const out: AppLocaleItem[] = [];
  for (const it of items) {
    const code = toShortLocale(it?.code);
    if (!code) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ ...it, code });
  }
  return out;
}

function buildLocaleLabel(item: AppLocaleItem): string {
  const code = toShortLocale(item.code);
  const label = String(item.label || '').trim();

  // statik map yok: label varsa kullan, yoksa Intl ile üret (yoksa code)
  if (label) return `${label} (${code})`;

  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames([code || 'en'], { type: 'language' });
  } catch {
    dn = null;
  }

  const name = dn?.of(code) ?? '';
  return name ? `${name} (${code})` : `${code.toUpperCase()} (${code})`;
}

function parseAppLocalesValue(raw: unknown): AppLocaleItem[] {
  if (!raw) return [];

  // API value already object/array
  if (Array.isArray(raw)) {
    return raw
      .map((x: any) => ({
        code: toShortLocale(x?.code ?? x),
        label: x?.label,
        is_active: x?.is_active,
        is_default: x?.is_default,
      }))
      .filter((x) => !!x.code);
  }

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return parseAppLocalesValue(parsed);
    } catch {
      return [];
    }
  }

  if (typeof raw === 'object' && raw !== null) {
    // { locales: [...] } gibi varyant
    const anyObj = raw as any;
    if (Array.isArray(anyObj.locales)) return parseAppLocalesValue(anyObj.locales);
  }

  return [];
}

/* -------------------- Page -------------------- */

const AdminServicesPage: NextPage = () => {
  const router = useRouter();

  /* --------- Locales – site_settings(app_locales + default_locale) --------- */

  const {
    data: settingsRows,
    isLoading: isLocalesLoading,
    isFetching: isLocalesFetching,
  } = useListSiteSettingsAdminQuery({
    keys: ['app_locales', 'default_locale'],
  });

  const { localeOptions, defaultLocaleFromDb } = useMemo(() => {
    const rows = settingsRows ?? [];
    const appRow = rows.find((r: any) => r.key === 'app_locales');
    const defRow = rows.find((r: any) => r.key === 'default_locale');

    const itemsRaw = parseAppLocalesValue(appRow?.value);
    const active = itemsRaw.filter((x) => x && x.code && x.is_active !== false);
    const uniq = uniqByCode(active);

    const def = toShortLocale(defRow?.value);

    const options: AdminLocaleOption[] = uniq.map((it) => ({
      value: toShortLocale(it.code),
      label: buildLocaleLabel(it),
    }));

    return { localeOptions: options, defaultLocaleFromDb: def };
  }, [settingsRows]);

  // active locale: URL ?locale > default_locale > first
  const initialLocale = useMemo(() => {
    const q = router.query?.locale;
    const qLocale = typeof q === 'string' ? toShortLocale(q) : '';

    if (qLocale && localeOptions.some((x) => x.value === qLocale)) return qLocale;
    if (defaultLocaleFromDb && localeOptions.some((x) => x.value === defaultLocaleFromDb))
      return defaultLocaleFromDb;

    return localeOptions?.[0]?.value || '';
  }, [router.query?.locale, localeOptions, defaultLocaleFromDb]);

  const [filters, setFilters] = useState<ServicesFilterState>({});

  // İlk load/onarım: locale hazır olunca filters.locale set et
  useEffect(() => {
    if (!router.isReady) return;
    if (!localeOptions.length) return;

    setFilters((prev) => {
      if (prev.locale && localeOptions.some((x) => x.value === prev.locale)) return prev;
      return initialLocale ? { ...prev, locale: initialLocale } : prev;
    });
  }, [router.isReady, localeOptions, initialLocale]);

  // locale değişince URL senkron
  useEffect(() => {
    if (!router.isReady) return;
    if (!filters.locale) return;

    const next = toShortLocale(filters.locale);
    const cur = typeof router.query?.locale === 'string' ? toShortLocale(router.query.locale) : '';

    if (next && next !== cur) {
      void router.replace(
        { pathname: router.pathname, query: { ...router.query, locale: next } },
        undefined,
        { shallow: true },
      );
    }
  }, [filters.locale, router]);

  const effectiveQueryLocale = useMemo(() => {
    const loc = toShortLocale(filters.locale) || '';
    return loc || undefined;
  }, [filters.locale]);

  const queryParams: ServiceListAdminQueryParams = {
    limit: 200,
    offset: 0,
    ...filters,
    ...(effectiveQueryLocale ? { locale: effectiveQueryLocale } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useListServicesAdminQuery(queryParams);

  const [updateService, { isLoading: isUpdating }] = useUpdateServiceAdminMutation();
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceAdminMutation();

  const [reorderServices, { isLoading: isReordering }] = useReorderServicesAdminMutation();

  const items: ServiceDto[] = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? items.length;

  const [rows, setRows] = useState<ServiceDto[]>([]);
  useEffect(() => setRows(items), [items]);

  const loading =
    isLoading ||
    isFetching ||
    isUpdating ||
    isDeleting ||
    isLocalesLoading ||
    isLocalesFetching ||
    isReordering;

  /* -------------------- Handlers -------------------- */

  const handleFiltersChange = (patch: Partial<ServicesFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleCreateNew = () => {
    const loc = toShortLocale(filters.locale) || toShortLocale(initialLocale);
    router.push({
      pathname: '/admin/services/new',
      ...(loc ? { query: { locale: loc } } : {}),
    });
  };

  const handleToggleActive = async (svc: ServiceDto, value: boolean) => {
    try {
      await updateService({ id: svc.id, patch: { is_active: value } }).unwrap();
      toast.success('Durum güncellendi.');
      setRows((prev) => prev.map((r) => (r.id === svc.id ? { ...r, is_active: value } : r)));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Hata.');
    }
  };

  const handleToggleFeatured = async (svc: ServiceDto, value: boolean) => {
    try {
      await updateService({ id: svc.id, patch: { featured: value } }).unwrap();
      toast.success('Öne çıkan durumu güncellendi.');
      setRows((prev) => prev.map((r) => (r.id === svc.id ? { ...r, featured: value } : r)));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Hata.');
    }
  };

  const handleEdit = (svc: ServiceDto) => {
    const loc = toShortLocale(filters.locale) || toShortLocale(initialLocale);
    router.push({
      pathname: `/admin/services/${encodeURIComponent(svc.id)}`,
      ...(loc ? { query: { locale: loc } } : {}),
    });
  };

  const handleDelete = async (svc: ServiceDto) => {
    const ok = window.confirm(`"${svc.name || 'Bu hizmet'}" silinsin mi?`);
    if (!ok) return;

    try {
      await deleteService({ id: svc.id }).unwrap();
      toast.success('Hizmet silindi.');
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silinemedi.');
    }
  };

  const handleReorderLocal = (next: ServiceDto[]) => setRows(next);

  const handleSaveOrder = async () => {
    if (!rows.length) return;
    try {
      await reorderServices({
        items: rows.map((r, i) => ({ id: r.id, display_order: i })),
      }).unwrap();
      toast.success('Sıralama kaydedildi.');
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Sıralama kaydedilemedi.');
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <h4 className="h5 mb-1">Hizmetler Yönetimi</h4>
        <p className="text-muted small mb-0">konigsmassage hizmet kayıtlarını yönet.</p>
      </div>

      <ServicesHeader
        loading={loading}
        total={total}
        filters={filters}
        onChangeFilters={handleFiltersChange}
        onRefresh={refetch}
        onCreateNew={handleCreateNew}
        locales={localeOptions}
        localesLoading={isLocalesLoading || isLocalesFetching}
      />

      <ServicesList
        items={rows}
        loading={loading}
        onToggleActive={handleToggleActive}
        onToggleFeatured={handleToggleFeatured}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorderLocal}
        onSaveOrder={handleSaveOrder}
        savingOrder={isReordering}
      />
    </div>
  );
};

export default AdminServicesPage;
