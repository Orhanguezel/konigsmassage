// =============================================================
// FILE: src/components/admin/footer-sections/FooterSectionsList.tsx
// konigsmassage – Admin Footer Sections Listesi
//
// EXTRA:
// - item._menu_items (menu_items location=footer) gösterilir (varsa)
// - item._menu_count desteklenir (varsa)
// - HTML validity: <caption> table'ın ilk child'ı olacak şekilde düzeltildi
// =============================================================

'use client';

import React from 'react';
import type { FooterSectionDto } from '@/integrations/types';

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const toBool = (v: unknown) => v === true || v === 1 || v === '1' || v === 'true';

const getMenuItems = (item: FooterSectionDto): any[] => {
  const arr = (item as any)?._menu_items;
  return Array.isArray(arr) ? arr : [];
};

const getMenuCount = (item: FooterSectionDto): number | null => {
  const n = (item as any)?._menu_count;
  if (typeof n === 'number' && Number.isFinite(n)) return n;
  const arr = getMenuItems(item);
  return arr.length ? arr.length : null; // hiç veri yoksa null (UI'da "-" göstereceğiz)
};

const previewLinkText = (mi: any): string => {
  const title = safeText(mi?.title);
  const url = safeText(mi?.url);
  const slug = safeText(mi?.slug);
  const t = title || slug || safeText(mi?.id) || 'link';
  return url ? `${t} → ${url}` : t;
};

export interface FooterSectionsListProps {
  items: FooterSectionDto[];
  loading: boolean;
  onEdit: (item: FooterSectionDto) => void;
  onDelete: (item: FooterSectionDto) => void;
  onToggleActive: (item: FooterSectionDto, value: boolean) => void;
}

