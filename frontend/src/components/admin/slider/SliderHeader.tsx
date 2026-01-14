// =============================================================
// FILE: src/components/admin/slider/SliderHeader.tsx
// konigsmassage – Slider Header + Filtreler
// =============================================================

import React from 'react';
export type LocaleOption = {
  value: string;
  label: string;
};

export type SliderHeaderProps = {
  search: string;
  onSearchChange: (v: string) => void;

  locale: string;
  onLocaleChange: (v: string) => void;

  showOnlyActive: boolean;
  onShowOnlyActiveChange: (v: boolean) => void;

  loading: boolean;
  onRefresh: () => void;

  locales: LocaleOption[];
  localesLoading?: boolean;

  onCreateClick: () => void;
};

export const SliderHeader: React.FC<SliderHeaderProps> = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
  showOnlyActive,
  onShowOnlyActiveChange,
  loading,
  onRefresh,
  locales,
  localesLoading,
  onCreateClick,
}) => {
  return (
    <div className="row mb-3">
      <div className="col-12 col-lg-6 mb-2 mb-lg-0">
        <h1 className="h4 mb-1">Slider Yönetimi</h1>
        <p className="text-muted small mb-0">
          Ana sayfa ve diğer sayfalar için slider görsellerini, linklerini ve sıralamasını
          yönetebilirsin. Kayıtlar çok dilli ve aktif/pasif durumlarına göre filtrelenebilir.
        </p>
      </div>

      <div className="col-12 col-lg-6 d-flex align-items-end justify-content-lg-end">
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-sm-auto">
          <div className="input-group input-group-sm">
            <span className="input-group-text">Ara</span>
            <input
              type="text"
              className="form-control"
              placeholder="Başlık içinde ara"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="input-group input-group-sm">
            <span className="input-group-text">
              Dil
              {localesLoading && <span className="ms-1 spinner-border spinner-border-sm" />}
            </span>
            <select
              className="form-select"
              value={(locale || '').toLowerCase()}
              onChange={(e) => onLocaleChange((e.target.value || '').toLowerCase())}
            >
              {locales.map((opt) => (
                <option key={opt.value} value={String(opt.value).toLowerCase()}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="col-12 mt-2 d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-md-between">
        <div className="d-flex flex-wrap gap-3 small">
          <div className="form-check form-switch">
            <input
              id="slider-filter-active"
              className="form-check-input"
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => onShowOnlyActiveChange(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="slider-filter-active">
              Sadece aktif sliderlar
            </label>
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-end mt-2 mt-md-0">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            Yenile
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onCreateClick}>
            + Yeni Slider
          </button>
        </div>
      </div>
    </div>
  );
};
