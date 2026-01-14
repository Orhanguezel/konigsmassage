// =============================================================
// FILE: src/pages/admin/custompage/[id].tsx
// konigsmassage – Admin Custompage Create/Edit Page (ID bazlı)
//
// ADMIN RULE:
// - ✅ URL locale sync YOK (ne prefix ne ?locale)
// - ✅ API locale: resolveAdminApiLocale (db default > first > 'tr')
// - ✅ Form locale değişse bile URL değişmez (sadece state + API)
// =============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { useAdminLocales } from '@/components/common/useAdminLocales';

import {
  CustomPageForm,
  type CustomPageFormValues,
} from '@/components/admin/custompage/CustomPageForm';

import type {
  CustomPageCreatePayload,
  CustomPageDto,
  CustomPageUpdatePayload,
} from '@/integrations/types';

import {
  useLazyGetCustomPageAdminQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
} from '@/integrations/rtk/hooks';

const pickId = (v: string | string[] | undefined): string | undefined => {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return String(v[0] || '').trim() || undefined;
  return undefined;
};

const isUuidLike = (v?: string) => {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
};

const AdminCustomPageDetailPage: NextPage = () => {
  const router = useRouter();
  const isRouterReady = router.isReady;

  const routeId = useMemo(
    () => (isRouterReady ? pickId(router.query.id as any) : undefined),
    [isRouterReady, router.query.id],
  );

  const isCreateMode = routeId === 'new';

  const {
    localeOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
    fetching: localesFetching,
  } = useAdminLocales();

  const apiLocaleFromDb = useMemo(() => {
    return resolveAdminApiLocale(localeOptions as any, defaultLocaleFromDb, 'tr');
  }, [localeOptions, defaultLocaleFromDb]);

  const localeSet = useMemo(() => {
    return new Set((localeOptions ?? []).map((x) => localeShortClient(x.value)).filter(Boolean));
  }, [localeOptions]);

  // activeLocale: admin içinde state (URL sync yok)
  const [activeLocale, setActiveLocale] = useState<string>('');

  useEffect(() => {
    if (!localeOptions || localeOptions.length === 0) return;

    setActiveLocale((prev) => {
      const p = localeShortClient(prev);
      if (p && localeSet.has(p)) return p;

      const next = localeShortClientOr(apiLocaleFromDb, 'tr');
      return next;
    });
  }, [localeOptions, localeSet, apiLocaleFromDb]);

  const queryLocale = useMemo(() => {
    const l = localeShortClient(activeLocale);
    if (l && localeSet.has(l)) return l;
    return localeShortClientOr(apiLocaleFromDb, 'tr');
  }, [activeLocale, localeSet, apiLocaleFromDb]);

  const localesReady = !localesLoading && !localesFetching;
  const hasLocales = !!localeOptions && localeOptions.length > 0;

  // RTK: by-id (admin) – LAZY
  const shouldSkipQuery =
    !isRouterReady ||
    !hasLocales ||
    isCreateMode ||
    !routeId ||
    !queryLocale ||
    !isUuidLike(routeId);

  const [triggerGetById, getState] = useLazyGetCustomPageAdminQuery();

  const [page, setPage] = useState<CustomPageDto | undefined>(undefined);
  const [pageError, setPageError] = useState<any>(undefined);

  const reqSeq = useRef(0);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (shouldSkipQuery) return;

      setPageError(undefined);
      const mySeq = ++reqSeq.current;

      try {
        const res = await triggerGetById({
          id: routeId as string,
          locale: queryLocale,
        } as any).unwrap();

        if (!alive) return;
        if (mySeq !== reqSeq.current) return;

        setPage(res);
      } catch (err: any) {
        if (!alive) return;
        if (mySeq !== reqSeq.current) return;

        setPageError(err);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [shouldSkipQuery, triggerGetById, routeId, queryLocale]);

  const loading = localesLoading || localesFetching || getState.isLoading || getState.isFetching;

  // Mutations
  const [createCustomPage, { isLoading: isCreating }] = useCreateCustomPageAdminMutation();
  const [updateCustomPage, { isLoading: isUpdating }] = useUpdateCustomPageAdminMutation();
  const saving = isCreating || isUpdating;

  const handleCancel = () => {
    // ✅ URL sabit (locale query yok)
    void router.push('/admin/custompage');
  };

  const handleSubmit = async (values: CustomPageFormValues) => {
    try {
      const loc = localeShortClientOr(values.locale || queryLocale || apiLocaleFromDb, 'tr');

      if (!loc || (localeSet.size > 0 && !localeSet.has(loc))) {
        toast.error('Geçerli bir locale seçilmedi. app_locales ve default_locale kontrol edin.');
        return;
      }

      if (isCreateMode) {
        const payload: CustomPageCreatePayload = {
          locale: loc,
          title: values.title.trim(),
          slug: values.slug.trim(),
          content: values.content ?? '',
          is_published: !!values.is_published,
          summary: values.summary?.trim() || null,
          tags: values.tags?.trim() || null,
          featured_image: values.featured_image?.trim() || null,
          featured_image_asset_id: values.featured_image_asset_id?.trim() || null,
          featured_image_alt: values.featured_image_alt?.trim() || null,
          meta_title: values.meta_title?.trim() || null,
          meta_description: values.meta_description?.trim() || null,
        };

        const created = await createCustomPage(payload).unwrap();
        toast.success('Sayfa başarıyla oluşturuldu.');

        const nextId = created?.id ? String(created.id) : '';
        if (!nextId) {
          toast.error("Oluşturuldu ama id dönmedi. Backend response'u kontrol et.");
          return;
        }

        // ✅ URL sabit, sadece id route’a geç
        void router.replace(`/admin/custompage/${encodeURIComponent(nextId)}`);
        return;
      }

      if (!page?.id) {
        toast.error('Sayfa verisi yüklenemedi (id yok).');
        return;
      }

      const patch: CustomPageUpdatePayload = {
        locale: loc,
        title: values.title.trim(),
        slug: values.slug.trim(),
        content: values.content ?? '',
        is_published: !!values.is_published,
        summary: values.summary?.trim() || null,
        tags: values.tags?.trim() || null,
        featured_image: values.featured_image?.trim() || null,
        featured_image_asset_id: values.featured_image_asset_id?.trim() || null,
        featured_image_alt: values.featured_image_alt?.trim() || null,
        meta_title: values.meta_title?.trim() || null,
        meta_description: values.meta_description?.trim() || null,
      };

      await updateCustomPage({ id: page.id, patch } as any).unwrap();
      toast.success('Sayfa güncellendi.');

      if (loc !== queryLocale) setActiveLocale(loc);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'İşlem sırasında bir hata oluştu.');
    }
  };

  // UI Guards
  if (!isRouterReady) {
    return (
      <div className="container-fluid py-3">
        <div className="text-muted small">Yükleniyor...</div>
      </div>
    );
  }

  if (localesReady && !hasLocales) {
    return (
      <div className="container-fluid py-3">
        <h4 className="h5 mb-2">Dil listesi bulunamadı</h4>
        <p className="text-muted small mb-3">
          <code>site_settings.app_locales</code> boş veya geçersiz. Önce Site Settings’ten dilleri
          ayarla.
        </p>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => void router.push('/admin/site-settings')}
        >
          Site Ayarlarına git
        </button>
      </div>
    );
  }

  if (!isCreateMode && routeId && !isUuidLike(routeId)) {
    return (
      <div className="container-fluid py-3">
        <h4 className="h5 mb-2">Geçersiz ID</h4>
        <p className="text-muted small mb-3">
          URL paramı UUID değil: <code className="ms-1">{routeId}</code>
        </p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
          Listeye dön
        </button>
      </div>
    );
  }

  if (!isCreateMode && !loading && !page && pageError) {
    return (
      <div className="container-fluid py-3">
        <h4 className="h5 mb-2">Sayfa bulunamadı</h4>
        <p className="text-muted small mb-3">
          Bu id için kayıt yok: <code className="ms-1">{routeId}</code>
        </p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
          Listeye dön
        </button>
      </div>
    );
  }

  const pageTitle = isCreateMode ? 'Yeni Sayfa Oluştur' : page?.title || 'Sayfa Düzenle';

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <h4 className="h5 mb-1">{pageTitle}</h4>
        <p className="text-muted small mb-0">
          Custom Page içeriklerini burada yönetebilirsin. (Admin URL sabittir.)
        </p>
        <div className="text-muted small mt-1">
          Active locale: <code>{queryLocale || '-'}</code>
        </div>
      </div>

      <CustomPageForm
        mode={isCreateMode ? 'create' : 'edit'}
        initialData={!isCreateMode ? page : undefined}
        loading={loading}
        saving={saving}
        locales={localeOptions as any}
        localesLoading={localesLoading || localesFetching}
        defaultLocale={queryLocale}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onLocaleChange={(nextLocale) => setActiveLocale(localeShortClientOr(nextLocale, 'tr'))}
      />
    </div>
  );
};

export default AdminCustomPageDetailPage;
