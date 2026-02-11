'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/faqs/admin-faqs-client.tsx
// FINAL — Admin FAQ List (App Router + _components)
// - UI: FaqsHeader + FaqsList
// - Query: q, slug, is_active, sort, orderDir, locale, limit, offset
// - Reorder: local up/down + Save (display_order patch approach placeholder)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { resolveAdminApiLocale } from '../../../../../i18n/adminLocale';
import { localeShortClient, localeShortClientOr } from '../../../../../i18n/localeShortClient';

import type { FaqDto, FaqUpdatePayload } from '@/integrations/shared';
import { useListFaqsAdminQuery, useUpdateFaqAdminMutation } from '@/integrations/hooks';

import type { FaqsFilters } from './_components/FaqsHeader';
import { FaqsHeader } from './_components/FaqsHeader';
import { FaqsList } from './_components/FaqsList';

const normLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

export default function AdminFaqsClient() {
  const {
    localeOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
    fetching: localesFetching,
  } = useAdminLocales();

  const apiLocale = React.useMemo(() => {
    return resolveAdminApiLocale(localeOptions as any, defaultLocaleFromDb, 'tr');
  }, [localeOptions, defaultLocaleFromDb]);

  const [filters, setFilters] = React.useState<FaqsFilters>({
    q: '',
    slug: '',
    isActive: 'all',
    sort: 'updated_at',
    orderDir: 'desc',
    locale: '',
  });

  // initial locale in state
  React.useEffect(() => {
    if (!localeOptions || localeOptions.length === 0) return;
    setFilters((prev) => {
      if (prev.locale) return prev;
      return { ...prev, locale: localeShortClientOr(apiLocale, 'tr') };
    });
  }, [localeOptions, apiLocale]);

  const effectiveLocale = React.useMemo(() => {
    const f = normLocale(filters.locale);
    return f || apiLocale;
  }, [filters.locale, apiLocale]);

  const is_active = React.useMemo(() => {
    if (filters.isActive === 'all') return undefined;
    if (filters.isActive === 'active') return 1;
    return 0;
  }, [filters.isActive]);

  const queryParams = React.useMemo(
    () => ({
      q: filters.q.trim() || undefined,
      slug: filters.slug.trim() || undefined,
      is_active,
      sort: filters.sort,
      orderDir: filters.orderDir,
      locale: effectiveLocale || undefined,
      limit: 200,
      offset: 0,
    }),
    [filters.q, filters.slug, is_active, filters.sort, filters.orderDir, effectiveLocale],
  );

  const listQ = useListFaqsAdminQuery(
    queryParams as any,
    {
      refetchOnMountOrArgChange: true,
    } as any,
  );

  // RTK endpoint transformResponse returns FaqDto[]
  const items: FaqDto[] = React.useMemo(() => {
    const d = listQ.data;
    return Array.isArray(d) ? (d as any) : [];
  }, [listQ.data]);

  const total = items.length;

  // local reorder
  const [rows, setRows] = React.useState<FaqDto[]>([]);
  React.useEffect(() => setRows(items), [items]);

  function moveRow(from: number, to: number) {
    setRows((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const copy = prev.slice();
      const [x] = copy.splice(from, 1);
      copy.splice(to, 0, x);
      return copy;
    });
  }

  // Save order:
  // Backend’de bulk reorder endpoint yoksa en güvenlisi: her item için PATCH display_order göndermek.
  // (RTK'de sadece updateFaqAdmin var => tek tek patch)
  const [updateFaq, updateState] = useUpdateFaqAdminMutation();

  async function onSaveOrder() {
    try {
      // display_order: idx
      for (let i = 0; i < rows.length; i++) {
        const it = rows[i];
        const patch: FaqUpdatePayload = { display_order: i } as any;
        await updateFaq({ id: it.id, patch } as any).unwrap();
      }
      toast.success('Sıralama kaydedildi.');
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Sıralama kaydedilemedi.');
    }
  }

  const busy =
    listQ.isLoading ||
    listQ.isFetching ||
    localesLoading ||
    localesFetching ||
    updateState.isLoading;

  return (
    <div className="space-y-4">
      <FaqsHeader
        filters={filters}
        total={total}
        onFiltersChange={setFilters}
        onRefresh={() => listQ.refetch()}
        locales={(localeOptions as any) ?? []}
        localesLoading={localesLoading || localesFetching}
        allowAllOption={false}
      />

      <FaqsList
        items={rows}
        loading={busy}
        activeLocale={effectiveLocale}
        enableMoveControls
        onMoveUp={(index) => moveRow(index, index - 1)}
        onMoveDown={(index) => moveRow(index, index + 1)}
        onSaveOrder={onSaveOrder}
        savingOrder={updateState.isLoading}
      />
    </div>
  );
}
