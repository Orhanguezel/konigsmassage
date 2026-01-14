// =============================================================
// FILE: src/components/admin/bookings/BookingsList.tsx
// konigsmassage – Admin Bookings List (table + cards)
// FINAL — TR UI + NO ID on screen
// + Quick actions: Accept / Reject (modal decision_note)
// Pattern: ResourcesList / AvailabilityList
// =============================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import type { BookingMergedDto } from '@/integrations/types';
import {
  useDeleteBookingAdminMutation,
  useMarkBookingReadAdminMutation,
  useAcceptBookingAdminMutation,
  useRejectBookingAdminMutation,
} from '@/integrations/rtk/hooks';

export type BookingsListProps = {
  items?: BookingMergedDto[];
  loading: boolean;
};

const formatDateTime = (date: string | null | undefined, time: string | null | undefined) => {
  const d = String(date || '').trim();
  const t = String(time || '').trim();
  if (!d && !t) return '-';
  if (d && t) return `${d} ${t}`;
  return d || t;
};

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const statusLabelTr = (s: unknown) => {
  const x = String(s || '').toLowerCase();
  if (x === 'new') return 'Yeni';
  if (x === 'confirmed') return 'Onaylandı';
  if (x === 'completed') return 'Tamamlandı';
  if (x === 'rejected') return 'Reddedildi';
  if (x === 'cancelled') return 'İptal';
  if (x === 'expired') return 'Süresi Doldu';
  return x ? String(s) : '-';
};

const statusBadgeClass = (s: unknown) => {
  const x = String(s || '').toLowerCase();
  if (x === 'new') return 'bg-primary-subtle text-primary border border-primary-subtle';
  if (x === 'confirmed') return 'bg-success-subtle text-success border border-success-subtle';
  if (x === 'completed') return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  if (x === 'rejected') return 'bg-warning-subtle text-warning border border-warning-subtle';
  if (x === 'cancelled') return 'bg-danger-subtle text-danger border border-danger-subtle';
  if (x === 'expired') return 'bg-dark-subtle text-dark border border-dark-subtle';
  return 'bg-light text-dark border';
};

const canAccept = (b: BookingMergedDto) => String(b.status || '').toLowerCase() === 'new';
const canReject = (b: BookingMergedDto) => {
  const s = String(b.status || '').toLowerCase();
  return s === 'new' || s === 'confirmed';
};

type DecisionMode = 'accept' | 'reject';

