'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/custompage/admin-custom_pages-client.tsx
// FINAL — Admin Custom Pages List (App Router + _components)
// - UI: CustomPageHeader + CustomPageList
// - Locale URL sync yok (state + API)
// - Module options: unique module_key
// - Reorder: up/down + Save (via CustomPageList)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { resolveAdminApiLocale } from '../../../../../i18n/adminLocale';
import { localeShortClient, localeShortClientOr } from '../../../../../i18n/localeShortClient';

import type { CustomPageDto } from '@/integrations/shared';
import {
  useListCustomPagesAdminQuery,
  useReorderCustomPagesAdminMutation,
} from '@/integrations/hooks';

import type { CustomPageFilters, ModuleOption } from './_components/CustomPageHeader';
import { CustomPageHeader } from './_components/CustomPageHeader';
import { CustomPageList } from './_components/CustomPageList';

type PublishedFilter = 'all' | 'published' | 'draft';

type Filters = {
  search: string;
  moduleKey: string;
  publishedFilter: PublishedFilter;
  locale: string;
};

function labelOfModuleKey(k: string, t: any) {
  const map: Record<string, string> = {
    blog: t('admin.customPage.moduleLabels.blog'),
    news: t('admin.customPage.moduleLabels.news'),
    about: t('admin.customPage.moduleLabels.about'),
    services: t('admin.customPage.moduleLabels.services'),
    products: t('admin.customPage.moduleLabels.products'),
    solutions: t('admin.customPage.moduleLabels.solutions'),
    library: t('admin.customPage.moduleLabels.library'),
    faq: t('admin.customPage.moduleLabels.faq'),
    contact: t('admin.customPage.moduleLabels.contact'),
  };
  return map[k] || k;
}

export default function AdminCustomPagesClient() {
  const t = useAdminT();
  const {
    localeOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
    fetching: localesFetching,
  } = useAdminLocales();

  const apiLocale = React.useMemo(() => {
    return resolveAdminApiLocale(localeOptions as any, defaultLocaleFromDb, 'tr');
  }, [localeOptions, defaultLocaleFromDb]);

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    moduleKey: '',
    publishedFilter: 'all',
    locale: '',
  });

  // initial locale in state (no URL sync)
  React.useEffect(() => {
    if (!localeOptions || localeOptions.length === 0) return;

    setFilters((prev) => {
      if (prev.locale) return prev;
      return { ...prev, locale: localeShortClientOr(apiLocale, 'tr') };
    });
  }, [localeOptions, apiLocale]);

  const effectiveLocale = React.useMemo(() => {
    const f = localeShortClient(filters.locale);
    return f || apiLocale;
  }, [filters.locale, apiLocale]);

  const is_published = React.useMemo(() => {
    if (filters.publishedFilter === 'all') return undefined;
    if (filters.publishedFilter === 'published') return 1;
    return 0;
  }, [filters.publishedFilter]);

  const queryParams = React.useMemo(
    () => ({
      q: filters.search.trim() || undefined,
      module_key: filters.moduleKey.trim() || undefined,
      is_published,
      locale: effectiveLocale || undefined,
      limit: 200,
      offset: 0,
    }),
    [filters.search, filters.moduleKey, is_published, effectiveLocale],
  );

  const pagesQ = useListCustomPagesAdminQuery(
    queryParams as any,
    {
      refetchOnMountOrArgChange: true,
    } as any,
  );

  const items: CustomPageDto[] = React.useMemo(() => {
    return ((pagesQ.data as any)?.items ?? []) as CustomPageDto[];
  }, [pagesQ.data]);

  const total: number = React.useMemo(() => {
    const t = (pagesQ.data as any)?.total;
    return typeof t === 'number' ? t : items.length;
  }, [pagesQ.data, items.length]);

  const [rows, setRows] = React.useState<CustomPageDto[]>([]);
  React.useEffect(() => setRows(items), [items]);

  const moduleOptions: ModuleOption[] = React.useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      const key = String((it as any).module_key ?? '').trim();
      if (key) set.add(key);
    }
    if (filters.moduleKey && !set.has(filters.moduleKey)) set.add(filters.moduleKey);

    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => ({ value: k, label: labelOfModuleKey(k, t) }));
  }, [items, filters.moduleKey, t]);

  const [reorder, reorderState] = useReorderCustomPagesAdminMutation();

  const busy =
    pagesQ.isLoading ||
    pagesQ.isFetching ||
    localesLoading ||
    localesFetching ||
    reorderState.isLoading;

  const headerFilters: CustomPageFilters = React.useMemo(
    () => ({
      search: filters.search,
      moduleKey: filters.moduleKey,
      publishedFilter: filters.publishedFilter,
      locale: filters.locale,
    }),
    [filters],
  );

  const onHeaderFiltersChange = (next: CustomPageFilters) => {
    setFilters((p) => ({
      ...p,
      search: next.search,
      moduleKey: next.moduleKey,
      publishedFilter: next.publishedFilter as any,
      locale: next.locale,
    }));
  };

  function moveRow(from: number, to: number) {
    setRows((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const copy = prev.slice();
      const [x] = copy.splice(from, 1);
      copy.splice(to, 0, x);
      return copy;
    });
  }

  async function onSaveOrder() {
    try {
      const payload = { items: rows.map((p, idx) => ({ id: p.id, display_order: idx })) };
      await reorder(payload as any).unwrap();
      toast.success(t('admin.common.updated', { item: t('admin.customPage.list.saveOrder') }));
      pagesQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Sıralama kaydedilemedi.');
    }
  }

  return (
    <div className="space-y-4">
      <CustomPageHeader
        filters={headerFilters}
        total={total}
        onFiltersChange={onHeaderFiltersChange}
        onRefresh={() => pagesQ.refetch()}
        locales={(localeOptions as any) ?? []}
        localesLoading={localesLoading || localesFetching}
        allowAllOption={false}
        moduleOptions={moduleOptions}
      />

      <CustomPageList
        items={rows}
        loading={busy}
        activeLocale={effectiveLocale}
        // reorder controls (up/down)
        enableMoveControls
        onMoveUp={(index) => moveRow(index, index - 1)}
        onMoveDown={(index) => moveRow(index, index + 1)}
        // save
        onSaveOrder={onSaveOrder}
        savingOrder={reorderState.isLoading}
      />
    </div>
  );
}
