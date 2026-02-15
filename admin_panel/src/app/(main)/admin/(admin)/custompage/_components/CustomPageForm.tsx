// =============================================================
// FILE: src/app/(main)/admin/(admin)/custompage/_components/CustomPageForm.tsx
// FINAL — Admin Custom Page Create/Edit Form (container)
// - ✅ Cover + Gallery (multi) + "set as cover"
// - ✅ Locale select single source: AdminLocaleSelect
// - ✅ JSON mode uses AdminJsonEditor
// - ✅ App Router paths + no inline styles
// =============================================================

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import type { CustomPageDto } from '@/integrations/shared';
import { useLazyListCustomPagesAdminQuery } from '@/integrations/hooks';

import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

import type { LocaleOption } from './CustomPageHeader';
import { CustomPageMainColumn } from './CustomPageMainColumn';
import { CustomPageSidebarColumn } from './CustomPageSidebarColumn';
import { CustomPageFormImageColumn } from './CustomPageFormImageColumn';

/* ------------------------------------------------------------- */
/*  Types                                                        */
/* ------------------------------------------------------------- */

export type CustomPageFormValues = {
  id?: string;
  page_id?: string;

  locale: string;
  is_published: boolean;
  featured: boolean;
  title: string;
  slug: string;
  content: string;

  featured_image: string;
  featured_image_asset_id: string;
  featured_image_alt: string;

  summary: string;

  meta_title: string;
  meta_description: string;

  tags: string;

  images: string[];
  storage_image_ids: string[];
};

