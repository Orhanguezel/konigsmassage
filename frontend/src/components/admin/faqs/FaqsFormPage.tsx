// =============================================================
// FILE: src/components/admin/faqs/FaqsFormPage.tsx
// konigsmassage – FAQ Form Sayfası (Create/Edit + JSON)
// ReferencesFormPage pattern’i + useAdminLocales standardı
// - RTK hooks import: "@/integrations/rtk/hooks"
// - locale priority: query.locale > router.locale > DB default
// - URL sync: query.locale shallow replace
// - edit: locale change -> GET /admin/faqs/:id?locale=.. (lazy query)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import type { FaqDto, FaqCreatePayload, FaqUpdatePayload } from '@/integrations/types';
import type { LocaleOption } from '@/components/admin/faqs/FaqsHeader';

import {
  useCreateFaqAdminMutation,
  useUpdateFaqAdminMutation,
  useLazyGetFaqAdminQuery,
} from '@/integrations/rtk/hooks';

import { useAdminLocales } from '@/components/common/useAdminLocales';

import { FaqsForm, type FaqsFormValues } from './FaqsForm';
import { FaqsFormHeader, type FaqsFormEditMode } from './FaqsFormHeader';
import { FaqsFormJsonSection } from './FaqsFormJsonSection';

/* -------------------- helpers -------------------- */

function pickFirstString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

type FaqsFormPageProps = {
  mode: 'create' | 'edit';
  initialData?: FaqDto | null;
  loading?: boolean;
  onDone?: () => void;
};

type FaqsFormState = FaqsFormValues & {
  id?: string;
};

/* map DTO → form state */
const mapDtoToFormState = (item: FaqDto): FaqsFormState => ({
  id: String((item as any).id ?? ''),
  locale: toShortLocale((item as any).locale_resolved ?? (item as any).locale ?? 'de'),

  is_active: (item as any).is_active === 1,
  display_order: (item as any).display_order ?? 0,

  question: (item as any).question ?? '',
  answer: (item as any).answer ?? '',
  slug: (item as any).slug ?? '',
});

/* JSON model builder */
const buildJsonModelFromForm = (s: FaqsFormState) => ({
  locale: s.locale,

  is_active: !!s.is_active,
  display_order: Number(s.display_order) || 0,

  question: s.question || '',
  answer: s.answer || '',
  slug: s.slug || '',
});

