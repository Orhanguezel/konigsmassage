// =============================================================
// FILE: src/components/admin/footer-sections/FooterSectionsForm.tsx
// konigsmassage – Footer Section Form Fields
// - Locale select: AdminLocaleSelect (shared)
// =============================================================

'use client';

import React from 'react';
import type { LocaleOption } from '@/components/admin/footer-sections/FooterSectionsHeader';

import { AdminLocaleSelect } from '@/components/common/AdminLocaleSelect';

export type FooterSectionsFormValues = {
  locale: string;

  is_active: boolean;
  display_order: number;

  title: string;
  slug: string;
  description: string;

  meta: any;
};

export type FooterSectionsFormProps = {
  mode: 'create' | 'edit';
  values: FooterSectionsFormValues;

  onChange: <K extends keyof FooterSectionsFormValues>(
    field: K,
    value: FooterSectionsFormValues[K],
  ) => void;

  onLocaleChange?: (locale: string) => void;

  saving: boolean;
  localeOptions: LocaleOption[];
  localesLoading?: boolean;
};

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

export const FooterSectionsForm: React.FC<FooterSectionsFormProps> = ({
  values,
  onChange,
  onLocaleChange,
  saving,
  localeOptions,
  localesLoading,
}) => {
  const options = (localeOptions ?? [])
    .map((x) => ({ value: toShortLocale(x.value), label: x.label }))
    .filter((x) => !!x.value);

  const hasOptions = options.length > 0;
  const value = toShortLocale(values.locale);

  const handleLocale = (raw: string) => {
    const next = toShortLocale(raw);
    if (!next) return;
    onChange('locale', next);
    onLocaleChange?.(next);
  };

  return (
    <div className="row g-3">
      {/* Locale */}
      <div className="col-md-4">
        <AdminLocaleSelect
          id="footer-section-locale"
          label="Dil"
          value={value}
          onChange={handleLocale}
          options={options}
          loading={!!localesLoading}
          disabled={saving || !hasOptions}
        />
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

      {/* aktif */}
      <div className="col-md-4 d-flex align-items-end">
        <div className="form-check form-switch small">
          <input
            type="checkbox"
            className="form-check-input"
            disabled={saving}
            checked={!!values.is_active}
            onChange={(e) => onChange('is_active', e.target.checked)}
            id="footer-section-is-active"
          />
          <label className="form-check-label" htmlFor="footer-section-is-active">
            Aktif
          </label>
        </div>
      </div>

      {/* title */}
      <div className="col-md-6">
        <label className="form-label small">Başlık (title)</label>
        <input
          className="form-control form-control-sm"
          disabled={saving}
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
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
      </div>

      {/* description */}
      <div className="col-12">
        <label className="form-label small">Açıklama (description)</label>
        <textarea
          className="form-control form-control-sm"
          rows={4}
          disabled={saving}
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>

      {/* meta (structured form yoksa bile burada minimal gösterelim) */}
      <div className="col-12">
        <div className="alert alert-secondary small py-2 mb-0">
          <strong>Not:</strong> Meta alanı JSON modunda yönetilir.
        </div>
      </div>
    </div>
  );
};
