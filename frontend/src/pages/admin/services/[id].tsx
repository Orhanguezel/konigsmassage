// =============================================================
// FILE: src/pages/admin/services/[id].tsx (FINAL)
// konigsmassage – Admin Hizmet Detay (Create / Edit by id)
// - Locale source: RTK public endpoints (app-locales + default-locale)
// - URL ?locale=... sync (shallow)
// - RTK imports: ONLY from "@/integrations/rtk/hooks"
// - NO category / sub_category
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import { ServiceForm } from '@/components/admin/services/serviceForm/ServiceForm';

import {
  useGetServiceAdminQuery,
  useCreateServiceAdminMutation,
  useUpdateServiceAdminMutation,
  useGetAppLocalesPublicQuery,
  useGetDefaultLocalePublicQuery,
} from '@/integrations/rtk/hooks';

import type {
  ServiceCreatePayload,
  ServiceUpdatePayload,
  ServiceFormValues,
} from '@/integrations/types';
import type { AdminLocaleOption } from '@/components/common/AdminLocaleSelect';

/* -------------------- Locale helpers -------------------- */

const toShortLocale = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

const normalizeLocale = (v: unknown): string =>
  String(v ?? '')
    .trim()
    .toLowerCase();

function uniqByCode(items: { code: string; label?: string; is_default?: boolean }[]) {
  const seen = new Set<string>();
  const out: { code: string; label?: string; is_default?: boolean }[] = [];

  for (const it of items) {
    const code = toShortLocale(it?.code);
    if (!code) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ ...it, code });
  }

  return out;
}

function buildLocaleLabel(item: { code: string; label?: string }): string {
  const code = toShortLocale(item.code);
  const label = String(item.label || '').trim();
  if (label) return `${label} (${code})`;

  try {
    const dn = new Intl.DisplayNames(['de'], { type: 'language' });
    const name = dn.of(code) ?? '';
    return name ? `${name} (${code})` : `${code.toUpperCase()} (${code})`;
  } catch {
    return `${code.toUpperCase()} (${code})`;
  }
}

/* -------------------- Page -------------------- */

