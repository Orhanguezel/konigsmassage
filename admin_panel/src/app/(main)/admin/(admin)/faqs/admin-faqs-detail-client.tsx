'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/faqs/admin-faqs-detail-client.tsx
// FINAL — Admin FAQ Create/Edit (App Router)
// - id: "new" => create mode; UUID => edit mode
// - Fields: locale, is_active, display_order, question, answer, slug
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { resolveAdminApiLocale } from '../../../../../i18n/adminLocale';
import { localeShortClient, localeShortClientOr } from '../../../../../i18n/localeShortClient';

import type { FaqDto, FaqCreatePayload, FaqUpdatePayload } from '@/integrations/shared';
import {
  useLazyGetFaqAdminQuery,
  useCreateFaqAdminMutation,
  useUpdateFaqAdminMutation,
} from '@/integrations/hooks';

import type { LocaleOption } from './_components/FaqsHeader';
import { FaqsForm, type FaqsFormValues } from './_components/FaqsForm';

function isUuidLike(v?: string) {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function getErrMessage(err: unknown): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return 'İşlem başarısız. Lütfen tekrar deneyin.';
}

export default function AdminFaqsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const isCreateMode = String(id) === 'new';

  const {
    localeOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
    fetching: localesFetching,
  } = useAdminLocales();

  const apiLocaleFromDb = React.useMemo(() => {
    return resolveAdminApiLocale(localeOptions as any, defaultLocaleFromDb, 'tr');
  }, [localeOptions, defaultLocaleFromDb]);

  const localeSet = React.useMemo(() => {
    return new Set(
      (localeOptions ?? []).map((x: any) => localeShortClient(x.value)).filter(Boolean),
    );
  }, [localeOptions]);

  const [activeLocale, setActiveLocale] = React.useState<string>('');

  React.useEffect(() => {
    if (!localeOptions || localeOptions.length === 0) return;

    setActiveLocale((prev) => {
      const p = localeShortClient(prev);
      if (p && localeSet.has(p)) return p;
      return localeShortClientOr(apiLocaleFromDb, 'tr');
    });
  }, [localeOptions, localeSet, apiLocaleFromDb]);

  const queryLocale = React.useMemo(() => {
    const l = localeShortClient(activeLocale);
    if (l && localeSet.has(l)) return l;
    return localeShortClientOr(apiLocaleFromDb, 'tr');
  }, [activeLocale, localeSet, apiLocaleFromDb]);

  const localesReady = !localesLoading && !localesFetching;
  const hasLocales = (localeOptions?.length ?? 0) > 0;

  const [triggerGetById, getState] = useLazyGetFaqAdminQuery();
  const [faq, setFaq] = React.useState<FaqDto | undefined>(undefined);

  React.useEffect(() => {
    let alive = true;

    async function run() {
      if (!localesReady || !hasLocales) return;

      if (isCreateMode) {
        setFaq(undefined);
        return;
      }

      const routeId = String(id || '');
      if (!isUuidLike(routeId)) return;

      try {
        const res = await triggerGetById({ id: routeId, locale: queryLocale } as any).unwrap();
        if (!alive) return;
        setFaq(res as any);
      } catch {
        if (!alive) return;
        setFaq(undefined);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [id, isCreateMode, localesReady, hasLocales, queryLocale, triggerGetById]);

  const [createFaq, createState] = useCreateFaqAdminMutation();
  const [updateFaq, updateState] = useUpdateFaqAdminMutation();

  const loading = localesLoading || localesFetching || getState.isLoading || getState.isFetching;
  const saving = createState.isLoading || updateState.isLoading;
  const busy = loading || saving;

  const localesForForm: LocaleOption[] = React.useMemo(() => {
    return (localeOptions ?? []).map((l: any) => ({
      value: String(l.value ?? ''),
      label: String(l.label ?? l.value ?? ''),
    }));
  }, [localeOptions]);

  const mode = isCreateMode ? 'create' : 'edit';

  const onCancel = () => router.push('/admin/faqs');

  const handleSubmit = async (values: FaqsFormValues) => {
    try {
      const loc = localeShortClientOr(values.locale || queryLocale || apiLocaleFromDb, 'tr');

      if (localeSet.size > 0 && !localeSet.has(localeShortClient(loc))) {
        toast.error('Geçerli bir locale seçilmedi. app_locales ve default_locale kontrol edin.');
        return;
      }

      if (mode === 'create') {
        const payload: FaqCreatePayload = {
          locale: loc,
          is_active: values.is_active ? 1 : 0,
          display_order: values.display_order ?? 0,
          question: values.question.trim(),
          answer: values.answer.trim(),
          slug: values.slug.trim(),
        };

        const created = await createFaq(payload as any).unwrap();
        const nextId = String((created as any)?.id ?? '').trim();

        if (!nextId || !isUuidLike(nextId)) {
          toast.error("Oluşturuldu ama id dönmedi/UUID değil. Backend response'u kontrol et.");
          return;
        }

        toast.success('FAQ başarıyla oluşturuldu.');
        router.replace(`/admin/faqs/${encodeURIComponent(nextId)}`);
        router.refresh();
        return;
      }

      const baseId = faq?.id || values.id || id;
      if (!baseId || !isUuidLike(String(baseId))) {
        toast.error('FAQ verisi yüklenemedi (id yok).');
        return;
      }

      const patch: FaqUpdatePayload = {
        locale: loc,
        is_active: values.is_active ? 1 : 0,
        display_order: values.display_order ?? 0,
        question: values.question.trim(),
        answer: values.answer.trim(),
        slug: values.slug.trim(),
      };

      await updateFaq({ id: String(baseId), patch } as any).unwrap();
      toast.success('FAQ güncellendi.');

      if (loc !== queryLocale) setActiveLocale(loc);
    } catch (err) {
      toast.error(getErrMessage(err));
    }
  };

  if (localesReady && !hasLocales) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-semibold">Dil listesi bulunamadı</div>
        <div className="mt-1 text-sm text-muted-foreground">
          <code>site_settings.app_locales</code> boş veya geçersiz. Önce Site Settings’ten dilleri
          ayarlayın.
        </div>
      </div>
    );
  }

  if (!isCreateMode && !isUuidLike(String(id || ''))) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-semibold">Geçersiz ID</div>
        <div className="mt-1 text-sm text-muted-foreground">
          UUID değil: <code>{String(id || '-')}</code>
        </div>
        <div className="mt-3">
          <button className="rounded-md border px-3 py-2 text-xs" onClick={onCancel}>
            Listeye dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <FaqsForm
      mode={mode}
      initialData={faq}
      loading={busy}
      saving={saving}
      locales={localesForForm}
      localesLoading={localesLoading || localesFetching}
      defaultLocale={queryLocale || apiLocaleFromDb || 'tr'}
      onLocaleChange={(l) => setActiveLocale(localeShortClientOr(l, 'tr'))}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
}
