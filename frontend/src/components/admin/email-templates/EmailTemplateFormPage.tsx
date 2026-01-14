// ===================================================================
// FILE: src/components/admin/email-templates/EmailTemplateFormPage.tsx
// Email Templates – Form Container (create + edit)
// - Edit: tek detail fetch (tüm translations)
// - Locale switch: client-side (API çağrısı yok)
// ===================================================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import {
  useGetEmailTemplateAdminQuery,
  useCreateEmailTemplateAdminMutation,
  useUpdateEmailTemplateAdminMutation,
} from '@/integrations/rtk/hooks';

import type {
  EmailTemplateAdminDetailDto,
  EmailTemplateAdminTranslationDto,
} from '@/integrations/types/email_templates.types';

import type { LocaleOption } from '@/components/admin/email-templates/EmailTemplateHeader';

import { EmailTemplateForm } from '@/components/admin/email-templates/EmailTemplateForm';
import { EmailTemplateFormHeader } from '@/components/admin/email-templates/EmailTemplateFormHeader';
import { EmailTemplateFormJsonSection } from '@/components/admin/email-templates/EmailTemplateFormJsonSection';

import { useAdminLocales } from '@/components/common/useAdminLocales';

/* ------------------------------------------------------------- */

export type EmailTemplateFormMode = 'create' | 'edit';

interface EmailTemplateFormPageProps {
  mode: EmailTemplateFormMode;
  id?: string;
}

export type EmailTemplateFormValues = {
  template_key: string;
  is_active: boolean;

  locale: string;
  template_name: string;
  subject: string;
  content: string;

  variablesValue: unknown;
  detectedVariables: string[];

  parentCreatedAt?: string | Date;
  parentUpdatedAt?: string | Date;
  translationCreatedAt?: string | Date;
  translationUpdatedAt?: string | Date;
};

const pickFirstString = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
};

const normalizeVariablesForPayload = (raw: unknown): string[] | null => {
  if (raw == null) return null;

  if (Array.isArray(raw)) {
    const arr = raw.map((x) => String(x).trim()).filter((x) => x.length > 0);
    return arr.length ? arr : null;
  }

  if (typeof raw === 'object') {
    const arr = Object.values(raw as any)
      .map((x) => String(x).trim())
      .filter((x) => x.length > 0);
    return arr.length ? arr : null;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const arr = trimmed
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return arr.length ? arr : null;
  }

  return null;
};

/**
 * detail + selectedLocale → form values
 * - translation yoksa: alanları boş döndürür (yeni translation gibi)
 */
const buildFormValuesFromDetail = (
  detail: EmailTemplateAdminDetailDto,
  selectedLocale: string,
): EmailTemplateFormValues => {
  const normSel = String(selectedLocale || '')
    .trim()
    .toLowerCase();

  const tr: EmailTemplateAdminTranslationDto | undefined = detail.translations.find(
    (t) => String(t.locale || '').toLowerCase() === normSel,
  );

  return {
    template_key: detail.template_key,
    is_active: !!detail.is_active,

    locale: normSel,
    template_name: tr?.template_name ?? '',
    subject: tr?.subject ?? '',
    content: tr?.content ?? '',

    variablesValue: detail.variables ?? [],
    detectedVariables: tr?.detected_variables ?? [],

    parentCreatedAt: detail.created_at,
    parentUpdatedAt: detail.updated_at,
    translationCreatedAt: tr?.created_at,
    translationUpdatedAt: tr?.updated_at,
  };
};

