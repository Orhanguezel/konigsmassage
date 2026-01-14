// =============================================================
// FILE: src/components/admin/services/ServiceForm.tsx (FINAL)
// konigsmassage – Admin Service Create/Edit Form (FINAL)
// - ✅ NO Category/SubCategory (removed)
// - ✅ Cover canonical: services.image_url (featured_image legacy mirror)
// - ✅ Cover UI single-source: cover = image_url || featured_image
// - ✅ Null-safe submit: empty string => null
// - ✅ tags + meta_* fields
// - ✅ Gallery DB-backed via ServiceFormImageColumn
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { ServiceDto, ServiceFormProps, ServiceFormValues } from '@/integrations/types';

import { AdminLocaleSelect, type AdminLocaleOption } from '@/components/common/AdminLocaleSelect';
import { AdminJsonEditor } from '@/components/common/AdminJsonEditor';
import RichContentEditor from '@/components/common/RichContentEditor';

import { buildInitialValues, normalizeLocale, slugify } from './serviceForm.utils';
import { ServiceFormImageColumn } from './ServiceFormImageColumn';
import { useServiceEditorImageUpload } from './useServiceEditorImageUpload';

const norm = (v: unknown) => String(v ?? '').trim();
const toNull = (v: unknown) => {
  const s = norm(v);
  return s ? s : null;
};
const toInt = (v: unknown, fallback = 0) => {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : fallback;
};