const AdminServiceDetailPage: NextPage = () => {
  const router = useRouter();
  const isRouterReady = router.isReady;

  const id = useMemo(() => {
    const raw = router.query?.id;
    return isRouterReady && typeof raw === 'string' ? raw : undefined;
  }, [isRouterReady, router.query?.id]);

  const isCreateMode = id === 'new';
  const shouldSkipDetail = !isRouterReady || !id || isCreateMode;

  /* --------- Locales – RTK public endpoints --------- */

  const { data: appLocalesMeta, isLoading: l1, isFetching: f1 } = useGetAppLocalesPublicQuery();
  const {
    data: defaultLocaleMeta,
    isLoading: l2,
    isFetching: f2,
  } = useGetDefaultLocalePublicQuery();

  const { localeOptions, defaultLocale } = useMemo(() => {
    const metasRaw = Array.isArray(appLocalesMeta) ? appLocalesMeta : [];

    const active = metasRaw
      .filter((m: any) => m && m.code)
      .filter((m: any) => m.is_active !== false)
      .map((m: any) => ({
        code: toShortLocale(m.code),
        label: typeof m.label === 'string' ? m.label : undefined,
        is_default: m.is_default === true,
      }))
      .filter((x: any) => !!x.code);

    const uniq = uniqByCode(active);

    const metaDefault = uniq.find((x: any) => x.is_default)?.code || '';
    const defEndpoint =
      typeof defaultLocaleMeta === 'string' ? toShortLocale(defaultLocaleMeta) : '';

    const effectiveDefault = (metaDefault || defEndpoint || uniq[0]?.code || 'de').toLowerCase();

    const options: AdminLocaleOption[] = uniq.map((it: any) => ({
      value: toShortLocale(it.code),
      label: buildLocaleLabel(it),
    }));

    return { localeOptions: options, defaultLocale: effectiveDefault };
  }, [appLocalesMeta, defaultLocaleMeta]);

  const isLocalesLoading = l1 || l2 || f1 || f2;

  /* --------- Active locale state (URL sync) --------- */

  const initialActiveLocale = useMemo(() => {
    const qLocale = toShortLocale(router.query?.locale);

    if (qLocale && localeOptions.some((x) => x.value === qLocale)) return qLocale;
    if (defaultLocale && localeOptions.some((x) => x.value === defaultLocale)) return defaultLocale;

    return localeOptions?.[0]?.value || '';
  }, [router.query?.locale, localeOptions, defaultLocale]);

  const [activeLocale, setActiveLocale] = useState<string>('');

  // initialize/repair active locale when inputs change
  useEffect(() => {
    if (!activeLocale && initialActiveLocale) setActiveLocale(initialActiveLocale);
    if (activeLocale && initialActiveLocale && activeLocale !== initialActiveLocale) {
      // only fix if current becomes invalid
      const ok = localeOptions.some((x) => x.value === activeLocale);
      if (!ok) setActiveLocale(initialActiveLocale);
    }
  }, [activeLocale, initialActiveLocale, localeOptions]);

  // activeLocale -> URL sync (shallow)
  useEffect(() => {
    if (!router.isReady) return;
    if (!activeLocale) return;

    const cur = toShortLocale(router.query?.locale);
    if (activeLocale === cur) return;

    void router.replace(
      { pathname: router.pathname, query: { ...router.query, locale: activeLocale } },
      undefined,
      { shallow: true },
    );
  }, [activeLocale, router]);

  /* --------- Detail query – locale ile --------- */

  const {
    data: service,
    isLoading: isLoadingService,
    isFetching: isFetchingService,
    error: serviceError,
  } = useGetServiceAdminQuery(
    { id: id as string, locale: activeLocale },
    { skip: shouldSkipDetail || !activeLocale },
  );

  const [createService, { isLoading: isCreating }] = useCreateServiceAdminMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceAdminMutation();

  const loading = isLoadingService || isFetchingService || isLocalesLoading;
  const saving = isCreating || isUpdating;

  const handleCancel = () => {
    router.push({
      pathname: '/admin/services',
      query: activeLocale ? { locale: activeLocale } : undefined,
    });
  };

  const handleSubmit = async (values: ServiceFormValues) => {
    try {
      const loc = normalizeLocale(values.locale || activeLocale || defaultLocale);
      if (!loc) {
        toast.error('Locale seçimi zorunludur. app_locales ayarlarını kontrol edin.');
        return;
      }

      const common = {
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
        toast.error('Name ve Slug zorunludur.');
        return;
      }

      if (isCreateMode) {
        const payload: ServiceCreatePayload = {
          ...common,
          replicate_all_locales: values.replicate_all_locales,
        };

        const created = await createService(payload).unwrap();
        toast.success('Hizmet oluşturuldu.');

        const nextId = created.id;
        router.replace({
          pathname: `/admin/services/${encodeURIComponent(nextId)}`,
          query: { locale: loc },
        });
      } else {
        if (!service?.id) {
          toast.error('Hizmet verisi yüklenemedi.');
          return;
        }

        const payload: ServiceUpdatePayload = {
          ...common,
          apply_all_locales: values.apply_all_locales,
        };

        await updateService({ id: service.id, patch: payload }).unwrap();
        toast.success('Hizmet güncellendi.');

        if (loc && loc !== activeLocale) setActiveLocale(toShortLocale(loc));
      }
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'İşlem sırasında hata oluştu.');
    }
  };

  if (!isRouterReady) {
    return (
      <div className="container-fluid py-3">
        <div className="text-muted small">Yükleniyor...</div>
      </div>
    );
  }

  // app_locales yoksa net uyarı
  if (!isLocalesLoading && (!localeOptions || localeOptions.length === 0)) {
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
          onClick={() => router.push('/admin/site-settings')}
        >
          Site Ayarlarına git
        </button>
      </div>
    );
  }

  if (!isCreateMode && serviceError && !loading && !service) {
    return (
      <div className="container-fluid py-3">
        <h4 className="h5 mb-2">Hizmet bulunamadı</h4>
        <p className="text-muted small mb-3">
          Bu id için kayıtlı hizmet yok: <code className="ms-1">{id}</code>
        </p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
          Listeye dön
        </button>
      </div>
    );
  }

  const pageTitle = isCreateMode ? 'Yeni Hizmet Oluştur' : service?.name || 'Hizmet Düzenle';

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <h4 className="h5 mb-1">{pageTitle}</h4>
        <p className="text-muted small mb-0">
          Hizmeti burada oluşturup düzenleyebilirsin. Dil seçimi dinamik gelir ve URL ile senkron
          çalışır.
        </p>
      </div>

      <ServiceForm
        mode={isCreateMode ? 'create' : 'edit'}
        initialData={!isCreateMode && service ? service : undefined}
        loading={loading}
        saving={saving}
        locales={localeOptions}
        localesLoading={isLocalesLoading}
        defaultLocale={activeLocale || defaultLocale}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onLocaleChange={(loc) => setActiveLocale(toShortLocale(loc))}
      />
    </div>
  );
};

export default AdminServiceDetailPage;
