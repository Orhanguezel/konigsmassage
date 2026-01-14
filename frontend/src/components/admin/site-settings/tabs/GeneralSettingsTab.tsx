// =============================================================
// FILE: src/components/admin/site-settings/tabs/GeneralSettingsTab.tsx
// konigsmassage – Genel / UI Ayarları (GLOBAL '*' + Localized Override)
// FIX: Modal kaldırıldı. Düzenleme artık detail form sayfasına link ile gider.
// Route: /admin/site-settings/[id]?locale=tr|en|*
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

/* ----------------------------- config ----------------------------- */

const GENERAL_KEYS = [
  'contact_info',
  'socials',
  'businessHours',
  'company_profile',
  'ui_header',
] as const;
type GeneralKey = (typeof GENERAL_KEYS)[number];

const DEFAULTS_BY_KEY: Record<GeneralKey, SettingValue> = {
  contact_info: { phone: '', email: '', address: '', whatsapp: '' },
  socials: { instagram: '', facebook: '', linkedin: '', youtube: '', x: '' },
  businessHours: [
    { day: 'mon', open: '09:00', close: '18:00', closed: false },
    { day: 'tue', open: '09:00', close: '18:00', closed: false },
    { day: 'wed', open: '09:00', close: '18:00', closed: false },
    { day: 'thu', open: '09:00', close: '18:00', closed: false },
    { day: 'fri', open: '09:00', close: '18:00', closed: false },
    { day: 'sat', open: '10:00', close: '14:00', closed: false },
    { day: 'sun', open: '00:00', close: '00:00', closed: true },
  ],
  company_profile: { company_name: 'konigsmassage', slogan: '', about: '' },
  ui_header: {
    nav_home: 'Home',
    nav_products: 'Products',
    nav_services: 'Services',
    nav_contact: 'Contact',
    cta_label: 'Get Offer',
  },
};

function isGeneralKey(k: string): k is GeneralKey {
  return (GENERAL_KEYS as readonly string[]).includes(k);
}

