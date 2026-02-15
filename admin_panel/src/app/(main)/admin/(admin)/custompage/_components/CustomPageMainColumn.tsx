// =============================================================
// FILE: src/app/(main)/admin/(admin)/custompage/_components/CustomPageMainColumn.tsx
// FINAL — Main column: publish, title, slug, summary, rich content
// - ✅ Uses RichContentEditor (new common path)
// - ✅ No locale select here (single source in CustomPageForm)
// =============================================================

'use client';

import React from 'react';
import type { CustomPageFormValues } from './CustomPageForm';

import RichContentEditor from '@/app/(main)/admin/_components/common/RichContentEditor';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

/* slugify */
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
  const t = useAdminT();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            id="is_published"
            type="checkbox"
            className="h-4 w-4"
            checked={values.is_published}
            onChange={handleCheckboxChange('is_published')}
            disabled={disabled}
          />
          <span>{t('admin.customPage.form.isPublished')}</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            id="featured"
            type="checkbox"
            className="h-4 w-4"
            checked={values.featured}
            onChange={handleCheckboxChange('featured')}
            disabled={disabled}
          />
          <span>{t('admin.customPage.form.featured')}</span>
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">{t('admin.customPage.form.title')}</label>
        <input
          type="text"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Slug</label>
        <input
          type="text"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={values.slug}
          onFocus={() => setSlugTouched(true)}
          onChange={(e) => {
            setSlugTouched(true);
            setValues((prev) => ({ ...prev, slug: e.target.value }));
          }}
          disabled={disabled}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">{t('admin.customPage.form.summary')}</label>
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          rows={3}
          value={values.summary}
          onChange={handleChange('summary')}
          disabled={disabled}
        />
      </div>

      <div>
        <div className="mb-1 text-xs text-muted-foreground">{t('admin.customPage.form.content')}</div>
        <RichContentEditor
          value={values.content}
          disabled={disabled}
          onChange={(html: string) => setValues((prev) => ({ ...prev, content: html }))}
        />
      </div>
    </div>
  );
};
