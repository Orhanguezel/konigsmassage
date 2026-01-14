// =============================================================
// FILE: src/components/admin/slider/SliderFormPage.tsx
// konigsmassage – Slider Form Sayfası (Create/Edit + JSON + Image Upload)
// Category/SubCategory FormPage pattern’ine uygun (useAdminLocales)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type { SliderAdminDto } from '@/integrations/types';

import {
  useCreateSliderAdminMutation,
  useUpdateSliderAdminMutation,
  useLazyGetSliderAdminQuery,
} from '@/integrations/rtk/hooks';

import { useAdminLocales } from '@/components/common/useAdminLocales';

import { SliderForm, type SliderFormValues } from './SliderForm';
import { SliderFormJsonSection } from './SliderFormJsonSection';
import { SliderFormImageColumn, type SliderImageMetadata } from './SliderFormImageColumn';
import { SliderFormHeader, type SliderFormEditMode } from './SliderFormHeader';

/* ------------------------------------------------------------- */

type SliderFormPageProps = {
  mode: 'create' | 'edit';
  initialData?: SliderAdminDto | null;
  loading?: boolean; // edit page fetch loading
  onDone?: () => void;
};

type SliderFormState = SliderFormValues & {
  id?: string;
};

/* map DTO → form state */
const mapDtoToFormState = (item: SliderAdminDto): SliderFormState => ({
  id: item.id != null ? String(item.id) : undefined,
  locale: (item.locale || 'de').toLowerCase(),
  name: item.name || '',
  slug: item.slug || '',
  description: item.description || '',
  image_url: item.image_url || '',
  alt: item.alt || '',
  buttonText: item.buttonText || '',
  buttonLink: item.buttonLink || '',
  featured: !!item.featured,
  is_active: !!item.is_active,
  display_order: item.display_order ?? 0,
});

/* JSON model builder */
const buildJsonModelFromForm = (state: SliderFormState) => ({
  locale: (state.locale || '').toLowerCase(),
  name: state.name,
  slug: state.slug,
  description: state.description || '',
  image_url: state.image_url || '',
  alt: state.alt || '',
  buttonText: state.buttonText || '',
  buttonLink: state.buttonLink || '',
  featured: !!state.featured,
  is_active: !!state.is_active,
  display_order: state.display_order,
});

/* ------------------------------------------------------------- */