const FaqsFormPage: React.FC<FaqsFormPageProps> = ({
  mode,
  initialData,
  loading: externalLoading,
  onDone,
}) => {
  const router = useRouter();

  const [formState, setFormState] = useState<FaqsFormState | null>(null);
  const [editMode, setEditMode] = useState<FaqsFormEditMode>('form');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [isLocaleChanging, setIsLocaleChanging] = useState(false);

  const [triggerGetFaq] = useLazyGetFaqAdminQuery();

  const [createFaq, { isLoading: isCreating }] = useCreateFaqAdminMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqAdminMutation();

  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  // LocaleOption uyumu (FaqsForm bekliyor)
  const localeOptions: LocaleOption[] = useMemo(
    () =>
      (adminLocaleOptions ?? []).map((x) => ({
        value: String(x.value).toLowerCase(),
        label: x.label,
      })),
    [adminLocaleOptions],
  );

  // locale priority: query.locale > router.locale > db default
  const effectiveLocale = useMemo(() => {
    const q = pickFirstString(router.query.locale);
    const r = typeof router.locale === 'string' ? router.locale : undefined;
    return toShortLocale(coerceLocale(q ?? r, defaultLocaleFromDb));
  }, [router.query.locale, router.locale, coerceLocale, defaultLocaleFromDb]);

  const saving = isCreating || isUpdating;
  const loading = !!externalLoading || localesLoading;

  /* -------------------- URL SYNC (locale) -------------------- */

  const setUrlLocale = (nextLocale: string) => {
    const nextQuery = { ...router.query, locale: nextLocale };
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  };

  /* -------------------- INITIAL FORM SETUP -------------------- */

  useEffect(() => {
    if (mode === 'edit') {
      if (initialData && !formState) {
        setFormState(mapDtoToFormState(initialData));
      }
      return;
    }

    // create mode
    if (!formState && !localesLoading && localeOptions.length > 0) {
      const first = toShortLocale(localeOptions[0]?.value || 'de');
      const initLocale = toShortLocale(effectiveLocale || first || 'de');

      setFormState({
        id: undefined,
        locale: initLocale,

        is_active: true,
        display_order: 0,

        question: '',
        answer: '',
        slug: '',
      });

      // create sayfasında da URL locale sync olsun
      setUrlLocale(initLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialData, formState, localesLoading, localeOptions, effectiveLocale]);

  /* -------------------- LOCALE CHANGE (edit i18n fetch) -------------------- */

  const handleLocaleChange = async (nextLocaleRaw: string) => {
    if (!formState) return;

    const nextLocale = toShortLocale(coerceLocale(nextLocaleRaw, defaultLocaleFromDb) || 'de');

    // UI anında güncellensin
    setFormState((prev) => (prev ? { ...prev, locale: nextLocale } : prev));

    // URL sync
    setUrlLocale(nextLocale);

    // create: sadece locale set yeterli
    if (mode === 'create') return;

    const baseId = formState.id || String((initialData as any)?.id ?? '');
    if (!baseId) return;

    try {
      setIsLocaleChanging(true);
      const data = await triggerGetFaq({ id: String(baseId), locale: nextLocale }).unwrap();
      setFormState(mapDtoToFormState(data as FaqDto));
      toast.success('Dil içeriği yüklendi.');
    } catch (err: any) {
      const status = err?.status ?? err?.originalStatus;
      if (status === 404) {
        toast.info(
          'Bu dil için kayıt bulunamadı. Kaydettiğinde bu dil için yeni kayıt oluşturulacak (aynı id mantığına göre).',
        );
      } else {
        console.error('Faq locale change error:', err);
        toast.error('Seçilen dil için SSS yüklenirken bir hata oluştu.');
      }
    } finally {
      setIsLocaleChanging(false);
    }
  };

  /* -------------------- JSON → FORM -------------------- */

  const applyJsonToForm = (json: any) => {
    if (!formState) return;

    setFormState((prev) => {
      if (!prev) return prev;
      const next: FaqsFormState = { ...prev };

      if (typeof json.locale === 'string') {
        const coerced = toShortLocale(
          coerceLocale(json.locale, defaultLocaleFromDb) || prev.locale,
        );
        next.locale = coerced || prev.locale;
        setUrlLocale(next.locale);
      }

      if (typeof json.is_active === 'boolean') next.is_active = json.is_active;
      if (typeof json.display_order === 'number' && Number.isFinite(json.display_order)) {
        next.display_order = json.display_order;
      }

      if (typeof json.question === 'string') next.question = json.question;
      if (typeof json.answer === 'string') next.answer = json.answer;
      if (typeof json.slug === 'string') next.slug = json.slug;

      return next;
    });
  };

  /* -------------------- SUBMIT -------------------- */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState) return;

    if (editMode === 'json' && jsonError) {
      toast.error('JSON geçerli değil.');
      return;
    }

    const question = formState.question.trim();
    const answer = formState.answer.trim();
    const slug = formState.slug.trim();

    if (!question || !answer || !slug) {
      toast.error('Soru, cevap ve slug zorunludur.');
      return;
    }

    const normalizedLocale = toShortLocale(
      coerceLocale(formState.locale, defaultLocaleFromDb) || formState.locale || 'de',
    );

    try {
      if (mode === 'create') {
        const payload: FaqCreatePayload = {
          question,
          answer,
          slug,
          locale: normalizedLocale || undefined,

          is_active: formState.is_active ? '1' : '0',
          display_order: Number(formState.display_order) || 0,
        };

        await createFaq(payload).unwrap();
        toast.success('SSS kaydı oluşturuldu.');
      } else if (mode === 'edit' && formState.id) {
        const payload: FaqUpdatePayload = {
          question: question || undefined,
          answer: answer || undefined,
          slug: slug || undefined,
          locale: normalizedLocale || undefined,

          is_active: formState.is_active ? '1' : '0',
          display_order: Number.isFinite(Number(formState.display_order))
            ? Number(formState.display_order)
            : undefined,
        };

        await updateFaq({ id: String(formState.id), patch: payload }).unwrap();
        toast.success('SSS kaydı güncellendi.');
      } else {
        // edit ama id yoksa -> create fallback
        const payload: FaqCreatePayload = {
          question,
          answer,
          slug,
          locale: normalizedLocale || undefined,
          is_active: formState.is_active ? '1' : '0',
          display_order: Number(formState.display_order) || 0,
        };

        await createFaq(payload).unwrap();
        toast.success('SSS kaydı oluşturuldu.');
      }

      if (onDone) onDone();
      else router.push('/admin/faqs');
    } catch (err: any) {
      console.error('Faq save error:', err);
      toast.error(err?.data?.error?.message || err?.message || 'SSS kaydedilirken hata oluştu.');
    }
  };

  /* -------------------- CANCEL -------------------- */

  const handleCancel = () => {
    if (onDone) onDone();
    else router.push('/admin/faqs');
  };

  /* -------------------- LOADING -------------------- */

  if (mode === 'edit' && externalLoading && !initialData) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center text-muted small py-5">
          <div className="spinner-border spinner-border-sm me-2" />
          SSS yükleniyor...
        </div>
      </div>
    );
  }

  if (mode === 'edit' && !externalLoading && !initialData) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning small">
          SSS kaydı bulunamadı veya silinmiş olabilir.
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCancel}>
          ← Listeye dön
        </button>
      </div>
    );
  }

  if (!formState) {
    return (
      <div className="container-fluid py-4 text-muted small">
        <div className="spinner-border spinner-border-sm me-2" />
        Form hazırlanıyor...
      </div>
    );
  }

  const jsonModel = buildJsonModelFromForm(formState);

  /* -------------------- RENDER -------------------- */

  return (
    <div className="container-fluid py-4">
      <div className="card">
        <FaqsFormHeader
          mode={mode}
          locale={formState.locale}
          editMode={editMode}
          saving={saving}
          localesLoading={localesLoading}
          isLocaleChanging={isLocaleChanging}
          onChangeEditMode={setEditMode}
          onCancel={handleCancel}
        />

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-12">
                {editMode === 'form' ? (
                  <FaqsForm
                    mode={mode}
                    values={formState}
                    onChange={(field, value) =>
                      setFormState((prev) => (prev ? { ...prev, [field]: value } : prev))
                    }
                    onLocaleChange={handleLocaleChange}
                    saving={saving || loading || isLocaleChanging}
                    localeOptions={localeOptions}
                    localesLoading={localesLoading || isLocaleChanging}
                  />
                ) : (
                  <FaqsFormJsonSection
                    jsonModel={jsonModel}
                    disabled={saving || loading || isLocaleChanging}
                    onChangeJson={applyJsonToForm}
                    onErrorChange={setJsonError}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="card-footer d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || isLocaleChanging}
            >
              {saving ? 'Kaydediliyor...' : mode === 'create' ? 'Oluştur' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaqsFormPage;
