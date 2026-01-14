// =============================================================
// FILE: src/components/containers/appointment/_components/DailyAvailableSlots.tsx
// FINAL — Daily available sessions list (only available slots)
// - Separate block: shows ONLY available slots for selected therapist + date
// =============================================================

'use client';

import React, { useMemo } from 'react';
import type { ResourceSlotDto } from '@/integrations/types';

import {
  slotIsActive,
  slotIsAvailable,
  slotTime,
  safeStr,
  isValidYmd,
} from '../_utils/appointmentHelpers';

export type DailyAvailableSlotsProps = {
  date: string; // YYYY-MM-DD
  slots: ResourceSlotDto[];
  loading: boolean;
  fetching: boolean;
  error: boolean;
  selectedTime: string;
  onPickTime: (tm: string) => void;
  onRefresh?: () => void;
  disabled?: boolean;
  t: (key: string, fallback: string) => string;
};

export const DailyAvailableSlots: React.FC<DailyAvailableSlotsProps> = ({
  date,
  slots,
  loading,
  fetching,
  error,
  selectedTime,
  onPickTime,
  onRefresh,
  disabled,
  t,
}) => {
  const d = safeStr(date);

  const available = useMemo(() => {
    // ✅ IMPORTANT: "boş seans" => active + available
    return (slots || [])
      .filter(slotIsActive)
      .filter(slotIsAvailable)
      .sort((a, b) => slotTime(a).localeCompare(slotTime(b)));
  }, [slots]);


  const statusText = useMemo(() => {
    if (!isValidYmd(d)) return t('ui_appointment_daily_pick_date', 'Önce tarih seçin.');
    if (loading || fetching) return t('ui_appointment_slots_loading', 'Saatler yükleniyor...');
    if (error) return t('ui_appointment_slots_error', 'Saatler yüklenemedi.');
    if (!available.length)
      return t('ui_appointment_slots_empty', 'Bu tarihte müsait saat bulunamadı.');
    return '';
  }, [d, loading, fetching, error, available.length, t]);

  return (
    <div className="ens-appointment__slots mt-15">
      <div className="d-flex align-items-center justify-content-between mb-10">

        {onRefresh ? (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={!!disabled || loading || fetching}
          >
            {t('ui_appointment_refresh', 'Yenile')}
          </button>
        ) : null}
      </div>

      {statusText ? (
        <div className="alert alert-light mb-0">{statusText}</div>
      ) : (
        <div className="list-group">
          {available.map((s) => {
            const time = slotTime(s);
            const selected = safeStr(selectedTime) === time;

            return (
              <button
                key={String((s as any).id || time)}
                type="button"
                className={
                  'list-group-item list-group-item-action d-flex align-items-center justify-content-between' +
                  (selected ? ' active' : '')
                }
                onClick={() => onPickTime(time)}
                disabled={!!disabled}
              >
                <span className="text-nowrap">{time || '-'}</span>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  {t('ui_appointment_slot_status_available', 'Müsait')}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