export type CustomPageFormProps = {
  mode: 'create' | 'edit';
  initialData?: CustomPageDto;
  loading: boolean;
  saving: boolean;

  locales: LocaleOption[];
  localesLoading?: boolean;

  defaultLocale?: string;
  onLocaleChange?: (nextLocale: string) => void;

  onSubmit: (values: CustomPageFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export type ContentImageSize = 'sm' | 'md' | 'lg' | 'full';

/* ------------------------------------------------------------- */
/*  Helpers                                                      */
/* ------------------------------------------------------------- */

const norm = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const getLocaleFromDto = (dto?: CustomPageDto, fallback = 'de') => {
  const raw = dto?.locale_resolved ?? fallback;
  return norm(raw) || norm(fallback) || 'de';
};

const buildInitialValues = (
  initial: CustomPageDto | undefined,
  fallbackLocale: string | undefined,
): CustomPageFormValues => {
  const safeLocale = norm(fallbackLocale || 'de') || 'de';

  if (!initial) {
    return {
      id: undefined,
      page_id: undefined,

      locale: safeLocale,
      is_published: false,
      featured: false,
      title: '',
      slug: '',
      content: '',

      featured_image: '',
      featured_image_asset_id: '',
      featured_image_alt: '',

      summary: '',
      meta_title: '',
      meta_description: '',

      tags: '',

      images: [],
      storage_image_ids: [],
    };
  }

  const tagsString =
    Array.isArray(initial.tags) && initial.tags.length
      ? initial.tags.join(', ')
      : (initial.tags_raw ?? '');

  const resolvedLocale = getLocaleFromDto(initial, safeLocale);

  return {
    id: initial.id,
    page_id: initial.id,

    locale: resolvedLocale,
    is_published: !!initial.is_published,
    featured: !!initial.featured,

    title: initial.title ?? '',
    slug: initial.slug ?? '',
    content: initial.content ?? initial.content_html ?? '',

    featured_image: initial.featured_image ?? '',
    featured_image_asset_id: initial.featured_image_asset_id ?? '',
    featured_image_alt: initial.featured_image_alt ?? '',

    summary: initial.summary ?? '',
    meta_title: initial.meta_title ?? '',
    meta_description: initial.meta_description ?? '',

    tags: tagsString,

    images: Array.isArray(initial.images) ? initial.images : [],
    storage_image_ids: Array.isArray(initial.storage_image_ids)
      ? initial.storage_image_ids
      : [],
  };
};

const buildContentImageHtml = (url: string, alt = '', size: ContentImageSize = 'lg'): string => {
  const safeAlt = alt.replace(/"/g, '&quot;');
  return `
<figure class="content-image-block content-image-${size}">
  <img src="${url}" alt="${safeAlt}" loading="lazy" />
</figure>
`.trim();
};

/* ------------------------------------------------------------- */
/*  Component                                                    */
/* ------------------------------------------------------------- */

export const CustomPageForm: React.FC<CustomPageFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  locales,
  localesLoading,
  defaultLocale,
  onLocaleChange,
  onSubmit,
  onCancel,
}) => {
  const t = useAdminT();
  const safeDefaultLocale = norm(defaultLocale || 'de') || 'de';

  const [values, setValues] = useState<CustomPageFormValues>(
    buildInitialValues(initialData, safeDefaultLocale),
  );

  const [slugTouched, setSlugTouched] = useState(false);
  const [activeMode, setActiveMode] = useState<'form' | 'json'>('form');

  const [contentImagePreview, setContentImagePreview] = useState<string>('');
  const [contentImageSize, setContentImageSize] = useState<ContentImageSize>('lg');
  const [manualImageUrl, setManualImageUrl] = useState<string>('');
  const [manualImageAlt, setManualImageAlt] = useState<string>('');

  const [triggerListPages, { isLoading: isLocaleSwitchLoading }] =
    useLazyListCustomPagesAdminQuery();

  const localeReqSeq = useRef(0);
  const pendingLocaleRef = useRef<string>('');

  useEffect(() => {
    if (!initialData) {
      setValues(buildInitialValues(undefined, safeDefaultLocale));
      setSlugTouched(false);
      pendingLocaleRef.current = '';
      return;
    }

    const incomingLocale = getLocaleFromDto(initialData, safeDefaultLocale);
    const wantedLocale = norm(pendingLocaleRef.current || '');

    if (mode === 'edit' && wantedLocale && incomingLocale !== wantedLocale) return;

    pendingLocaleRef.current = '';
    setValues(buildInitialValues(initialData, safeDefaultLocale));
    setSlugTouched(false);
  }, [initialData, safeDefaultLocale, mode]);

  useEffect(() => {
    if (!values.locale) {
      setValues((p) => ({ ...p, locale: safeDefaultLocale }));
    }
  }, [values.locale, safeDefaultLocale]);

  const disabled = loading || saving;

  const handleChange =
    (field: keyof CustomPageFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setValues((prev) => ({ ...prev, [field]: val }) as CustomPageFormValues);
    };

  const handleCheckboxChange =
    (field: keyof CustomPageFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setValues((prev) => ({ ...prev, [field]: checked }) as CustomPageFormValues);
    };

  const handleLocaleChange = async (nextLocaleRaw: string) => {
    const nextLocale = norm(nextLocaleRaw || safeDefaultLocale) || safeDefaultLocale;

    if (norm(values.locale) === nextLocale) {
      onLocaleChange?.(nextLocale);
      return;
    }

    onLocaleChange?.(nextLocale);

    if (mode === 'create' || !initialData) {
      setValues((prev) => ({ ...prev, locale: nextLocale }));
      return;
    }

    const baseId = initialData.id;
    if (!baseId) {
      setValues((prev) => ({ ...prev, locale: nextLocale }));
      return;
    }

    pendingLocaleRef.current = nextLocale;
    const mySeq = ++localeReqSeq.current;

    setValues((prev) => ({ ...prev, locale: nextLocale }));

    try {
      const res = await triggerListPages({
        locale: nextLocale || undefined,
        limit: 200,
        offset: 0,
      } as any).unwrap();

      if (mySeq !== localeReqSeq.current) return;

      const items: CustomPageDto[] = res?.items ?? [];
      const match = items.find((item) => String(item?.id || '') === String(baseId));

      if (match) {
        const nextValues = buildInitialValues(match, safeDefaultLocale);
        nextValues.locale = nextLocale;
        setValues(nextValues);
        setSlugTouched(false);
        pendingLocaleRef.current = '';
      } else {
        toast.info(t('admin.customPage.form.localeRecordNotFound'));
      }
    } catch (err: any) {
      if (mySeq !== localeReqSeq.current) return;
      const status = err?.status ?? err?.originalStatus;
      if (status === 400) {
        toast.info(
          t('admin.customPage.form.localeRecordNotFound'),
        );
      } else {
        toast.error(t('admin.customPage.form.localeLoadFailed'));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (!values.title.trim() || !values.slug.trim()) {
      toast.error(t('admin.customPage.form.titleSlugRequired'));
      return;
    }

    void onSubmit({
      ...values,
      page_id: values.page_id ?? initialData?.id ?? undefined,

      locale: norm(values.locale || safeDefaultLocale) || safeDefaultLocale,
      title: values.title.trim(),
      slug: values.slug.trim(),
      summary: values.summary.trim(),
      meta_title: values.meta_title.trim(),
      meta_description: values.meta_description.trim(),
      tags: values.tags.trim(),
    });
  };

  const localeSelectOptions = useMemo(
    () => (locales ?? []).map((x) => ({ value: norm(x.value), label: x.label })),
    [locales],
  );

  const imageMetadata = useMemo<Record<string, string | number | boolean>>(
    () => ({
      module_key: 'custom_pages',
      locale: values.locale || safeDefaultLocale,
      page_slug: values.slug || values.title || '',
      ...(values.page_id || initialData?.id
        ? { page_id: values.page_id ?? (initialData?.id as string) }
        : {}),
    }),
    [values.locale, values.slug, values.title, values.page_id, safeDefaultLocale, initialData?.id],
  );

  const handleAddContentImage = (url: string, alt?: string) => {
    if (!url) return;
    const htmlBlock = buildContentImageHtml(url, alt ?? '', contentImageSize);

    setContentImagePreview(url);
    setValues((prev) => ({
      ...prev,
      content: (prev.content || '') + '\n\n' + htmlBlock + '\n\n',
    }));
    toast.success(t('admin.customPage.form.imageAddedToContent'));
  };

  const handleAddManualImage = () => {
    const url = manualImageUrl.trim();
    if (!url) {
      toast.error(t('admin.customPage.form.invalidImageUrl'));
      return;
    }
    handleAddContentImage(url, manualImageAlt.trim());
    setManualImageUrl('');
    setManualImageAlt('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-card">
        <div className="border-b p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {mode === 'create' ? t('admin.customPage.form.createTitle') : t('admin.customPage.form.editTitle')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('admin.customPage.form.formDescription')}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-md border">
                <button
                  type="button"
                  className={[
                    'px-3 py-1 text-xs',
                    activeMode === 'form' ? 'bg-muted font-semibold' : 'bg-background',
                  ].join(' ')}
                  onClick={() => setActiveMode('form')}
                  disabled={disabled}
                >
                  Form
                </button>
                <button
                  type="button"
                  className={[
                    'px-3 py-1 text-xs',
                    activeMode === 'json' ? 'bg-muted font-semibold' : 'bg-background',
                  ].join(' ')}
                  onClick={() => setActiveMode('json')}
                  disabled={disabled}
                >
                  JSON
                </button>
              </div>

              {onCancel ? (
                <button
                  type="button"
                  className="rounded-md border px-3 py-1 text-xs"
                  onClick={onCancel}
                  disabled={disabled}
                >
                  {t('admin.customPage.form.back')}
                </button>
              ) : null}

              <button
                type="submit"
                className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-60"
                disabled={disabled}
              >
                {saving
                  ? mode === 'create'
                    ? t('admin.customPage.form.creating')
                    : t('admin.customPage.form.saving')
                  : mode === 'create'
                    ? t('admin.customPage.form.createBtn')
                    : t('admin.customPage.form.saveBtn')}
              </button>

              {loading || isLocaleSwitchLoading ? (
                <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                  {isLocaleSwitchLoading ? t('admin.customPage.form.switchingLocale') : t('admin.common.loading')}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-3">
          {activeMode === 'json' ? (
            <AdminJsonEditor
              value={values}
              disabled={disabled}
              onChange={(next) => setValues(next as CustomPageFormValues)}
              label="Custom Page JSON"
              helperText={t('admin.customPage.form.jsonHelperText')}
            />
          ) : (
            <>
              <div className="mb-4">
                <AdminLocaleSelect
                  value={values.locale}
                  onChange={handleLocaleChange}
                  options={localeSelectOptions as any}
                  loading={!!localesLoading}
                  disabled={
                    disabled ||
                    (!!localesLoading && !localeSelectOptions.length) ||
                    isLocaleSwitchLoading
                  }
                  label={t('admin.customPage.form.localeLabel')}
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  {t('admin.customPage.form.localeHint')}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <CustomPageMainColumn
                    values={values}
                    disabled={disabled}
                    slugTouched={slugTouched}
                    setSlugTouched={setSlugTouched}
                    setValues={setValues}
                    handleChange={handleChange}
                    handleCheckboxChange={handleCheckboxChange}
                  />
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <CustomPageFormImageColumn
                    metadata={imageMetadata}
                    disabled={disabled}
                    featuredImageValue={values.featured_image}
                    onFeaturedImageChange={(url) =>
                      setValues((prev) => ({ ...prev, featured_image: url }))
                    }
                    galleryUrls={values.images}
                    onGalleryUrlsChange={(urls) => setValues((prev) => ({ ...prev, images: urls }))}
                    onSelectAsCover={(url) =>
                      setValues((prev) => ({ ...prev, featured_image: url }))
                    }
                  />

                  <CustomPageSidebarColumn
                    values={values}
                    disabled={disabled}
                    imageMetadata={imageMetadata}
                    contentImageSize={contentImageSize}
                    setContentImageSize={setContentImageSize}
                    contentImagePreview={contentImagePreview}
                    handleAddContentImage={handleAddContentImage}
                    manualImageUrl={manualImageUrl}
                    manualImageAlt={manualImageAlt}
                    setManualImageUrl={setManualImageUrl}
                    setManualImageAlt={setManualImageAlt}
                    handleAddManualImage={handleAddManualImage}
                    setValues={setValues}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  );
};
