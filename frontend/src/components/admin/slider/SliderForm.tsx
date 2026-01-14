// =============================================================
// FILE: src/components/admin/slider/SliderForm.tsx
// konigsmassage – Slider Form Fields (LEFT COLUMN ONLY – NO JSON, NO IMAGE)
// CategoryFormFields pattern'ine uygun
// =============================================================

'use client';

import React, { useMemo } from 'react';

export type SliderFormValues = {
  locale: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  alt: string;
  buttonText: string;
  buttonLink: string;
  featured: boolean;
  is_active: boolean;
  display_order: number;
};

export type SliderFormProps = {
  mode: 'create' | 'edit';
  values: SliderFormValues;

  onChange: <K extends keyof SliderFormValues>(field: K, value: SliderFormValues[K]) => void;

  /**
   * Locale değişimi SliderFormPage tarafından yönetilir.
   * - create: sadece state.locale set
   * - edit: aynı slider id için locale ile tekrar fetch / 404 ise yeni çeviri
   */
  onLocaleChange?: (locale: string) => void;

  saving: boolean;
  localeOptions: { value: string; label: string }[];
  localesLoading?: boolean;
};

export const SliderForm: React.FC<SliderFormProps> = ({
  values,
  onChange,
  onLocaleChange,
  saving,
  localeOptions,
  localesLoading,
}) => {
  // UI'da gösterilecek locale (state boş/invalid olsa bile dropdown bozulmasın)
  const effectiveLocaleValue = useMemo(() => {
    const current = (values.locale || '').toLowerCase();
    const valid = new Set((localeOptions ?? []).map((x) => String(x.value).toLowerCase()));
    if (current && valid.has(current)) return current;
    return (localeOptions?.[0]?.value || '').toLowerCase();
  }, [values.locale, localeOptions]);

  return (
    <div className="row g-2">
      {/* Locale */}
      <div className="col-md-4">
        <label className="form-label small">
          Dil {localesLoading && <span className="spinner-border spinner-border-sm ms-1" />}
        </label>

        <select
          className="form-select form-select-sm"
          disabled={saving || localesLoading}
          value={effectiveLocaleValue}
          onChange={(e) => {
            const next = (e.target.value || '').toLowerCase();
            // Category/SubCategory pattern: locale değişimini ayrı handler yönetir
            onLocaleChange?.(next);
          }}
        >
          {(localeOptions ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* display_order */}
      <div className="col-md-4">
        <label className="form-label small">Sıralama</label>
        <input
          type="number"
          className="form-control form-control-sm"
          disabled={saving}
          value={values.display_order}
          onChange={(e) => onChange('display_order', Number(e.target.value) || 0)}
        />
      </div>

      {/* flags */}
      <div className="col-md-4 d-flex align-items-end">
        <div className="d-flex gap-3 small">
          <div className="form-check form-switch">
            <input
              id="slider-is-active"
              type="checkbox"
              className="form-check-input"
              disabled={saving}
              checked={!!values.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="slider-is-active">
              Aktif
            </label>
          </div>

          <div className="form-check form-switch">
            <input
              id="slider-featured"
              type="checkbox"
              className="form-check-input"
              disabled={saving}
              checked={!!values.featured}
              onChange={(e) => onChange('featured', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="slider-featured">
              Öne çıkan
            </label>
          </div>
        </div>
      </div>

      {/* name */}
      <div className="col-md-6">
        <label className="form-label small">Başlık</label>
        <input
          className="form-control form-control-sm"
          disabled={saving}
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
        />
      </div>

      {/* slug */}
      <div className="col-md-6">
        <label className="form-label small">Slug</label>
        <input
          className="form-control form-control-sm"
          disabled={saving}
          value={values.slug}
          onChange={(e) => onChange('slug', e.target.value)}
        />
        <div className="form-text small">
          Başlık alanını doldururken otomatik oluşabilir; istersen manuel değiştirebilirsin.
        </div>
      </div>

      {/* description */}
      <div className="col-12">
        <label className="form-label small">Açıklama</label>
        <textarea
          rows={3}
          className="form-control form-control-sm"
          disabled={saving}
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>

      {/* alt */}
      <div className="col-md-4">
        <label className="form-label small">Alt</label>
        <input
          className="form-control form-control-sm"
          disabled={saving}
          value={values.alt}
          onChange={(e) => onChange('alt', e.target.value)}
        />
      </div>

      {/* button text */}
      <div className="col-md-4">
        <label className="form-label small">Buton Metni</label>
        <input
          className="form-control form-control-sm"
          disabled={saving}
          value={values.buttonText}
          onChange={(e) => onChange('buttonText', e.target.value)}
        />
      </div>

      {/* button link */}
      <div className="col-md-4">
        <label className="form-label small">Buton Linki</label>
        <input
          className="form-control form-control-sm"
          disabled={saving}
          value={values.buttonLink}
          onChange={(e) => onChange('buttonLink', e.target.value)}
        />
      </div>

      {/* image_url */}
      <div className="col-12">
        <label className="form-label small">Görsel URL</label>
        <input
          className="form-control form-control-sm"
          disabled={saving}
          value={values.image_url}
          onChange={(e) => onChange('image_url', e.target.value)}
        />
      </div>
    </div>
  );
};
