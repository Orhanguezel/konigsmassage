// =============================================================
// FILE: src/components/admin/services/ServicesHeader.tsx (FINAL)
// konigsmassage – Admin Services Header (filters + locale + summary)
// - Statik locale map YOK
// - Locales parent'tan gelir
// - NO Category/SubCategory
// =============================================================

'use client';

import React, { useEffect, useMemo } from 'react';

import { AdminLocaleSelect, type AdminLocaleOption } from '@/components/common/AdminLocaleSelect';
import type { BoolLike } from '@/integrations/types';

const normalizeLocale = (v: unknown): string =>
  typeof v === 'string' ? v.trim().toLowerCase() : '';

const boolLikeToSelectValue = (v: BoolLike | undefined): string => {
  if (v === undefined) return '';
  if (v === true || v === 1 || v === '1' || v === 'true') return '1';
  if (v === false || v === 0 || v === '0' || v === 'false') return '0';
  return '';
};

const selectValueToBoolLike = (v: string): BoolLike | undefined => {
  if (v === '') return undefined;
  if (v === '1') return 1;
  if (v === '0') return 0;
  return undefined;
};

export type ServicesFilterState = {
  q?: string;
  is_active?: BoolLike;
  featured?: BoolLike;
  locale?: string;
};

export type ServicesHeaderProps = {
  loading: boolean;
  total: number;

  filters: ServicesFilterState;
  onChangeFilters: (patch: Partial<ServicesFilterState>) => void;

  onRefresh?: () => void;
  onCreateNew?: () => void;

  locales: AdminLocaleOption[];
  localesLoading?: boolean;
};

export const ServicesHeader: React.FC<ServicesHeaderProps> = ({
  loading,
  total,
  filters,
  onChangeFilters,
  onRefresh,
  onCreateNew,
  locales,
  localesLoading,
}) => {
  const localeOptions: AdminLocaleOption[] = useMemo(
    () =>
      (locales ?? [])
        .map((x) => ({ value: normalizeLocale(x.value), label: x.label }))
        .filter((x) => !!x.value),
    [locales],
  );

  /**
   * Effective locale:
   * - filters.locale varsa ve listede varsa onu kullan
   * - değilse first
   * - locale listesi boşsa ""
   */
  const effectiveLocale = useMemo(() => {
    const selected = normalizeLocale(filters.locale);
    const list = localeOptions.map((x) => x.value).filter(Boolean);

    if (selected && list.includes(selected)) return selected;
    return list[0] || '';
  }, [filters.locale, localeOptions]);

  /**
   * Auto-sync:
   * locales geldikten sonra filters.locale boşsa parent'a set et
   */
  useEffect(() => {
    if (localesLoading) return;
    if (normalizeLocale(filters.locale)) return;

    const first = normalizeLocale(localeOptions?.[0]?.value);
    if (!first) return;

    onChangeFilters({ locale: first });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localesLoading, localeOptions]);

  const localeDisabled = loading || !!localesLoading || localeOptions.length === 0;

  /* -------------------- Reset -------------------- */

  const handleReset = () => {
    onChangeFilters({
      q: undefined,
      is_active: undefined,
      featured: undefined,
      // locale aynı kalsın
    });
  };

  const activeValue = boolLikeToSelectValue(filters.is_active);
  const featuredValue = boolLikeToSelectValue(filters.featured);

  /* -------------------- Render -------------------- */

  return (
    <div className="card mb-3">
      <div className="card-body py-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
          <div style={{ minWidth: 0, flex: 2 }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="mb-0 small fw-semibold">Hizmetler (Services) Yönetimi</h5>
                <div className="text-muted small">
                  konigsmassage endüstriyel soğutma kulesi hizmetlerini yönet.
                </div>
              </div>

              <div className="text-end d-none d-lg-block">
                <div className="small text-muted">
                  Toplam kayıt: <span className="fw-semibold ms-1">{total}</span>
                </div>
                {loading && <span className="badge bg-secondary mt-1">Yükleniyor...</span>}
              </div>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-sm-6 col-md-4">
                <label className="form-label small mb-1">Ara (isim / slug / açıklama)</label>
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Örn: bakım, modernizasyon..."
                  value={filters.q ?? ''}
                  onChange={(e) => onChangeFilters({ q: e.target.value || undefined })}
                  disabled={loading}
                />
              </div>

              <div className="col-sm-6 col-md-4">
                <label className="form-label small mb-1">Dil</label>
                <AdminLocaleSelect
                  value={effectiveLocale}
                  onChange={(nextLocale) => {
                    const next = normalizeLocale(nextLocale);
                    onChangeFilters({ locale: next || undefined });
                  }}
                  options={localeOptions}
                  loading={!!localesLoading}
                  disabled={localeDisabled}
                />

                {!localesLoading && localeOptions.length === 0 && (
                  <div className="form-text small text-danger">
                    <strong>app_locales boş.</strong> Site Settings → app_locales değerini kontrol
                    et.
                  </div>
                )}
              </div>

              <div className="col-sm-6 col-md-2">
                <label className="form-label small mb-1">Durum</label>
                <select
                  className="form-select form-select-sm"
                  value={activeValue}
                  onChange={(e) =>
                    onChangeFilters({ is_active: selectValueToBoolLike(e.target.value) })
                  }
                  disabled={loading}
                >
                  <option value="">Hepsi</option>
                  <option value="1">Sadece aktif</option>
                  <option value="0">Sadece pasif</option>
                </select>
              </div>

              <div className="col-sm-6 col-md-2">
                <label className="form-label small mb-1">Öne çıkan</label>
                <select
                  className="form-select form-select-sm"
                  value={featuredValue}
                  onChange={(e) =>
                    onChangeFilters({ featured: selectValueToBoolLike(e.target.value) })
                  }
                  disabled={loading}
                >
                  <option value="">Hepsi</option>
                  <option value="1">Öne çıkanlar</option>
                  <option value="0">Diğerleri</option>
                </select>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleReset}
                disabled={loading}
              >
                Filtreleri temizle
              </button>

              {onRefresh && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Yenile
                </button>
              )}
            </div>
          </div>

          <div
            className="border-top pt-2 mt-2 d-flex flex-row justify-content-between align-items-center gap-2 flex-lg-column border-lg-start pt-lg-0 mt-lg-0"
            style={{ minWidth: 0, flex: 1 }}
          >
            <div className="d-block d-lg-none">
              <div className="small text-muted">
                Toplam kayıt: <span className="fw-semibold ms-1">{total}</span>
              </div>
              {loading && <span className="badge bg-secondary mt-1">Yükleniyor...</span>}
            </div>

            <div className="ms-lg-auto">
              {onCreateNew && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onCreateNew}
                  disabled={loading}
                >
                  + Yeni Hizmet Ekle
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
