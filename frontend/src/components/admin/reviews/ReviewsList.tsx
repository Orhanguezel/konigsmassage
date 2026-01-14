// =============================================================
// FILE: src/components/admin/reviews/ReviewsList.tsx
// konigsmassage – Admin Reviews List (Responsive)
// - < xxl: CARDS (tablet + mobile)
// - xxl+: TABLE (scroll-free: table-layout fixed + truncation)
// =============================================================

'use client';

import React from 'react';
import { useRouter } from 'next/router';
import type { AdminReviewDto } from '@/integrations/types';

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const fmtDate = (value: string | null | undefined) => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('tr-TR');
  } catch {
    return String(value);
  }
};

const formatComment = (v: unknown, max = 140) => {
  const s = safeText(v).trim();
  if (!s) return '-';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
};

const normLocale = (v: unknown) =>
  safeText(v).trim().toLowerCase().replace('_', '-').split('-')[0] || '-';

const ratingText = (v: any) => {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (Number.isFinite(n)) return n.toFixed(1);
  return safeText(v);
};

export type ReviewsListProps = {
  items: AdminReviewDto[];
  loading: boolean;
  onDelete: (item: AdminReviewDto) => void;
};

export const ReviewsList: React.FC<ReviewsListProps> = ({ items, loading, onDelete }) => {
  const router = useRouter();

  const rows = items ?? [];
  const hasData = rows.length > 0;
  const busy = !!loading;

  const goDetail = (item: AdminReviewDto) => {
    router.push(`/admin/reviews/${encodeURIComponent(String(item.id))}`);
  };

  const onDeleteClick = (e: React.MouseEvent<HTMLButtonElement>, item: AdminReviewDto) => {
    e.stopPropagation();
    if (!busy) onDelete(item);
  };

  // ✅ colgroup içinde whitespace/text node oluşmaması için array ile üret
  const COL_WIDTHS = [
    '56px', // order
    '180px', // name
    '220px', // email
    '90px', // rating
    '110px', // approved
    '90px', // active
    '90px', // locale
    '520px', // comment
    '170px', // created
    '180px', // actions
  ] as const;

  if (!busy && !hasData) {
    return (
      <div className="card">
        <div className="card-body py-4 text-center text-muted small">
          Henüz kayıtlı bir yorum yok.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* ===================== XXL+ TABLE ===================== */}
      <div className="d-none d-xxl-block">
        <div className="table-responsive">
          <table
            className="table table-sm align-middle mb-0"
            style={{ tableLayout: 'fixed', width: '100%' }}
          >
            <colgroup>
              {COL_WIDTHS.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>

            <thead className="table-light">
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>#</th>
                <th style={{ whiteSpace: 'nowrap' }}>İsim</th>
                <th style={{ whiteSpace: 'nowrap' }}>E-posta</th>
                <th style={{ whiteSpace: 'nowrap' }}>Puan</th>
                <th style={{ whiteSpace: 'nowrap' }}>Onay</th>
                <th style={{ whiteSpace: 'nowrap' }}>Aktif</th>
                <th style={{ whiteSpace: 'nowrap' }}>Locale</th>
                <th style={{ whiteSpace: 'nowrap' }}>Yorum</th>
                <th style={{ whiteSpace: 'nowrap' }}>Oluşturulma</th>
                <th className="text-end" style={{ whiteSpace: 'nowrap' }}>
                  İşlemler
                </th>
              </tr>
            </thead>

            <tbody>
              {busy ? (
                <tr>
                  <td colSpan={10} className="text-center py-3 text-muted small">
                    Yükleniyor...
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const order = (r as any).display_order ?? '-';
                  const name = safeText((r as any).name) || '-';
                  const email = safeText((r as any).email) || '-';
                  const rating = ratingText((r as any).rating);
                  const approved = !!(r as any).is_approved;
                  const active = !!(r as any).is_active;
                  const locale = normLocale((r as any).locale_resolved ?? (r as any).locale);
                  const comment = safeText((r as any).comment);
                  const created = fmtDate((r as any).created_at);

                  return (
                    <tr
                      key={String((r as any).id)}
                      onClick={() => goDetail(r)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="text-muted small text-nowrap">
                        <span className="badge bg-secondary-subtle text-muted border">{order}</span>
                      </td>

                      <td
                        className="fw-semibold small text-truncate"
                        title={name}
                        style={{ minWidth: 0 }}
                      >
                        {name}
                      </td>

                      <td
                        className="text-muted small text-truncate"
                        title={email}
                        style={{ minWidth: 0 }}
                      >
                        {email}
                      </td>

                      <td>
                        <span className="badge bg-primary-subtle text-primary">{rating}</span>
                      </td>

                      <td>
                        {approved ? (
                          <span className="badge bg-success-subtle text-success">Onaylı</span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning">Bekliyor</span>
                        )}
                      </td>

                      <td>
                        {active ? (
                          <span className="badge bg-success-subtle text-success">Aktif</span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-muted">Pasif</span>
                        )}
                      </td>

                      <td className="text-muted small text-nowrap">
                        <code>{locale}</code>
                      </td>

                      <td className="text-muted small" style={{ minWidth: 0 }}>
                        <div className="text-truncate" title={comment || '-'}>
                          {formatComment(comment, 120)}
                        </div>
                      </td>

                      <td className="text-muted small text-nowrap">{created}</td>

                      <td className="text-end text-nowrap">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              goDetail(r);
                            }}
                            disabled={busy}
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={(e) => onDeleteClick(e, r)}
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
          </table>
        </div>
      </div>

      {/* ===================== < XXL : CARDS ===================== */}
      <div className="d-block d-xxl-none">
        {busy ? (
          <div className="card-body py-3 text-center text-muted small">Yükleniyor...</div>
        ) : (
          <div className="p-3">
            <div className="row g-3">
              {rows.map((r, index) => {
                const id = String((r as any).id);
                const order = (r as any).display_order ?? index + 1;
                const name = safeText((r as any).name) || '-';
                const email = safeText((r as any).email) || '-';
                const rating = ratingText((r as any).rating);
                const approved = !!(r as any).is_approved;
                const active = !!(r as any).is_active;
                const locale = normLocale((r as any).locale_resolved ?? (r as any).locale);
                const comment = safeText((r as any).comment);
                const created = fmtDate((r as any).created_at);

                return (
                  <div key={id} className="col-12 col-lg-6">
                    <div
                      className="border rounded-3 p-3 bg-white h-100"
                      role="button"
                      tabIndex={0}
                      onClick={() => goDetail(r)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') goDetail(r);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="d-flex flex-wrap gap-2">
                          <span className="badge bg-light text-dark border">#{order}</span>
                          <span className="badge bg-primary-subtle text-primary">
                            Puan: {rating}
                          </span>
                          <span className="badge bg-light text-dark border small">
                            Locale: <code>{locale}</code>
                          </span>
                        </div>

                        <div className="d-flex flex-column align-items-end gap-1">
                          {approved ? (
                            <span className="badge bg-success-subtle text-success">Onaylı</span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning">Bekliyor</span>
                          )}
                          {active ? (
                            <span className="badge bg-success-subtle text-success">Aktif</span>
                          ) : (
                            <span className="badge bg-secondary-subtle text-muted">Pasif</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>
                          {name}
                        </div>
                        <div className="text-muted small" style={{ wordBreak: 'break-word' }}>
                          {email}
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="text-muted small">Yorum</div>
                        <div className="small" style={{ wordBreak: 'break-word' }}>
                          {formatComment(comment, 220)}
                        </div>
                      </div>

                      <div className="mt-2 text-muted small">Oluşturulma: {created}</div>

                      <div className="mt-3 d-flex gap-2 flex-wrap justify-content-end">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            goDetail(r);
                          }}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={(e) => onDeleteClick(e, r)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3">
              <span className="text-muted small">
                Kartlara tıklayarak detaya gidebilirsin. Masaüstünde tablo görünümü xxl+ ekranda
                açılır.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
