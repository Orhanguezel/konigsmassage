'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/faqs/admin-faqs-detail-client.tsx
// FINAL — Admin FAQ Create/Edit (App Router)
// - id: "new" => create mode; UUID => edit mode
// - Fields: locale, is_active, display_order, question, answer, slug
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
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

function getErrMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return fallback;
}

export default function AdminFaqsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useAdminT('admin.faqs');
  const isCreateMode = String(id) === 'new';

  const {
    localeOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
    fetching: localesFetching,
  } = useAdminLocales();

  const apiLocaleFromDb = React.useMemo(() => {
    return resolveAdminApiLocale(localeOptions as any, defaultLocaleFromDb, 'de');
  }, [localeOptions, defaultLocaleFromDb]);

  const localeSet = React.useMemo(() => {
    return new Set(
      (localeOptions ?? []).map((x: any) => localeShortClient(x.value)).filter(Boolean),
    );
  }, [localeOptions]);

  const [activeLocale, setActiveLocale] = React.useState<string>('');

  React.useEffect(() => {
    if (!localeOptions || localeOptions.length === 0) return;

    const urlLocale = localeShortClient(sp?.get('locale'));

    setActiveLocale((prev) => {
      const p = localeShortClient(prev);
      if (p && localeSet.has(p)) return p;
      if (urlLocale && localeSet.has(urlLocale)) return urlLocale;
      return localeShortClientOr(apiLocaleFromDb, 'de');
    });
  }, [localeOptions, localeSet, apiLocaleFromDb, sp]);

  const queryLocale = React.useMemo(() => {
    const l = localeShortClient(activeLocale);
    if (l && localeSet.has(l)) return l;
    return localeShortClientOr(apiLocaleFromDb, 'de');
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
      const loc = localeShortClientOr(values.locale || queryLocale || apiLocaleFromDb, 'de');

      if (localeSet.size > 0 && !localeSet.has(localeShortClient(loc))) {
        toast.error(t('errors.invalidLocale'));
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
          toast.error(t('errors.createdButInvalidId'));
          return;
        }

        toast.success(t('messages.created'));
        router.replace(`/admin/faqs/${encodeURIComponent(nextId)}`);
        router.refresh();
        return;
      }

      const baseId = faq?.id || values.id || id;
      if (!baseId || !isUuidLike(String(baseId))) {
        toast.error(t('errors.missingId'));
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
      toast.success(t('messages.updated'));

      if (loc !== queryLocale) setActiveLocale(loc);
    } catch (err) {
      toast.error(getErrMessage(err, t('errors.generic')));
    }
  };

  // locale -> URL sync (guard)
  React.useEffect(() => {
    if (!queryLocale) return;
    const cur = localeShortClient(sp?.get('locale'));
    if (cur === queryLocale) return;

    const params = new URLSearchParams(sp?.toString() || '');
    params.set('locale', queryLocale);
    router.replace(`/admin/faqs/${encodeURIComponent(String(id))}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryLocale]);

  if (localesReady && !hasLocales) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-semibold">{t('noLocales.title')}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {t('noLocales.description')}
        </div>
      </div>
    );
  }

  if (!isCreateMode && !isUuidLike(String(id || ''))) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-semibold">{t('invalidId.title')}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {t('invalidId.description')} <code>{String(id || '-')}</code>
        </div>
        <div className="mt-3">
          <button className="rounded-md border px-3 py-2 text-xs" onClick={onCancel}>
            {t('actions.backToList')}
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
      defaultLocale={queryLocale || apiLocaleFromDb || 'de'}
      onLocaleChange={(l) => setActiveLocale(localeShortClientOr(l, 'de'))}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
}
