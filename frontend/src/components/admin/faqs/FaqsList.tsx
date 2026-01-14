// =============================================================
// FILE: src/components/admin/faqs/FaqsList.tsx
// konigsmassage – Admin FAQ Listesi
//
// Responsive Strategy (Bootstrap 5):
// - < xxl: CARDS (dar desktop + tablet + mobile)
// - xxl+: TABLE (fixed layout + truncation)
//
// Goal: No broken table / minimal horizontal scroll
// =============================================================

'use client';

import React from 'react';
import type { FaqDto } from '@/integrations/types/faqs.types';

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

export interface FaqsListProps {
  items: FaqDto[];
  loading: boolean;
  onEdit: (item: FaqDto) => void;
  onDelete: (item: FaqDto) => void;
  onToggleActive: (item: FaqDto, value: boolean) => void;
}

export const FaqsList: React.FC<FaqsListProps> = ({
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

  const resolveCreated = (item: FaqDto) =>
    typeof (item as any).created_at === 'string'
      ? (item as any).created_at
      : (item as any).created_at?.toString?.() ?? '';

  const resolveUpdated = (item: FaqDto) =>
    typeof (item as any).updated_at === 'string'
      ? (item as any).updated_at
      : (item as any).updated_at?.toString?.() ?? '';

  const caption = (
    <span className="text-muted small">
      FAQ kayıtları locale bazlı yönetilebilir. Detay düzenleme için{' '}
      <strong>&quot;Düzenle&quot;</strong> butonunu kullan.
    </span>
  );

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header py-2">
        <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 flex-wrap">
          <div className="small fw-semibold">SSS (FAQ)</div>

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
              <colgroup>
                <col style={{ width: '90px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '280px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '170px' }} />
              </colgroup>

              <thead className="table-light">
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Sıra</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Soru</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Slug</th>
                  <th className="text-center" style={{ whiteSpace: 'nowrap' }}>
                    Aktif
                  </th>
                  <th style={{ whiteSpace: 'nowrap' }}>Tarih</th>
                  <th className="text-end" style={{ whiteSpace: 'nowrap' }}>
                    İşlemler
                  </th>
                </tr>
              </thead>

              <tbody>
                {!hasData ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 small text-muted">
                      {loading ? 'Yükleniyor...' : 'Kayıt bulunamadı.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((item, idx) => {
                    const isActive =
                      (item as any).is_active === 1 || (item as any).is_active === true;

                    const created = resolveCreated(item);
                    const updated = resolveUpdated(item);

                    const order = (item as any).display_order ?? idx + 1;
                    const question = safeText((item as any).question);
                    const slug = safeText((item as any).slug) || '-';
                    const localeResolved = safeText((item as any).locale_resolved);

                    return (
                      <tr key={String((item as any).id)}>
                        <td className="text-muted small text-nowrap">
                          <span className="me-1">#</span>
                          <span>{order}</span>
                        </td>

                        {/* shrinkable cell + truncate */}
                        <td className="small" style={{ minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <div
                              className="fw-semibold text-truncate"
                              title={question || '(soru yok)'}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {question ? question : <span className="text-muted">(soru yok)</span>}
                            </div>

                            {localeResolved ? (
                              <div
                                className="text-muted small text-truncate"
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                locale: <code>{localeResolved}</code>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        {/* slug fixed + truncate */}
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
              </tbody>

              <caption className="px-3 py-2 text-start">{caption}</caption>
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
                  const isActive =
                    (item as any).is_active === 1 || (item as any).is_active === true;

                  const created = resolveCreated(item);
                  const updated = resolveUpdated(item);

                  const order = (item as any).display_order ?? idx + 1;
                  const question = safeText((item as any).question);
                  const slug = safeText((item as any).slug) || '-';
                  const localeResolved = safeText((item as any).locale_resolved);

                  return (
                    <div key={String((item as any).id)} className="col-12 col-lg-6">
                      <div className="border rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="badge bg-light text-dark border">#{order}</span>
                            {localeResolved ? (
                              <span className="badge bg-light text-dark border small">
                                locale: <code>{localeResolved}</code>
                              </span>
                            ) : null}
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
                            {question ? question : <span className="text-muted">(soru yok)</span>}
                          </div>

                          <div
                            className="text-muted small mt-1"
                            style={{ wordBreak: 'break-word' }}
                          >
                            Slug: <code>{slug}</code>
                          </div>

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
