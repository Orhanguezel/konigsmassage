// =============================================================
// FILE: src/components/admin/bookings/BookingForm.tsx
// FINAL — Admin Booking Create/Edit Form (+ Accept/Reject actions)
// - Edit modunda Accept/Reject aksiyonları (decision_note ile)
// - Status açıklaması düzeltildi
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type {
  BookingMergedDto,
  BookingStatus,
  PlannedSlotDto,
  ResourceAdminListItemDto,
} from '@/integrations/types';

import {
  useGetDailyPlanAdminQuery,
  useGetSlotAvailabilityAdminQuery,
  useListResourcesAdminQuery,
  useAcceptBookingAdminMutation,
  useRejectBookingAdminMutation,
} from '@/integrations/rtk/hooks';

export type BookingFormMode = 'create' | 'edit';

export type BookingFormValues = {
  name: string;
  email: string;
  phone: string;
  locale: string;

  customer_message: string;

  resource_id: string;
  service_id: string;

  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm

  status: BookingStatus | string;
  is_read: boolean;

  admin_note: string;
  decision_note: string;
};

export type BookingFormProps = {
  mode: BookingFormMode;
  initialData?: BookingMergedDto | null;
  loading: boolean;
  saving: boolean;
  onSubmit: (values: BookingFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

const norm = (v: unknown) => String(v ?? '').trim();

const normLocale = (v: unknown, fallback = 'de') => {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  const short = s.split('-')[0] || '';
  return short || fallback;
};

const isValidYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const isValidHm = (v: string) => /^\d{2}:\d{2}$/.test(v);

const toBool01 = (v: any) => Number(v ?? 0) === 1 || v === true;

const buildInitial = (dto?: BookingMergedDto | null): BookingFormValues => {
  if (!dto) {
    return {
      name: '',
      email: '',
      phone: '',
      locale: 'de',

      customer_message: '',

      resource_id: '',
      service_id: '',

      appointment_date: '',
      appointment_time: '',

      status: 'new',
      is_read: false,

      admin_note: '',
      decision_note: '',
    };
  }

  return {
    name: norm(dto.name),
    email: norm(dto.email),
    phone: norm(dto.phone),
    locale: normLocale((dto as any).locale, 'de'),

    customer_message: norm(dto.customer_message ?? ''),

    resource_id: norm(dto.resource_id),
    service_id: norm(dto.service_id ?? ''),

    appointment_date: norm(dto.appointment_date),
    appointment_time: norm(dto.appointment_time ?? ''),

    status: norm(dto.status) || 'new',
    is_read: toBool01((dto as any).is_read),

    admin_note: norm(dto.admin_note ?? ''),
    decision_note: norm(dto.decision_note ?? ''),
  };
};

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const slotRowClass = (p: PlannedSlotDto) => {
  if (!p.is_active) return 'text-muted';
  if (!p.available) return 'text-muted';
  return '';
};

export const BookingForm: React.FC<BookingFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<BookingFormValues>(buildInitial(initialData));

  useEffect(() => {
    setValues(buildInitial(initialData));
  }, [initialData]);

  const disabled = loading || saving;

  const bookingId = norm((initialData as any)?.id);
  const hasId = bookingId.length === 36;
  const decidedAtRaw = (initialData as any)?.decided_at;
  const isDecided = !!decidedAtRaw; // basit; string/date/null fark etmez

  const [acceptBooking, acceptState] = useAcceptBookingAdminMutation();
  const [rejectBooking, rejectState] = useRejectBookingAdminMutation();

  const actionBusy = disabled || acceptState.isLoading || rejectState.isLoading;

  // Resources dropdown
  const {
    data: resourcesData,
    isLoading: resLoading,
    isFetching: resFetching,
  } = useListResourcesAdminQuery(
    {
      limit: 500,
      offset: 0,
      sort: 'title',
      order: 'asc',
      is_active: 1,
    } as any,
    { refetchOnMountOrArgChange: true } as any,
  );

  const resources: ResourceAdminListItemDto[] = useMemo(
    () => ((resourcesData as any) ?? []) as ResourceAdminListItemDto[],
    [resourcesData],
  );

  // Plan query
  const planArgs = useMemo(() => {
    const rid = norm(values.resource_id);
    const d = norm(values.appointment_date);
    if (!rid || !isValidYmd(d)) return null;
    return { resource_id: rid, date: d };
  }, [values.resource_id, values.appointment_date]);

  const {
    data: planData,
    isLoading: planLoading,
    isFetching: planFetching,
    refetch: refetchPlan,
  } = useGetDailyPlanAdminQuery(
    planArgs as any,
    {
      skip: !planArgs,
      refetchOnMountOrArgChange: true,
    } as any,
  );

  const planned: PlannedSlotDto[] = useMemo(
    () => ((planData as any) ?? []) as PlannedSlotDto[],
    [planData],
  );

  // Availability check for selected time
  const availArgs = useMemo(() => {
    const rid = norm(values.resource_id);
    const d = norm(values.appointment_date);
    const t = norm(values.appointment_time);
    if (!rid || !isValidYmd(d) || !isValidHm(t)) return null;
    return { resource_id: rid, date: d, time: t };
  }, [values.resource_id, values.appointment_date, values.appointment_time]);

  const { data: availData, isLoading: availLoading } = useGetSlotAvailabilityAdminQuery(
    availArgs as any,
    { skip: !availArgs } as any,
  );

  const availabilityText = useMemo(() => {
    if (!availArgs) return '';
    if (availLoading) return 'Müsaitlik kontrol ediliyor...';
    const dto: any = availData as any;
    if (!dto) return '';
    if (dto.exists === false) return 'Slot kaydı yok (plan üzerinden oluşturulabilir).';
    if (dto.available) return `Müsait (${dto.reserved_count}/${dto.capacity ?? '-'})`;
    return `Dolu / Pasif (${dto.reserved_count}/${dto.capacity ?? '-'})`;
  }, [availArgs, availLoading, availData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    const payload: BookingFormValues = {
      ...values,
      name: norm(values.name),
      email: norm(values.email),
      phone: norm(values.phone),
      locale: normLocale(values.locale, 'de'),
      customer_message: norm(values.customer_message),
      resource_id: norm(values.resource_id),
      service_id: norm(values.service_id),
      appointment_date: norm(values.appointment_date),
      appointment_time: norm(values.appointment_time),
      admin_note: norm(values.admin_note),
      decision_note: norm(values.decision_note),
    };

    if (!payload.name || !payload.email || !payload.phone) {
      toast.error('İsim, email ve telefon zorunludur.');
      return;
    }
    if (!payload.resource_id) {
      toast.error('Resource seçimi zorunludur.');
      return;
    }
    if (!isValidYmd(payload.appointment_date)) {
      toast.error('Geçerli bir tarih seç. (YYYY-MM-DD)');
      return;
    }
    if (!isValidHm(payload.appointment_time)) {
      toast.error('Geçerli bir saat seç. (HH:mm)');
      return;
    }

    void onSubmit(payload);
  };

  const handleAccept = async () => {
    if (mode !== 'edit' || !hasId) return;
    if (isDecided) return;

    try {
      await acceptBooking({
        id: bookingId,
        body: {
          decision_note: norm(values.decision_note) || undefined,
          // locale override zorunlu değil; backend booking.locale kullanır
          // locale: normLocale(values.locale, 'de'),
        },
      }).unwrap();
      toast.success('Booking kabul edildi. (Email + bildirim tetiklendi)');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Kabul işlemi başarısız.');
    }
  };

  const handleReject = async () => {
    if (mode !== 'edit' || !hasId) return;
    if (isDecided) return;

    const ok = window.confirm('Bu randevu talebini reddetmek üzeresin. Devam edilsin mi?');
    if (!ok) return;

    try {
      await rejectBooking({
        id: bookingId,
        body: {
          decision_note: norm(values.decision_note) || undefined,
        },
      }).unwrap();
      toast.success('Booking reddedildi. (Slot serbest bırakıldı, email + bildirim tetiklendi)');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Red işlemi başarısız.');
    }
  };

  const planBusy = planLoading || planFetching;
  const resBusy = resLoading || resFetching;

  const availableSlots = useMemo(() => {
    return planned
      .filter((p) => !!p.is_active)
      .map((p) => ({
        time: String((p as any).time || ''),
        available: !!(p as any).available,
        reserved: Number((p as any).reserved_count ?? 0),
        cap: Number((p as any).capacity ?? 0),
        raw: p,
      }));
  }, [planned]);

  const showDecisionActions = mode === 'edit' && hasId;

  return (
    <div className="konigsmassage-admin-page">
      <div className="container-fluid px-2 px-lg-3">
        <div className="konigsmassage-admin-page__inner">
          <form onSubmit={handleSubmit}>
            <div className="card konigsmassage-admin-card">
              <div className="card-header py-2 konigsmassage-admin-card__header">
                <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-2">
                  <div>
                    <h5 className="mb-1 small fw-semibold text-truncate">
                      {mode === 'create' ? 'Yeni Booking' : 'Booking Düzenle'}
                    </h5>
                    <div className="text-muted small text-truncate">
                      Müşteri bilgileri, tarih/saat, resource ve durum alanlarını yönet.
                    </div>
                  </div>

                  <div className="d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
                    {onCancel && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={onCancel}
                        disabled={disabled || actionBusy}
                      >
                        Geri
                      </button>
                    )}

                    {showDecisionActions ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={() => void handleAccept()}
                          disabled={actionBusy || isDecided}
                          title={isDecided ? 'Bu booking için karar zaten verilmiş.' : 'Kabul et'}
                        >
                          {acceptState.isLoading ? 'Kabul Ediliyor...' : 'Kabul Et'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => void handleReject()}
                          disabled={actionBusy || isDecided}
                          title={isDecided ? 'Bu booking için karar zaten verilmiş.' : 'Reddet'}
                        >
                          {rejectState.isLoading ? 'Reddediliyor...' : 'Reddet'}
                        </button>
                      </>
                    ) : null}

                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={disabled || actionBusy}
                    >
                      {saving
                        ? mode === 'create'
                          ? 'Oluşturuluyor...'
                          : 'Kaydediliyor...'
                        : mode === 'create'
                        ? 'Oluştur'
                        : 'Kaydet'}
                    </button>

                    {loading && <span className="badge bg-secondary small">Yükleniyor...</span>}
                  </div>
                </div>
              </div>

              <div className="card-body konigsmassage-admin-card__body">
                <div className="row g-3">
                  <div className="col-12 col-lg-4">
                    <label className="form-label small mb-1">İsim</label>
                    <input
                      className="form-control"
                      value={values.name}
                      onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
                      disabled={disabled || actionBusy}
                    />
                  </div>
                  <div className="col-12 col-lg-4">
                    <label className="form-label small mb-1">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={values.email}
                      onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                      disabled={disabled || actionBusy}
                    />
                  </div>
                  <div className="col-12 col-lg-4">
                    <label className="form-label small mb-1">Telefon</label>
                    <input
                      className="form-control"
                      value={values.phone}
                      onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
                      disabled={disabled || actionBusy}
                    />
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Locale</label>
                    <input
                      className="form-control"
                      value={values.locale}
                      onChange={(e) => setValues((p) => ({ ...p, locale: e.target.value }))}
                      placeholder="de"
                      disabled={disabled || actionBusy}
                    />
                    <div className="form-text small">
                      Müşterinin tercih dili. Email template dili bu alana göre seçilir.
                    </div>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Durum</label>
                    <select
                      className="form-select"
                      value={values.status}
                      onChange={(e) => setValues((p) => ({ ...p, status: e.target.value }))}
                      disabled={disabled || actionBusy}
                    >
                      {Object.keys(STATUS_LABEL).map((k) => (
                        <option key={k} value={k}>
                          {STATUS_LABEL[k]}
                        </option>
                      ))}
                    </select>
                    <div className="form-text small">
                      Kabul/Red için üstteki butonları kullan. (Decision note + email + bildirim)
                    </div>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Okunma</label>
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={values.is_read}
                        onChange={(e) => setValues((p) => ({ ...p, is_read: e.target.checked }))}
                        disabled={disabled || actionBusy}
                        id="booking-is-read"
                      />
                      <label className="form-check-label" htmlFor="booking-is-read">
                        {values.is_read ? 'Okundu' : 'Okunmadı'}
                      </label>
                    </div>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Service ID</label>
                    <input
                      className="form-control"
                      value={values.service_id}
                      onChange={(e) => setValues((p) => ({ ...p, service_id: e.target.value }))}
                      placeholder="(opsiyonel)"
                      disabled={disabled || actionBusy}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label small mb-1">Resource</label>
                    <select
                      className="form-select"
                      value={values.resource_id}
                      onChange={(e) =>
                        setValues((p) => ({
                          ...p,
                          resource_id: e.target.value,
                          appointment_time: '',
                        }))
                      }
                      disabled={disabled || actionBusy || resBusy}
                    >
                      <option value="">Seç...</option>
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({String(r.type)})
                        </option>
                      ))}
                    </select>
                    {resBusy ? (
                      <div className="form-text small">Resources yükleniyor...</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Tarih</label>
                    <input
                      type="date"
                      className="form-control"
                      value={values.appointment_date}
                      onChange={(e) =>
                        setValues((p) => ({
                          ...p,
                          appointment_date: e.target.value,
                          appointment_time: '',
                        }))
                      }
                      disabled={disabled || actionBusy}
                    />
                    <div className="form-text small">Plan bu tarihe göre çekilir.</div>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Saat</label>
                    <select
                      className="form-select"
                      value={values.appointment_time}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, appointment_time: e.target.value }))
                      }
                      disabled={disabled || actionBusy || !planArgs || planBusy}
                    >
                      <option value="">Seç...</option>
                      {availableSlots.map((x) => (
                        <option key={x.time} value={x.time} disabled={!x.available}>
                          {x.time} {x.available ? '' : ` (Dolu)`}
                        </option>
                      ))}
                    </select>
                    <div className="d-flex align-items-center justify-content-between mt-1">
                      <div className="form-text small">
                        {!planArgs
                          ? 'Resource + tarih seç.'
                          : planBusy
                          ? 'Slotlar yükleniyor...'
                          : `${availableSlots.length} slot`}
                      </div>
                      {planArgs ? (
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0"
                          onClick={() => void refetchPlan()}
                          disabled={disabled || actionBusy || planBusy}
                        >
                          Yenile
                        </button>
                      ) : null}
                    </div>
                    {availabilityText ? (
                      <div className="form-text small">{availabilityText}</div>
                    ) : null}
                  </div>

                  <div className="col-12">
                    <label className="form-label small mb-1">Müşteri Mesajı</label>
                    <textarea
                      className="form-control"
                      value={values.customer_message}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, customer_message: e.target.value }))
                      }
                      rows={3}
                      disabled={disabled || actionBusy}
                      placeholder="(opsiyonel)"
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label small mb-1">Admin Note</label>
                    <textarea
                      className="form-control"
                      value={values.admin_note}
                      onChange={(e) => setValues((p) => ({ ...p, admin_note: e.target.value }))}
                      rows={3}
                      disabled={disabled || actionBusy}
                      placeholder="(opsiyonel)"
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label small mb-1">Decision Note</label>
                    <textarea
                      className="form-control"
                      value={values.decision_note}
                      onChange={(e) => setValues((p) => ({ ...p, decision_note: e.target.value }))}
                      rows={3}
                      disabled={disabled || actionBusy}
                      placeholder="(opsiyonel) Kabul/Red emailinde müşteriye gösterilebilir."
                    />
                  </div>

                  {planArgs ? (
                    <div className="col-12">
                      <div className="border rounded-3 p-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div>
                            <div className="small fw-semibold">Günlük Plan</div>
                            <div className="text-muted small">
                              Slot listesi plan endpoint’inden gelir. (Available olanlar
                              seçilebilir.)
                            </div>
                          </div>
                          {planBusy ? (
                            <span className="badge bg-secondary">Yükleniyor...</span>
                          ) : null}
                        </div>
                        <div className="table-responsive">
                          <table className="table table-sm mb-0 align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Saat</th>
                                <th>Durum</th>
                                <th className="text-end">Kapasite</th>
                              </tr>
                            </thead>
                            <tbody>
                              {planned.map((p) => {
                                const time = String((p as any).time || '');
                                const active = Number((p as any).is_active ?? 0) === 1;
                                const available = !!(p as any).available;
                                const reserved = Number((p as any).reserved_count ?? 0);
                                const cap = Number((p as any).capacity ?? 0);
                                return (
                                  <tr
                                    key={time}
                                    className={slotRowClass(p)}
                                    role={active && available ? 'button' : undefined}
                                    tabIndex={active && available ? 0 : -1}
                                    onClick={() => {
                                      if (!active || !available) return;
                                      setValues((x) => ({ ...x, appointment_time: time }));
                                    }}
                                    onKeyDown={(e) => {
                                      if (!active || !available) return;
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setValues((x) => ({ ...x, appointment_time: time }));
                                      }
                                    }}
                                  >
                                    <td className="text-nowrap">
                                      <code>{time}</code>
                                      {values.appointment_time === time ? (
                                        <span className="badge bg-primary ms-2">Seçili</span>
                                      ) : null}
                                    </td>
                                    <td className="text-nowrap small">
                                      {active ? (available ? 'Müsait' : 'Dolu') : 'Pasif'}
                                    </td>
                                    <td className="text-end small text-nowrap">
                                      {reserved}/{cap}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
