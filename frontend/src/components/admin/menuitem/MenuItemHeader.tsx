// =============================================================
// FILE: src/components/admin/menuitem/MenuItemHeader.tsx
// konigsmassage – Admin Menu Items Header / Filters (HEADER ONLY)
// =============================================================

'use client';

import React, { useMemo } from 'react';
import type { MenuLocation } from '@/integrations/types';

export type LocaleOption = {
  value: string;
  label: string;
};

export type MenuItemFilters = {
  search: string;
  location: MenuLocation;
  active: 'all' | 'active' | 'inactive';
  sort: 'display_order' | 'created_at' | 'title';
  order: 'asc' | 'desc';
  locale: string; // "" => tüm diller, aksi => "de"/"en"...
};

export type MenuItemHeaderProps = {
  filters: MenuItemFilters;
  total: number;
  loading: boolean;
  locales: LocaleOption[];
  localesLoading?: boolean;
  defaultLocale?: string;
  onFiltersChange: (next: MenuItemFilters) => void;
  onRefresh: () => void;
  onCreateClick: () => void;
};

/* -------------------- helpers -------------------- */
const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

export const MenuItemHeader: React.FC<MenuItemHeaderProps> = ({
  filters,
  total,
  loading,
  locales,
  localesLoading,
  defaultLocale,
  onFiltersChange,
  onRefresh,
  onCreateClick,
}) => {
  const effectiveDefaultLocale = useMemo(
    () => toShortLocale(defaultLocale ?? 'de'),
    [defaultLocale],
  );

  const localeSelectDisabled = loading || (!!localesLoading && (locales?.length ?? 0) === 0);

  const setField =
    <K extends keyof MenuItemFilters>(field: K) =>
    (value: MenuItemFilters[K]) => {
      onFiltersChange({ ...filters, [field]: value });
    };

  const handleInputChange =
    (field: keyof MenuItemFilters) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setField(field as any)(e.target.value as any);
    };

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    setField('locale')(raw ? toShortLocale(raw) : '');
  };

  const handleOrderToggle = () => {
    setField('order')(filters.order === 'asc' ? 'desc' : 'asc');
  };

  const totalSafe = Number.isFinite(total) ? total : 0;

  return (
    <div className="row g-2 mb-3">
      {/* LEFT: FILTERS */}
      <div className="col-12 col-lg-8">
        <div className="card">
          <div className="card-body py-2">
            <div className="row g-2">
              {/* Search */}
              <div className="col-12 col-md-6 col-xl-4">
                <label className="form-label small mb-1">Ara (başlık / URL)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Başlık / URL içinde ara..."
                  value={filters.search}
                  onChange={handleInputChange('search')}
                  disabled={loading}
                />
              </div>

              {/* Locale */}
              <div className="col-12 col-md-6 col-xl-3">
                <label className="form-label small mb-1 d-flex align-items-center gap-2">
                  <span>Dil</span>
                  {localesLoading && (
                    <span className="spinner-border spinner-border-sm" role="status" />
                  )}
                </label>

                <select
                  className="form-select form-select-sm"
                  value={toShortLocale(filters.locale)}
                  onChange={handleLocaleChange}
                  disabled={localeSelectDisabled}
                >
                  <option value="">
                    Tüm diller
                    {effectiveDefaultLocale ? ` (varsayılan: ${effectiveDefaultLocale})` : ''}
                  </option>

                  {(locales ?? []).map((loc) => (
                    <option key={loc.value} value={toShortLocale(loc.value)}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active */}
              <div className="col-6 col-md-4 col-xl-2">
                <label className="form-label small mb-1">Aktiflik</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.active}
                  onChange={handleInputChange('active')}
                  disabled={loading}
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>

              {/* Sort */}
              <div className="col-6 col-md-4 col-xl-2">
                <label className="form-label small mb-1">Sıralama</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.sort}
                  onChange={handleInputChange('sort')}
                  disabled={loading}
                >
                  <option value="display_order">Sıra</option>
                  <option value="created_at">Oluşturulma</option>
                  <option value="title">Başlık</option>
                </select>
              </div>

              {/* Order */}
              <div className="col-12 col-md-4 col-xl-1">
                <label className="form-label small mb-1 d-block">Yön</label>

                <div className="d-none d-md-block">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm w-100"
                    disabled={loading}
                    onClick={handleOrderToggle}
                  >
                    {filters.order === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                <div className="d-block d-md-none">
                  <select
                    className="form-select form-select-sm"
                    value={filters.order}
                    onChange={handleInputChange('order')}
                    disabled={loading}
                  >
                    <option value="asc">Artan</option>
                    <option value="desc">Azalan</option>
                  </select>
                </div>
              </div>

              {/* ✅ Location kaldırıldı (Header-only) */}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: ACTIONS / SUMMARY */}
      <div className="col-12 col-lg-4">
        <div className="card h-100">
          <div className="card-body py-2">
            <div className="d-flex flex-column flex-sm-row flex-lg-column justify-content-between align-items-start gap-2 h-100">
              <div className="small text-muted">
                <div className="fw-semibold text-dark">Header Menü</div>
                <div>
                  Toplam <span className="fw-semibold">{totalSafe}</span> kayıt görüntüleniyor.
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap justify-content-start">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={loading}
                  onClick={onRefresh}
                >
                  {loading ? 'Yenileniyor...' : 'Yenile'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={loading}
                  onClick={onCreateClick}
                >
                  + Yeni Header Menü Öğesi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
