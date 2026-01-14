// =============================================================
// FILE: src/components/admin/site-settings/SiteSettingsList.tsx
// konigsmassage – Site Ayarları Liste Bileşeni
// FIX: Hide SEO keys in global(*) list.
// UI FIX: Mobile responsive cards
// FIX: <a href> => next/link (no full reload)
// FIX: renderEditAction double-call removed
// NEW: Preview fallback -> if value is object/array OR string(JSON), show JSON preview
// =============================================================

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { SiteSetting, SettingValue } from '@/integrations/types';

/* ----------------------------- helpers ----------------------------- */

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

/**
 * Some rows may store JSON as string in DB.
 * For list preview, attempt to parse if it "looks like JSON".
 */
function coercePreviewValue(input: SettingValue): SettingValue {
  if (input === null || input === undefined) return input;

  // already object/array
  if (typeof input === 'object') return input;

  // string -> try json (only if it looks like json)
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return input;

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (!looksJson) return input;

    try {
      return JSON.parse(s) as any;
    } catch {
      return input;
    }
  }

  return input;
}

function formatValuePreview(v: SettingValue): string {
  const vv = coercePreviewValue(v);

  if (vv === null || vv === undefined) return '';

  if (typeof vv === 'string') {
    const s = vv.trim();
    if (s.length <= 160) return s;
    return s.slice(0, 157) + '...';
  }

  if (typeof vv === 'number' || typeof vv === 'boolean') return String(vv);

  // object/array: show compact JSON preview
  try {
    const s = JSON.stringify(vv);
    if (s.length <= 160) return s;
    return s.slice(0, 157) + '...';
  } catch {
    return String(vv as any);
  }
}

/* ----------------------------- types ----------------------------- */

export type SiteSettingsListProps = {
  settings?: SiteSetting[];
  loading: boolean;

  onEdit?: (setting: SiteSetting) => void;
  onDelete?: (setting: SiteSetting) => void;

  /**
   * New behavior: edit action can be a link.
   * Example: (s) => `/admin/site-settings/${encodeURIComponent(s.key)}?locale=${selectedLocale}`
   */
  getEditHref?: (setting: SiteSetting) => string;

  selectedLocale: string; // 'en' | 'de' | '*'
};

/* ----------------------------- component ----------------------------- */

export const SiteSettingsList: React.FC<SiteSettingsListProps> = ({
  settings,
  loading,
  onEdit,
  onDelete,
  getEditHref,
  selectedLocale,
}) => {
  const filtered = useMemo(() => {
    const arr = Array.isArray(settings) ? settings : [];
    if (selectedLocale === '*') return arr.filter((s) => s && !isSeoKey(s.key));
    return arr;
  }, [settings, selectedLocale]);

  const hasData = filtered.length > 0;

  const renderEditAction = (s: SiteSetting) => {
    const href = getEditHref?.(s);

    if (href) {
      return (
        <Link href={href} className="btn btn-outline-secondary btn-sm">
          Düzenle
        </Link>
      );
    }

    if (onEdit) {
      return (
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onEdit(s)}
        >
          Düzenle
        </button>
      );
    }

    return null;
  };

  return (
    <div className="card">
      <div className="card-header py-2 d-flex align-items-center justify-content-between">
        <span className="small fw-semibold">
          Ayar Listesi{' '}
          {selectedLocale ? (
            <span className="badge bg-light text-dark border ms-2">{selectedLocale}</span>
          ) : null}
        </span>
        {loading && <span className="badge bg-secondary">Yükleniyor...</span>}
      </div>

      <div className="card-body p-0">
        {/* ===================== DESKTOP TABLE (md+) ===================== */}
        <div className="d-none d-md-block">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Key</th>
                <th style={{ width: '10%' }}>Dil</th>
                <th style={{ width: '35%' }}>Değer (Özet)</th>
                <th style={{ width: '15%' }}>Güncellenme</th>
                <th style={{ width: '10%' }} className="text-end">
                  İşlemler
                </th>
              </tr>
            </thead>

            <tbody>
              {hasData ? (
                filtered.map((s) => (
                  <tr key={`${s.key}_${s.locale || 'none'}`} style={{ cursor: 'default' }}>
                    <td style={{ wordBreak: 'break-word' }}>{s.key}</td>
                    <td>{s.locale || <span className="text-muted">-</span>}</td>
                    <td>
                      <span className="text-muted small" style={{ wordBreak: 'break-word' }}>
                        {formatValuePreview(s.value)}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted small">
                        {s.updated_at ? new Date(s.updated_at).toLocaleString() : '-'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        {renderEditAction(s)}
                        {onDelete && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => onDelete(s)}
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="text-center text-muted small py-3">Kayıt bulunamadı.</div>
                  </td>
                </tr>
              )}
            </tbody>

            <caption className="px-3 py-2 text-start">
              <span className="text-muted small">
                Bu tablo <code>site_settings</code> kayıtlarını <strong>{selectedLocale}</strong>{' '}
                locale’i için gösterir.
                {selectedLocale === '*' ? (
                  <> SEO anahtarları bu listede gizlenir; SEO tab’ında yönetilir.</>
                ) : null}
              </span>
            </caption>
          </table>
        </div>

        {/* ===================== MOBILE CARDS (sm and down) ===================== */}
        <div className="d-block d-md-none">
          {hasData ? (
            filtered.map((s) => {
              const localeBadge = s.locale ? (
                <span className="badge bg-light text-dark border ms-2">{s.locale}</span>
              ) : null;

              const editAction = renderEditAction(s);

              return (
                <div key={`${s.key}_${s.locale || 'none'}`} className="border-bottom px-3 py-3">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-semibold small" style={{ wordBreak: 'break-word' }}>
                        {s.key}
                        {localeBadge}
                      </div>

                      <div
                        className="text-muted small mt-1"
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                      >
                        {formatValuePreview(s.value)}
                      </div>

                      <div className="text-muted small mt-2">
                        <span className="me-1">Güncellenme:</span>
                        {s.updated_at ? new Date(s.updated_at).toLocaleString() : '-'}
                      </div>
                    </div>
                  </div>

                  {(editAction || onDelete) && (
                    <div className="mt-3 d-flex flex-column gap-2">
                      {editAction ? <div className="d-grid">{editAction}</div> : null}

                      {onDelete && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm w-100"
                          onClick={() => onDelete(s)}
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center text-muted small">Kayıt bulunamadı.</div>
          )}

          <div className="px-3 py-2 border-top">
            <span className="text-muted small">
              Mobil görünümde kayıtlar kart formatında listelenir.
              {selectedLocale === '*' ? ' SEO anahtarları burada da gizlidir.' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

SiteSettingsList.displayName = 'SiteSettingsList';