export const FooterSectionsList: React.FC<FooterSectionsListProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const rows = items ?? [];
  const totalItems = rows.length;
  const hasData = totalItems > 0;

  const busy = !!loading;

  const resolveCreated = (item: FooterSectionDto) =>
    typeof (item as any).created_at === 'string'
      ? (item as any).created_at
      : (item as any).created_at?.toString?.() ?? '';

  const resolveUpdated = (item: FooterSectionDto) =>
    typeof (item as any).updated_at === 'string'
      ? (item as any).updated_at
      : (item as any).updated_at?.toString?.() ?? '';

  const caption = (
    <span className="text-muted small">
      Footer section kayıtları locale bazlı yönetilebilir. Detay düzenleme için{' '}
      <strong>&quot;Düzenle&quot;</strong> butonunu kullan. Footer linkleri <code>menu_items</code>{' '}
      (location=footer, section_id=&lt;footer_section_id&gt;) tablosundan gelir. Liste ekranında
      linkler yalnızca backend list endpoint’i <code>_menu_items</code> /<code>_menu_count</code>{' '}
      döndürüyorsa önizlenir.
    </span>
  );

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header py-2">
        <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 flex-wrap">
          <div className="small fw-semibold">Footer Sections</div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {loading && (
              <span className="small text-muted d-flex align-items-center gap-1">
                <span className="spinner-border spinner-border-sm" role="status" />
                <span>Yükleniyor...</span>
              </span>
            )}

            <span className="text-muted small">
              Toplam: <strong>{totalItems}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {/* ===================== XXL+ TABLE ===================== */}
        <div className="d-none d-xxl-block">
          <div className="table-responsive">
            <table
              className="table table-hover table-sm align-middle mb-0"
              style={{ tableLayout: 'fixed', width: '100%' }}
            >
              <caption className="px-3 py-2 text-start">{caption}</caption>

              <colgroup>
                <col style={{ width: '80px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '260px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '170px' }} />
              </colgroup>

              <thead className="table-light">
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Sıra</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Başlık</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Slug</th>
                  <th className="text-center" style={{ whiteSpace: 'nowrap' }}>
                    Aktif
                  </th>
                  <th style={{ whiteSpace: 'nowrap' }}>Locale</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Footer Links</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Tarih</th>
                  <th className="text-end" style={{ whiteSpace: 'nowrap' }}>
                    İşlemler
                  </th>
                </tr>
              </thead>

              <tbody>
                {!hasData ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 small text-muted">
                      {loading ? 'Yükleniyor...' : 'Kayıt bulunamadı.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((item, idx) => {
                    const isActive = toBool((item as any).is_active);

                    const created = resolveCreated(item);
                    const updated = resolveUpdated(item);

                    const order = (item as any).display_order ?? idx + 1;
                    const title = safeText((item as any).title);
                    const slug = safeText((item as any).slug) || '-';
                    const loc = safeText((item as any).locale_resolved ?? (item as any).locale);

                    const links = getMenuItems(item);
                    const linkCount = getMenuCount(item);
                    const previews = links.slice(0, 2).map(previewLinkText);

                    return (
                      <tr key={String((item as any).id)}>
                        <td className="text-muted small text-nowrap">
                          <span className="me-1">#</span>
                          <span>{order}</span>
                        </td>

                        <td className="small" style={{ minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <div
                              className="fw-semibold text-truncate"
                              title={title || '(başlık yok)'}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {title ? title : <span className="text-muted">(başlık yok)</span>}
                            </div>

                            {(item as any).description ? (
                              <div
                                className="text-muted small text-truncate"
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                {String((item as any).description)}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="small" style={{ minWidth: 0 }}>
                          <div
                            className="text-truncate"
                            title={slug}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            <code>{slug}</code>
                          </div>
                        </td>

                        <td className="text-center">
                          <div className="form-check form-switch d-inline-flex m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isActive}
                              disabled={busy}
                              onChange={(e) => onToggleActive(item, e.target.checked)}
                            />
                          </div>
                        </td>

                        <td className="small">
                          {loc ? (
                            <span className="badge bg-light text-dark border small">
                              <code>{loc}</code>
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        {/* footer links preview (safe) */}
                        <td className="small" style={{ minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-dark border small">
                              {linkCount === null ? '-' : `${linkCount} link`}
                            </span>
                            <div className="text-truncate" style={{ whiteSpace: 'nowrap' }}>
                              {previews.length ? (
                                <span title={previews.join(' | ')}>
                                  {previews.join(' | ')}
                                  {linkCount !== null && linkCount > previews.length ? ' …' : ''}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </div>
                          </div>
                          <div className="text-muted small">Detayda yönetilir.</div>
                        </td>

                        <td className="small">
                          <div className="text-truncate" style={{ whiteSpace: 'nowrap' }}>
                            {formatDate(created)}
                          </div>
                          <div
                            className="text-muted small text-truncate"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            Güncelleme: {formatDate(updated)}
                          </div>
                        </td>

                        <td className="text-end text-nowrap">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => onEdit(item)}
                              disabled={busy}
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => onDelete(item)}
                              disabled={busy}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {loading && hasData ? (
                  <tr>
                    <td colSpan={8} className="text-center py-3 text-muted small">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== < XXL : CARDS ===================== */}
        <div className="d-block d-xxl-none">
          {loading ? (
            <div className="px-3 py-3 text-center text-muted small">Yükleniyor...</div>
          ) : hasData ? (
            <div className="p-3">
              <div className="row g-3">
                {rows.map((item, idx) => {
                  const isActive = toBool((item as any).is_active);
                  const created = resolveCreated(item);
                  const updated = resolveUpdated(item);

                  const order = (item as any).display_order ?? idx + 1;
                  const title = safeText((item as any).title);
                  const slug = safeText((item as any).slug) || '-';
                  const loc = safeText((item as any).locale_resolved ?? (item as any).locale);

                  const links = getMenuItems(item);
                  const linkCount = getMenuCount(item);
                  const previews = links.slice(0, 2).map(previewLinkText);

                  return (
                    <div key={String((item as any).id)} className="col-12 col-lg-6">
                      <div className="border rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="badge bg-light text-dark border">#{order}</span>
                            {loc ? (
                              <span className="badge bg-light text-dark border small">
                                locale: <code>{loc}</code>
                              </span>
                            ) : null}
                            <span className="badge bg-light text-dark border small">
                              {linkCount === null ? '-' : `${linkCount} link`}
                            </span>
                          </div>

                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isActive}
                              disabled={busy}
                              onChange={(e) => onToggleActive(item, e.target.checked)}
                            />
                            <label className="form-check-label small">Aktif</label>
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>
                            {title ? title : <span className="text-muted">(başlık yok)</span>}
                          </div>

                          <div
                            className="text-muted small mt-1"
                            style={{ wordBreak: 'break-word' }}
                          >
                            Slug: <code>{slug}</code>
                          </div>

                          {/* footer links preview */}
                          <div
                            className="text-muted small mt-2"
                            style={{ wordBreak: 'break-word' }}
                          >
                            <div className="fw-semibold text-dark mb-1">Footer Links</div>
                            {previews.length ? (
                              <div>
                                {previews.join(' | ')}
                                {linkCount !== null && linkCount > previews.length ? ' …' : ''}
                              </div>
                            ) : (
                              <div className="text-muted">-</div>
                            )}
                            <div className="text-muted">Detayda yönetilir.</div>
                          </div>

                          {(item as any).description ? (
                            <div
                              className="text-muted small mt-2"
                              style={{ wordBreak: 'break-word' }}
                            >
                              {String((item as any).description)}
                            </div>
                          ) : null}

                          <div className="text-muted small mt-2">
                            <div>Oluşturma: {formatDate(created)}</div>
                            <div>Güncelleme: {formatDate(updated)}</div>
                          </div>
                        </div>

                        <div className="mt-3 d-flex gap-2 flex-wrap justify-content-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => onEdit(item)}
                            disabled={busy}
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onDelete(item)}
                            disabled={busy}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3">{caption}</div>
            </div>
          ) : (
            <div className="px-3 py-3 text-center text-muted small">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>
    </div>
  );
};
