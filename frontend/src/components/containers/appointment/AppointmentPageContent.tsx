// =============================================================
// FILE: src/components/containers/appointment/AppointmentPageContent.tsx
// FINAL — Public Appointment PAGE content (rendered)
// - Same UI/logic as AppointmentSection, but no route-key remount wrapper
// - No inline styles
// - Weekly note text removed (parent already has enough)
// =============================================================

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useListResourcesPublicQuery,
  useListAvailabilitySlotsPublicQuery,
  useListAvailabilitySlotsByResourcesPublicQuery,
  useGetAvailabilityPublicQuery,
  useCreateBookingPublicMutation,
  useListResourceWorkingHoursPublicQuery,
} from '@/integrations/rtk/hooks';

import type {
  BookingPublicCreatePayload,
  ResourceSlotDto,
  SlotAvailabilityDto,
  ResourceWorkingHourDto,
  ResourcePublicItemDto,
} from '@/integrations/types';

import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

import {
  safeStr,
  isValidEmail,
  normalizePhone,
  isValidYmd,
  isValidHm,
  slotTime,
  slotIsActive,
  slotIsAvailable,
} from './_utils/appointmentHelpers';

import { TherapistSelect } from './_utils/TherapistSelect';
import { DailyAvailableSlots } from './_utils/DailyAvailableSlots';
import { WeeklyPlanTable } from './_utils/WeeklyPlanTable';

type TherapistDaySummary = {
  status: 'unknown' | 'closed' | 'full' | 'available';
  totalActive: number;
  availableCount: number;
};

type FormState = {
  name: string;
  email: string;
  phone: string;

  resource_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm
  service_id: string;

  customer_message: string; // kept for payload compatibility (not rendered)
};

const DEFAULT_STATE: FormState = {
  name: '',
  email: '',
  phone: '',
  resource_id: '',
  appointment_date: '',
  appointment_time: '',
  service_id: '',
  customer_message: '',
};

