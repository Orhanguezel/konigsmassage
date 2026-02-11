'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/slider/_components/SliderFormPage.tsx
// FINAL — Services pattern form page
// - Locale injected from detail-client (single source)
// - No locale resolving here
// - No stuck loading: uses `loading` from detail-client (skip not counted)
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { SliderAdminDto } from '@/integrations/shared';
import { useCreateSliderAdminMutation, useUpdateSliderAdminMutation } from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { SliderFormHeader } from './SliderFormHeader';
import { SliderForm, type SliderFormValues } from './SliderForm';
import { SliderFormImageColumn } from './SliderFormImageColumn';
import { SliderFormJsonSection } from './SliderFormJsonSection';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

const norm = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const normLocale = (v: unknown) => norm(v).toLowerCase();
const toNull = (v: unknown) => {
  const s = norm(v);
  return s ? s : null;
};
const toInt = (v: unknown, fallback = 0) => {
  const n = Number(norm(v));
  return Number.isFinite(n) ? n : fallback;
};

function buildValuesFromDto(dto: SliderAdminDto | null, locale: string): SliderFormValues {
  const d: any = dto || {};
  const loc = normLocale(locale || d?.locale);
  return {
    locale: loc || '',

    name: norm(d.name),
    slug: norm(d.slug),
    description: norm(d.description),

    image_url: norm(d.image_effective_url || d.image_url),
    alt: norm(d.alt),

    buttonText: norm(d.buttonText || d.button_text),
    buttonLink: norm(d.buttonLink || d.button_link),

    featured: !!d.featured,
    is_active: d.is_active !== false,
    display_order: toInt(d.display_order, 0),
  };
}

export type SliderFormPageProps = {
  mode: 'create' | 'edit';

  locale: string;
  localeOptions: { value: string; label: string }[];
  localesLoading: boolean;

  initialData: SliderAdminDto | null;
  loading: boolean;

  onDone?: () => void;
};

