'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/faqs/_components/FaqsForm.tsx
// FINAL — Admin FAQ Create/Edit Form (FaqDto uyumlu)
// - ✅ Fields: locale, is_active, display_order, question, answer, slug
// - ✅ Locale source: AdminLocaleSelect
// - ✅ JSON Editor: optional mode (Form | JSON)
// - ✅ No shadcn / no bootstrap
// =============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { FaqDto } from '@/integrations/shared';
import { useLazyGetFaqAdminQuery } from '@/integrations/hooks';

import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import type { LocaleOption } from './FaqsHeader';

import { FaqsFormJsonSection } from './FaqsFormJsonSection';

/* ------------------------------------------------------------- */
/* Types                                                         */
/* ------------------------------------------------------------- */

export type FaqsFormValues = {
  id?: string;

  locale: string;
  is_active: boolean;
  display_order: number;

  question: string;
  answer: string;
  slug: string;
};

export type FaqsFormProps = {
  mode: 'create' | 'edit';
  initialData?: FaqDto;
  loading: boolean;
  saving: boolean;

  locales: LocaleOption[];
  localesLoading?: boolean;

  defaultLocale?: string;
  onLocaleChange?: (nextLocale: string) => void;

  onSubmit: (values: FaqsFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

/* ------------------------------------------------------------- */
/* Helpers                                                       */
/* ------------------------------------------------------------- */

const norm = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const getLocaleFromDto = (dto?: FaqDto, fallback = 'de') => {
  const raw = (dto as any)?.locale_resolved ?? (dto as any)?.locale ?? fallback;
  return norm(raw) || norm(fallback) || 'de';
};

const toBool = (v: any) => !!Number(v ?? 0);

const toNum = (v: any, fallback = 0) => {
  const n = typeof v === 'number' ? v : Number(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

/** basit slugify (TR/DE uyumlu) */
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

const buildInitialValues = (
  initial: FaqDto | undefined,
  fallbackLocale: string,
): FaqsFormValues => {
  const safeLocale = norm(fallbackLocale || 'de') || 'de';

  if (!initial) {
    return {
      id: undefined,
      locale: safeLocale,
      is_active: true,
      display_order: 0,
      question: '',
      answer: '',
      slug: '',
    };
  }

  const resolvedLocale = getLocaleFromDto(initial, safeLocale);

  return {
    id: initial.id,
    locale: resolvedLocale,
    is_active: toBool(initial.is_active),
    display_order: toNum(initial.display_order, 0),
    question: initial.question ?? '',
    answer: initial.answer ?? '',
    slug: initial.slug ?? '',
  };
};

type FaqPayloadJson = {
  // i18n
  question?: unknown;
  answer?: unknown;
  slug?: unknown;
  locale?: unknown;

  // parent
  is_active?: unknown;
  display_order?: unknown;
};

const valuesToPayloadJson = (values: FaqsFormValues): FaqPayloadJson => ({
  question: values.question,
  answer: values.answer,
  slug: values.slug,
  locale: values.locale,

  is_active: values.is_active,
  display_order: values.display_order,
});

const payloadJsonToValues = (
  json: any,
  fallbackLocale: string,
  base?: FaqsFormValues,
): FaqsFormValues => {
  const safeLocale = norm(fallbackLocale || 'de') || 'de';

  const out: FaqsFormValues = {
    ...(base ?? {
      id: undefined,
      locale: safeLocale,
      is_active: true,
      display_order: 0,
      question: '',
      answer: '',
      slug: '',
    }),
  };

  const j = (json ?? {}) as FaqPayloadJson;

  // locale: json varsa kullan, yoksa base/selected kalsın
  const loc = norm(j.locale ?? out.locale ?? safeLocale) || safeLocale;
  out.locale = loc;

  if (typeof j.is_active !== 'undefined') out.is_active = !!(j.is_active as any);
  if (typeof j.display_order !== 'undefined') out.display_order = toNum(j.display_order, 0);

  if (typeof j.question !== 'undefined') out.question = String(j.question ?? '');
  if (typeof j.answer !== 'undefined') out.answer = String(j.answer ?? '');
  if (typeof j.slug !== 'undefined') out.slug = String(j.slug ?? '');

  return out;
};

/* ------------------------------------------------------------- */
/* Component                                                     */
/* ------------------------------------------------------------- */

export const FaqsForm: React.FC<FaqsFormProps> = ({
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

  const [values, setValues] = useState<FaqsFormValues>(
    buildInitialValues(initialData, safeDefaultLocale),
  );

  const [slugTouched, setSlugTouched] = useState(false);

  const disabled = loading || saving;

  // locale switch (edit mode): direct GET by id+locale
  const [triggerGet, getState] = useLazyGetFaqAdminQuery();
  const localeReqSeq = useRef(0);

  // editor mode
  const [editorMode, setEditorMode] = useState<'form' | 'json'>('form');

  // json editor model + errors
  const [jsonModel, setJsonModel] = useState<any>(() => valuesToPayloadJson(values));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    // initialData changes
    const next = buildInitialValues(initialData, safeDefaultLocale);
    setValues(next);
    setSlugTouched(false);

    // sync json model
    setJsonModel(valuesToPayloadJson(next));
    setJsonError(null);
  }, [initialData, safeDefaultLocale]);

  useEffect(() => {
    if (!values.locale) {
      setValues((p) => ({ ...p, locale: safeDefaultLocale }));
    }
  }, [values.locale, safeDefaultLocale]);

  // keep JSON in sync when in form mode (avoid overwriting user's json edits)
  useEffect(() => {
    if (editorMode !== 'form') return;
    setJsonModel(valuesToPayloadJson(values));
    setJsonError(null);
  }, [values, editorMode]);

  const handleLocaleChange = async (nextLocaleRaw: string) => {
    const nextLocale = norm(nextLocaleRaw || safeDefaultLocale) || safeDefaultLocale;

    if (norm(values.locale) === nextLocale) {
      onLocaleChange?.(nextLocale);
      return;
    }

    onLocaleChange?.(nextLocale);

    // create mode: only set state
    if (mode === 'create' || !initialData?.id) {
      setValues((prev) => ({ ...prev, locale: nextLocale }));
      // form mode ise json sync zaten effect’ten gelir
      return;
    }

    // edit mode: fetch by id + locale
    const mySeq = ++localeReqSeq.current;
    setValues((prev) => ({ ...prev, locale: nextLocale }));

    try {
      const res = await triggerGet({ id: initialData.id, locale: nextLocale } as any).unwrap();
      if (mySeq !== localeReqSeq.current) return;

      const dto = res as any as FaqDto;
      const nextValues = buildInitialValues(dto, safeDefaultLocale);
      nextValues.locale = nextLocale;

      setValues(nextValues);
      setSlugTouched(false);

      // json sync
      if (editorMode === 'json') {
        setJsonModel(valuesToPayloadJson(nextValues));
        setJsonError(null);
      }
    } catch (err: any) {
      if (mySeq !== localeReqSeq.current) return;
      const status = err?.status ?? err?.originalStatus;
      if (status === 404) {
        toast.info('Seçilen dil için kayıt bulunamadı; bu dilde yeni içerik oluşturabilirsin.');
        // keep current values but locale updated
      } else {
        toast.error('Seçilen dil için kayıt yüklenirken bir hata oluştu.');
      }
    }
  };

  const validateRequired = (v: FaqsFormValues) => {
    const q = v.question.trim();
    const a = v.answer.trim();
    const s = v.slug.trim();
    if (!q || !a || !s) return false;
    return true;
  };

  const submitValues = (v: FaqsFormValues) => {
    const q = v.question.trim();
    const a = v.answer.trim();
    const s = v.slug.trim();

    if (!q || !a || !s) {
      toast.error('Question, Answer ve Slug alanları zorunludur.');
      return;
    }

    void onSubmit({
      ...v,
      locale: norm(v.locale || safeDefaultLocale) || safeDefaultLocale,
      question: q,
      answer: a,
      slug: s,
      display_order: Number.isFinite(v.display_order) ? v.display_order : 0,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (editorMode === 'form') {
      submitValues(values);
      return;
    }

    // json mode
    if (jsonError) {
      toast.error('JSON geçersiz. Lütfen hatayı düzelt.');
      return;
    }

    const next = payloadJsonToValues(jsonModel, safeDefaultLocale, values);

    if (!validateRequired(next)) {
      toast.error('JSON içinde Question, Answer ve Slug alanları zorunludur.');
      return;
    }

    // state sync (so user sees what submitted if they switch back)
    setValues(next);
    setSlugTouched(true);

    submitValues(next);
  };

  const localeSelectOptions = useMemo(
    () => (locales ?? []).map((x) => ({ value: norm(x.value), label: x.label })),
    [locales],
  );

  const switchingLocale = getState.isLoading || getState.isFetching;

  const canSwitchToJson = !disabled;
  const canSwitchToForm = !disabled;

  const renderModeSwitch = () => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={[
          'rounded-md border px-3 py-1 text-xs',
          editorMode === 'form'
            ? 'bg-muted text-foreground'
            : 'bg-background text-muted-foreground',
          !canSwitchToForm ? 'opacity-60' : '',
        ].join(' ')}
        onClick={() => setEditorMode('form')}
        disabled={!canSwitchToForm}
      >
        Form
      </button>
      <button
        type="button"
        className={[
          'rounded-md border px-3 py-1 text-xs',
          editorMode === 'json'
            ? 'bg-muted text-foreground'
            : 'bg-background text-muted-foreground',
          !canSwitchToJson ? 'opacity-60' : '',
        ].join(' ')}
        onClick={() => {
          // json’e geçerken mevcut values → json (kullanıcı daha önce edit ettiyse, bilinçli olarak overwrite etme)
          setJsonModel(valuesToPayloadJson(values));
          setJsonError(null);
          setEditorMode('json');
        }}
        disabled={!canSwitchToJson}
      >
        JSON
      </button>
      {editorMode === 'json' ? (
        <span className="ml-2 text-[11px] text-muted-foreground">
          {jsonError ? 'JSON hatalı' : 'JSON hazır'}
        </span>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-card">
        <div className="border-b p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {mode === 'create' ? 'Yeni FAQ Oluştur' : 'FAQ Düzenle'}
              </div>
              <div className="text-xs text-muted-foreground">
                {editorMode === 'form'
                  ? 'Locale, aktiflik, sıralama, soru/cevap ve slug alanlarını doldur.'
                  : 'İstek payload’ını JSON olarak düzenle ve kaydet.'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {renderModeSwitch()}

              <div className="h-4 w-px bg-border mx-1 hidden lg:block" />

              {onCancel ? (
                <button
                  type="button"
                  className="rounded-md border px-3 py-1 text-xs"
                  onClick={onCancel}
                  disabled={disabled}
                >
                  Geri
                </button>
              ) : null}

              <button
                type="submit"
                className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-60"
                disabled={disabled}
              >
                {saving
                  ? mode === 'create'
                    ? 'Oluşturuluyor...'
                    : 'Kaydediliyor...'
                  : mode === 'create'
                    ? 'Oluştur'
                    : 'Kaydet'}
              </button>

              {loading || switchingLocale ? (
                <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                  {switchingLocale ? 'Dil değiştiriliyor...' : 'Yükleniyor...'}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-3 space-y-4">
          <AdminLocaleSelect
            value={values.locale}
            onChange={handleLocaleChange}
            options={localeSelectOptions as any}
            loading={!!localesLoading}
            disabled={
              disabled || (!!localesLoading && !localeSelectOptions.length) || switchingLocale
            }
            label="Dil"
          />

          {editorMode === 'json' ? (
            <FaqsFormJsonSection
              jsonModel={jsonModel}
              disabled={disabled || switchingLocale}
              onChangeJson={(j) => setJsonModel(j)}
              onErrorChange={(err) => setJsonError(err)}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-4">
                <div className="rounded-lg border bg-card p-3 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        id="is_active"
                        type="checkbox"
                        className="h-4 w-4"
                        checked={values.is_active}
                        onChange={(e) => setValues((p) => ({ ...p, is_active: e.target.checked }))}
                        disabled={disabled}
                      />
                      <span>Aktif</span>
                    </label>

                    <div className="md:ml-auto w-full md:w-56">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Sıralama (display_order)
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={values.display_order}
                        onChange={(e) =>
                          setValues((p) => ({ ...p, display_order: toNum(e.target.value, 0) }))
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Question</label>
                    <input
                      type="text"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={values.question}
                      onChange={(e) => {
                        const v = e.target.value;
                        setValues((prev) => {
                          const next = { ...prev, question: v };
                          if (!slugTouched) next.slug = slugify(v);
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
                    <label className="mb-1 block text-xs text-muted-foreground">Answer</label>
                    <textarea
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      rows={8}
                      value={values.answer}
                      onChange={(e) => setValues((p) => ({ ...p, answer: e.target.value }))}
                      disabled={disabled}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="text-sm font-semibold">Notlar</div>
                  <div className="text-xs text-muted-foreground">
                    FAQ modülünde görsel/SEO alanı yok. Bu form sadece backend’deki faq alanlarını
                    yönetir.
                  </div>

                  <div className="text-xs text-muted-foreground">
                    İstersen üstten <code>JSON</code> moduna geçip payload’ı direkt
                    düzenleyebilirsin.
                  </div>

                  {initialData?.created_at ? (
                    <div className="text-xs text-muted-foreground">
                      Oluşturulma: <code>{initialData.created_at}</code>
                    </div>
                  ) : null}
                  {initialData?.updated_at ? (
                    <div className="text-xs text-muted-foreground">
                      Güncelleme: <code>{initialData.updated_at}</code>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
