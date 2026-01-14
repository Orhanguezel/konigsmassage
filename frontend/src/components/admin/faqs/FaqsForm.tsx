// =============================================================
// FILE: src/components/admin/faqs/FaqsForm.tsx
// konigsmassage – FAQ Form Fields (LEFT COLUMN ONLY)
// RTK FaqCreate/Update payloadları ile uyumlu
// - Locale select: AdminLocaleSelect (shared) + normalize + disabled logic
// =============================================================

'use client';

import React from 'react';
import type { LocaleOption } from '@/components/admin/faqs/FaqsHeader';

import { AdminLocaleSelect } from '@/components/common/AdminLocaleSelect';

export type FaqsFormValues = {
  locale: string;

  is_active: boolean;
  display_order: number;

  question: string;
  answer: string;
  slug: string;
};

export type FaqsFormProps = {
  mode: 'create' | 'edit';
  values: FaqsFormValues;

  onChange: <K extends keyof FaqsFormValues>(field: K, value: FaqsFormValues[K]) => void;

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

export const FaqsForm: React.FC<FaqsFormProps> = ({
  values,
  onChange,
  onLocaleChange,
  saving,
  localeOptions,
  localesLoading,
}) => {
  const options = (localeOptions ?? [])
    .map((x) => ({
      value: toShortLocale(x.value),
      label: x.label,
    }))
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
    <div className="row g-2">
      {/* Locale */}
      <div className="col-md-4">
        <AdminLocaleSelect
          id="faq-locale"
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

      {/* aktif flag */}
      <div className="col-md-4 d-flex align-items-end">
        <div className="form-check form-switch small">
          <input
            type="checkbox"
            className="form-check-input"
            disabled={saving}
            checked={!!values.is_active}
            onChange={(e) => onChange('is_active', e.target.checked)}
            id="faq-is-active"
          />
          <label className="form-check-label" htmlFor="faq-is-active">
            Aktif
          </label>
        </div>
      </div>

      {/* question */}
      <div className="col-12">
        <label className="form-label small">Soru (question)</label>
        <input
          className="form-control form-control-sm"
          disabled={saving}
          value={values.question}
          onChange={(e) => onChange('question', e.target.value)}
        />
      </div>

      {/* answer */}
      <div className="col-12">
        <label className="form-label small">Cevap (answer)</label>
        <textarea
          className="form-control form-control-sm"
          rows={5}
          disabled={saving}
          value={values.answer}
          onChange={(e) => onChange('answer', e.target.value)}
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
    </div>
  );
};
