// =============================================================
// FILE: src/components/admin/site-settings/tabs/SeoSettingsTab.tsx
// konigsmassage – SEO Ayarları (GLOBAL '*' + Localized Override)
// ✅ MODAL KALDIRILDI
// - “Düzenle” artık /admin/site-settings/[id]?locale=... form sayfasına gider
//
// FIXES (korundu):
// - Locale change => refetch (stale view engeli)
// - RTK Query: refetchOnMountOrArgChange (global + locale)
// - Deterministic preview
// - site_meta_default GLOBAL(*) olamaz (override/create/restore guard)
//
// NEW:
// - Global OG default image (site_og_default_image, locale='*')
//   bu tab üzerinden de AdminImageUploadField ile yönetilebilir.
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/rtk/hooks';

import type { SiteSetting, SettingValue } from '@/integrations/types';

import { DEFAULT_SEO_GLOBAL, DEFAULT_SITE_META_DEFAULT_BY_LOCALE } from '@/seo/seoSchema';

import { AdminImageUploadField } from '@/components/common/AdminImageUploadField';

/* ----------------------------- helpers ----------------------------- */

function stringifyValuePretty(v: SettingValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function isSeoKey(key: string): boolean {
  const k = String(key || '')
    .trim()
    .toLowerCase();
  if (!k) return false;

  return (
    k === 'seo' ||
    k === 'site_seo' ||
    k === 'site_meta_default' ||
    k.startsWith('seo_') ||
    k.startsWith('seo|') ||
    k.startsWith('site_seo|') ||
    k.startsWith('ui_seo') ||
    k.startsWith('ui_seo_')
  );
}

const PRIMARY_SEO_KEYS = ['seo', 'site_seo', 'site_meta_default'] as const;

function orderSeoKeys(keys: string[]): string[] {
  const uniqKeys = Array.from(new Set(keys.filter(Boolean)));
  const primary = PRIMARY_SEO_KEYS.filter((k) => uniqKeys.includes(k));
  const rest = uniqKeys
    .filter((k) => !PRIMARY_SEO_KEYS.includes(k as any))
    .sort((a, b) => a.localeCompare(b));
  return [...primary, ...rest];
}

type RowGroup = {
  key: string;
  globalRow?: SiteSetting; // locale='*'
  localeRow?: SiteSetting; // locale='{selected}'
  effectiveValue: SettingValue | undefined;
  effectiveSource: 'locale' | 'global' | 'none';
};

function buildGroups(rows: SiteSetting[], locale: string): RowGroup[] {
  const seoRows = rows.filter((r) => r && isSeoKey(r.key));
  const keys = orderSeoKeys(seoRows.map((r) => r.key));

  const byKey = new Map<string, { global?: SiteSetting; local?: SiteSetting }>();
  for (const r of seoRows) {
    const entry = byKey.get(r.key) || {};
    if (r.locale === '*') entry.global = r;
    if (r.locale === locale) entry.local = r;
    byKey.set(r.key, entry);
  }

  return keys.map((k) => {
    const entry = byKey.get(k) || {};
    const effectiveSource: RowGroup['effectiveSource'] = entry.local
      ? 'locale'
      : entry.global
      ? 'global'
      : 'none';

    const effectiveValue =
      effectiveSource === 'locale'
        ? entry.local?.value
        : effectiveSource === 'global'
        ? entry.global?.value
        : undefined;

    return {
      key: k,
      globalRow: entry.global,
      localeRow: entry.local,
      effectiveSource,
      effectiveValue,
    };
  });
}

function preview(v: SettingValue | undefined): string {
  if (v === undefined) return '';
  const pretty = stringifyValuePretty(v);
  if (pretty.length <= 180) return pretty;
  return pretty.slice(0, 180) + '...';
}

function isPrimaryKey(k: string) {
  return k === 'seo' || k === 'site_seo' || k === 'site_meta_default';
}

function getEditHref(key: string, targetLocale: string) {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(
    targetLocale,
  )}`;
}

/* ----- media helpers (OG default image) ----- */

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

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

export type SeoSettingsTabProps = {
  locale: string; // selected locale from header
};

export const SeoSettingsTab: React.FC<SeoSettingsTabProps> = ({ locale }) => {
  const [search, setSearch] = useState('');

  // ✅ Query args
  const listArgsGlobal = useMemo(() => {
    const q = search.trim() || undefined;
    return { locale: '*', q };
  }, [search]);

  const listArgsLocale = useMemo(() => {
    const q = search.trim() || undefined;
    return { locale, q };
  }, [locale, search]);

  // OG default image (GLOBAL '*') – sadece site_og_default_image
  const ogArgs = useMemo(
    () => ({
      locale: '*',
      // IMPORTANT: "as const" KULLANMIYORUZ; ListParams.keys => string[]
      keys: ['site_og_default_image'],
      sort: 'key' as const,
      order: 'asc' as const,
      limit: 1,
      offset: 0,
    }),
    [],
  );

  // ✅ IMPORTANT: refetchOnMountOrArgChange fixes stale locale switching in this tab
  const qGlobal = useListSiteSettingsAdminQuery(listArgsGlobal, {
    skip: !locale,
    refetchOnMountOrArgChange: true,
  });

  const qLocale = useListSiteSettingsAdminQuery(listArgsLocale, {
    skip: !locale,
    refetchOnMountOrArgChange: true,
  });

  const qOg = useListSiteSettingsAdminQuery(ogArgs, {
    refetchOnMountOrArgChange: true,
  });

  const rowsMerged = useMemo(() => {
    const g = Array.isArray(qGlobal.data) ? qGlobal.data : [];
    const l = Array.isArray(qLocale.data) ? qLocale.data : [];
    return [...g, ...l];
  }, [qGlobal.data, qLocale.data]);

  const groups = useMemo(() => {
    const arr = rowsMerged || [];
    const s = search.trim().toLowerCase();

    const filtered =
      s && s.length >= 2
        ? arr.filter((r) => {
            const k = String(r?.key || '').toLowerCase();
            const v = stringifyValuePretty(r?.value as any).toLowerCase();
            return k.includes(s) || v.includes(s);
          })
        : arr;

    return buildGroups(filtered, locale);
  }, [rowsMerged, locale, search]);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy =
    qGlobal.isLoading ||
    qLocale.isLoading ||
    qOg.isLoading ||
    qGlobal.isFetching ||
    qLocale.isFetching ||
    qOg.isFetching ||
    isSaving ||
    isDeleting;

  const refetchAll = async () => {
    await Promise.all([qGlobal.refetch(), qLocale.refetch(), qOg.refetch()]);
  };

  // ✅ Locale changed => refetch; prevents “previous locale view”
  useEffect(() => {
    if (!locale) return;
    void refetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const deleteRow = async (key: string, targetLocale: string) => {
    const ok = window.confirm(`"${key}" (${targetLocale}) silinsin mi?`);
    if (!ok) return;

    try {
      await deleteSetting({ key, locale: targetLocale }).unwrap();
      toast.success(`"${key}" (${targetLocale}) silindi.`);
      await refetchAll();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'SEO ayarı silinirken hata oluştu.';
      toast.error(msg);
    }
  };

  const createOverrideFromGlobal = async (g: RowGroup) => {
    if (!g.globalRow) {
      toast.error('GLOBAL (*) kayıt bulunamadı. Önce global değer oluşturmalısın.');
      return;
    }

    // site_meta_default should not be global-copied; it must be locale based
    if (g.key === 'site_meta_default') {
      toast.error('site_meta_default GLOBAL(*) olamaz. Locale için seed/structured değer yaz.');
      return;
    }

    try {
      await updateSetting({
        key: g.key,
        locale,
        value: g.globalRow.value,
      }).unwrap();

      toast.success(`"${g.key}" için ${locale} override oluşturuldu (GLOBAL kopyalandı).`);
      await refetchAll();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || 'Override oluşturulurken hata oluştu.';
      toast.error(msg);
    }
  };

  const restoreDefaults = async (key: string, targetLocale: string) => {
    try {
      if (key === 'seo') {
        await updateSetting({ key, locale: targetLocale, value: DEFAULT_SEO_GLOBAL }).unwrap();
      } else if (key === 'site_seo') {
        // ✅ Artık site_seo için de aynı global schema kullanılıyor
        await updateSetting({ key, locale: targetLocale, value: DEFAULT_SEO_GLOBAL }).unwrap();
      } else if (key === 'site_meta_default') {
        if (targetLocale === '*') {
          toast.error('site_meta_default global(*) olamaz. Locale seçerek restore et.');
          return;
        }
        const seed =
          DEFAULT_SITE_META_DEFAULT_BY_LOCALE[targetLocale] ||
          DEFAULT_SITE_META_DEFAULT_BY_LOCALE[locale] ||
          DEFAULT_SITE_META_DEFAULT_BY_LOCALE['de'];
        await updateSetting({ key, locale: targetLocale, value: seed }).unwrap();
      } else {
        toast.error('Bu key için default tanımlı değil.');
        return;
      }

      toast.success(`"${key}" (${targetLocale}) default değerler geri yüklendi.`);
      await refetchAll();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Default restore hata verdi.';
      toast.error(msg);
    }
  };

  const upsertEmptyGlobalDefaults = async () => {
    const keys = ['seo', 'site_seo'] as const;

    try {
      for (const k of keys) {
        const exists = groups.find((g) => g.key === k)?.globalRow;
        if (exists) continue;

        await updateSetting({
          key: k,
          locale: '*',
          value: DEFAULT_SEO_GLOBAL, // ✅ site_seo da aynı şemayı kullanıyor
        }).unwrap();
      }
      toast.success('Eksik GLOBAL SEO kayıtları oluşturuldu.');
      await refetchAll();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'GLOBAL bootstrap hata verdi.';
      toast.error(msg);
    }
  };

  const effectiveEditLocale = (g: RowGroup): string => {
    // Öncelik: locale override varsa locale, yoksa global
    const chosen = g.localeRow ? locale : g.globalRow ? '*' : locale;

    // site_meta_default asla '*' ile düzenlenmesin (form sayfasında da guard var)
    if (g.key === 'site_meta_default' && chosen === '*') return locale;
    return chosen;
  };

  const globalEditLocaleForKey = (key: string): string => {
    // site_meta_default global edit yok -> locale ile aç
    if (key === 'site_meta_default') return locale;
    return '*';
  };

  // ---------------- OG DEFAULT IMAGE (GLOBAL '*') STATE ----------------

  const ogRow: SiteSetting | null = useMemo(() => {
    const arr = Array.isArray(qOg.data) ? qOg.data : [];
    const row = arr.find((r) => r && r.key === 'site_og_default_image') || null;
    return (row as SiteSetting | null) ?? null;
  }, [qOg.data]);

  const ogUrl = useMemo(() => {
    if (!ogRow) return '';
    return extractUrlFromSettingValue(ogRow.value as SettingValue);
  }, [ogRow]);

  const handleOgChange = async (nextUrl: string) => {
    const u = safeStr(nextUrl);
    if (!u) return;

    try {
      await updateSetting({
        key: 'site_og_default_image',
        locale: '*',
        value: toMediaValue(u),
      }).unwrap();
      toast.success('Varsayılan OG görseli güncellendi.');
      await qOg.refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.message ||
        'Varsayılan OG görseli kaydedilirken hata oluştu.';
      toast.error(msg);
    }
  };

  return (
    <div className="card">
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <span className="small fw-semibold">SEO Ayarları</span>
          <span className="text-muted small">
            GLOBAL (<code>*</code>) default + seçili dil (<strong>{locale}</strong>) override
            birlikte yönetilir. “Düzenle” butonu form sayfasını açar.
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark border">Dil: {locale}</span>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={refetchAll}
            disabled={busy}
          >
            Yenile
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={upsertEmptyGlobalDefaults}
            disabled={busy}
            title="seo / site_seo GLOBAL (*) yoksa default schema ile oluşturur"
          >
            Global Bootstrap
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* OG DEFAULT IMAGE (GLOBAL '*') BLOĞU */}
        <div className="mb-3 border rounded-2 p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <div className="small fw-semibold">Varsayılan OG Görseli (Global)</div>
              <div className="text-muted small">
                Key: <code>site_og_default_image</code> / <code>locale=&quot;*&quot;</code>
              </div>
            </div>

            {ogUrl && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => void copyToClipboard(ogUrl)}
                disabled={busy}
              >
                URL Kopyala
              </button>
            )}
          </div>

          <AdminImageUploadField
            label=""
            helperText={
              <span className="text-muted small">
                Buradan yüklenen görsel, global OG varsayılanı olarak kullanılır. Brand &amp; Media
                tabındaki <code>site_og_default_image</code> ile aynıdır.
              </span>
            }
            bucket="public"
            folder="site-media"
            metadata={{ key: 'site_og_default_image', scope: 'site_settings', locale: '*' }}
            value={ogUrl}
            onChange={(u) => void handleOgChange(u)}
            disabled={busy}
            openLibraryHref="/admin/storage"
            previewAspect="16x9"
            previewObjectFit="cover"
          />
        </div>

        <div className="input-group input-group-sm mb-3">
          <span className="input-group-text">Ara</span>
          <input
            type="text"
            className="form-control"
            placeholder="Key veya değer içinde ara"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={busy}
          />
        </div>

        {busy && (
          <div className="mb-2">
            <span className="badge bg-secondary">Yükleniyor...</span>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Key</th>
                <th style={{ width: '18%' }}>Kaynak</th>
                <th style={{ width: '34%' }}>Effective (Özet)</th>
                <th style={{ width: '20%' }} className="text-end">
                  İşlemler
                </th>
              </tr>
            </thead>

            <tbody>
              {groups.length ? (
                groups.map((g) => {
                  const hasGlobal = Boolean(g.globalRow);
                  const hasLocal = Boolean(g.localeRow);

                  const editLoc = effectiveEditLocale(g);
                  const editHref = getEditHref(g.key, editLoc);

                  return (
                    <React.Fragment key={`group_${g.key}`}>
                      {/* Group summary row */}
                      <tr className="table-light">
                        <td className="font-monospace small">
                          <strong>{g.key}</strong>
                        </td>
                        <td>
                          {g.effectiveSource === 'locale' ? (
                            <span className="badge bg-success">Override</span>
                          ) : g.effectiveSource === 'global' ? (
                            <span className="badge bg-primary">Global</span>
                          ) : (
                            <span className="badge bg-secondary">Yok</span>
                          )}
                        </td>

                        <td>
                          <span className="text-muted small">{preview(g.effectiveValue)}</span>
                          {g.effectiveSource === 'global' && !hasLocal && (
                            <div className="text-muted small mt-1">
                              Bu key için <strong>{locale}</strong> override yok; GLOBAL (
                              <code>*</code>) uygulanıyor.
                            </div>
                          )}
                        </td>

                        <td className="text-end">
                          <div className="d-inline-flex gap-1 flex-wrap justify-content-end">
                            <Link href={editHref} className="btn btn-outline-secondary btn-sm">
                              Düzenle
                            </Link>

                            {!hasLocal && hasGlobal && g.key !== 'site_meta_default' && (
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm"
                                onClick={() => createOverrideFromGlobal(g)}
                                disabled={busy}
                              >
                                Override Oluştur
                              </button>
                            )}

                            {isPrimaryKey(g.key) && (hasGlobal || hasLocal) && (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => restoreDefaults(g.key, hasLocal ? locale : '*')}
                                disabled={busy}
                                title="Bu satırın default değerlerini geri yükler"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Global row */}
                      <tr>
                        <td className="text-muted small ps-4">GLOBAL (*)</td>
                        <td className="text-muted small">{hasGlobal ? 'Var' : 'Yok'}</td>
                        <td className="text-muted small">
                          {hasGlobal ? preview(g.globalRow?.value) : '-'}
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <Link
                              href={getEditHref(g.key, globalEditLocaleForKey(g.key))}
                              className={`btn btn-outline-secondary btn-sm ${
                                !hasGlobal ? 'disabled' : ''
                              }`}
                              aria-disabled={!hasGlobal}
                              tabIndex={!hasGlobal ? -1 : 0}
                            >
                              Düzenle
                            </Link>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={busy || !hasGlobal}
                              onClick={() => deleteRow(g.key, '*')}
                              title={
                                g.key === 'site_meta_default'
                                  ? 'Normalde GLOBAL olmaz; varsa silinebilir.'
                                  : ''
                              }
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Locale row */}
                      <tr>
                        <td className="text-muted small ps-4">LOCALE ({locale})</td>
                        <td className="text-muted small">{hasLocal ? 'Var' : 'Yok'}</td>
                        <td className="text-muted small">
                          {hasLocal ? preview(g.localeRow?.value) : '-'}
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <Link
                              href={getEditHref(g.key, locale)}
                              className={`btn btn-outline-secondary btn-sm ${
                                !hasLocal ? 'disabled' : ''
                              }`}
                              aria-disabled={!hasLocal}
                              tabIndex={!hasLocal ? -1 : 0}
                            >
                              Düzenle
                            </Link>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={busy || !hasLocal}
                              onClick={() => deleteRow(g.key, locale)}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="text-center text-muted small py-3">
                      SEO kaydı bulunamadı.
                      <div className="mt-1">
                        Seed çalıştıysa en az <code>seo</code> ve <code>site_seo</code> GLOBAL
                        satırı görünmelidir.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            <caption className="pt-2">
              <span className="text-muted small">
                Not: <code>site_meta_default</code> GLOBAL(*) olamaz; edit linki her zaman locale
                ile açılır.
              </span>
            </caption>
          </table>
        </div>
      </div>
    </div>
  );
};
