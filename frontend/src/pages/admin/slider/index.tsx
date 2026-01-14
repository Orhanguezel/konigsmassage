// =============================================================
// FILE: src/pages/admin/slider/index.tsx
// konigsmassage – Admin Slider Sayfası
// (Liste + filtreler + drag & drop reorder)
//  - Yeni slider:  /admin/slider/new
//  - Düzenle:      /admin/slider/[id]
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  useListSlidersAdminQuery,
  useUpdateSliderAdminMutation,
  useDeleteSliderAdminMutation,
  useReorderSlidersAdminMutation,
  useSetSliderStatusAdminMutation,
} from '@/integrations/rtk/hooks';

import { useAdminLocales } from '@/components/common/useAdminLocales';
import type { AdminLocaleOption } from '@/components/common/AdminLocaleSelect';

import type { SliderAdminDto } from '@/integrations/types';

import { SliderHeader } from '@/components/admin/slider/SliderHeader';
import { SliderList } from '@/components/admin/slider/SliderList';

const FALLBACK_LOCALE = 'de';

const SliderAdminPage: React.FC = () => {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [localeFilter, setLocaleFilter] = useState<string>(''); // kullanıcı seçimi
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // ✅ Locale options (DB’den)
  const { localeOptions: adminLocaleOptions, loading: isLocalesLoading } = useAdminLocales();

  // Hook’tan gelen shape zaten {value,label} → UI tipiyle aynı kabul
const locales: AdminLocaleOption[] = useMemo(() => {
  return (adminLocaleOptions ?? []) as AdminLocaleOption[];
}, [adminLocaleOptions]);


  // Locale boşsa / listede yoksa → ilk locale’e çek
  useEffect(() => {
    if (!locales.length) return;

    const values = new Set(locales.map((l) => (l.value || '').toLowerCase()).filter(Boolean));
    const fallback = (locales[0]?.value || FALLBACK_LOCALE).toLowerCase();

    if (!localeFilter) {
      setLocaleFilter(fallback);
      return;
    }

    if (!values.has(localeFilter.toLowerCase())) {
      setLocaleFilter(fallback);
    }
  }, [locales, localeFilter]);

  // Query için her zaman dolu locale üret
  const queryLocale = useMemo(() => {
    const safe = (localeFilter || locales[0]?.value || FALLBACK_LOCALE).toLowerCase();
    return safe || FALLBACK_LOCALE;
  }, [localeFilter, locales]);

  /* -------------------- Liste + filtreler -------------------- */

  const {
    data: sliders,
    isLoading,
    isFetching,
    refetch,
  } = useListSlidersAdminQuery({
    q: search || undefined,
    locale: queryLocale, // ✅ HER ZAMAN LOCALE
    is_active: showOnlyActive ? true : undefined,
    sort: 'display_order',
    order: 'asc',
    offset: 0,
  });

  const [rows, setRows] = useState<SliderAdminDto[]>([]);

  useEffect(() => {
    setRows((sliders as SliderAdminDto[]) || []);
  }, [sliders]);

  /* -------------------- Mutations ----------------------------- */

  const [updateSlider] = useUpdateSliderAdminMutation();
  const [deleteSlider, { isLoading: isDeleting }] = useDeleteSliderAdminMutation();
  const [reorderSliders, { isLoading: isReordering }] = useReorderSlidersAdminMutation();
  const [setStatus] = useSetSliderStatusAdminMutation();

  const loading = isLoading || isFetching;
  const busy = loading || isDeleting || isReordering;

  /* -------------------- Actions (create/edit nav) ------------- */

  const handleCreateClick = () => {
    router.push('/admin/slider/new');
  };

  const handleEdit = (item: SliderAdminDto) => {
    router.push(`/admin/slider/${encodeURIComponent(String(item.id))}`);
  };

  /* -------------------- Delete / Toggle / Reorder ------------- */

  const handleDelete = async (item: SliderAdminDto) => {
    if (
      !window.confirm(`"${item.name}" slider kaydını silmek üzeresin. Devam etmek istiyor musun?`)
    ) {
      return;
    }

    try {
      await deleteSlider(String(item.id)).unwrap();
      toast.success(`"${item.name}" slider kaydı silindi.`);
      await refetch();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Slider silinirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleToggleActive = async (item: SliderAdminDto, value: boolean) => {
    try {
      await setStatus({
        id: String(item.id),
        payload: { is_active: value },
      }).unwrap();

      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(item.id) ? { ...r, is_active: value } : r)),
      );
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || 'Aktif durumu güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleToggleFeatured = async (item: SliderAdminDto, value: boolean) => {
    try {
      await updateSlider({
        id: String(item.id),
        patch: { featured: value },
      }).unwrap();

      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(item.id) ? { ...r, featured: value } : r)),
      );
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.message ||
        'Öne çıkarma durumu güncellenirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  const handleReorderLocal = (next: SliderAdminDto[]) => {
    setRows(next);
  };

  const handleSaveOrder = async () => {
    if (!rows.length) return;

    try {
      // reorder endpoint ids bekliyor
      const ids = rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n) && n > 0);
      if (!ids.length) return;

      await reorderSliders({ ids }).unwrap();
      toast.success('Slider sıralaması kaydedildi.');
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || 'Sıralama kaydedilirken bir hata oluştu.';
      toast.error(msg);
    }
  };

  /* -------------------- Render -------------------- */

  return (
    <div className="container-fluid py-4">
      <SliderHeader
        search={search}
        onSearchChange={setSearch}
        locale={queryLocale}
        onLocaleChange={setLocaleFilter}
        showOnlyActive={showOnlyActive}
        onShowOnlyActiveChange={setShowOnlyActive}
        loading={busy}
        onRefresh={refetch}
        locales={locales}
        localesLoading={isLocalesLoading}
        onCreateClick={handleCreateClick}
      />

      <div className="row">
        <div className="col-12">
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
      </div>
    </div>
  );
};

export default SliderAdminPage;
