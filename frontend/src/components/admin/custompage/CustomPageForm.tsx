// =============================================================
// FILE: src/components/admin/custompage/CustomPageForm.tsx
// konigsmassage – Admin Custom Page Create/Edit Form (container) (FINAL)
// - ✅ Custom Pages: cover + gallery (multi) + "set as cover"
// - ✅ Category/SubCategory REMOVED
// - ✅ Locale select single source: AdminLocaleSelect
// =============================================================

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { CustomPageDto } from '@/integrations/types';

import type { LocaleOption } from './CustomPageHeader';
import { AdminJsonEditor } from '@/components/common/AdminJsonEditor';

import { useLazyListCustomPagesAdminQuery } from '@/integrations/rtk/hooks';

import { CustomPageMainColumn } from './CustomPageMainColumn';
import { CustomPageSidebarColumn } from './CustomPageSidebarColumn';
import { CustomPageFormImageColumn } from './CustomPageFormImageColumn';

import { AdminLocaleSelect } from '@/components/common/AdminLocaleSelect';

/* ------------------------------------------------------------- */
/*  Types                                                        */
/* ------------------------------------------------------------- */

export type CustomPageFormValues = {
  id?: string;
  page_id?: string;

  locale: string;
  is_published: boolean;
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

  // ✅ parent gallery fields
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
  const raw = (dto as any)?.locale_resolved ?? (dto as any)?.locale ?? fallback;
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
    Array.isArray((initial as any)?.tags) && (initial as any).tags.length
      ? (initial as any).tags.join(', ')
      : (initial as any).tags_raw ?? '';

  const pageId = initial.id;
  const resolvedLocale = getLocaleFromDto(initial, safeLocale);

  return {
    id: initial.id,
    page_id: pageId,

    locale: resolvedLocale,

    is_published: !!initial.is_published,

    title: initial.title ?? '',
    slug: initial.slug ?? '',
    content: (initial as any).content ?? (initial as any).content_html ?? '',

    featured_image: (initial as any).featured_image ?? '',
    featured_image_asset_id: (initial as any).featured_image_asset_id ?? '',
    featured_image_alt: (initial as any).featured_image_alt ?? '',

    summary: (initial as any).summary ?? '',
    meta_title: (initial as any).meta_title ?? '',
    meta_description: (initial as any).meta_description ?? '',

    tags: tagsString,

    // ✅ normalized dto already returns arrays
    images: Array.isArray((initial as any).images) ? (initial as any).images : [],
    storage_image_ids: Array.isArray((initial as any).storage_image_ids)
      ? (initial as any).storage_image_ids
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

    if (mode === 'edit' && wantedLocale && incomingLocale !== wantedLocale) {
      return;
    }

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
      setValues((prev) => ({ ...prev, [field]: val } as CustomPageFormValues));
    };

  const handleCheckboxChange =
    (field: keyof CustomPageFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setValues((prev) => ({ ...prev, [field]: checked } as CustomPageFormValues));
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

      const items: CustomPageDto[] = (res as any)?.items ?? (res as any) ?? [];
      const match = items.find((item: any) => String(item?.id || '') === String(baseId));

      if (match) {
        const nextValues = buildInitialValues(match, safeDefaultLocale);
        nextValues.locale = nextLocale;
        setValues(nextValues);
        setSlugTouched(false);
        pendingLocaleRef.current = '';
      } else {
        toast.info(
          'Seçilen dil için mevcut kayıt bulunamadı; bu dilde yeni içerik oluşturabilirsin.',
        );
      }
    } catch (err: any) {
      if (mySeq !== localeReqSeq.current) return;

      const status = err?.status ?? err?.originalStatus;
      if (status === 400) {
        toast.info(
          'Seçilen dil için kayıt listesi alınamadı; bu dilde yeni içerik oluşturabilirsin.',
        );
      } else {
        toast.error('Seçilen dil için özel sayfa yüklenirken bir hata oluştu.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (!values.title.trim() || !values.slug.trim()) {
      toast.error('Başlık ve slug alanları zorunludur.');
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
    toast.success(
      'Görsel içerik alanının sonuna eklendi. Metin editöründe konumunu değiştirebilirsin.',
    );
  };

  const handleAddManualImage = () => {
    const url = manualImageUrl.trim();
    if (!url) {
      toast.error("Lütfen geçerli bir görsel URL'i gir.");
      return;
    }
    handleAddContentImage(url, manualImageAlt.trim());
    setManualImageUrl('');
    setManualImageAlt('');
  };

  return (
    <div className="konigsmassage-admin-page">
      <div className="container-fluid px-2 px-lg-3">
        <div className="konigsmassage-admin-page__inner">
          <form onSubmit={handleSubmit}>
            <div className="card konigsmassage-admin-card">
              <div className="card-header py-2 konigsmassage-admin-card__header">
                <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-2">
                  <div className="konigsmassage-admin-card__title">
                    <h5 className="mb-1 small fw-semibold text-truncate">
                      {mode === 'create' ? 'Yeni Sayfa Oluştur' : 'Sayfa Düzenle'}
                    </h5>
                    <div className="text-muted small text-truncate">
                      Başlık, slug, içerik (HTML), etiketler ve SEO alanlarını doldur.
                    </div>
                  </div>

                  <div className="d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className={
                          'btn btn-outline-secondary btn-sm' +
                          (activeMode === 'form' ? ' active' : '')
                        }
                        onClick={() => setActiveMode('form')}
                        disabled={disabled}
                      >
                        Form
                      </button>
                      <button
                        type="button"
                        className={
                          'btn btn-outline-secondary btn-sm' +
                          (activeMode === 'json' ? ' active' : '')
                        }
                        onClick={() => setActiveMode('json')}
                        disabled={disabled}
                      >
                        JSON
                      </button>
                    </div>

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
                        ? 'Sayfayı Oluştur'
                        : 'Değişiklikleri Kaydet'}
                    </button>

                    {(loading || isLocaleSwitchLoading) && (
                      <span className="badge bg-secondary small">
                        {isLocaleSwitchLoading ? 'Dil değiştiriliyor...' : 'Yükleniyor...'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-body konigsmassage-admin-card__body">
                {activeMode === 'json' ? (
                  <AdminJsonEditor
                    value={values}
                    disabled={disabled}
                    onChange={(next) => setValues(next as CustomPageFormValues)}
                    label="Custom Page JSON"
                    helperText="Bu JSON, formdaki tüm alanların bire bir karşılığıdır."
                  />
                ) : (
                  <>
                    <div className="mb-2 mb-lg-3">
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
                        label="Dil"
                      />
                      <div className="form-text small">
                        Seçim; aynı zamanda düzenlediğin locale kaydını belirler.
                      </div>
                    </div>

                    <div className="row g-3 konigsmassage-admin-grid">
                      <div className="col-12 col-lg-8 konigsmassage-admin-col">
                        <CustomPageMainColumn
                          values={values}
                          disabled={disabled}
                          slugTouched={slugTouched}
                          setSlugTouched={setSlugTouched}
                          setValues={setValues}
                          handleChange={handleChange}
                          effectiveDefaultLocale={safeDefaultLocale}
                          locales={locales}
                          localesLoading={localesLoading}
                          isLocaleSwitchLoading={isLocaleSwitchLoading}
                          handleLocaleChange={handleLocaleChange}
                          handleCheckboxChange={handleCheckboxChange}
                        />
                      </div>

                      <div className="col-12 col-lg-4 konigsmassage-admin-col">
                        <div className="mb-3">
                          <CustomPageFormImageColumn
                            metadata={imageMetadata}
                            disabled={disabled}
                            featuredImageValue={values.featured_image}
                            onFeaturedImageChange={(url) =>
                              setValues((prev) => ({ ...prev, featured_image: url }))
                            }
                            galleryUrls={values.images}
                            onGalleryUrlsChange={(urls) =>
                              setValues((prev) => ({ ...prev, images: urls }))
                            }
                            onSelectAsCover={(url) =>
                              setValues((prev) => ({ ...prev, featured_image: url }))
                            }
                          />
                        </div>

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
        </div>
      </div>
    </div>
  );
};
