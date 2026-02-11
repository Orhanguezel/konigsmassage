'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/_components/SliderForm.tsx
// FINAL — Slug auto ONLY in create mode
// =============================================================

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import RichContentEditor from '@/app/(main)/admin/_components/common/RichContentEditor';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type AdminLocaleOption = { value: string; label: string };

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
  onLocaleChange?: (locale: string) => void;
  saving: boolean;
  localeOptions: AdminLocaleOption[];
  localesLoading?: boolean;
};

const norm = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const normLocale = (v: unknown) => norm(v).toLowerCase();

function slugify(v: string) {
  const s = (v || '').trim();
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function SliderForm({
  mode,
  values,
  onChange,
  onLocaleChange,
  saving,
  localeOptions,
  localesLoading,
}: SliderFormProps) {
  const t = useAdminT();
  const options = React.useMemo(
    () =>
      (localeOptions ?? [])
        .map((x) => ({ value: normLocale(x.value), label: String(x.label || '').trim() }))
        .filter((x) => !!x.value),
    [localeOptions],
  );

  const effectiveLocaleValue = React.useMemo(() => {
    const cur = normLocale(values.locale);
    const set = new Set(options.map((o) => o.value));
    if (cur && set.has(cur)) return cur;
    return options?.[0]?.value || '';
  }, [values.locale, options]);

  const [slugTouched, setSlugTouched] = React.useState(false);

  React.useEffect(() => {
    if (mode !== 'create') return;
    if (saving) return;
    if (!values.name) return;
    if (slugTouched) return;
    onChange('slug', slugify(values.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, mode, saving, slugTouched]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('admin.slider.form.contentTitle')}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t('admin.slider.form.localeLabel')}</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              disabled={saving || !!localesLoading || options.length === 0}
              value={effectiveLocaleValue}
              onChange={(e) => onLocaleChange?.(normLocale(e.target.value))}
            >
              {options.map((opt) => (
                <option key={`${opt.value}:${opt.label}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slider-order">{t('admin.slider.form.orderLabel')}</Label>
            <Input
              id="slider-order"
              type="number"
              value={Number(values.display_order) || 0}
              onChange={(e) => onChange('display_order', Number(e.target.value) || 0)}
              disabled={saving}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{t('admin.slider.form.activeLabel')}</div>
                <div className="text-xs text-muted-foreground">{t('admin.slider.form.activeHelp')}</div>
              </div>
              <Switch
                checked={!!values.is_active}
                onCheckedChange={(v) => onChange('is_active', !!v)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{t('admin.slider.form.featuredLabel')}</div>
                <div className="text-xs text-muted-foreground">{t('admin.slider.form.featuredHelp')}</div>
              </div>
              <Switch
                checked={!!values.featured}
                onCheckedChange={(v) => onChange('featured', !!v)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="slider-name">{t('admin.slider.form.titleLabel')}</Label>
            <Input
              id="slider-name"
              value={values.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slider-slug">{t('admin.slider.form.slugLabel')}</Label>
            <Input
              id="slider-slug"
              value={values.slug || ''}
              onFocus={() => setSlugTouched(true)}
              onChange={(e) => {
                setSlugTouched(true);
                onChange('slug', e.target.value);
              }}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.slider.form.slugHelp')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('admin.slider.form.descriptionLabel')}</Label>
          <RichContentEditor
            label=""
            value={values.description || ''}
            onChange={(next) => onChange('description', String(next || ''))}
            disabled={saving}
            height="240px"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="slider-btn-text">{t('admin.slider.form.buttonTextLabel')}</Label>
            <Input
              id="slider-btn-text"
              value={values.buttonText || ''}
              onChange={(e) => onChange('buttonText', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slider-btn-link">{t('admin.slider.form.buttonLinkLabel')}</Label>
            <Input
              id="slider-btn-link"
              value={values.buttonLink || ''}
              onChange={(e) => onChange('buttonLink', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slider-alt">{t('admin.slider.form.altLabel')}</Label>
          <Input
            id="slider-alt"
            value={values.alt || ''}
            onChange={(e) => onChange('alt', e.target.value)}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
}
