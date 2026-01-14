// =============================================================
// FILE: src/components/admin/site-settings/tabs/BrandMediaTab.tsx
// konigsmassage – Brand / Media Settings Tab (GLOBAL '*')
// - Flicker fix korunur (refetch loop yok)
// - Responsive: cards/grid (taşma yok)
// - Duplicate preview yok; sadece AdminImageUploadField preview kullanılır
// - Logo / Icon / OG image için uygun aspect + object-fit
// =============================================================

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/rtk/hooks';

import type { SiteSetting, SettingValue } from '@/integrations/types';
import { AdminImageUploadField } from '@/components/common/AdminImageUploadField';

/* ----------------------------- constants ----------------------------- */

const GLOBAL_LOCALE = '*' as const;

export const SITE_MEDIA_KEYS = [
  'site_logo',
  'site_logo_dark',
  'site_logo_light',
  'site_favicon',
  'site_apple_touch_icon',
  'site_app_icon_512',
  'site_og_default_image',
] as const;

type MediaKey = (typeof SITE_MEDIA_KEYS)[number];

const labelMap: Record<MediaKey, string> = {
  site_logo: 'Logo',
  site_logo_dark: 'Logo (Dark)',
  site_logo_light: 'Logo (Light)',
  site_favicon: 'Favicon',
  site_apple_touch_icon: 'Apple Touch Icon',
  site_app_icon_512: 'App Icon 512x512',
  site_og_default_image: 'OG Default Image',
};

function isMediaKey(k: string): k is MediaKey {
  return (SITE_MEDIA_KEYS as readonly string[]).includes(k);
}

/**
 * Her key için preview aspect & fit ayarı
 */
const previewConfig: Record<
  MediaKey,
  {
    aspect: '16x9' | '4x3' | '1x1';
    fit: 'cover' | 'contain';
  }
> = {
  site_logo: { aspect: '4x3', fit: 'contain' },
  site_logo_dark: { aspect: '4x3', fit: 'contain' },
  site_logo_light: { aspect: '4x3', fit: 'contain' },
  site_favicon: { aspect: '1x1', fit: 'contain' },
  site_apple_touch_icon: { aspect: '1x1', fit: 'contain' },
  site_app_icon_512: { aspect: '1x1', fit: 'contain' },
  site_og_default_image: { aspect: '16x9', fit: 'cover' },
};

/* ----------------------------- helpers ----------------------------- */

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

