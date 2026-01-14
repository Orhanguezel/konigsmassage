// =============================================================
// FILE: src/components/admin/faqs/FaqsHeader.tsx
// Admin FAQ Header (filtreler + aksiyonlar)
// - "Tüm diller" opsiyonu sadece gerektiğinde gösterilir
// =============================================================

import React from 'react';

export type LocaleOption = {
  value: string;
  label: string;
};

export type FaqOrderField = 'created_at' | 'updated_at' | 'display_order';

interface FaqsHeaderProps {
  /** Arama (soru / slug) */
  search: string;
  onSearchChange: (v: string) => void;

  /** Dil filtresi */
  locale: string;
  onLocaleChange: (v: string) => void;
  locales: LocaleOption[];
  localesLoading?: boolean;

  /** Sadece aktif kayıtlar filtresi */
  showOnlyActive: boolean;
  onShowOnlyActiveChange: (v: boolean) => void;

  orderBy: FaqOrderField;
  orderDir: 'asc' | 'desc';
  onOrderByChange: (v: FaqOrderField) => void;
  onOrderDirChange: (v: 'asc' | 'desc') => void;

  loading: boolean;
  onRefresh: () => void;
  onCreateClick: () => void;
}

const normalizeLocale = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toLowerCase();

export const FaqsHeader: React.FC<FaqsHeaderProps> = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
  locales,
  localesLoading,
  showOnlyActive,
  onShowOnlyActiveChange,
  orderBy,
  orderDir,
  onOrderByChange,
  onOrderDirChange,
  loading,
  onRefresh,
  onCreateClick,
}) => {
  const hasAllOptionAlready =
    Array.isArray(locales) && locales.some((x) => normalizeLocale(x.value) === '');

  const handleLocaleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = normalizeLocale(e.target.value);
    onLocaleChange(nextLocale);
  };

  return (
    <div className="row mb-3 g-2 align-items-end">
      {/* Sol blok: arama + dil + sıralama */}
      <div className="col-md-8">
        <div className="card">
          <div className="card-body py-2">
            <div className="row g-2 align-items-end">
              {/* Arama */}
              <div className="col-12 col-md-4">
                <label className="form-label small mb-1">Ara (soru / slug)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ara..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Dil */}
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">
                  Dil {localesLoading && <span className="spinner-border spinner-border-sm ms-1" />}
                </label>
                <select
                  className="form-select form-select-sm"
                  value={normalizeLocale(locale)}
                  onChange={handleLocaleSelectChange}
                  disabled={loading || (!!localesLoading && (!locales || locales.length === 0))}
                >
                  {/* Eğer parent locales listesine "" eklemediyse, burada ekle */}
                  {!hasAllOptionAlready && <option value="">Tüm diller</option>}

                  {(locales ?? []).map((opt) => (
                    <option key={`${opt.value}:${opt.label}`} value={normalizeLocale(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sıralama */}
              <div className="col-6 col-md-3 mt-2">
                <label className="form-label small mb-1 d-block">Sıralama</label>
                <div className="d-flex gap-1">
                  <select
                    className="form-select form-select-sm"
                    value={orderBy}
                    onChange={(e) => onOrderByChange(e.target.value as FaqOrderField)}
                    disabled={loading}
                  >
                    <option value="display_order">Sıra (display_order)</option>
                    <option value="created_at">Oluşturma</option>
                    <option value="updated_at">Güncelleme</option>
                  </select>

                  <select
                    className="form-select form-select-sm"
                    value={orderDir}
                    onChange={(e) => onOrderDirChange(e.target.value as 'asc' | 'desc')}
                    disabled={loading}
                  >
                    <option value="asc">Artan</option>
                    <option value="desc">Azalan</option>
                  </select>
                </div>
              </div>

              {/* (İstersen buraya kategori/subcategory filtrelerini ekleriz; şimdilik sade) */}
            </div>
          </div>
        </div>
      </div>

      {/* Sağ blok: filtre toggles + aksiyonlar */}
      <div className="col-md-4">
        <div className="card">
          <div className="card-body py-2">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="form-check form-switch small">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="faq-header-active"
                  checked={!!showOnlyActive}
                  onChange={(e) => onShowOnlyActiveChange(e.target.checked)}
                  disabled={loading}
                />
                <label className="form-check-label ms-1" htmlFor="faq-header-active">
                  Sadece aktifler
                </label>
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
                  + Yeni Soru
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
