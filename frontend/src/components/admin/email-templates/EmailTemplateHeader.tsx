// =============================================================
// FILE: src/components/admin/email-templates/EmailTemplateHeader.tsx
// Admin Email Templates – Header / Filtreler / Actions
// =============================================================

import React from 'react';

export type LocaleOption = {
  value: string;
  label: string;
};

interface EmailTemplateHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;

  locale: string;
  onLocaleChange: (value: string) => void;
  locales: LocaleOption[];
  localesLoading?: boolean;

  /** "" = hepsi, "active" = sadece aktif, "inactive" = sadece pasif */
  isActiveFilter: '' | 'active' | 'inactive';
  onIsActiveFilterChange: (value: '' | 'active' | 'inactive') => void;

  loading: boolean;
  total: number;

  onRefresh: () => void;
  onCreateClick: () => void;
}

export const EmailTemplateHeader: React.FC<EmailTemplateHeaderProps> = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
  locales,
  localesLoading,
  isActiveFilter,
  onIsActiveFilterChange,
  loading,
  total,
  onRefresh,
  onCreateClick,
}) => {
  const handleLocaleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    const nextLocale = raw ? raw.trim().toLowerCase() : '';
    onLocaleChange(nextLocale);
  };

  return (
    <div className="row mb-3 g-2 align-items-end">
      {/* Sol blok: arama + dil + aktiflik filtresi */}
      <div className="col-md-8">
        <div className="card">
          <div className="card-body py-2">
            <div className="row g-2 align-items-end">
              {/* Arama */}
              <div className="col-12 col-md-5">
                <label className="form-label small mb-1">Ara (key / isim / konu)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="template_key, isim veya subject içinde ara..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>

              {/* Dil */}
              <div className="col-6 col-md-3">
                <label className="form-label small mb-1">
                  Dil {localesLoading && <span className="spinner-border spinner-border-sm ms-1" />}
                </label>
                <select
                  className="form-select form-select-sm"
                  value={locale}
                  onChange={handleLocaleSelectChange}
                  disabled={loading || (localesLoading && !locales.length)}
                >
                  <option value="">Tüm diller</option>
                  {locales.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aktiflik filtresi */}
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Aktiflik</label>
                <select
                  className="form-select form-select-sm"
                  value={isActiveFilter}
                  onChange={(e) =>
                    onIsActiveFilterChange(e.target.value as '' | 'active' | 'inactive')
                  }
                >
                  <option value="">Hepsi</option>
                  <option value="active">Sadece aktif</option>
                  <option value="inactive">Sadece pasif</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ blok: toplam + aksiyonlar */}
      <div className="col-md-4">
        <div className="card">
          <div className="card-body py-2">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="small text-muted">
                Toplam: <span className="fw-semibold">{loading ? '...' : total}</span>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  {loading ? 'Yükleniyor...' : 'Yenile'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onCreateClick}
                  disabled={loading}
                >
                  + Yeni Şablon
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