export const ServiceForm: React.FC<ServiceFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  locales,
  localesLoading,
  defaultLocale,
  onSubmit,
  onCancel,
  onLocaleChange,
}) => {
  const fallbackLocale = normalizeLocale(defaultLocale || locales?.[0]?.value || '');

  const [values, setValues] = useState<ServiceFormValues>(
    buildInitialValues(initialData as ServiceDto | undefined, defaultLocale, fallbackLocale),
  );

  const [slugTouched, setSlugTouched] = useState(false);
  const [activeMode, setActiveMode] = useState<'form' | 'json'>('form');

  useEffect(() => {
    const next = buildInitialValues(
      initialData as ServiceDto | undefined,
      defaultLocale,
      fallbackLocale,
    );

    // ✅ UI cover single source from DB (prefer canonical image_url)
    const coverFromDb =
      norm((initialData as any)?.image_url) || norm((initialData as any)?.featured_image) || '';

    const coverFromNext =
      norm((next as any)?.image_url) || norm((next as any)?.featured_image) || '';

    const cover = coverFromNext || coverFromDb || '';

    setValues({
      ...next,

      // ✅ mirror both so preview never "disappears"
      image_url: cover,
      featured_image: cover,

      // tags/meta (i18n)
      tags: norm((next as any)?.tags) || norm((initialData as any)?.tags),
      meta_title: norm((next as any)?.meta_title) || norm((initialData as any)?.meta_title),
      meta_description:
        norm((next as any)?.meta_description) || norm((initialData as any)?.meta_description),
      meta_keywords:
        norm((next as any)?.meta_keywords) || norm((initialData as any)?.meta_keywords),
    });

    setSlugTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, defaultLocale, fallbackLocale]);

  const disabled = loading || saving;

  const handleChange =
    (field: keyof ServiceFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setValues((prev) => ({ ...prev, [field]: val }));
    };

  const handleCheckboxChange =
    (field: keyof ServiceFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.checked as never }));
    };

  const handleLocaleChange = (nextLocaleRaw: string) => {
    const next = normalizeLocale(nextLocaleRaw);
    const resolved = next || normalizeLocale(values.locale) || fallbackLocale;
    if (!resolved) {
      toast.error('Locale seçimi zorunludur. app_locales ayarlarını kontrol edin.');
      return;
    }
    setValues((prev) => ({ ...prev, locale: resolved }));
    onLocaleChange?.(resolved);
  };

  const effectiveLocale = normalizeLocale(values.locale || fallbackLocale);

  const imageMetadata = useMemo(
    () => ({
      module_key: 'service',
      locale: effectiveLocale,
      service_slug: values.slug || values.name || '',
      ...(values.id ? { service_id: values.id } : {}),
    }),
    [effectiveLocale, values.slug, values.name, values.id],
  );

  const { onUpload } = useServiceEditorImageUpload({ metadata: imageMetadata });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    const loc = normalizeLocale(values.locale || fallbackLocale);
    if (!loc) {
      toast.error('Locale seçimi zorunludur. app_locales ayarlarını kontrol edin.');
      return;
    }

    if (!values.name.trim() || !values.slug.trim()) {
      toast.error('İsim ve slug alanları zorunludur.');
      return;
    }

    // ✅ cover canonical
    const cover = norm(values.image_url) || norm(values.featured_image);

    const payload = {
      ...values,

      // required basics
      locale: loc,
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: String(values.description || ''),

      // flags + order
      featured: !!values.featured,
      is_active: !!values.is_active,
      display_order: toInt(values.display_order, 0),

      // ✅ cover + storage
      image_url: toNull(cover),
      featured_image: toNull(cover), // legacy mirror
      image_asset_id: toNull(values.image_asset_id),

      // i18n common
      image_alt: toNull(values.image_alt),

      material: toNull(values.material),
      price: toNull(values.price),
      includes: toNull(values.includes),
      warranty: toNull(values.warranty),

      // i18n SEO extras
      tags: toNull(values.tags),
      meta_title: toNull(values.meta_title),
      meta_description: toNull(values.meta_description),
      meta_keywords: toNull(values.meta_keywords),

      // technical (non-i18n, still nullable)
      area: toNull(values.area),
      duration: toNull(values.duration),
      maintenance: toNull(values.maintenance),
      season: toNull(values.season),
      equipment: toNull(values.equipment),
    };

    void onSubmit(payload as any);
  };

  const localeDisabled = disabled || !!localesLoading || !(locales?.length > 0);

  // ✅ UI cover single source for preview
  const coverValue = norm(values.image_url) || norm(values.featured_image);

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <div className="card-header py-2 d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-0 small fw-semibold">
              {mode === 'create' ? 'Yeni Hizmet Oluştur' : 'Hizmet Düzenle'}
            </h5>
            <div className="text-muted small">
              İsim, slug, teknik alanlar ve görsel bilgilerini doldur. Dilersen Form veya JSON
              modunda çalışabilirsin.
            </div>
          </div>

          <div className="d-flex flex-column align-items-end gap-2">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={
                  'btn btn-outline-secondary btn-sm' + (activeMode === 'form' ? ' active' : '')
                }
                onClick={() => setActiveMode('form')}
              >
                Form
              </button>
              <button
                type="button"
                className={
                  'btn btn-outline-secondary btn-sm' + (activeMode === 'json' ? ' active' : '')
                }
                onClick={() => setActiveMode('json')}
              >
                JSON
              </button>
            </div>

            <div className="d-flex gap-2">
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
                  ? 'Hizmeti Oluştur'
                  : 'Değişiklikleri Kaydet'}
              </button>
            </div>

            {loading && <span className="badge bg-secondary small mt-1">Yükleniyor...</span>}
          </div>
        </div>

        <div className="card-body">
          {activeMode === 'json' ? (
            <AdminJsonEditor
              value={values}
              disabled={disabled}
              onChange={(next) => setValues(next as ServiceFormValues)}
              label="Service JSON"
              helperText="Formdaki tüm alanların bire bir karşılığıdır."
            />
          ) : (
            <div className="row g-4">
              <div className="col-lg-8">
                {/* Locale + flags */}
                <div className="row g-2 mb-3">
                  <div className="col-sm-4">
                    <label className="form-label small mb-1">Locale (Dil)</label>
                    <AdminLocaleSelect
                      value={normalizeLocale(values.locale)}
                      onChange={handleLocaleChange}
                      options={locales as AdminLocaleOption[]}
                      loading={!!localesLoading}
                      disabled={localeDisabled}
                    />
                  </div>

                  <div className="col-sm-8 d-flex align-items-end gap-3">
                    <div className="form-check">
                      <input
                        id="svc_is_active"
                        type="checkbox"
                        className="form-check-input"
                        checked={values.is_active}
                        onChange={handleCheckboxChange('is_active')}
                        disabled={disabled}
                      />
                      <label htmlFor="svc_is_active" className="form-check-label small">
                        Aktif
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        id="svc_featured"
                        type="checkbox"
                        className="form-check-input"
                        checked={values.featured}
                        onChange={handleCheckboxChange('featured')}
                        disabled={disabled}
                      />
                      <label htmlFor="svc_featured" className="form-check-label small">
                        Öne çıkan
                      </label>
                    </div>
                  </div>
                </div>

                {/* name + slug */}
                <div className="mb-3">
                  <label className="form-label small mb-1">Hizmet Adı</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={values.name}
                    onChange={(e) => {
                      const nameValue = e.target.value;
                      setValues((prev) => {
                        const next: ServiceFormValues = { ...prev, name: nameValue };
                        if (!slugTouched) next.slug = slugify(nameValue);
                        return next;
                      });
                    }}
                    disabled={disabled}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small mb-1">Slug</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
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

                {/* rich content */}
                <RichContentEditor
                  label="Açıklama (Zengin İçerik)"
                  value={values.description}
                  onChange={(next) => setValues((prev) => ({ ...prev, description: next }))}
                  disabled={disabled}
                  height="280px"
                  onUploadImage={onUpload}
                />

                {/* i18n fields */}
                <div className="row g-2 mt-3 mb-3">
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Malzeme / İçerik</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={values.material}
                      onChange={handleChange('material')}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Fiyat</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={values.price}
                      onChange={handleChange('price')}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small mb-1">Dahil Olanlar</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={values.includes}
                    onChange={handleChange('includes')}
                    disabled={disabled}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small mb-1">Garanti / Koşullar</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={values.warranty}
                    onChange={handleChange('warranty')}
                    disabled={disabled}
                  />
                </div>

                {/* tags + meta */}
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label small mb-1">
                      Etiketler <span className="text-muted">(virgül ile ayır)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={values.tags}
                      onChange={handleChange('tags')}
                      disabled={disabled}
                      placeholder="bakım, onarım, retrofit, scada"
                    />
                  </div>
                </div>

                <div className="row g-2 mt-2">
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Meta Title</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.meta_title}
                      onChange={handleChange('meta_title')}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Meta Keywords</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.meta_keywords}
                      onChange={handleChange('meta_keywords')}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="form-label small mb-1">Meta Description</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={values.meta_description}
                    onChange={handleChange('meta_description')}
                    disabled={disabled}
                  />
                </div>

                {/* technical */}
                <div className="row g-2 mt-3">
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Alan / Kapasite</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.area}
                      onChange={handleChange('area')}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Süre</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.duration}
                      onChange={handleChange('duration')}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="row g-2 mt-2">
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Bakım</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.maintenance}
                      onChange={handleChange('maintenance')}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Sezon</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.season}
                      onChange={handleChange('season')}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="row g-2 mt-2">
                  <div className="col-sm-6">
                    <label className="form-label small mb-1">Ekipman</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.equipment}
                      onChange={handleChange('equipment')}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                {/* order */}
                <div className="mb-3">
                  <label className="form-label small mb-1">Görüntüleme Sırası</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={0}
                    value={values.display_order}
                    onChange={handleChange('display_order')}
                    disabled={disabled}
                  />
                </div>

                {/* cover + gallery */}
                <div className="mb-3">
                  <ServiceFormImageColumn
                    serviceId={values.id}
                    locale={effectiveLocale}
                    disabled={disabled}
                    metadata={imageMetadata}
                    featuredImageValue={coverValue}
                    onFeaturedImageChange={(url) => {
                      const u = norm(url);
                      setValues((prev) => ({
                        ...prev,
                        image_url: u,
                        featured_image: u, // mirror
                      }));
                    }}
                  />
                </div>

                {/* alt */}
                <div className="mb-3">
                  <label className="form-label small mb-1">Görsel Alt Metni</label>
                  <input
                    className="form-control form-control-sm"
                    value={values.image_alt}
                    onChange={handleChange('image_alt')}
                    disabled={disabled}
                  />
                </div>

                {/* i18n ops */}
                <div className="mb-0">
                  <label className="form-label small mb-1">Çok Dilli İşlem</label>

                  <div className="form-check">
                    <input
                      id="svc_replicate_all"
                      type="checkbox"
                      className="form-check-input"
                      checked={values.replicate_all_locales}
                      onChange={handleCheckboxChange('replicate_all_locales')}
                      disabled={disabled}
                    />
                    <label className="form-check-label small" htmlFor="svc_replicate_all">
                      Oluştururken tüm dillere kopyala <code>replicate_all_locales</code>
                    </label>
                  </div>

                  <div className="form-check mt-1">
                    <input
                      id="svc_apply_all"
                      type="checkbox"
                      className="form-check-input"
                      checked={values.apply_all_locales}
                      onChange={handleCheckboxChange('apply_all_locales')}
                      disabled={disabled}
                    />
                    <label className="form-check-label small" htmlFor="svc_apply_all">
                      Güncellerken tüm dillere uygula <code>apply_all_locales</code>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
