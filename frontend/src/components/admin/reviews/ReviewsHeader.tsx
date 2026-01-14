// =============================================================
// FILE: src/components/admin/reviews/ReviewsHeader.tsx
// konigsmassage – Admin Reviews Header / Filters
// =============================================================

import React from 'react';

export type LocaleOption = {
  value: string;
  label: string;
};

export type ReviewFilters = {
  search: string;
  locale: string;
  approval: 'all' | 'approved' | 'pending';
  active: 'all' | 'active' | 'inactive';
};

export type ReviewsHeaderProps = {
  filters: ReviewFilters;
  total: number;
  loading: boolean;
  locales: LocaleOption[];
  localesLoading?: boolean;
  defaultLocale?: string;
  onFiltersChange: (next: ReviewFilters) => void;
  onRefresh: () => void;
  onCreateClick: () => void;
};

export const ReviewsHeader: React.FC<ReviewsHeaderProps> = ({
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
  const handleChange =
    (field: keyof ReviewFilters) =>
    (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onFiltersChange({
        ...filters,
        [field]: value,
      });
    };

  const effectiveDefaultLocale = defaultLocale ?? 'de';

  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="me-auto d-flex flex-wrap gap-2 align-items-center">
            <div>
              <div className="small text-muted">Toplam Yorum</div>
              <div className="fw-semibold">{total}</div>
            </div>

            <div className="ms-3">
              <label className="form-label small mb-1">Ara</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="İsim, e-posta veya yorum içinde ara..."
                value={filters.search}
                onChange={handleChange('search')}
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label small mb-1">Onay Durumu</label>
              <select
                className="form-select form-select-sm"
                value={filters.approval}
                onChange={handleChange('approval')}
                disabled={loading}
              >
                <option value="all">Hepsi</option>
                <option value="approved">Sadece onaylı</option>
                <option value="pending">Onaysız / bekleyen</option>
              </select>
            </div>

            <div>
              <label className="form-label small mb-1">Aktiflik</label>
              <select
                className="form-select form-select-sm"
                value={filters.active}
                onChange={handleChange('active')}
                disabled={loading}
              >
                <option value="all">Hepsi</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>

            <div>
              <label className="form-label small mb-1">Locale</label>
              <select
                className="form-select form-select-sm"
                value={filters.locale}
                onChange={handleChange('locale')}
                disabled={loading || (localesLoading && !locales.length)}
              >
                <option value="">
                  (Varsayılan
                  {effectiveDefaultLocale ? `: ${effectiveDefaultLocale}` : ''})
                </option>
                {locales.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={onRefresh}
              disabled={loading}
            >
              Yenile
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onCreateClick}
              disabled={loading}
            >
              Yeni Yorum Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
