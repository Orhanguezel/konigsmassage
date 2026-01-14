// =============================================================
// FILE: src/components/admin/contact/ContactList.tsx
// konigsmassage – Admin Contact Listesi
//
// Responsive Strategy (Bootstrap 5):
// - < xxl: CARDS (dar desktop + tablet + mobile)
// - xxl+: TABLE (fixed layout + truncation)
//
// Goal: No broken layout / minimal horizontal scroll
// =============================================================

'use client';

import React from 'react';
import type { ContactDto, ContactStatus } from '@/integrations/types';

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const formatText = (v: unknown, max = 90): string => {
  const s = safeText(v).trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
};

const formatDate = (value: unknown): string => {
  if (!value) return '-';
  const s = typeof value === 'string' ? value : (value as any)?.toString?.() ?? '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s || '-';
  return d.toLocaleString();
};

const statusBadgeClass = (status: ContactStatus): string => {
  switch (status) {
    case 'new':
      return 'bg-secondary';
    case 'in_progress':
      return 'bg-warning text-dark';
    case 'closed':
      return 'bg-success';
    default:
      return 'bg-light text-muted';
  }
};

const statusLabel = (status: ContactStatus): string => {
  switch (status) {
    case 'new':
      return 'Yeni';
    case 'in_progress':
      return 'Üzerinde Çalışılıyor';
    case 'closed':
      return 'Kapalı';
    default:
      return String(status);
  }
};

export interface ContactListProps {
  items: ContactDto[];
  loading: boolean;
  onEdit: (item: ContactDto) => void;
  onDelete: (item: ContactDto) => void;
  onToggleResolved: (item: ContactDto, value: boolean) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
  onToggleResolved,
}) => {
  const rows = items ?? [];
  const totalItems = rows.length;
  const hasData = totalItems > 0;

  const busy = !!loading;

  const caption = (
    <span className="text-muted small">
      İletişim kayıtlarını durum/çözüm bilgisine göre yönetebilirsin. Detay ve not için{' '}
      <strong>&quot;Detay / Not&quot;</strong> butonunu kullan.
    </span>
  );

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header py-2">
        <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 flex-wrap">
          <div className="small fw-semibold">İletişim Mesajları</div>

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
              className="table table-sm table-hover align-middle mb-0"
              style={{ tableLayout: 'fixed', width: '100%' }}
            >
              <colgroup>
                <col style={{ width: '280px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '230px' }} />
                <col style={{ width: '180px' }} />
              </colgroup>

              <thead className="table-light">
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Gönderen</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Konu / Mesaj</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Durum</th>
                  <th className="text-center" style={{ whiteSpace: 'nowrap' }}>
                    Çözüldü
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
                  rows.map((item) => {
                    const name = safeText(item.name) || '(isim yok)';
                    const email = safeText(item.email);
                    const phone = safeText((item as any).phone);
                    const subject = safeText(item.subject) || '(konu yok)';
                    const message = safeText((item as any).message);

                    const created = formatDate((item as any).created_at);
                    const updated = formatDate((item as any).updated_at);

                    return (
                      <tr key={String(item.id)}>
                        {/* Gönderen */}
                        <td className="small" style={{ minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold small text-truncate" title={name}>
                              {name}
                            </div>
                            <div
                              className="text-muted small text-truncate"
                              title={`${email}${phone ? ` • ${phone}` : ''}`}
                            >
                              {email}
                              {phone ? (
                                <>
                                  {' '}
                                  • <span>{phone}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Konu / Mesaj */}
                        <td className="small" style={{ minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <div
                              className="fw-semibold text-truncate"
                              title={subject}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {subject}
                            </div>
                            <div
                              className="text-muted small text-truncate"
                              title={message}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {message ? formatText(message, 140) : ''}
                            </div>
                          </div>
                        </td>

                        {/* Durum */}
                        <td className="small">
                          <span className={`badge ${statusBadgeClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </td>

                        {/* Çözüldü */}
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-flex m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!(item as any).is_resolved}
                              disabled={busy}
                              onChange={(e) => onToggleResolved(item, e.target.checked)}
                            />
                          </div>
                        </td>

                        {/* Tarih */}
                        <td className="small">
                          <div className="text-truncate" style={{ whiteSpace: 'nowrap' }}>
                            Oluşturma: {created}
                          </div>
                          <div
                            className="text-muted small text-truncate"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            Güncelleme: {updated}
                          </div>
                        </td>

                        {/* İşlemler */}
                        <td className="text-end text-nowrap">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => onEdit(item)}
                              disabled={busy}
                            >
                              Detay / Not
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
                {rows.map((item) => {
                  const name = safeText(item.name) || '(isim yok)';
                  const email = safeText(item.email);
                  const phone = safeText((item as any).phone);
                  const subject = safeText(item.subject) || '(konu yok)';
                  const message = safeText((item as any).message);

                  const created = formatDate((item as any).created_at);
                  const updated = formatDate((item as any).updated_at);

                  const resolved = !!(item as any).is_resolved;

                  return (
                    <div key={String(item.id)} className="col-12 col-lg-6">
                      <div className="border rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>
                              {name}
                            </div>
                            <div className="text-muted small" style={{ wordBreak: 'break-word' }}>
                              {email}
                              {phone ? <> • {phone}</> : null}
                            </div>
                          </div>

                          <div className="d-flex flex-column align-items-end gap-2">
                            <span className={`badge ${statusBadgeClass(item.status)}`}>
                              {statusLabel(item.status)}
                            </span>

                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={resolved}
                                disabled={busy}
                                onChange={(e) => onToggleResolved(item, e.target.checked)}
                              />
                              <label className="form-check-label small">Çözüldü</label>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>
                            {subject}
                          </div>
                          {message ? (
                            <div
                              className="text-muted small mt-1"
                              style={{ wordBreak: 'break-word' }}
                            >
                              {message}
                            </div>
                          ) : null}
                        </div>

                        <div className="text-muted small mt-2">
                          <div>Oluşturma: {created}</div>
                          <div>Güncelleme: {updated}</div>
                        </div>

                        <div className="mt-3 d-flex gap-2 flex-wrap justify-content-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => onEdit(item)}
                            disabled={busy}
                          >
                            Detay / Not
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