function stringifyValuePretty(v: SettingValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function formatValuePreview(v: SettingValue | undefined): string {
  if (v === undefined) return '';
  const s = stringifyValuePretty(v);
  if (s.length <= 140) return s;
  return s.slice(0, 140) + '...';
}

type RowGroup = {
  key: GeneralKey;
  globalRow?: SiteSetting;
  localeRow?: SiteSetting;
  effectiveValue: SettingValue | undefined;
  effectiveSource: 'locale' | 'global' | 'none';
};

function buildGroups(rows: SiteSetting[], locale: string): RowGroup[] {
  const only = rows.filter((r) => r && isGeneralKey(r.key));
  const byKey = new Map<GeneralKey, { global?: SiteSetting; local?: SiteSetting }>();

  for (const r of only) {
    const key = r.key as GeneralKey;
    const entry = byKey.get(key) || {};
    if (r.locale === '*') entry.global = r;
    if (r.locale === locale) entry.local = r;
    byKey.set(key, entry);
  }

  return GENERAL_KEYS.map((k) => {
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

function editHref(key: string, locale: string) {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(locale)}`;
}

/* ----------------------------- component ----------------------------- */

export type GeneralSettingsTabProps = {
  locale: string; // selected locale (tr/en/...)
};

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ locale }) => {
  const [search, setSearch] = useState('');

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  // list global + locale
  const listArgsGlobal = useMemo(() => {
    const q = search.trim() || undefined;
    return { locale: '*', q, keys: GENERAL_KEYS as unknown as string[] };
  }, [search]);

  const listArgsLocale = useMemo(() => {
    const q = search.trim() || undefined;
    return { locale, q, keys: GENERAL_KEYS as unknown as string[] };
  }, [locale, search]);

  const qGlobal = useListSiteSettingsAdminQuery(listArgsGlobal, { skip: !locale });
  const qLocale = useListSiteSettingsAdminQuery(listArgsLocale, { skip: !locale });

  useEffect(() => {
    // locale değişince search aynen kalabilir; burada ekstra bir şey yapma.
  }, [locale]);

  const rowsMerged = useMemo(() => {
    const g = Array.isArray(qGlobal.data) ? qGlobal.data : [];
    const l = Array.isArray(qLocale.data) ? qLocale.data : [];
    return [...g, ...l];
  }, [qGlobal.data, qLocale.data]);

  const groups = useMemo(() => {
    const arr = Array.isArray(rowsMerged) ? rowsMerged : [];
    const s = search.trim().toLowerCase();

    const filtered =
      s && s.length >= 2
        ? arr.filter((r) => {
            if (!r || !isGeneralKey(r.key)) return false;
            const k = String(r.key || '').toLowerCase();
            const v = stringifyValuePretty(r.value as any).toLowerCase();
            return k.includes(s) || v.includes(s);
          })
        : arr.filter((r) => r && isGeneralKey(r.key));

    return buildGroups(filtered as SiteSetting[], locale);
  }, [rowsMerged, locale, search]);

  const busy =
    qGlobal.isLoading ||
    qLocale.isLoading ||
    qGlobal.isFetching ||
    qLocale.isFetching ||
    isSaving ||
    isDeleting;

  const refetchAll = async () => {
    await Promise.all([qGlobal.refetch(), qLocale.refetch()]);
  };

  const createOverrideFromGlobal = async (g: RowGroup) => {
    if (!g.globalRow) {
      toast.error('GLOBAL (*) kayıt bulunamadı. Önce global değer oluşturmalısın.');
      return;
    }

    try {
      await updateSetting({ key: g.key, locale, value: g.globalRow.value }).unwrap();
      toast.success(`"${g.key}" için ${locale} override oluşturuldu (GLOBAL kopyalandı).`);
      await refetchAll();
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message || err?.message || 'Override oluşturulurken hata oluştu.',
      );
    }
  };

  const restoreDefaults = async (key: GeneralKey, targetLocale: string) => {
    try {
      await updateSetting({
        key,
        locale: targetLocale,
        value: DEFAULTS_BY_KEY[key] as any,
      }).unwrap();
      toast.success(`"${key}" (${targetLocale}) default değerler geri yüklendi.`);
      await refetchAll();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Default restore hata verdi.');
    }
  };

  const deleteRow = async (key: GeneralKey, targetLocale: string) => {
    const ok = window.confirm(`"${key}" (${targetLocale}) silinsin mi?`);
    if (!ok) return;

    try {
      await deleteSetting({ key, locale: targetLocale }).unwrap();
      toast.success(`"${key}" (${targetLocale}) silindi.`);
      await refetchAll();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silme sırasında hata oluştu.');
    }
  };

  const upsertEmptyGlobals = async () => {
    try {
      for (const k of GENERAL_KEYS) {
        const exists = groups.find((g) => g.key === k)?.globalRow;
        if (exists) continue;

        await updateSetting({ key: k, locale: '*', value: DEFAULTS_BY_KEY[k] as any }).unwrap();
      }
      toast.success('Eksik GLOBAL (*) General/UI kayıtları oluşturuldu.');
      await refetchAll();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'GLOBAL bootstrap hata verdi.');
    }
  };

  return (
    <div className="card">
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column">
          <span className="small fw-semibold">Genel / UI</span>
          <span className="text-muted small">
            GLOBAL (<code>*</code>) default + seçili dil (<strong>{locale}</strong>) override
            birlikte yönetilir.
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
            onClick={upsertEmptyGlobals}
            disabled={busy}
            title="Eksik GLOBAL (*) kayıtları default seed ile oluşturur"
          >
            Global Bootstrap
          </button>
        </div>
      </div>

      <div className="card-body">
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

                  return (
                    <React.Fragment key={`group_${g.key}`}>
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
                          <span className="text-muted small">
                            {formatValuePreview(g.effectiveValue)}
                          </span>
                          {g.effectiveSource === 'global' && !hasLocal && (
                            <div className="text-muted small mt-1">
                              Bu key için <strong>{locale}</strong> override yok; GLOBAL (
                              <code>*</code>) uygulanıyor.
                            </div>
                          )}
                        </td>

                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            {/* Edit: prefer locale row if exists else global */}
                            <Link
                              href={editHref(g.key, hasLocal ? locale : '*')}
                              className={`btn btn-outline-secondary btn-sm ${
                                !hasGlobal && !hasLocal ? 'disabled' : ''
                              }`}
                              aria-disabled={(!hasGlobal && !hasLocal) || busy}
                              onClick={(e) => {
                                if (busy || (!hasGlobal && !hasLocal)) e.preventDefault();
                              }}
                              title="Varsa locale override’ı, yoksa global’i düzenler (form sayfası)"
                            >
                              Düzenle
                            </Link>

                            {!hasLocal && hasGlobal && (
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm"
                                onClick={() => createOverrideFromGlobal(g)}
                                disabled={busy}
                              >
                                Override Oluştur
                              </button>
                            )}

                            {(hasGlobal || hasLocal) && (
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

                      {/* GLOBAL row */}
                      <tr>
                        <td className="text-muted small ps-4">GLOBAL (*)</td>
                        <td className="text-muted small">{hasGlobal ? 'Var' : 'Yok'}</td>
                        <td className="text-muted small">
                          {hasGlobal ? formatValuePreview(g.globalRow?.value) : '-'}
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <Link
                              href={editHref(g.key, '*')}
                              className={`btn btn-outline-secondary btn-sm ${
                                !hasGlobal ? 'disabled' : ''
                              }`}
                              aria-disabled={!hasGlobal || busy}
                              onClick={(e) => {
                                if (busy || !hasGlobal) e.preventDefault();
                              }}
                            >
                              Düzenle
                            </Link>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={busy || !hasGlobal}
                              onClick={() => deleteRow(g.key, '*')}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* LOCALE row */}
                      <tr>
                        <td className="text-muted small ps-4">LOCALE ({locale})</td>
                        <td className="text-muted small">{hasLocal ? 'Var' : 'Yok'}</td>
                        <td className="text-muted small">
                          {hasLocal ? formatValuePreview(g.localeRow?.value) : '-'}
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <Link
                              href={editHref(g.key, locale)}
                              className={`btn btn-outline-secondary btn-sm ${
                                !hasLocal ? 'disabled' : ''
                              }`}
                              aria-disabled={!hasLocal || busy}
                              onClick={(e) => {
                                if (busy || !hasLocal) e.preventDefault();
                              }}
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
                      Kayıt bulunamadı.
                      <div className="mt-1">
                        İpucu: “Global Bootstrap” ile GLOBAL (<code>*</code>) seed oluşturabilirsin.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            <caption className="pt-2">
              <span className="text-muted small">
                Yönetilen anahtarlar:
                {GENERAL_KEYS.map((k) => (
                  <code key={k} className="ms-1">
                    {k}
                  </code>
                ))}
              </span>
            </caption>
          </table>
        </div>
      </div>
    </div>
  );
};

GeneralSettingsTab.displayName = 'GeneralSettingsTab';
