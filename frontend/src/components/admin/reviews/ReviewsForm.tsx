// =============================================================
// FILE: src/components/admin/reviews/ReviewsForm.tsx
// konigsmassage – Admin Review Create/Edit Form
// =============================================================

import React, { useEffect, useState } from 'react';
import type { AdminReviewDto } from '@/integrations/types';
import type { LocaleOption } from './ReviewsHeader';

export type ReviewFormValues = {
  locale: string;
  name: string;
  email: string;
  rating: string;
  comment: string;
  is_active: boolean;
  is_approved: boolean;
  display_order: string;
};

export type ReviewsFormProps = {
  mode: 'create' | 'edit';
  initialData?: AdminReviewDto;
  loading: boolean;
  saving: boolean;
  locales: LocaleOption[];
  localesLoading?: boolean;
  defaultLocale?: string; // DB’den gelecek defaultLocaleFromDb
  onSubmit: (values: ReviewFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

const normalizeLocale = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase();

const pickInitialLocale = (initial: AdminReviewDto | undefined, fallback: string | undefined) => {
  const fb = normalizeLocale(fallback) || 'de';
  if (!initial) return fb;

  // Admin dto’da tipik alanlar: locale_resolved (coalesced), submitted_locale (orijinal)
  const fromResolved = normalizeLocale((initial as any).locale_resolved);
  if (fromResolved) return fromResolved;

  const fromSubmitted = normalizeLocale((initial as any).submitted_locale);
  if (fromSubmitted) return fromSubmitted;

  return fb;
};

const buildInitialValues = (
  initial: AdminReviewDto | undefined,
  fallbackLocale: string | undefined,
): ReviewFormValues => {
  const loc = pickInitialLocale(initial, fallbackLocale);

  if (!initial) {
    return {
      locale: loc,
      name: '',
      email: '',
      rating: '5',
      comment: '',
      is_active: true,
      is_approved: false,
      display_order: '0',
    };
  }

  return {
    locale: loc,
    name: initial.name ?? '',
    email: initial.email ?? '',
    rating: String(initial.rating ?? 5),
    comment: (initial as any).comment ?? '',
    is_active: initial.is_active ?? true,
    is_approved: initial.is_approved ?? false,
    display_order: String(initial.display_order ?? 0),
  };
};

export const ReviewsForm: React.FC<ReviewsFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  locales,
  localesLoading,
  defaultLocale,
  onSubmit,
  onCancel,
}) => {
  const disabled = loading || saving;
  const effectiveDefaultLocale = normalizeLocale(defaultLocale) || 'de';

  const [values, setValues] = useState<ReviewFormValues>(
    buildInitialValues(initialData, effectiveDefaultLocale),
  );

  useEffect(() => {
    setValues(buildInitialValues(initialData, effectiveDefaultLocale));
  }, [initialData, effectiveDefaultLocale]);

  const handleChange =
    (field: keyof ReviewFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleCheckboxChange =
    (field: keyof ReviewFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.checked as never }));
    };

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = normalizeLocale(e.target.value);
    setValues((prev) => ({ ...prev, locale: val }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    void onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <div className="card-header py-2 d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-0 small fw-semibold">
              {mode === 'create' ? 'Yeni Yorum Oluştur' : 'Yorum Düzenle'}
            </h5>
            <div className="text-muted small">
              Müşteri yorumlarını, puan ve onay durumlarını buradan yönetebilirsin.
            </div>
          </div>

          <div className="d-flex gap-2">
            {onCancel && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onCancel}
                disabled={disabled}
              >
                Geri
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm" disabled={disabled}>
              {saving
                ? mode === 'create'
                  ? 'Oluşturuluyor...'
                  : 'Kaydediliyor...'
                : mode === 'create'
                ? 'Yorumu Oluştur'
                : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="row g-2 mb-3">
                <div className="col-sm-4">
                  <label className="form-label small mb-1">Locale (Dil)</label>
                  <select
                    className="form-select form-select-sm"
                    value={values.locale}
                    onChange={handleLocaleChange}
                    disabled={disabled || (localesLoading && !locales.length)}
                  >
                    <option value="">
                      (Site varsayılanı{effectiveDefaultLocale ? `: ${effectiveDefaultLocale}` : ''}
                      )
                    </option>
                    {locales.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-text small">
                    Yorum metni bu locale için saklanır. Boş bırakırsan backend varsayılan locale
                    kullanır.
                  </div>
                </div>

                <div className="col-sm-8 d-flex align-items-end">
                  <div className="form-check me-3">
                    <input
                      id="is_active"
                      type="checkbox"
                      className="form-check-input"
                      checked={values.is_active}
                      onChange={handleCheckboxChange('is_active')}
                      disabled={disabled}
                    />
                    <label className="form-check-label small" htmlFor="is_active">
                      Aktif olsun
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      id="is_approved"
                      type="checkbox"
                      className="form-check-input"
                      checked={values.is_approved}
                      onChange={handleCheckboxChange('is_approved')}
                      disabled={disabled}
                    />
                    <label className="form-check-label small" htmlFor="is_approved">
                      Onaylı (sitede göster)
                    </label>
                  </div>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-sm-6">
                  <label className="form-label small mb-1">İsim</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={values.name}
                    onChange={handleChange('name')}
                    disabled={disabled}
                    required
                  />
                </div>

                <div className="col-sm-6">
                  <label className="form-label small mb-1">E-posta</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={values.email}
                    onChange={handleChange('email')}
                    disabled={disabled}
                    required
                  />
                </div>
              </div>

              <div className="mb-0">
                <label className="form-label small mb-1">Yorum</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={5}
                  value={values.comment}
                  onChange={handleChange('comment')}
                  disabled={disabled}
                  required
                />
              </div>
            </div>

            <div className="col-lg-4">
              <div className="mb-3">
                <label className="form-label small mb-1">Puan (1 - 5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="1"
                  className="form-control form-control-sm"
                  value={values.rating}
                  onChange={handleChange('rating')}
                  disabled={disabled}
                  required
                />
                <div className="form-text small">Ortalama puan hesaplamaları için kullanılır.</div>
              </div>

              <div className="mb-3">
                <label className="form-label small mb-1">Görünüm Sırası</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-control form-control-sm"
                  value={values.display_order}
                  onChange={handleChange('display_order')}
                  disabled={disabled}
                />
                <div className="form-text small">Küçük değerler listede daha üstte gösterilir.</div>
              </div>

              <div className="mb-0 small text-muted">
                Yorumlar public tarafta sadece <strong>onaylı</strong> ve <strong>aktif</strong> ise
                listelenir.
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