export const EmailTemplateFormPage: React.FC<EmailTemplateFormPageProps> = ({ mode, id }) => {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const {
    localeOptions: adminLocaleOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const localeOptions: LocaleOption[] = useMemo(() => {
    return (adminLocaleOptions ?? [])
      .map((o) => ({
        value: String(o.value || '').toLowerCase(),
        label: o.label,
      }))
      .filter((o) => !!o.value);
  }, [adminLocaleOptions]);

  const effectiveLocale = useMemo(() => {
    const q = pickFirstString(router.query.locale);
    const r = typeof router.locale === 'string' ? router.locale : undefined;
    return coerceLocale(q ?? r, defaultLocaleFromDb);
  }, [router.query.locale, router.locale, coerceLocale, defaultLocaleFromDb]);

  // Edit: tek detail çağrısı (tüm translations)
  const shouldSkipDetail = !isEdit || !id || typeof id !== 'string';

  const {
    data: detail,
    isLoading: isDetailLoading,
    isFetching: isDetailFetching,
    refetch: refetchDetail,
  } = useGetEmailTemplateAdminQuery(shouldSkipDetail ? ('' as any) : (id as string), {
    skip: shouldSkipDetail,
  });

  const [createTemplate, { isLoading: isCreating }] = useCreateEmailTemplateAdminMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateAdminMutation();

  const [selectedLocale, setSelectedLocale] = useState<string>('');
  const [form, setForm] = useState<EmailTemplateFormValues | null>(null);

  const loading =
    localesLoading ||
    isCreating ||
    isUpdating ||
    (isEdit ? isDetailLoading || isDetailFetching : false);

  /* ------------------ selectedLocale init ------------------ */
  useEffect(() => {
    if (selectedLocale) return;

    if (effectiveLocale) {
      setSelectedLocale(effectiveLocale);
      return;
    }

    // fallback: localeOptions ilk eleman
    if (localeOptions.length > 0) {
      setSelectedLocale(localeOptions[0].value);
      return;
    }

    setSelectedLocale('de');
  }, [effectiveLocale, localeOptions, selectedLocale]);

  /* ------------------ form init/sync ------------------ */

  // Edit: detail + selectedLocale -> form
  useEffect(() => {
    if (!isEdit) return;
    if (!detail) return;
    if (!selectedLocale) return;

    setForm(buildFormValuesFromDetail(detail, selectedLocale));
  }, [detail, isEdit, selectedLocale]);

  // Create: selectedLocale -> empty form
  useEffect(() => {
    if (isEdit) return;
    if (!selectedLocale) return;

    setForm((prev) => {
      if (prev) return prev;
      return {
        template_key: '',
        is_active: true,
        locale: selectedLocale,
        template_name: '',
        subject: '',
        content: '',
        variablesValue: [],
        detectedVariables: [],
        parentCreatedAt: undefined,
        parentUpdatedAt: undefined,
        translationCreatedAt: undefined,
        translationUpdatedAt: undefined,
      };
    });
  }, [isEdit, selectedLocale]);

  /* ------------------ Handlers ------------------ */

  const handleBackToList = () => {
    router.push('/admin/email-templates');
  };

  const handleFormChange = (patch: Partial<EmailTemplateFormValues>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleVariablesChange = (next: unknown) => {
    handleFormChange({ variablesValue: next });
  };

  /**
   * Locale değişimi:
   * - Edit: API çağırma yok. Mevcut detail.translations içinden form güncelle.
   * - Create: sadece state
   */
  const handleLocaleChange = useCallback(
    (nextLocaleRaw: string) => {
      const nextLocale = coerceLocale(nextLocaleRaw, defaultLocaleFromDb);
      if (!nextLocale) {
        toast.error('Geçersiz locale.');
        return;
      }

      setSelectedLocale(nextLocale);

      // URL’de locale’i tut (refresh olursa aynı locale ile gelsin)
      router.replace(
        { pathname: router.pathname, query: { ...router.query, locale: nextLocale } },
        undefined,
        { shallow: true },
      );

      if (!isEdit) {
        setForm((prev) => (prev ? { ...prev, locale: nextLocale } : prev));
        return;
      }

      // Edit: detail varsa direkt swap
      if (detail) {
        setForm(buildFormValuesFromDetail(detail, nextLocale));
      }
    },
    [coerceLocale, defaultLocaleFromDb, detail, isEdit, router],
  );

  const handleSubmit = async () => {
    if (!form) return;

    const template_key = form.template_key.trim();
    const template_name = form.template_name.trim();
    const subject = form.subject.trim();
    const content = form.content;

    const localeValue = coerceLocale(form.locale, defaultLocaleFromDb);

    if (!template_key || !template_name || !subject || !content) {
      toast.error('template_key, isim (template_name), subject ve content zorunludur.');
      return;
    }

    if (!localeValue) {
      toast.error('Locale alanı boş olamaz.');
      return;
    }

    const variablesArray = normalizeVariablesForPayload(form.variablesValue);

    try {
      if (isEdit && id && typeof id === 'string') {
        const result = await updateTemplate({
          id,
          patch: {
            template_key,
            is_active: form.is_active,
            variables: variablesArray ?? undefined,
            template_name,
            subject,
            content,
            locale: localeValue,
          },
        } as any).unwrap();

        toast.success('Email şablonu güncellendi.');
        await refetchDetail();

        // result detail döndürüyorsa form’u onunla sync et
        if (result) {
          setForm(buildFormValuesFromDetail(result as EmailTemplateAdminDetailDto, localeValue));
        }
      } else {
        const result = await createTemplate({
          template_key,
          template_name,
          subject,
          content,
          is_active: form.is_active,
          variables: variablesArray ?? undefined,
          locale: localeValue,
        } as any).unwrap();

        toast.success('Email şablonu oluşturuldu.');

        if ((result as any)?.id) {
          router.push(
            `/admin/email-templates/${(result as any).id}?locale=${encodeURIComponent(
              localeValue,
            )}`,
          );
        } else {
          handleBackToList();
        }
      }
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.error ||
        err?.message ||
        'Şablon kaydedilirken bir hata oluştu.';

      if (msg === 'key_exists_for_locale') {
        toast.error('Bu template_key + locale kombinasyonu zaten mevcut.');
      } else {
        toast.error(msg);
      }
    }
  };

  /* ------------------ Render ------------------ */

  if (!form) {
    return (
      <div className="container-fluid py-4">
        {loading ? (
          <div className="alert alert-info mb-0">Yükleniyor...</div>
        ) : (
          <div className="alert alert-warning mb-0">Form yüklenemedi.</div>
        )}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <EmailTemplateFormHeader
        mode={mode}
        values={form}
        onChange={handleFormChange}
        localeOptions={localeOptions}
        localesLoading={localesLoading}
        loading={loading}
        onSubmit={handleSubmit}
        onCancel={handleBackToList}
        onLocaleChange={handleLocaleChange}
      />

      <div className="row g-3">
        <div className="col-lg-8">
          <EmailTemplateForm values={form} onChange={handleFormChange} disabled={loading} />
        </div>
        <div className="col-lg-4">
          <EmailTemplateFormJsonSection values={form} onVariablesChange={handleVariablesChange} />
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateFormPage;
