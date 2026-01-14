// =============================================================
// FILE: src/components/admin/custompage/CustomPageHeader.tsx
// konigsmassage – Admin Custom Pages Header (Filtreler + Özet)
// FIX:
//  - Locale options dynamic
//  - Module dropdown dynamic (props) — NO FALLBACK
//  - Locale change: NO onRefresh() call
// =============================================================

import React from 'react';
import Link from 'next/link';
import { AdminLocaleSelect, type AdminLocaleOption } from '@/components/common/AdminLocaleSelect';

export type LocaleOption = {
  value: string;
  label: string;
};

export type ModuleOption = {
  value: string;
  label: string;
};

export type CustomPageFilters = {
  search: string;
  moduleKey: string;
  publishedFilter: 'all' | 'published' | 'draft';
  /** Admin listte locale filtre UI için tutulur; URL sync YOK */
  locale: string;
};

export type CustomPageHeaderProps = {
  filters: CustomPageFilters;
  total: number;
  onFiltersChange: (next: CustomPageFilters) => void;
  onRefresh?: () => void;

  locales: LocaleOption[];
  localesLoading?: boolean;

  allowAllOption?: boolean;

  /** ✅ Dinamik modül listesi (index sayfasından gelir) */
  moduleOptions?: ModuleOption[];
};

export const CustomPageHeader: React.FC<CustomPageHeaderProps> = ({
  filters,
  total,
  onFiltersChange,
  onRefresh,
  locales,
  localesLoading,
  allowAllOption = true,
  moduleOptions,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, moduleKey: e.target.value });
  };

  const handlePublishedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CustomPageFilters['publishedFilter'];
    onFiltersChange({ ...filters, publishedFilter: value });
  };

  const handleLocaleChange = (nextLocale: string) => {
    const normalized = nextLocale ? nextLocale.trim().toLowerCase() : '';
    onFiltersChange({ ...filters, locale: normalized });
  };

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

  const moduleOpts = (moduleOptions ?? []).filter((x) => String(x?.value || '').trim().length > 0);
  const disabledModuleSelect = moduleOpts.length === 0;

  return (
    <div className="card mb-3">
      <div className="card-body py-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
          <div style={{ minWidth: 0, flex: 2 }}>
            <div className="mb-2">
              <h5 className="mb-0 small fw-semibold">Özel Sayfalar</h5>
              <div className="text-muted small">
                İçerik sayfalarını burada modül, yayın durumu ve aktif dile göre yönetebilirsin.
              </div>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-md-5">
                <label className="form-label small mb-1">Başlık / Slug / Meta arama</label>
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Örn: 'hakkımızda', 'duyuru', 'kampanya'"
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="col-md-3">
                <AdminLocaleSelect
                  id="custompage-locale-filter"
                  value={filters.locale}
                  onChange={handleLocaleChange}
                  options={localeOptions}
                  loading={!!localesLoading}
                  disabled={disabledLocaleSelect}
                  label="Dil"
                />
                {localesLoading && <div className="form-text small">Diller yükleniyor...</div>}
                {!localesLoading && localeOptions.length === 0 && (
                  <div className="form-text small text-danger">
                    Aktif dil listesi bulunamadı. Site ayarlarından app_locales kontrol et.
                  </div>
                )}
              </div>

              <div className="col-md-2">
                <label className="form-label small mb-1">Modül</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.moduleKey}
                  onChange={handleModuleChange}
                  disabled={disabledModuleSelect}
                >
                  <option value="">Tümü</option>
                  {moduleOpts.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {disabledModuleSelect && (
                  <div className="form-text small text-muted">Modül listesi yükleniyor...</div>
                )}
              </div>

              <div className="col-md-2">
                <label className="form-label small mb-1">Yayın durumu</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.publishedFilter}
                  onChange={handlePublishedChange}
                >
                  <option value="all">Hepsi</option>
                  <option value="published">Yayında</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="border-start ps-lg-3 ms-lg-3 d-flex flex-column justify-content-between"
            style={{ minWidth: 0, flex: 1 }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <div className="small fw-semibold">Toplam Kayıt</div>
                <div className="display-6 fs-4 fw-bold">{total}</div>
              </div>

              {onRefresh && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onRefresh}
                >
                  Yenile
                </button>
              )}
            </div>

            <div className="text-muted small">
              <ul className="mb-0 ps-3">
                <li>Liste, seçili dile göre filtrelenir (locale paramı).</li>
              </ul>
            </div>

            <div className="mt-2 d-flex justify-content-end">
              <Link href="/admin/custompage/new" className="btn btn-primary btn-sm">
                Yeni Sayfa Oluştur
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
