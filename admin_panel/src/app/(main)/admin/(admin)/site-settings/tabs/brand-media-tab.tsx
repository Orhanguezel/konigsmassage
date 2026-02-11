// =============================================================
// FILE: src/components/admin/site-settings/tabs/BrandMediaTab.tsx
// guezelwebdesign – Brand / Media Settings Tab (GLOBAL '*')
// - Flicker fix korunur (refetch loop yok)
// - Responsive: cards/grid (taşma yok)
// - Duplicate preview yok; sadece AdminImageUploadField preview kullanılır
// - Logo / Icon / OG image için uygun aspect + object-fit
// =============================================================

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';

import type { SiteSetting, SettingValue } from '@/integrations/shared';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  if (v === null || v === undefined) return '';

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';

    // JSON gibi görünüyorsa parse et
    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (looksJson) {
      try {
        const parsed = JSON.parse(s);
        const url = safeStr((parsed as any)?.url);
        if (url) return url;
      } catch {
        // Parse hatası, direkt string olarak kullan
      }
    }

    // JSON değilse veya parse edemediyse, direkt URL olarak kabul et
    return s;
  }

  if (typeof v === 'object' && v !== null) {
    const url = safeStr((v as any)?.url);
    if (url) return url;
  }

  return '';
}

/** Save format: JSON object { url } */
function toMediaValue(url: string): SettingValue {
  const u = safeStr(url);
  if (!u) return null;
  return { url: u };
}

async function copyToClipboard(text: string, successMsg: string, errorMsg: string) {
  const t = safeStr(text);
  if (!t) return;

  try {
    await navigator.clipboard.writeText(t);
    toast.success(successMsg);
  } catch {
    toast.error(errorMsg);
  }
}

/**
 * Normalize image URL - if relative, try to make it absolute
 * Returns empty string if URL is invalid
 */
function normalizeImageUrl(rawUrl: string): string {
  const url = safeStr(rawUrl);
  if (!url) return '';

  // Already a full URL (http, https, data URI)
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('//')
  ) {
    return url;
  }

  // Relative URL detected - log warning for debugging
  if (typeof window !== 'undefined') {
    console.warn(
      `[BrandMediaTab] Relative URL detected: "${url}". ` +
        'Database should store full URLs. Attempting to resolve...',
    );
  }

  // Try to construct full URL using NEXT_PUBLIC_SITE_URL (public panel URL)
  // This is where storage/assets are served from
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const base = publicSiteUrl.replace(/\/$/, '');

  try {
    // If URL starts with /, use it directly (absolute path)
    // Otherwise, assume it's in storage folder
    const fullUrl = url.startsWith('/') ? `${base}${url}` : `${base}/storage/${url}`;

    if (typeof window !== 'undefined') {
      console.info(`[BrandMediaTab] Resolved "${url}" to: ${fullUrl}`);
    }
    return fullUrl;
  } catch (e) {
    console.error('[BrandMediaTab] Failed to normalize URL:', e);
  }

  // Return original if all else fails
  return url;
}

/* ----------------------------- component ----------------------------- */