export const BookingsList: React.FC<BookingsListProps> = ({ items, loading }) => {
  const rows = items ?? [];
  const hasData = rows.length > 0;

  const [deleteBooking, { isLoading: isDeleting }] = useDeleteBookingAdminMutation();
  const [markRead, { isLoading: isMarking }] = useMarkBookingReadAdminMutation();
  const [acceptBooking, { isLoading: isAccepting }] = useAcceptBookingAdminMutation();
  const [rejectBooking, { isLoading: isRejecting }] = useRejectBookingAdminMutation();

  const busy = loading || isDeleting || isMarking || isAccepting || isRejecting;

  const [view, setView] = useState<'table' | 'cards'>('table');

  // decision modal state
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionMode, setDecisionMode] = useState<DecisionMode>('accept');
  const [decisionItem, setDecisionItem] = useState<BookingMergedDto | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const openDecision = (mode: DecisionMode, b: BookingMergedDto) => {
    setDecisionMode(mode);
    setDecisionItem(b);
    setDecisionNote(String((b as any)?.decision_note ?? '').trim());
    setDecisionOpen(true);
  };

  const closeDecision = () => {
    setDecisionOpen(false);
    setDecisionItem(null);
    setDecisionNote('');
  };

  const handleDelete = async (b: BookingMergedDto) => {
    const ok = window.confirm(
      `Bu randevu kaydını silmek üzeresin.\n\n` +
        `Müşteri: ${b.name || '-'}\n` +
        `Tarih: ${formatDateTime(b.appointment_date, b.appointment_time)}\n\n` +
        `Devam etmek istiyor musun?`,
    );
    if (!ok) return;

    try {
      await deleteBooking(b.id).unwrap();
      toast.success('Randevu silindi.');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silme sırasında hata oluştu.');
    }
  };

  const handleMarkRead = async (b: BookingMergedDto) => {
    try {
      await markRead(b.id).unwrap();
      toast.success('Okundu olarak işaretlendi.');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'İşlem sırasında hata oluştu.');
    }
  };

  const handleDecisionSubmit = async () => {
    const b = decisionItem;
    if (!b) return;

    const note = String(decisionNote || '').trim();

    try {
      if (decisionMode === 'accept') {
        await acceptBooking({
          id: b.id,
          body: note ? { decision_note: note } : {},
        } as any).unwrap();
        toast.success('Randevu kabul edildi. (Email + bildirim tetiklendi)');
      } else {
        const ok = window.confirm('Randevuyu reddetmek üzeresin. Devam edilsin mi?');
        if (!ok) return;
        await rejectBooking({
          id: b.id,
          body: note ? { decision_note: note } : {},
        } as any).unwrap();
        toast.success('Randevu reddedildi. (Email + bildirim tetiklendi)');
      }

      closeDecision();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'İşlem sırasında hata oluştu.');
    }
  };

  const renderEmpty = () => {
    if (loading) return <div className="text-muted small p-3">Yükleniyor...</div>;
    return <div className="text-muted small p-3">Kayıt bulunamadı.</div>;
  };

  const DecisionModal = () => {
    if (!decisionOpen || !decisionItem) return null;

    const b = decisionItem;
    const title = decisionMode === 'accept' ? 'Randevu Kabul' : 'Randevu Red';
    const actionLabel = decisionMode === 'accept' ? 'Kabul Et' : 'Reddet';

    return (
      <div
        className="modal fade show"
        style={{ display: 'block', background: 'rgba(0,0,0,0.35)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header py-2">
              <div>
                <div className="fw-semibold">{title}</div>
                <div className="text-muted small">
                  {b.name || '-'} • {formatDateTime(b.appointment_date, b.appointment_time)}
                </div>
              </div>
              <button type="button" className="btn-close" onClick={closeDecision} />
            </div>

            <div className="modal-body">
              <label className="form-label small mb-1">Decision Note (opsiyonel)</label>
              <textarea
                className="form-control"
                rows={4}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                disabled={busy}
                placeholder="Müşteriye gidecek template içinde gösterilebilir."
              />

              <div className="text-muted small mt-2">
                Bu işlem backend’de email template + notification tetikler.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={closeDecision}
                disabled={busy}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className={
                  'btn btn-sm ' + (decisionMode === 'accept' ? 'btn-success' : 'btn-danger')
                }
                onClick={() => void handleDecisionSubmit()}
                disabled={busy}
              >
                {busy ? 'İşleniyor...' : actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!hasData) return renderEmpty();

    return (
      <div className="table-responsive">
        <table className="table table-hover table-sm mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th className="text-muted">Durum</th>
              <th>Müşteri</th>
              <th>Tarih</th>
              <th>Kaynak</th>
              <th>Servis</th>
              <th className="text-end text-nowrap">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const isRead = Number((b as any).is_read ?? 0) === 1 || (b as any).is_read === true;

              return (
                <tr key={b.id} className={isRead ? '' : 'table-warning'}>
                  <td className="text-nowrap">
                    <span className={`badge ${statusBadgeClass(b.status)}`}>
                      {statusLabelTr(b.status)}
                    </span>
                    {!isRead ? <span className="badge bg-warning ms-2">Okunmadı</span> : null}
                  </td>

                  <td>
                    <div className="fw-semibold text-truncate" style={{ maxWidth: 260 }}>
                      {b.name || '-'}
                    </div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: 260 }}>
                      {b.email || ''} {b.phone ? `• ${b.phone}` : ''}
                    </div>
                  </td>

                  <td className="text-nowrap small">
                    {formatDateTime(b.appointment_date, b.appointment_time)}
                  </td>

                  <td className="small text-truncate" style={{ maxWidth: 220 }}>
                    {b.resource_title ? b.resource_title : <span className="text-muted">—</span>}
                  </td>

                  <td className="small text-truncate" style={{ maxWidth: 220 }}>
                    {b.service_title ? b.service_title : <span className="text-muted">—</span>}
                  </td>

                  <td className="text-end text-nowrap">
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => openDecision('accept', b)}
                        disabled={busy || !canAccept(b)}
                        title={
                          !canAccept(b) ? 'Sadece "Yeni" talepler kabul edilebilir.' : 'Kabul et'
                        }
                      >
                        Kabul
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => openDecision('reject', b)}
                        disabled={busy || !canReject(b)}
                        title={!canReject(b) ? 'Bu durum reddedilemez.' : 'Reddet'}
                      >
                        Red
                      </button>

                      <Link
                        href={`/admin/bookings/${encodeURIComponent(b.id)}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        Düzenle
                      </Link>

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => void handleMarkRead(b)}
                        disabled={busy || isRead}
                        title={isRead ? 'Zaten okundu' : 'Okundu işaretle'}
                      >
                        Okundu
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => void handleDelete(b)}
                        disabled={busy}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <DecisionModal />
      </div>
    );
  };

  const renderCards = () => {
    if (!hasData) return renderEmpty();

    return (
      <div className="p-3">
        <div className="row g-3">
          {rows.map((b) => {
            const isRead = Number((b as any).is_read ?? 0) === 1 || (b as any).is_read === true;

            return (
              <div key={b.id} className="col-12 col-xxl-6">
                <div className="border rounded-3 bg-white h-100 p-3">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className={`badge ${statusBadgeClass(b.status)}`}>
                          {statusLabelTr(b.status)}
                        </span>
                        {!isRead ? <span className="badge bg-warning">Okunmadı</span> : null}
                        <span className="badge bg-light text-dark border">
                          {formatDateTime(b.appointment_date, b.appointment_time)}
                        </span>
                      </div>

                      <div className="fw-semibold mt-2 text-truncate" title={safeText(b.name)}>
                        {b.name || '-'}
                      </div>
                      <div className="text-muted small text-truncate" title={safeText(b.email)}>
                        {b.email || '-'}
                      </div>

                      {b.customer_message ? (
                        <div className="small mt-2">{String(b.customer_message).slice(0, 140)}</div>
                      ) : null}

                      <div className="text-muted small mt-2">Kaynak: {b.resource_title || '—'}</div>
                      <div className="text-muted small">Servis: {b.service_title || '—'}</div>
                    </div>

                    <div style={{ width: 180 }}>
                      <div className="btn-group-vertical w-100" role="group">
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={() => openDecision('accept', b)}
                          disabled={busy || !canAccept(b)}
                        >
                          Kabul
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openDecision('reject', b)}
                          disabled={busy || !canReject(b)}
                        >
                          Red
                        </button>

                        <Link
                          href={`/admin/bookings/${encodeURIComponent(b.id)}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          Düzenle
                        </Link>

                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => void handleMarkRead(b)}
                          disabled={busy || isRead}
                        >
                          Okundu
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => void handleDelete(b)}
                          disabled={busy}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <DecisionModal />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header py-2">
        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
          <span className="small fw-semibold">Randevu Listesi</span>
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={'btn btn-outline-secondary' + (view === 'table' ? ' active' : '')}
                onClick={() => setView('table')}
              >
                Tablo
              </button>
              <button
                type="button"
                className={'btn btn-outline-secondary' + (view === 'cards' ? ' active' : '')}
                onClick={() => setView('cards')}
              >
                Kart
              </button>
            </div>
            {busy ? <span className="badge bg-secondary small">Yükleniyor...</span> : null}
          </div>
        </div>
      </div>

      <div className="card-body p-0">{view === 'table' ? renderTable() : renderCards()}</div>
    </div>
  );
};
