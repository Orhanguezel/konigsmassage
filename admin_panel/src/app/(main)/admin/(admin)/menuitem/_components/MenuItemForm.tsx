// =============================================================
// FILE: src/components/admin/menuitem/MenuItemForm.tsx
// guezelwebdesign – Admin Menu Item Create / Edit Form (HEADER ONLY)
// =============================================================

'use client';

import React, { useMemo } from 'react';
import type { MenuItemType } from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type MenuItemFormValues = {
  title: string;
  url: string;
  type: MenuItemType;
  page_id: string | null;
  parent_id: string | null;

  // ✅ still in state for payload consistency, but UI does not edit it
  location: 'header';

  icon: string;
  section_id: string | null;
  is_active: boolean;
  display_order: number;
  locale: string; // short: "de" | "en" ...
};

export type MenuItemFormProps = {
  mode: 'create' | 'edit';
  values: MenuItemFormValues;
  saving: boolean;
  loading?: boolean;
  localeOptions: { value: string; label: string }[];
  localesLoading?: boolean;
  onChange: (field: keyof MenuItemFormValues, value: any) => void;
};

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();


    const ALL = '__all__' as const;

export const MenuItemForm: React.FC<MenuItemFormProps> = ({
  values,
  saving,
  loading,
  localeOptions,
  localesLoading,
  onChange,
}) => {
  const t = useAdminT('admin.menuitem');
  const disabled = !!saving || !!loading;

  const normalizedLocaleOptions = useMemo(() => {
    const list = (localeOptions ?? []).map((o) => ({
      value: toShortLocale(o.value),
      label: o.label,
    }));
    return list.filter((x, idx, arr) => arr.findIndex((y) => y.value === x.value) === idx);
  }, [localeOptions]);

  const localeValue = useMemo(() => {
    const cur = toShortLocale(values.locale);
    if (cur && normalizedLocaleOptions.some((o) => o.value === cur)) return cur;
    const first = normalizedLocaleOptions[0]?.value;
    return cur || first || '';
  }, [values.locale, normalizedLocaleOptions]);

  const handleChange =
    (field: keyof MenuItemFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      let value: any = target.value;

      if (field === 'is_active') value = (target as HTMLInputElement).checked;
      else if (field === 'display_order') {
        const n = Number(value);
        value = Number.isFinite(n) ? n : 0;
      } else if (field === 'locale') {
        value = toShortLocale(value);
      }

      onChange(field, value);
    };

  return (
    <div className="row g-3">
      <div className="col-12">
        <div
          className="alert alert-light border small mb-0"
          dangerouslySetInnerHTML={{ __html: t('form.headerHelp') }}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label form-label-sm">
          {t('form.labels.title')} <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={values.title}
          onChange={handleChange('title')}
          disabled={disabled}
          required
        />
      </div>

      <div className="col-md-3">
        <label className="form-label form-label-sm">
          {t('header.localeLabel')}{' '}
          {localesLoading && <span className="spinner-border spinner-border-sm ms-1" />}
        </label>
        <select
          className="form-select form-select-sm"
          value={localeValue}
          onChange={handleChange('locale')}
          disabled={disabled || !!localesLoading}
        >
          {normalizedLocaleOptions.length === 0 ? (
            <option value={ALL}>{t('list.loading')}</option>
          ) : null}
          {normalizedLocaleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="col-md-3">
        <label className="form-label form-label-sm">{t('header.sortOrder')}</label>
        <input
          type="number"
          className="form-control form-control-sm"
          value={values.display_order}
          onChange={handleChange('display_order')}
          disabled={disabled}
          min={0}
        />
      </div>

      <div className="col-md-3">
        <label className="form-label form-label-sm">
          {t('list.columns.type')} <span className="text-danger">*</span>
        </label>
        <select
          className="form-select form-select-sm"
          value={values.type}
          onChange={handleChange('type')}
          disabled={disabled}
        >
          <option value="custom">{t('list.types.custom')}</option>
          <option value="page">{t('list.types.page')}</option>
        </select>
      </div>

      {/* ✅ Konum alanı kaldırıldı */}

      <div className="col-md-9">
        <label className="form-label form-label-sm">
          {t('form.labels.url')} {values.type === 'custom' && <span className="text-danger">*</span>}
        </label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder={
            values.type === 'custom'
              ? t('form.placeholders.url')
              : t('form.placeholders.urlPage')
          }
          value={values.url}
          onChange={handleChange('url')}
          disabled={disabled}
        />
        <div
          className="form-text"
          dangerouslySetInnerHTML={{ __html: t('form.urlCustomHelp') }}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label form-label-sm">{t('form.labels.icon')}</label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder={t('form.placeholders.icon')}
          value={values.icon}
          onChange={handleChange('icon')}
          disabled={disabled}
        />
      </div>

      <div className="col-md-3 d-flex align-items-end">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="menuitem-active-switch"
            checked={values.is_active}
            onChange={handleChange('is_active')}
            disabled={disabled}
          />
          <label className="form-check-label small" htmlFor="menuitem-active-switch">
            {t('header.active')}
          </label>
        </div>
      </div>

      <div className="col-12">
        <div
          className="form-text small text-muted"
          dangerouslySetInnerHTML={{ __html: t('form.advancedUsageHelp') }}
        />
      </div>
    </div>
  );
};