export function SliderFormPage({
  mode,
  locale,
  localeOptions,
  localesLoading,
  initialData,
  loading,
  onDone,
}: SliderFormPageProps) {
  const router = useRouter();
  const t = useAdminT();

  const [createSlider, { isLoading: isCreating }] = useCreateSliderAdminMutation();
  const [updateSlider, { isLoading: isUpdating }] = useUpdateSliderAdminMutation();

  const saving = isCreating || isUpdating;
  const disabled = loading || localesLoading || saving;

  const [viewMode, setViewMode] = React.useState<'form' | 'json'>('form');

  const [values, setValues] = React.useState<SliderFormValues>(() =>
    buildValuesFromDto(initialData, locale),
  );

  // sync when dto/locale changes
  React.useEffect(() => {
    setValues((prev) => {
      const next = buildValuesFromDto(initialData, locale || prev.locale);

      const current = normLocale(prev.locale);
      const set = new Set((localeOptions ?? []).map((o) => normLocale(o.value)));

      // keep current if valid, else fall back to injected locale
      const safeLocale = current && set.has(current) ? current : normLocale(locale);

      return { ...next, locale: safeLocale || next.locale };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, locale, localeOptions]);

  const handleChange = <K extends keyof SliderFormValues>(k: K, v: SliderFormValues[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }));
  };

  const handleLocaleChange = (nextLocale: string) => {
    const nl = normLocale(nextLocale);
    if (!nl) return;
    setValues((prev) => ({ ...prev, locale: nl }));
    // URL sync'ini detail-client tarafında yapıyorsun (services pattern)
  };

  const validate = () => {
    const loc = normLocale(values.locale || locale);
    if (!loc) return t('admin.slider.form.localeRequired');
    if (!norm(values.name)) return t('admin.slider.form.titleRequired');
    if (!norm(values.slug)) return t('admin.slider.form.slugRequired');
    return '';
  };

  const persist = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const id = String((initialData as any)?.id || '');

    const payload: any = {
      locale: normLocale(values.locale || locale),

      name: norm(values.name),
      slug: norm(values.slug),
      description: String(values.description || ''),

      image_url: toNull(values.image_url),
      alt: toNull(values.alt),

      buttonText: toNull(values.buttonText),
      buttonLink: toNull(values.buttonLink),

      featured: !!values.featured,
      is_active: !!values.is_active,
      display_order: toInt(values.display_order, 0),
    };

    try {
      if (mode === 'create') {
        const tries = [
          () => createSlider(payload as any).unwrap(),
          () => createSlider({ payload } as any).unwrap(),
          () => createSlider({ data: payload } as any).unwrap(),
        ];

        let created: any = null;
        let lastErr: any = null;

        for (const fn of tries) {
          try {
            created = await fn();
            lastErr = null;
            break;
          } catch (e: any) {
            lastErr = e;
          }
        }
        if (lastErr) throw lastErr;

        const newId = String(created?.id || created?.data?.id || '');
        toast.success(t('admin.slider.form.created'));

        if (newId) {
          const loc = payload.locale;
          const href = loc
            ? `/admin/slider/${encodeURIComponent(newId)}?locale=${encodeURIComponent(loc)}`
            : `/admin/slider/${encodeURIComponent(newId)}`;
          router.replace(href);
        } else {
          onDone?.();
        }
      } else {
        if (!id) {
          toast.error(t('admin.slider.form.idNotFound'));
          return;
        }

        const patch = payload;

        const tries = [
          () => updateSlider({ id, patch } as any).unwrap(),
          () => updateSlider({ id, payload: patch } as any).unwrap(),
          () => updateSlider({ id, data: patch } as any).unwrap(),
          () => updateSlider({ sliderId: id, patch } as any).unwrap(),
          () => updateSlider({ sliderId: id, payload: patch } as any).unwrap(),
        ];

        let lastErr: any = null;
        for (const fn of tries) {
          try {
            await fn();
            lastErr = null;
            break;
          } catch (e: any) {
            lastErr = e;
          }
        }
        if (lastErr) throw lastErr;

        toast.success(t('admin.slider.form.updated'));
        onDone?.();
      }
    } catch (e: any) {
      const msg =
        e?.data?.error?.message || e?.data?.message || e?.message || t('admin.slider.form.saveError');
      toast.error(msg);
    }
  };

  const title =
    mode === 'edit' ? norm((initialData as any)?.name) || t('admin.slider.form.editTitle') : t('admin.slider.form.createTitle');

  const effectiveLoc = normLocale(values.locale || locale);

  return (
    <div className="space-y-4">
      <SliderFormHeader
        mode={mode}
        title={title}
        loading={loading || localesLoading}
        saving={saving}
        onBack={onDone}
        onSave={persist}
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={viewMode === 'form' ? 'default' : 'outline'}
              onClick={() => setViewMode('form')}
              disabled={disabled}
            >
              {t('admin.slider.form.formMode')}
            </Button>
            <Button
              type="button"
              variant={viewMode === 'json' ? 'default' : 'outline'}
              onClick={() => setViewMode('json')}
              disabled={disabled}
            >
              {t('admin.slider.form.jsonMode')}
            </Button>
          </div>

          {viewMode === 'json' ? (
            <SliderFormJsonSection
              value={values as any}
              disabled={disabled}
              onChange={(next) => setValues(next as any)}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <SliderForm
                  mode={mode}
                  values={values}
                  onChange={handleChange}
                  onLocaleChange={handleLocaleChange}
                  saving={disabled}
                  localeOptions={localeOptions}
                  localesLoading={localesLoading}
                />
              </div>

              <div className="space-y-4">
                <SliderFormImageColumn
                  disabled={disabled}
                  locale={effectiveLoc}
                  value={{ image_url: values.image_url, alt: values.alt }}
                  metadata={{
                    module_key: 'slider',
                    locale: effectiveLoc,
                    ...(mode === 'edit' && (initialData as any)?.id
                      ? { slider_id: String((initialData as any).id) }
                      : {}),
                    slug: values.slug || values.name || '',
                  }}
                  onChange={(patch) => {
                    if (typeof patch.image_url === 'string')
                      handleChange('image_url', patch.image_url);
                    if (typeof patch.alt === 'string') handleChange('alt', patch.alt);
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
