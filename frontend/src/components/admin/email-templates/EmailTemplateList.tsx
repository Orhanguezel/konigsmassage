// =============================================================
// FILE: src/components/admin/email-templates/EmailTemplateList.tsx
// Admin Email Templates – Responsive List
//
// Responsive Strategy (Bootstrap 5):
// - < xxl: CARDS (tablet + mobile)
// - xxl+: TABLE (scroll-free: table-layout fixed + truncation)
// =============================================================

'use client';

import React from 'react';
import type { EmailTemplateAdminListItemDto } from '@/integrations/types';

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const buildVarsDisplay = (item: EmailTemplateAdminListItemDto) => {
  const vars = item.variables ?? [];
  const detected = item.detected_variables ?? [];
  const list = vars.length > 0 ? vars : detected;
  return list.length ? list.join(', ') : '';
};

export type EmailTemplateListProps = {
  items: EmailTemplateAdminListItemDto[];
  loading: boolean;
  onEdit: (item: EmailTemplateAdminListItemDto) => void;
  onDelete: (item: EmailTemplateAdminListItemDto) => void;
  onToggleActive: (item: EmailTemplateAdminListItemDto, value: boolean) => void;
};

export const EmailTemplateList: React.FC<EmailTemplateListProps> = ({
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

  const caption = (
    <span className="text-muted small">
      Email template’leri locale bazlı yönetebilirsin. Düzenlemek için “Düzenle”, kaldırmak için
      “Sil” butonunu kullan.
    </span>
  );

  if (!busy && !hasData) {
    return (
      <div className="card">
        <div className="card-body py-4 text-center text-muted small">Kayıt bulunamadı.</div>
      </div>
    );
  }

  // ✅ colgroup içinde whitespace/text node oluşmaması için array ile üret
  const COL_WIDTHS = ['220px', '360px', '90px', '300px', '90px', '240px', '180px'] as const;

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header py-2">
        <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 flex-wrap">
          <div className="small fw-semibold">Email Templates</div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {busy && (
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
                {COL_WIDTHS.map((w, i) => (
                  <col key={i} style={{ width: w }} />
                ))}
              </colgroup>

              <thead className="table-light">
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Key</th>
                  <th style={{ whiteSpace: 'nowrap' }}>İsim / Konu</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Locale</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Değişkenler</th>
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
                {busy ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted small">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => {
                    const varsDisplay = buildVarsDisplay(item);
                    const key = safeText(item.template_key);
                    const name = safeText(item.template_name) || '(isim yok)';
                    const subject = safeText(item.subject) || '(subject yok)';
                    const locale = item.locale ? safeText(item.locale) : '';
                    const created = formatDate(item.created_at);
                    const updated = formatDate(item.updated_at);

                    return (
                      <tr key={`${item.id}-${item.locale ?? 'default'}`}>
                        <td className="small" style={{ minWidth: 0 }}>
                          <div className="text-truncate" title={key}>
                            <code>{key}</code>
                          </div>
                        </td>

                        <td className="small" style={{ minWidth: 0 }}>
                          <div className="fw-semibold text-truncate" title={name}>
                            {name}
                          </div>
                          <div className="text-muted text-truncate" title={subject}>
                            {subject}
                          </div>
                        </td>

                        <td className="small text-nowrap">
                          {locale ? (
                            <code>{locale}</code>
                          ) : (
                            <span className="text-muted">(yok)</span>
                          )}
                        </td>

                        <td className="small" style={{ minWidth: 0 }}>
                          {varsDisplay ? (
                            <div className="text-truncate" title={varsDisplay}>
                              {varsDisplay}
                            </div>
                          ) : (
                            <span className="text-muted">(değişken yok)</span>
                          )}
                        </td>

                        <td className="text-center">
                          <div className="form-check form-switch d-inline-flex m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!item.is_active}
                              disabled={busy}
                              onChange={(e) => onToggleActive(item, e.target.checked)}
                            />
                          </div>
                        </td>

                        <td className="small text-nowrap">
                          <div>Oluşturma: {created}</div>
                          <div className="text-muted small">Güncelleme: {updated}</div>
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
          {busy ? (
            <div className="px-3 py-3 text-center text-muted small">Yükleniyor...</div>
          ) : (
            <div className="p-3">
              <div className="row g-3">
                {rows.map((item) => {
                  const varsDisplay = buildVarsDisplay(item);
                  const key = safeText(item.template_key);
                  const name = safeText(item.template_name) || '(isim yok)';
                  const subject = safeText(item.subject) || '(subject yok)';
                  const locale = item.locale ? safeText(item.locale) : '';
                  const created = formatDate(item.created_at);
                  const updated = formatDate(item.updated_at);

                  return (
                    <div key={`${item.id}-${item.locale ?? 'default'}`} className="col-12 col-lg-6">
                      <div className="border rounded-3 p-3 bg-white h-100">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="d-flex flex-wrap gap-2">
                            <span className="badge bg-light text-dark border">
                              Key: <code>{key}</code>
                            </span>
                            <span className="badge bg-light text-dark border small">
                              Locale:{' '}
                              {locale ? (
                                <code>{locale}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </span>
                          </div>

                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!item.is_active}
                              disabled={busy}
                              onChange={(e) => onToggleActive(item, e.target.checked)}
                            />
                            <label className="form-check-label small">Aktif</label>
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>
                            {name}
                          </div>
                          <div className="text-muted small" style={{ wordBreak: 'break-word' }}>
                            {subject}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="text-muted small">Değişkenler</div>
                          {varsDisplay ? (
                            <div className="small" style={{ wordBreak: 'break-word' }}>
                              {varsDisplay}
                            </div>
                          ) : (
                            <div className="text-muted small">(değişken yok)</div>
                          )}
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
          )}
        </div>
      </div>
    </div>
  );
};