const SliderFormPage: React.FC<SliderFormPageProps> = ({
  mode,
  initialData,
  loading: externalLoading,
  onDone,
}) => {
  const router = useRouter();

  const [formState, setFormState] = useState<SliderFormState | null>(null);
  const [editMode, setEditMode] = useState<SliderFormEditMode>('form');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // ✅ Locale options (DB’den) — standard
  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  // LocaleOption shape uyumu (value/label)
  const localeOptions: { value: string; label: string }[] = useMemo(
    () =>
      ((adminLocaleOptions ?? []) as { value: string; label: string }[]).map((x) => ({
        value: String(x.value).toLowerCase(),
        label: x.label,
      })),
    [adminLocaleOptions],
  );

  // Lazy get (locale switch için)
  const [triggerGetSlider, { isLoading: isLocaleLoading }] = useLazyGetSliderAdminQuery();

  const [createSlider, { isLoading: isCreating }] = useCreateSliderAdminMutation();
  const [updateSlider, { isLoading: isUpdating }] = useUpdateSliderAdminMutation();

  const saving = isCreating || isUpdating;

  // externalLoading: edit page initial fetch
  // localesLoading: locale list ready mi?
  const pageLoading = !!externalLoading || localesLoading;

  /* ------------------------------------------------------------- */
  /* INITIAL FORM SETUP */
  /* ------------------------------------------------------------- */

  useEffect(() => {
    // EDIT: initialData geldiyse bir kere set et
    if (mode === 'edit') {
      if (initialData && !formState) {
        setFormState(mapDtoToFormState(initialData));
      }
      return;
    }

    // CREATE: localeOptions hazırsa default state kur
    if (mode === 'create' && !formState && localeOptions.length > 0) {
      const fallbackLocale =
        coerceLocale(undefined, defaultLocaleFromDb) || localeOptions[0]?.value || 'de';

      setFormState({
        id: undefined,
        locale: fallbackLocale.toLowerCase(),
        name: '',
        slug: '',
        description: '',
        image_url: '',
        alt: '',
        buttonText: '',
        buttonLink: '',
        featured: false,
        is_active: true,
        display_order: 0,
      });
    }
  }, [mode, initialData, formState, localeOptions, coerceLocale, defaultLocaleFromDb]);

  /* ------------------------------------------------------------- */
  /* IMAGE METADATA */
  /* ------------------------------------------------------------- */

  const imageMetadata: SliderImageMetadata | undefined = useMemo(() => {
    if (!formState) return undefined;
    return {
      module_key: 'slider',
      locale: (formState.locale || '').toLowerCase(),
      slider_slug: formState.slug || '',
      slider_id: formState.id ? String(formState.id) : undefined,
    };
  }, [formState]);

  /* ------------------------------------------------------------- */
  /* LOCALE CHANGE (Category/SubCategory pattern) */
  /* ------------------------------------------------------------- */

  const handleLocaleChange = async (nextLocaleRaw: string) => {
    if (!formState) return;

    const nextLocale = coerceLocale(nextLocaleRaw, defaultLocaleFromDb) || 'de';

    // CREATE modunda sadece locale değiştir
    if (mode === 'create') {
      setFormState((prev) => (prev ? { ...prev, locale: nextLocale } : prev));
      return;
    }

    // EDIT modunda: aynı slider id, farklı locale içeriği çek
    const baseId = formState.id || (initialData?.id != null ? String(initialData.id) : '');
    if (!baseId) {
      setFormState((prev) => (prev ? { ...prev, locale: nextLocale } : prev));
      return;
    }

    try {
      const data = await triggerGetSlider({ id: String(baseId), locale: nextLocale }).unwrap();
      setFormState(mapDtoToFormState(data));
      toast.success('Dil içeriği yüklendi.');
    } catch (err: any) {
      const status = err?.status ?? err?.originalStatus;

      if (status === 404) {
        // Bu dilde kayıt yok → kullanıcı kaydedince oluşturulacak
        setFormState((prev) => (prev ? { ...prev, locale: nextLocale } : prev));
        toast.info('Bu dil için çeviri yok. Kaydedildiğinde oluşturulacak.');
      } else {
        console.error('Slider locale load error:', err);
        // locale'i yine de UI'da değiştir; kullanıcı kaydedebilir
        setFormState((prev) => (prev ? { ...prev, locale: nextLocale } : prev));
        toast.error('Seçilen dil yüklenirken bir hata oluştu.');
      }
    }
  };

  /* ------------------------------------------------------------- */
  /* JSON → Form State */
  /* ------------------------------------------------------------- */

  const applyJsonToForm = (json: any) => {
    if (!formState) return;

    setFormState((prev) => {
      if (!prev) return prev;

      const next: SliderFormState = { ...prev };

      if (typeof json.locale === 'string') {
        next.locale = (coerceLocale(json.locale, defaultLocaleFromDb) || json.locale).toLowerCase();
      }
      if (typeof json.name === 'string') next.name = json.name;
      if (typeof json.slug === 'string') next.slug = json.slug;
      if (typeof json.description === 'string') next.description = json.description;
      if (typeof json.image_url === 'string') next.image_url = json.image_url;
      if (typeof json.alt === 'string') next.alt = json.alt;
      if (typeof json.buttonText === 'string') next.buttonText = json.buttonText;
      if (typeof json.buttonLink === 'string') next.buttonLink = json.buttonLink;

      if (typeof json.featured === 'boolean') next.featured = json.featured;
      if (typeof json.is_active === 'boolean') next.is_active = json.is_active;

      if (typeof json.display_order === 'number' && Number.isFinite(json.display_order)) {
        next.display_order = json.display_order;
      }

      return next;
    });
  };

  /* ------------------------------------------------------------- */
  /* SUBMIT */
  /* ------------------------------------------------------------- */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState) return;

    if (editMode === 'json' && jsonError) {
      toast.error('JSON geçerli değil.');
      return;
    }

    const payload = {
      locale: (formState.locale || '').toLowerCase(),
      name: formState.name.trim(),
      slug: formState.slug.trim() || undefined,
      description: formState.description.trim() || undefined,
      image_url: formState.image_url.trim() || undefined,
      alt: formState.alt.trim() || undefined,
      buttonText: formState.buttonText.trim() || undefined,
      buttonLink: formState.buttonLink.trim() || undefined,
      featured: !!formState.featured,
      is_active: !!formState.is_active,
      display_order: Number.isFinite(formState.display_order) ? formState.display_order : 0,
    };

    if (!payload.locale) {
      toast.error('Dil seçmelisin.');
      return;
    }
    if (!payload.name) {
      toast.error('Başlık zorunludur.');
      return;
    }

    try {
      if (mode === 'create') {
        await createSlider(payload as any).unwrap();
        toast.success('Slider oluşturuldu.');
      } else {
        const id = formState.id || (initialData?.id != null ? String(initialData.id) : '');
        if (!id) {
          toast.error('Slider id bulunamadı.');
          return;
        }
        await updateSlider({ id: String(id), patch: payload as any }).unwrap();
        toast.success('Slider güncellendi.');
      }

      if (onDone) onDone();
      else router.push('/admin/slider');
    } catch (err: any) {
      console.error('Slider save error:', err);
      const msg = err?.data?.error?.message || err?.message || 'Kaydedilirken hata oluştu.';
      toast.error(msg);
    }
  };

  /* ------------------------------------------------------------- */
  /* CANCEL */
  /* ------------------------------------------------------------- */

  const handleCancel = () => {
    if (onDone) onDone();
    else router.push('/admin/slider');
  };

  /* ------------------------------------------------------------- */

  if (!formState) {
    return (
      <div className="container-fluid py-4 text-muted small">
        <div className="spinner-border spinner-border-sm me-2" />
        Form hazırlanıyor...
      </div>
    );
  }

  const jsonModel = buildJsonModelFromForm(formState);

  /* ------------------------------------------------------------- */
  /* RENDER */
  /* ------------------------------------------------------------- */

  return (
    <div className="container-fluid py-4">
      <div className="card">
        <SliderFormHeader
          mode={mode}
          editMode={editMode}
          saving={saving}
          locale={(formState.locale || '').toLowerCase()}
          isLocaleLoading={isLocaleLoading || localesLoading}
          onChangeEditMode={setEditMode}
          onCancel={handleCancel}
        />

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="row g-3">
              {/* LEFT: FORM or JSON */}
              <div className="col-md-7">
                {editMode === 'form' ? (
                  <SliderForm
                    mode={mode}
                    values={formState}
                    onChange={(field, value) =>
                      setFormState((prev) => (prev ? { ...prev, [field]: value } : prev))
                    }
                    onLocaleChange={handleLocaleChange}
                    saving={saving || pageLoading}
                    localeOptions={localeOptions}
                    localesLoading={localesLoading}
                  />
                ) : (
                  <SliderFormJsonSection
                    jsonModel={jsonModel}
                    disabled={saving || pageLoading}
                    onChangeJson={applyJsonToForm}
                    onErrorChange={setJsonError}
                  />
                )}
              </div>

              {/* RIGHT: IMAGE */}
              <div className="col-md-5">
                <SliderFormImageColumn
                  metadata={imageMetadata}
                  imageUrl={formState.image_url}
                  disabled={saving}
                  onImageUrlChange={(url) =>
                    setFormState((prev) => (prev ? { ...prev, image_url: url } : prev))
                  }
                />
              </div>
            </div>
          </div>

          <div className="card-footer d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleCancel}
              disabled={saving}
            >
              İptal
            </button>

            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Kaydediliyor...' : mode === 'create' ? 'Oluştur' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SliderFormPage;
