// =============================================================
// FILE: src/components/admin/custompage/CustomPageMainColumn.tsx
// Responsive spacing fix:
// - Removed duplicate locale select (single source in CustomPageForm)
// - Tighter margins on small screens
// =============================================================

import React from 'react';
import type { LocaleOption } from './CustomPageHeader';
import type { CustomPageFormValues } from './CustomPageForm';
import RichContentEditor from '@/components/common/RichContentEditor';

/* ----------------- slugify sadece bu kolon için ----------------- */
const slugify = (value: string): string => {
  if (!value) return '';

  let s = value.trim();

  const trMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    I: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  };
  s = s
    .split('')
    .map((ch) => trMap[ch] ?? ch)
    .join('');

  s = s.replace(/ß/g, 'ss').replace(/ẞ/g, 'ss');

  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

type Props = {
  values: CustomPageFormValues;
  disabled: boolean;
  slugTouched: boolean;
  setSlugTouched: (v: boolean) => void;
  setValues: React.Dispatch<React.SetStateAction<CustomPageFormValues>>;
  handleChange: (
    field: keyof CustomPageFormValues,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  effectiveDefaultLocale: string;
  locales: LocaleOption[];
  localesLoading?: boolean;
  isLocaleSwitchLoading: boolean;
  handleLocaleChange: (nextLocale: string) => void;
  handleCheckboxChange: (
    field: keyof CustomPageFormValues,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const CustomPageMainColumn: React.FC<Props> = ({
  values,
  disabled,
  slugTouched,
  setSlugTouched,
  setValues,
  handleChange,
  handleCheckboxChange,
}) => {
  return (
    <>
      {/* Publish toggle (compact) */}
      <div className="d-flex align-items-center gap-2 mb-2 mb-lg-3">
        <div className="form-check mb-0">
          <input
            id="is_published"
            type="checkbox"
            className="form-check-input"
            checked={values.is_published}
            onChange={handleCheckboxChange('is_published')}
            disabled={disabled}
          />
          <label className="form-check-label small" htmlFor="is_published">
            Yayında olsun
          </label>
        </div>
      </div>

      {/* Başlık */}
      <div className="mb-2 mb-lg-3">
        <label className="form-label small mb-1">Başlık</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={values.title}
          onChange={(e) => {
            const titleValue = e.target.value;
            setValues((prev) => {
              const next: CustomPageFormValues = { ...prev, title: titleValue };
              if (!slugTouched) next.slug = slugify(titleValue);
              return next;
            });
          }}
          disabled={disabled}
          required
        />
      </div>

      {/* Slug */}
      <div className="mb-2 mb-lg-3">
        <label className="form-label small mb-1">Slug</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={values.slug}
          onFocus={() => setSlugTouched(true)}
          onChange={(e) => {
            setSlugTouched(true);
            const val = e.target.value;
            setValues((prev) => ({ ...prev, slug: val }));
          }}
          disabled={disabled}
          required
        />
      </div>

      {/* Özet */}
      <div className="mb-2 mb-lg-3">
        <label className="form-label small mb-1">Özet (Summary)</label>
        <textarea
          className="form-control form-control-sm"
          rows={3}
          value={values.summary}
          onChange={handleChange('summary')}
          disabled={disabled}
        />
      </div>

      {/* Zengin Metin */}
      <RichContentEditor
        value={values.content}
        disabled={disabled}
        onChange={(html: string) =>
          setValues((prev) => ({
            ...prev,
            content: html,
          }))
        }
      />
    </>
  );
};