export const AppointmentPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_appointment', locale as any);

  const t = useCallback(
    (key: string, fallback: string) => {
      const v = safeStr(ui(key, fallback));
      return isValidUiText(v, key) ? v : fallback;
    },
    [ui],
  );

  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [localMsg, setLocalMsg] = useState<string>('');

  const patch = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);

  // Left quick date picker
  const dateRef = useRef<HTMLInputElement>(null);
  const openDatePicker = useCallback(() => {
    const el = dateRef.current;
    if (!el) return;
    const anyEl = el as any;
    if (typeof anyEl.showPicker === 'function') anyEl.showPicker();
    else {
      el.focus();
      el.click();
    }
  }, []);

  // -------- resources (public) --------
  const {
    data: resourcesData,
    isLoading: resourcesLoading,
    isFetching: resourcesFetching,
    isError: resourcesError,
  } = useListResourcesPublicQuery({ type: 'therapist' }, {
    refetchOnMountOrArgChange: true,
  } as any);

  const resources: ResourcePublicItemDto[] = useMemo(() => {
    const arr = (resourcesData as unknown) ?? [];
    return Array.isArray(arr) ? (arr as ResourcePublicItemDto[]) : [];
  }, [resourcesData]);

  const isSingleTherapist = resources.length === 1;

  useEffect(() => {
    if (!isSingleTherapist) return;
    const only = resources[0];
    const rid = safeStr((only as any)?.id);
    if (!rid) return;

    setForm((p) => {
      if (safeStr(p.resource_id) === rid) return p;
      return { ...p, resource_id: rid, appointment_date: '', appointment_time: '' };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSingleTherapist, resources]);

  const hasTherapist = !!safeStr(form.resource_id);
  const hasDate = isValidYmd(safeStr(form.appointment_date));

  // -------- therapist day availability summary (RTK, multi-resource) --------
  const therapistDayArgs = useMemo(() => {
    const d = safeStr(form.appointment_date);
    if (!isValidYmd(d)) return null;

    const ids = resources.map((r) => safeStr((r as any)?.id)).filter(Boolean);
    if (!ids.length) return null;

    return { resource_ids: ids, date: d };
  }, [resources, form.appointment_date]);

  const {
    data: multiSlotsMap,
    isLoading: therapistDayLoading1,
    isFetching: therapistDayLoading2,
  } = useListAvailabilitySlotsByResourcesPublicQuery(
    therapistDayArgs as any,
    { skip: !therapistDayArgs, refetchOnMountOrArgChange: true } as any,
  );

  const therapistDayLoading = !!(therapistDayLoading1 || therapistDayLoading2);

  const therapistDayMap: Record<string, TherapistDaySummary> = useMemo(() => {
    const map: Record<string, TherapistDaySummary> = {};
    const raw = multiSlotsMap as unknown;

    if (!raw || typeof raw !== 'object') return map;

    const obj = raw as Record<string, unknown>;
    for (const rid of Object.keys(obj)) {
      const arr = Array.isArray(obj[rid]) ? (obj[rid] as ResourceSlotDto[]) : [];

      const activeSlots = arr.filter(slotIsActive);
      const availSlots = activeSlots.filter(slotIsAvailable);

      const totalActive = activeSlots.length;
      const availableCount = availSlots.length;

      let status: TherapistDaySummary['status'] = 'unknown';
      if (totalActive === 0) status = 'closed';
      else if (availableCount === 0) status = 'full';
      else status = 'available';

      map[rid] = { status, totalActive, availableCount };
    }

    return map;
  }, [multiSlotsMap]);

  const therapistAvailabilityText = useCallback(
    (rid: string) => {
      const d = safeStr(form.appointment_date);
      if (!isValidYmd(d)) return '';
      const s = therapistDayMap[rid];
      if (!s) {
        return therapistDayLoading ? t('ui_appointment_avail_checking', 'Kontrol ediliyor...') : '';
      }
      if (s.status === 'available')
        return t('ui_appointment_therapist_available', 'Müsait') + ` (${s.availableCount})`;
      if (s.status === 'full') return t('ui_appointment_therapist_full', 'Dolu');
      if (s.status === 'closed') return t('ui_appointment_therapist_closed', 'Kapalı');
      return t('ui_appointment_therapist_unknown', 'Bilinmiyor');
    },
    [form.appointment_date, therapistDayMap, therapistDayLoading, t],
  );

  const filteredResources = useMemo(() => {
    if (isSingleTherapist) return resources;

    const d = safeStr(form.appointment_date);
    if (!isValidYmd(d)) return resources;

    return resources.filter((r) => {
      const rid = safeStr((r as any)?.id);
      const s = therapistDayMap[rid];
      if (!s) return true;
      return s.status === 'available';
    });
  }, [resources, form.appointment_date, therapistDayMap, isSingleTherapist]);

  // -------- handlers --------
  const onPickTherapist = useCallback(
    (rid: string) => {
      patch('resource_id', rid);
      patch('appointment_date', '');
      patch('appointment_time', '');
      setLocalMsg('');
    },
    [patch],
  );

  const onPickDate = useCallback(
    (d: string) => {
      patch('appointment_date', d);
      patch('appointment_time', '');
      setLocalMsg('');
    },
    [patch],
  );

  const onPickTime = useCallback(
    (tm: string) => {
      patch('appointment_time', tm);
      setLocalMsg('');
    },
    [patch],
  );

  // -------- daily slots list (public) --------
  const slotsArgs = useMemo(() => {
    const rid = safeStr(form.resource_id);
    const d = safeStr(form.appointment_date);
    if (!rid || !isValidYmd(d)) return null;
    return { resource_id: rid, date: d };
  }, [form.resource_id, form.appointment_date]);

  const {
    data: slotsData,
    isLoading: slotsLoading,
    isFetching: slotsFetching,
    isError: slotsError,
    refetch: refetchSlots,
  } = useListAvailabilitySlotsPublicQuery(
    slotsArgs as any,
    { skip: !slotsArgs, refetchOnMountOrArgChange: true } as any,
  );

  const slots: ResourceSlotDto[] = useMemo(() => {
    const arr = (slotsData as unknown) ?? [];
    if (!Array.isArray(arr)) return [];
    return [...(arr as ResourceSlotDto[])].sort((a, b) => slotTime(a).localeCompare(slotTime(b)));
  }, [slotsData]);

  // -------- weekly working hours (public) --------
  const whArgs = useMemo(() => {
    const rid = safeStr(form.resource_id);
    if (!rid) return null;
    return { resource_id: rid };
  }, [form.resource_id]);

  const {
    data: whData,
    isLoading: whLoading,
    isFetching: whFetching,
    isError: whError,
  } = useListResourceWorkingHoursPublicQuery(whArgs as any, { skip: !whArgs } as any);

  const workingHours: ResourceWorkingHourDto[] = useMemo(() => {
    const arr = (whData as unknown) ?? [];
    return Array.isArray(arr) ? (arr as ResourceWorkingHourDto[]) : [];
  }, [whData]);

  // -------- final availability check (public) --------
  const availArgs = useMemo(() => {
    const rid = safeStr(form.resource_id);
    const d = safeStr(form.appointment_date);
    const tm = safeStr(form.appointment_time);
    if (!rid || !isValidYmd(d) || !isValidHm(tm)) return null;
    return { resource_id: rid, date: d, time: tm };
  }, [form.resource_id, form.appointment_date, form.appointment_time]);

  const { data: availData, isLoading: availLoading } = useGetAvailabilityPublicQuery(
    availArgs as any,
    { skip: !availArgs } as any,
  );

  const availabilityText = useMemo(() => {
    if (!availArgs) return '';
    if (availLoading) return t('ui_appointment_avail_checking', 'Müsaitlik kontrol ediliyor...');
    const dto = availData as SlotAvailabilityDto | undefined;
    if (!dto) return '';
    if ((dto as any).available) return t('ui_appointment_avail_ok', 'Müsait');
    return t('ui_appointment_avail_full', 'Dolu veya pasif');
  }, [availArgs, availLoading, availData, t]);

  // -------- create booking --------
  const [createBooking, createState] = useCreateBookingPublicMutation();
  const isSubmitting = !!createState.isLoading;

  const apiErrorText = useMemo(() => {
    const e = createState.error as any;
    if (!e) return '';
    if (typeof e === 'string') return e;
    if (e?.data?.error?.message) return safeStr(e.data.error.message);
    if (e?.data?.message) return safeStr(e.data.message);
    if (e?.error) return safeStr(e.error);
    return t('ui_appointment_error_generic', 'Bir hata oluştu. Lütfen tekrar deneyin.');
  }, [createState.error, t]);

  const canSubmit =
    !!slotsArgs && !!safeStr(form.appointment_time) && !slotsLoading && !slotsFetching;

  const validate = (): string => {
    const name = safeStr(form.name);
    const email = safeStr(form.email);
    const phone = normalizePhone(safeStr(form.phone));
    const rid = safeStr(form.resource_id);
    const d = safeStr(form.appointment_date);
    const tm = safeStr(form.appointment_time);

    if (!rid) return t('ui_appointment_err_resource', 'Lütfen bir terapist seçin.');
    if (!isValidYmd(d)) return t('ui_appointment_err_date', 'Lütfen geçerli bir tarih seçin.');
    if (!name) return t('ui_appointment_err_name', 'Lütfen adınızı girin.');
    if (!isValidEmail(email))
      return t('ui_appointment_err_email', 'Lütfen geçerli bir e-posta adresi girin.');
    if (!phone) return t('ui_appointment_err_phone', 'Lütfen telefon numaranızı girin.');
    if (!isValidHm(tm)) return t('ui_appointment_err_time', 'Lütfen bir saat seçin.');
    if (availArgs && availData && (availData as any).available === false) {
      return t('ui_appointment_err_not_available', 'Seçilen saat şu an müsait değil.');
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalMsg('');

    const err = validate();
    if (err) return setLocalMsg(err);

    const payload: BookingPublicCreatePayload = {
      locale: safeStr(locale) || undefined,

      name: safeStr(form.name),
      email: safeStr(form.email),
      phone: normalizePhone(safeStr(form.phone)),

      appointment_date: safeStr(form.appointment_date),
      appointment_time: safeStr(form.appointment_time),

      resource_id: safeStr(form.resource_id),
      service_id: safeStr(form.service_id) || undefined,

      customer_message: undefined,
      message: undefined,
    } as any;

    try {
      const resp = await createBooking(payload).unwrap();

      if ((resp as any)?.ok) {
        setLocalMsg(
          t('ui_appointment_success', 'Talebiniz alındı. En kısa sürede dönüş yapılacaktır.'),
        );

        setForm((p) => {
          const keepRid = isSingleTherapist ? p.resource_id : '';
          return { ...DEFAULT_STATE, resource_id: keepRid };
        });
      } else {
        setLocalMsg(
          t('ui_appointment_error_generic', 'Talebiniz alınamadı. Lütfen tekrar deneyin.'),
        );
      }
    } catch {
      // apiErrorText shown
    }
  };

  // -------- UI strings --------
  const leftSubprefix = t('ui_appointment_subprefix', 'Königs Massage');
  const leftSublabel = t('ui_appointment_sublabel', 'Appointment');

  const leftTitleRaw = t('ui_appointment_left_title', t('ui_appointment_page_title', 'Randevu Al'));
  const leftTitleParts = safeStr(leftTitleRaw).split(' ').filter(Boolean);
  const leftTitleFirst = leftTitleParts[0] ?? '';
  const leftTitleRest = leftTitleParts.slice(1).join(' ');

  const leftTagline = t(
    'ui_appointment_left_tagline',
    t('ui_appointment_page_lead', 'Terapist seçin, tarih ve saat belirleyin, formu gönderin.'),
  );

  const rightTitle = t('ui_appointment_form_title', 'Randevu Talebi');

  const dateLabel = t('ui_appointment_date_label', 'Tarih');
  const therapistLabel = t('ui_appointment_resource_label', 'Terapist');
  const customerLabel = t('ui_appointment_customer_label', 'İletişim Bilgileri');
  const slotsTitle = t('ui_appointment_slots_title', 'Boş Seanslar');

  const btnSubmit = isSubmitting
    ? t('ui_appointment_btn_loading', 'Gönderiliyor...')
    : t('ui_appointment_btn_submit', 'Randevu Talebi Gönder');

  return (
    <section className="touch__area touch-bg include__bg pt-120 contact-contrast ens-appointment appointment-page-root">
      <div className="container">
        <div className="row">
          {/* LEFT */}
          <div className="col-xl-4 col-lg-4">
            <div className="touch__left mb-60">
              <div className="section__title-wrapper">
                <span className="section__subtitle s-2">
                  {safeStr(leftSubprefix) ? <span>{leftSubprefix} </span> : null}
                  {safeStr(leftSublabel)}
                </span>

                <h2 className="section__title s-2 mb-30">
                  <span className="down__mark-line">{leftTitleFirst}</span> {leftTitleRest}
                </h2>
              </div>

              {safeStr(leftTagline) ? <p>{leftTagline}</p> : null}

              <div className="mt-25">
                <div className="mb-10">
                  <div className="contact__label text-white ens-appointmentLabel">
                    {therapistLabel}
                  </div>
                </div>

                <TherapistSelect
                  resources={resources}
                  filteredResources={filteredResources}
                  loading={resourcesLoading}
                  fetching={resourcesFetching}
                  error={!!resourcesError}
                  selectedId={form.resource_id}
                  onChange={onPickTherapist}
                  getSuffix={isSingleTherapist ? undefined : therapistAvailabilityText}
                  t={t}
                  disabled={isSubmitting}
                />

                <div className="touch__search mt-15">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      openDatePicker();
                    }}
                  >
                    <label className="visually-hidden" htmlFor="appointment-quick-date">
                      {dateLabel}
                    </label>

                    <input
                      id="appointment-quick-date"
                      ref={dateRef}
                      type="date"
                      value={form.appointment_date}
                      onChange={(e) => onPickDate(e.target.value)}
                      disabled={isSubmitting || !hasTherapist}
                    />

                    <button
                      type="submit"
                      aria-label={t('ui_appointment_open_calendar', 'Takvimi aç')}
                      title={t('ui_appointment_open_calendar', 'Takvimi aç')}
                      disabled={isSubmitting || !hasTherapist}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11.83"
                        height="20.026"
                        viewBox="0 0 11.83 20.026"
                      >
                        <path
                          d="M-3925.578,5558.542l7.623,8.242-7.623,7.543"
                          transform="translate(3927.699 -5556.422)"
                          fill="none"
                          stroke="#fff"
                          strokeLinecap="round"
                          strokeWidth="3"
                        />
                      </svg>
                    </button>
                  </form>
                </div>

                {localMsg || apiErrorText ? (
                  <div className="mt-20">
                    {localMsg ? (
                      <div className="alert alert-info mb-0" role="status">
                        {localMsg}
                      </div>
                    ) : (
                      <div className="alert alert-warning mb-0" role="alert">
                        {apiErrorText}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-xl-8 col-lg-8">
            <div className="touch__contact p-relative">
              <div className="touch__carcle ens-touch-circle" />

              <div className="touch__content-title">
                <h3>{rightTitle}</h3>
              </div>

              {hasTherapist ? (
                <>
                  <div className="touch__content-title mt-15">
                    <h3>{customerLabel}</h3>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-10" noValidate>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="touch__input">
                          <input
                            id="appt-name"
                            type="text"
                            placeholder={t('ui_appointment_name', 'Ad Soyad')}
                            value={form.name}
                            onChange={(e) => patch('name', e.target.value)}
                            disabled={isSubmitting}
                            autoComplete="name"
                          />
                        </div>
                      </div>

                      <div className="col-lg-6">
                        <div className="touch__input">
                          <input
                            id="appt-phone"
                            type="tel"
                            placeholder={t('ui_appointment_phone', 'Telefon')}
                            value={form.phone}
                            onChange={(e) => patch('phone', e.target.value)}
                            disabled={isSubmitting}
                            autoComplete="tel"
                            inputMode="tel"
                          />
                        </div>
                      </div>

                      <div className="col-lg-6">
                        <div className="touch__input">
                          <input
                            id="appt-time"
                            type="text"
                            placeholder={t('ui_appointment_time', 'Saat')}
                            value={form.appointment_time}
                            readOnly
                            aria-readonly="true"
                          />
                        </div>
                      </div>

                      <div className="col-lg-6">
                        <div className="touch__input">
                          <input
                            id="appt-email"
                            type="email"
                            placeholder={t('ui_appointment_email', 'E-posta')}
                            value={form.email}
                            onChange={(e) => patch('email', e.target.value)}
                            disabled={isSubmitting}
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      {hasDate ? (
                        <div className="col-12">
                          <div className="touch__content-title mt-25">
                            <h3>{slotsTitle}</h3>
                          </div>
                          <div className="mt-10">
                            <DailyAvailableSlots
                              date={form.appointment_date}
                              slots={slots}
                              loading={slotsLoading}
                              fetching={slotsFetching}
                              error={!!slotsError}
                              selectedTime={form.appointment_time}
                              onPickTime={onPickTime}
                              onRefresh={() => void refetchSlots()}
                              disabled={isSubmitting || !slotsArgs}
                              t={t}
                            />

                            {availabilityText ? (
                              <p className="small text-muted mt-10 mb-0">{availabilityText}</p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {hasDate ? (
                        <div className="col-12">
                          <div className="touch__submit mt-20">
                            <div className="touch__btn">
                              <button
                                className={`border__btn ${canSubmit ? '' : 'is-disabled'} ${
                                  isSubmitting ? 'is-loading' : ''
                                }`}
                                type="submit"
                                disabled={isSubmitting || !canSubmit}
                                aria-busy={isSubmitting}
                              >
                                {btnSubmit}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </form>
                </>
              ) : (
                <div className="ens-appointmentRightEmpty" />
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Weekly plan FULL WIDTH */}
        <div className="row mt-30">
          <div className="col-12">
            <div className="touch__contact p-relative ens-weeklyPlanCard ens-weeklyPlanFull">
              <div className="touch__carcle ens-touch-circle" />

              <div className="touch__content-title">
                <h3>{t('ui_appointment_weekly_title', 'Haftalık Çalışma Planı')}</h3>
              </div>

              <div className="ens-weeklyPlanWrap">
                <WeeklyPlanTable
                  resourceId={form.resource_id}
                  selectedDate={form.appointment_date}
                  workingHours={workingHours}
                  whLoading={whLoading || whFetching}
                  whError={!!whError}
                  t={t}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentPageContent;