export const BrandMediaTab: React.FC = () => {
  const [search, setSearch] = useState('');

  // Use default locale for translation (since this is global tab)
  const t = useAdminT();
  const labelForKey = useCallback(
    (key: MediaKey) =>
      t(`admin.siteSettings.brandMedia.labels.${key}`, undefined, key),
    [t],
  );

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
      (r: any) => r && isMediaKey(String(r.key || '')) && String(r.locale ?? '') === GLOBAL_LOCALE,
    );

    const s = search.trim().toLowerCase();
    if (!s || s.length < 2) return media;

    return media.filter((r: any) =>
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
      map.set(r.key as MediaKey, r as SiteSetting);
    }

    return map;
  }, [rows]);

  const quickUpload = useCallback(
    async (key: MediaKey, url: string) => {
      const u = safeStr(url);
      if (!u) return;

      try {
        await updateSetting({ key, locale: GLOBAL_LOCALE, value: toMediaValue(u) }).unwrap();
        toast.success(t('admin.siteSettings.brandMedia.updated', { label: labelForKey(key) }));
        await refetchAll();
      } catch (err: any) {
        toast.error(
          err?.data?.error?.message ||
            err?.message ||
            t('admin.siteSettings.brandMedia.updateError', { label: labelForKey(key) }),
        );
      }
    },
    [updateSetting, refetchAll, t, labelForKey],
  );

  const deleteRow = useCallback(
    async (key: MediaKey) => {
      const ok = window.confirm(t('admin.siteSettings.brandMedia.deleteConfirm', { key, locale: GLOBAL_LOCALE }));
      if (!ok) return;

      try {
        await deleteSetting({ key, locale: GLOBAL_LOCALE }).unwrap();
        toast.success(t('admin.common.deleted', { item: key }));
        await refetchAll();
      } catch (err: any) {
        toast.error(err?.data?.error?.message || err?.message || t('admin.siteSettings.brandMedia.deleteError'));
      }
    },
    [deleteSetting, refetchAll, t],
  );

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.brandMedia.title')}</CardTitle>
            <CardDescription>
              {t('admin.siteSettings.brandMedia.description')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t('admin.siteSettings.brandMedia.badge')}</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refetchAll}
              disabled={busy}
            >
              {t('admin.siteSettings.actions.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="brand-search">{t('admin.siteSettings.filters.search')}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="brand-search"
              type="text"
              placeholder={t('admin.siteSettings.brandMedia.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={busy}
              className="pl-9"
            />
          </div>
        </div>

        {busy && (
          <div>
            <Badge variant="secondary">{t('admin.siteSettings.messages.loading')}</Badge>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SITE_MEDIA_KEYS.map((k) => {
            const row = byKey.get(k) ?? null;
            const hasRow = Boolean(row);

            const rowValue: SettingValue = (row?.value ?? null) as SettingValue;
            const rawUrl = normalizeImageUrl(extractUrlFromSettingValue(rowValue));

            const cfg = previewConfig[k];

            return (
              <Card key={`media_${k}`}>
                <CardHeader className="gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-sm">{t(`admin.siteSettings.brandMedia.labels.${k}`)}</CardTitle>
                      <CardDescription className="text-xs">
                        <code className="font-mono">{k}</code>
                        <span className="mx-1">•</span>
                        <span>locale: *</span>
                      </CardDescription>
                    </div>

                    <div className="flex gap-1">
                      <Button asChild variant="outline" size="sm">
                        <Link href={getEditHref(k, GLOBAL_LOCALE)}>{t('admin.siteSettings.actions.edit')}</Link>
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={busy || !hasRow}
                        onClick={() => void deleteRow(k)}
                      >
                        {t('admin.siteSettings.actions.delete')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <AdminImageUploadField
                    label=""
                    helperText={
                      <span className="text-xs text-muted-foreground">
                        {t('admin.siteSettings.brandMedia.uploadHelp')}
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

                  {rawUrl && (
                    <div className="space-y-2">
                      <div className="rounded-md border bg-muted/50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t('admin.common.savedUrl')}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void copyToClipboard(rawUrl, t('admin.common.copySuccess'), t('admin.common.copyFailed'))}
                            disabled={busy}
                          >
                            {t('admin.siteSettings.actions.copy')}
                          </Button>
                        </div>
                        <code className="block wrap-break-word text-xs font-mono leading-relaxed">
                          {rawUrl}
                        </code>
                      </div>

                      {/* Manual preview for debugging */}
                      <div className="rounded-md border bg-muted/50 p-3">
                        <div className="mb-2 text-xs font-medium text-muted-foreground">
                          {t('admin.common.previewColon')}
                        </div>
                        <div className="relative aspect-video w-full overflow-hidden rounded border bg-background">
                          <img
                            src={rawUrl}
                            alt={t(`admin.siteSettings.brandMedia.labels.${k}`)}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.error-message')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className =
                                  'error-message flex h-full items-center justify-center text-xs text-muted-foreground';
                                errorDiv.textContent = t('admin.common.imageLoadFailed');
                                parent.appendChild(errorDiv);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {t('admin.siteSettings.brandMedia.note')}
        </p>
      </CardContent>
    </Card>
  );
};

BrandMediaTab.displayName = 'BrandMediaTab';
