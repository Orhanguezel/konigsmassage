'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/services/admin-services-detail-client.tsx
// FINAL — Admin Service Detail (Create/Edit) (App Router + shadcn)
// - Bootstrap yok, inline style yok
// - Locale: useAdminLocales + URL sync (?locale=)
// - id: "new" => create
// - ServiceForm şimdilik eski component (bir sonraki adımda refactor)
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, RefreshCcw } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { ServiceForm } from '@/app/(main)/admin/(admin)/services/serviceForm/ServiceForm';

import type {
  ServiceCreatePayload,
  ServiceUpdatePayload,
  ServiceFormValues,
  ServiceDto,
} from '@/integrations/shared';
import {
  useGetServiceAdminQuery,
  useCreateServiceAdminMutation,
  useUpdateServiceAdminMutation,
} from '@/integrations/hooks';

function isUuidLike(v?: string) {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

const normalizeLocale = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toLowerCase();

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

export default function AdminServiceDetailClient({ id }: { id: string }) {
  const t = useAdminT();
  const router = useRouter();
  const sp = useSearchParams();

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

  const urlLocale = React.useMemo(() => {
    const q = sp?.get('locale');
    return localeShortClient(q) || '';
  }, [sp]);

  // active locale (state, URL sync)
  const [activeLocale, setActiveLocale] = React.useState<string>('');

  React.useEffect(() => {
    if (!localeOptions || localeOptions.length === 0) return;

    setActiveLocale((prev) => {
      const p = localeShortClient(prev);
      const u = localeShortClient(urlLocale);
      const def = localeShortClientOr(apiLocaleFromDb, 'de');

      const canUse = (l: string) => !!l && (localeSet.size === 0 || localeSet.has(l));

      if (p && canUse(p)) return p;
      if (u && canUse(u)) return u;
      if (def && canUse(def)) return def;

      const first = localeShortClient((localeOptions as any)?.[0]?.value);
      return first || 'de';
    });
  }, [localeOptions, localeSet, urlLocale, apiLocaleFromDb]);

  const queryLocale = React.useMemo(() => {
    const l = localeShortClient(activeLocale);
    if (l && (localeSet.size === 0 || localeSet.has(l))) return l;
    return localeShortClientOr(apiLocaleFromDb, 'de');
  }, [activeLocale, localeSet, apiLocaleFromDb]);

  // locale -> URL sync
  React.useEffect(() => {
    const l = localeShortClient(activeLocale);
    if (!l) return;
    if (l === urlLocale) return;

    const params = new URLSearchParams(sp?.toString() || '');
    params.set('locale', l);

    if (isCreateMode) {
      router.replace(`/admin/services/new?${params.toString()}`);
    } else {
      router.replace(`/admin/services/${encodeURIComponent(String(id))}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocale]);

  const localesReady = !localesLoading && !localesFetching;
  const hasLocales = (localeOptions?.length ?? 0) > 0;

  const shouldSkipDetail = isCreateMode || !isUuidLike(String(id || '')) || !queryLocale;

  const {
    data: service,
    isLoading: isLoadingService,
    isFetching: isFetchingService,
    error: serviceError,
    refetch,
  } = useGetServiceAdminQuery(
    { id: String(id), locale: queryLocale } as any,
    { skip: shouldSkipDetail } as any,
  );

  const [createService, createState] = useCreateServiceAdminMutation();
  const [updateService, updateState] = useUpdateServiceAdminMutation();

  const loading = localesLoading || localesFetching || isLoadingService || isFetchingService;
  const saving = createState.isLoading || updateState.isLoading;
  const busy = loading || saving;

  function onCancel() {
    router.push(`/admin/services?locale=${encodeURIComponent(queryLocale || 'de')}`);
  }

  async function onSubmit(values: ServiceFormValues) {
    try {
      const loc = normalizeLocale(values.locale || queryLocale || apiLocaleFromDb);
      if (!loc || (localeSet.size > 0 && !localeSet.has(localeShortClient(loc)))) {
        toast.error(t('admin.services.formHeader.localeError'));
        return;
      }

      const common: any = {
        featured: values.featured,
        is_active: values.is_active,
        display_order: values.display_order ? Number(values.display_order) : undefined,

        featured_image: values.featured_image || null,
        image_url: values.image_url || null,
        image_asset_id: values.image_asset_id || null,

        area: values.area || null,
        duration: values.duration || null,
        maintenance: values.maintenance || null,
        season: values.season || null,
        equipment: values.equipment || null,

        locale: loc,
        name: values.name?.trim() || '',
        slug: values.slug?.trim() || '',

        description: values.description || undefined,
        material: values.material || undefined,
        price: values.price || undefined,
        includes: values.includes || undefined,
        warranty: values.warranty || undefined,
        image_alt: values.image_alt || undefined,

        tags: values.tags || null,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        meta_keywords: values.meta_keywords || null,
      };

      if (!common.name || !common.slug) {
        toast.error(t('admin.services.formHeader.nameSlugRequired'));
        return;
      }

      if (isCreateMode) {
        const payload: ServiceCreatePayload = {
          ...common,
          replicate_all_locales: (values as any).replicate_all_locales,
        };

        const created = await createService(payload as any).unwrap();
        const nextId = String((created as any)?.id ?? '').trim();

        if (!isUuidLike(nextId)) {
          toast.error(t('admin.services.formHeader.createdNoId'));
          return;
        }

        toast.success(t('admin.services.formHeader.created'));
        router.replace(
          `/admin/services/${encodeURIComponent(nextId)}?locale=${encodeURIComponent(
            localeShortClient(loc) || loc,
          )}`,
        );
        router.refresh();
        return;
      }

      const currentId = String((service as any)?.id ?? id);
      if (!isUuidLike(currentId)) {
        toast.error(t('admin.services.formHeader.idNotFound'));
        return;
      }

      const patch: ServiceUpdatePayload = {
        ...common,
        apply_all_locales: (values as any).apply_all_locales,
      };

      await updateService({ id: currentId, patch } as any).unwrap();
      toast.success(t('admin.services.formHeader.updated'));

      const short = localeShortClient(loc);
      if (short && short !== queryLocale) setActiveLocale(short);
    } catch (err) {
      toast.error(getErrMessage(err, t('admin.services.formHeader.defaultError')));
    }
  }

  // Guards
  if (localesReady && !hasLocales) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('admin.services.formHeader.noLocalesTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.services.formHeader.noLocalesDescription')}
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <Button variant="outline" onClick={() => router.push('/admin/site-settings')}>
              {t('admin.services.formHeader.goToSettings')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCreateMode && !isUuidLike(String(id || ''))) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('admin.services.formHeader.invalidIdTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.services.formHeader.invalidIdDescription')}{' '}
            <code className="wrap-break-word">{String(id || '-')}</code>
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="mr-2 size-4" />
              {t('admin.services.formHeader.backToList')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCreateMode && !loading && !service && serviceError) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('admin.services.formHeader.notFoundTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.services.formHeader.notFoundDescription')}{' '}
            <code className="wrap-break-word">{String(id)}</code>
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="mr-2 size-4" />
              {t('admin.services.formHeader.backToList')}
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="mr-2 size-4" />
              {t('admin.services.formHeader.retryButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = isCreateMode
    ? t('admin.services.formHeader.createTitle')
    : (service as any)?.name || t('admin.services.formHeader.editTitle');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={busy}>
              <ArrowLeft className="mr-2 size-4" />
              {t('admin.services.formHeader.backButton')}
            </Button>
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('admin.services.formHeader.description')}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{t('admin.services.formHeader.activeLocale')}</span>
            <Badge variant="secondary">{queryLocale || '-'}</Badge>
            {isCreateMode ? <Badge>CREATE</Badge> : <Badge variant="secondary">EDIT</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {t('admin.services.formHeader.cancelButton')}
          </Button>
          <Button
            onClick={() => (document.getElementById('service-form-submit') as any)?.click?.()}
            disabled={busy}
          >
            <Save className="mr-2 size-4" />
            {t('admin.services.formHeader.saveButton')}
          </Button>
        </div>
      </div>

      {/* ServiceForm: şimdilik mevcut bileşen (bir sonraki adımda shadcn refactor) */}
      <ServiceForm
        mode={isCreateMode ? 'create' : 'edit'}
        initialData={!isCreateMode && service ? (service as unknown as ServiceDto) : undefined}
        loading={loading}
        saving={saving}
        locales={(localeOptions ?? []) as any}
        localesLoading={localesLoading || localesFetching}
        defaultLocale={queryLocale || apiLocaleFromDb || 'de'}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onLocaleChange={(loc: string) =>
          setActiveLocale(localeShortClientOr(loc, queryLocale || 'de'))
        }
      />
    </div>
  );
}
