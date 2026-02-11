// =============================================================
// FILE: src/app/(main)/admin/(admin)/faqs/_components/FaqsHeader.tsx
// FINAL — Admin FAQ Header (Filters + Summary)
// - ✅ Filters: q, slug, is_active, sort, orderDir, locale
// - ✅ No module/published (faqs’da yok)
// - ✅ NO inline styles
// =============================================================

import React from 'react';
import Link from 'next/link';

import {
  AdminLocaleSelect,
  type AdminLocaleOption,
} from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

export type LocaleOption = { value: string; label: string };

export type FaqsFilters = {
  q: string;
  slug: string;
  isActive: 'all' | 'active' | 'inactive';
  sort: 'created_at' | 'updated_at' | 'display_order';
  orderDir: 'asc' | 'desc';
  locale: string;
};

export type FaqsHeaderProps = {
  filters: FaqsFilters;
  total: number;
  onFiltersChange: (next: FaqsFilters) => void;
  onRefresh?: () => void;

  locales: LocaleOption[];
  localesLoading?: boolean;

  allowAllOption?: boolean;
};

export const FaqsHeader: React.FC<FaqsHeaderProps> = ({
  filters,
  total,
  onFiltersChange,
  onRefresh,
  locales,
  localesLoading,
  allowAllOption = false,
}) => {
  const localeOptions: AdminLocaleOption[] = React.useMemo(() => {
    const base = (locales || [])
      .map((l) => ({
        value: String(l.value || '')
          .trim()
          .toLowerCase(),
        label: l.label,
      }))
      .filter((x) => x.value);

    if (!allowAllOption) return base;
    return [{ value: '', label: 'Tüm diller' }, ...base];
  }, [locales, allowAllOption]);

  const disabledLocaleSelect = !!localesLoading || localeOptions.length === 0;

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">FAQ</div>
            <div className="text-xs text-muted-foreground">
              FAQ kayıtlarını dil, aktiflik ve arama kriterlerine göre yönetebilirsin.
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <label className="mb-1 block text-xs text-muted-foreground">Arama (q)</label>
                <input
                  type="search"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="question/answer içinde ara"
                  value={filters.q}
                  onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
                />
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-xs text-muted-foreground">Slug</label>
                <input
                  type="text"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="örn: fiyatlar"
                  value={filters.slug}
                  onChange={(e) => onFiltersChange({ ...filters, slug: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <AdminLocaleSelect
                  value={filters.locale}
                  onChange={(next) =>
                    onFiltersChange({ ...filters, locale: (next || '').trim().toLowerCase() })
                  }
                  options={localeOptions}
                  loading={!!localesLoading}
                  disabled={disabledLocaleSelect}
                  label="Dil"
                />
                {localesLoading ? (
                  <div className="mt-1 text-xs text-muted-foreground">Diller yükleniyor...</div>
                ) : null}
                {!localesLoading && localeOptions.length === 0 ? (
                  <div className="mt-1 text-xs text-destructive">
                    Aktif dil listesi yok. Site ayarlarından app_locales kontrol et.
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-xs text-muted-foreground">Aktif</label>
                <select
                  className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                  value={filters.isActive}
                  onChange={(e) => onFiltersChange({ ...filters, isActive: e.target.value as any })}
                >
                  <option value="all">Hepsi</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-xs text-muted-foreground">Sort</label>
                <select
                  className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                  value={filters.sort}
                  onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value as any })}
                >
                  <option value="updated_at">updated_at</option>
                  <option value="created_at">created_at</option>
                  <option value="display_order">display_order</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-xs text-muted-foreground">Dir</label>
                <select
                  className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                  value={filters.orderDir}
                  onChange={(e) => onFiltersChange({ ...filters, orderDir: e.target.value as any })}
                >
                  <option value="desc">desc</option>
                  <option value="asc">asc</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:w-72 lg:border-l lg:pl-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Toplam Kayıt</div>
                <div className="text-2xl font-bold">{total}</div>
              </div>

              {onRefresh ? (
                <button
                  type="button"
                  className="rounded-md border px-3 py-1 text-xs"
                  onClick={onRefresh}
                >
                  Yenile
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                href="/admin/faqs/new"
                className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground"
              >
                Yeni FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
