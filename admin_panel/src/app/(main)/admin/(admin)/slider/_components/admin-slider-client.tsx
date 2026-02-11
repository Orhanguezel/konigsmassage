'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/admin-slider-client.tsx
// guezelwebdesign – Admin Slider Page (List + filters + reorder) (APP ROUTER)
// - Locale: useAdminLocales
// - URL sync: ?locale=... & ?q=... & ?active=1
// - RTK hooks in client
// =============================================================

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import {
  useListSlidersAdminQuery,
  useUpdateSliderAdminMutation,
  useDeleteSliderAdminMutation,
  useReorderSlidersAdminMutation,
  useSetSliderStatusAdminMutation,
} from '@/integrations/hooks';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import type { SliderAdminDto } from '@/integrations/shared';

// mevcut UI componentlerin
import { SliderHeader } from '@/app/(main)/admin/(admin)/slider/_components/SliderHeader';
import { SliderList } from '@/app/(main)/admin/(admin)/slider/_components/SliderList';

const normLocale = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

function pickFirst(v: string | string[] | null | undefined) {
  if (!v) return undefined;
  if (Array.isArray(v)) return v[0];
  return v;
}

function upsertSearchParams(
  pathname: string,
  params: URLSearchParams,
  patch: Record<string, string | undefined | null>,
) {
  const next = new URLSearchParams(params.toString());
  for (const [k, val] of Object.entries(patch)) {
    if (val === undefined || val === null || String(val).trim() === '') next.delete(k);
    else next.set(k, String(val));
  }
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function AdminSliderClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const t = useAdminT();

  // URL state (single source)
  const qFromUrl = pickFirst(sp.get('q')) ?? '';
  const localeFromUrl = normLocale(pickFirst(sp.get('locale')) ?? '');
  const activeFromUrl = pickFirst(sp.get('active')) ?? '';

  const showOnlyActive = activeFromUrl === '1';

  // Locale options (DB’den)
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
      .filter((x: any) => !!x.value)
      .map((x: any) => ({ value: x.value, label: x.label || x.value.toUpperCase() }));
  }, [localesHook]);

  const effectiveLocale = React.useMemo(() => {
    const list = new Set(localeOptions.map((o: any) => o.value));
    if (localeFromUrl && list.has(localeFromUrl)) return localeFromUrl;
    if (defaultLocaleFromDb && list.has(defaultLocaleFromDb)) return defaultLocaleFromDb;
    return localeOptions?.[0]?.value || '';
  }, [localeFromUrl, defaultLocaleFromDb, localeOptions]);

  // URL repair: locale yoksa yaz
  React.useEffect(() => {
    if (localesLoading) return;
    if (!effectiveLocale) return;

    const cur = normLocale(sp.get('locale') ?? '');
    if (cur === effectiveLocale) return;

    router.replace(upsertSearchParams(pathname, sp, { locale: effectiveLocale }), {
      scroll: false,
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localesLoading, effectiveLocale]);

  /* -------------------- RTK Query -------------------- */

  const {
    data: slidersRaw,
    isLoading,
    isFetching,
    refetch,
  } = useListSlidersAdminQuery(
    {
      q: qFromUrl || undefined,
      locale: effectiveLocale || undefined,
      is_active: showOnlyActive ? true : undefined,
      sort: 'display_order',
      order: 'asc',
      offset: 0,
    } as any,
    { skip: localesLoading || !effectiveLocale } as any,
  );

  const sliders = React.useMemo(
    () => (Array.isArray(slidersRaw) ? slidersRaw : []) as SliderAdminDto[],
    [slidersRaw],
  );

  const [rows, setRows] = React.useState<SliderAdminDto[]>([]);
  React.useEffect(() => setRows(sliders), [sliders]);

  const [updateSlider] = useUpdateSliderAdminMutation();
  const [deleteSlider, { isLoading: isDeleting }] = useDeleteSliderAdminMutation();
  const [reorderSliders, { isLoading: isReordering }] = useReorderSlidersAdminMutation();
  const [setStatus] = useSetSliderStatusAdminMutation();

  const loading = isLoading || isFetching || localesLoading;
  const busy = loading || isDeleting || isReordering;

  /* -------------------- URL handlers -------------------- */

  const setUrl = (patch: Record<string, string | undefined | null>) => {
    router.replace(upsertSearchParams(pathname, sp, patch), { scroll: false } as any);
  };

  const handleSearchChange = (next: string) => setUrl({ q: next || undefined });

  const handleLocaleChange = (next: string) => {
    const nl = normLocale(next);
    setUrl({ locale: nl || undefined });
  };

  const handleShowOnlyActiveChange = (next: boolean) => setUrl({ active: next ? '1' : undefined });

  /* -------------------- Navigation -------------------- */

  const handleCreateClick = () => {
    const loc = effectiveLocale || '';
    const href = loc ? `/admin/slider/new?locale=${encodeURIComponent(loc)}` : '/admin/slider/new';
    router.push(href);
  };

  const handleEdit = (item: SliderAdminDto) => {
    const loc = effectiveLocale || '';
    const href = loc
      ? `/admin/slider/${encodeURIComponent(String(item.id))}?locale=${encodeURIComponent(loc)}`
      : `/admin/slider/${encodeURIComponent(String(item.id))}`;
    router.push(href);
  };

  /* -------------------- Mutations -------------------- */

  const handleDelete = async (item: SliderAdminDto) => {
    if (
      !window.confirm(t('admin.slider.list.deleteConfirm', { name: item.name }))
    )
      return;

    try {
      await deleteSlider(String(item.id) as any).unwrap();
      toast.success(t('admin.slider.list.deleted', { name: item.name }));
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        t('admin.slider.list.deleteError');
      toast.error(msg);
    }
  };

  const handleToggleActive = async (item: SliderAdminDto, value: boolean) => {
    try {
      await setStatus({ id: String(item.id), payload: { is_active: value } } as any).unwrap();
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(item.id) ? { ...r, is_active: value } : r)),
      );
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        t('admin.slider.list.activeUpdateError');
      toast.error(msg);
    }
  };

  const handleToggleFeatured = async (item: SliderAdminDto, value: boolean) => {
    try {
      await updateSlider({ id: String(item.id), patch: { featured: value } } as any).unwrap();
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(item.id) ? { ...r, featured: value } : r)),
      );
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        t('admin.slider.list.featuredUpdateError');
      toast.error(msg);
    }
  };

  const handleReorderLocal = (next: SliderAdminDto[]) => setRows(next);

  const handleSaveOrder = async () => {
    if (!rows.length) return;

    try {
      const ids = rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n) && n > 0);
      if (!ids.length) return;

      await reorderSliders({ ids } as any).unwrap();
      toast.success(t('admin.slider.list.orderSaved'));
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        t('admin.slider.list.orderSaveError');
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <SliderHeader
        search={qFromUrl}
        onSearchChange={handleSearchChange}
        locale={effectiveLocale}
        onLocaleChange={handleLocaleChange}
        showOnlyActive={showOnlyActive}
        onShowOnlyActiveChange={handleShowOnlyActiveChange}
        loading={busy}
        onRefresh={refetch}
        locales={localeOptions as any}
        localesLoading={localesLoading}
        onCreateClick={handleCreateClick}
      />

      <SliderList
        items={rows}
        loading={busy}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onToggleFeatured={handleToggleFeatured}
        onReorder={handleReorderLocal}
        onSaveOrder={handleSaveOrder}
        savingOrder={isReordering}
      />
    </div>
  );
}