function getEditHref(key: string, targetLocale: string) {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(
    targetLocale,
  )}`;
}

/**
 * DB'de media value:
 *  - string url
 *  - object: { url: "..." }
 *  - stringified json: "{ "url": "..." }"
 */
function extractUrlFromSettingValue(v: SettingValue): string {
  if (v === null) return '';

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (!looksJson) return s;

    try {
      const parsed = JSON.parse(s);
      return safeStr((parsed as any)?.url) || '';
    } catch {
      return s;
    }
  }

  if (typeof v === 'object') {
    return safeStr((v as any)?.url) || '';
  }

  return '';
}

/** Save format: JSON object { url } */
function toMediaValue(url: string): SettingValue {
  const u = safeStr(url);
  if (!u) return null;
  return { url: u };
}

async function copyToClipboard(text: string) {
  const t = safeStr(text);
  if (!t) return;

  try {
    await navigator.clipboard.writeText(t);
    toast.success('URL kopyalandı.');
  } catch {
    toast.error('Kopyalama başarısız. Tarayıcı izni engelliyor olabilir.');
  }
}

/* ----------------------------- component ----------------------------- */

export const BrandMediaTab: React.FC = () => {
  const [search, setSearch] = useState('');

  const listArgs = useMemo(() => {
    const q = search.trim() || undefined;
    return {
      locale: GLOBAL_LOCALE,
      q,
      keys: [...SITE_MEDIA_KEYS],
      sort: 'key' as const,
      order: 'asc' as const,
      limit: 200,
      offset: 0,
    };
  }, [search]);

  const qGlobal = useListSiteSettingsAdminQuery(listArgs, {
    refetchOnMountOrArgChange: true,
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy = qGlobal.isLoading || qGlobal.isFetching || isSaving || isDeleting;

  const refetchAll = useCallback(async () => {
    await qGlobal.refetch();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qGlobal.refetch]);

  const rows = useMemo(() => {
    const all = Array.isArray(qGlobal.data) ? qGlobal.data : [];
    const media = all.filter(
      (r) => r && isMediaKey(String(r.key || '')) && String(r.locale ?? '') === GLOBAL_LOCALE,
    );

    const s = search.trim().toLowerCase();
    if (!s || s.length < 2) return media;

    return media.filter((r) =>
      String(r?.key || '')
        .toLowerCase()
        .includes(s),
    );
  }, [qGlobal.data, search]);

  const byKey = useMemo(() => {
    const map = new Map<MediaKey, SiteSetting | null>();
    for (const k of SITE_MEDIA_KEYS) map.set(k, null);

    for (const r of rows) {
      if (!r) continue;
      if (!isMediaKey(String(r.key || ''))) continue;
      map.set(r.key as MediaKey, r);
    }

    return map;
  }, [rows]);

  const quickUpload = useCallback(
    async (key: MediaKey, url: string) => {
      const u = safeStr(url);
      if (!u) return;

      try {
        await updateSetting({ key, locale: GLOBAL_LOCALE, value: toMediaValue(u) }).unwrap();
        toast.success(`${labelMap[key]} güncellendi.`);
        await refetchAll();
      } catch (err: any) {
        toast.error(
          err?.data?.error?.message ||
            err?.message ||
            `${labelMap[key]} kaydedilirken hata oluştu.`,
        );
      }
    },
    [updateSetting, refetchAll],
  );

  const deleteRow = useCallback(
    async (key: MediaKey) => {
      const ok = window.confirm(`"${key}" (${GLOBAL_LOCALE}) silinsin mi?`);
      if (!ok) return;

      try {
        await deleteSetting({ key, locale: GLOBAL_LOCALE }).unwrap();
        toast.success(`"${key}" (${GLOBAL_LOCALE}) silindi.`);
        await refetchAll();
      } catch (err: any) {
        toast.error(err?.data?.error?.message || err?.message || 'Silme sırasında hata oluştu.');
      }
    },
    [deleteSetting, refetchAll],
  );

  return (
    <div className="card konigsmassage-brand-media">
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <span className="small fw-semibold">Logo &amp; Favicon</span>
          <span className="text-muted small">
            Bu tab dilden bağımsızdır. Kayıtlar <code>locale=&quot;*&quot;</code> olarak saklanır.
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark border">Locale: *</span>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={refetchAll}
            disabled={busy}
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="input-group input-group-sm mb-3">
          <span className="input-group-text">Ara</span>
          <input
            type="text"
            className="form-control"
            placeholder="Key içinde ara (örn: logo, favicon)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={busy}
          />
        </div>

        {busy && (
          <div className="mb-3">
            <span className="badge bg-secondary">Yükleniyor...</span>
          </div>
        )}

        <div className="konigsmassage-brand-media__grid">
          {SITE_MEDIA_KEYS.map((k) => {
            const row = byKey.get(k) ?? null;
            const hasRow = Boolean(row);

            const rowValue: SettingValue = (row?.value ?? null) as SettingValue;
            const rawUrl = extractUrlFromSettingValue(rowValue);

            const cfg = previewConfig[k];

            return (
              <div key={`media_${k}`} className="konigsmassage-brand-media__item">
                <div className="konigsmassage-brand-media__head">
                  <div>
                    <div className="konigsmassage-brand-media__title">{labelMap[k]}</div>
                    <div className="konigsmassage-brand-media__meta">
                      <span className="font-monospace">{k}</span>
                      <span className="text-muted">locale: *</span>
                    </div>
                  </div>

                  <div className="konigsmassage-brand-media__actions">
                    <Link
                      href={getEditHref(k, GLOBAL_LOCALE)}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Düzenle
                    </Link>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={busy || !hasRow}
                      onClick={() => void deleteRow(k)}
                    >
                      Sil
                    </button>
                  </div>
                </div>

                <div className="konigsmassage-brand-media__body">
                  <div className="konigsmassage-brand-media__uploader">
                    <AdminImageUploadField
                      label=""
                      helperText={
                        <span className="text-muted small">
                          Upload sonrası otomatik kaydedilir.
                        </span>
                      }
                      bucket="public"
                      folder="site-media"
                      metadata={{ key: k, scope: 'site_settings', locale: GLOBAL_LOCALE }}
                      value={rawUrl}
                      onChange={(nextUrl) => void quickUpload(k, nextUrl)}
                      disabled={busy}
                      openLibraryHref="/admin/storage"
                      previewAspect={cfg.aspect}
                      previewObjectFit={cfg.fit}
                    />
                  </div>
                </div>

                {rawUrl ? (
                  <div className="konigsmassage-brand-media__url">
                    <span className="text-muted small">URL:</span>

                    <code className="konigsmassage-brand-media__urlCode" title={rawUrl}>
                      {rawUrl}
                    </code>

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => void copyToClipboard(rawUrl)}
                      disabled={busy}
                    >
                      Kopyala
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-muted small">
          Not: Bu ayarlar globaldir. Dil değişse bile <code>*</code> üzerinden yönetilir.
        </div>
      </div>
    </div>
  );
};

BrandMediaTab.displayName = 'BrandMediaTab';
