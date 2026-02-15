// =============================================================
// FILE: src/components/admin/availability/tabs/WeeklyWorkingHoursTab.tsx
// FINAL — Weekly working hours CRUD tab (+ Edit Day action) — i18n via ui_appointment
// =============================================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';

import type { AdminUpsertWorkingHourPayload, ResourceType } from '@/integrations/shared';
import {
  useListWorkingHoursAdminQuery,
  useUpsertWorkingHourAdminMutation,
  useDeleteWorkingHourAdminMutation,
} from '@/integrations/rtk/hooks';

// ✅ i18n (same pattern as Appointment)
import { useLocaleShort } from '@/i18n/useLocaleShort';
import { useUiSection } from '@/i18n/uiDb';
import { isValidUiText } from '@/i18n/uiText';

// ✅ helper
import { safeStr } from '@/components/containers/appointment/_utils/appointmentHelpers';

const toStr = (v: unknown) => String(v ?? '').trim();

const normalizeHm = (v: unknown): string => {
  const s = toStr(v);
  if (!s) return '00:00';
  if (s.includes('T') && s.includes(':')) return (s.split('T')[1] || '').slice(0, 5) || '00:00';
  return s.slice(0, 5);
};

const clampInt = (v: unknown, fallback: number, min = 0, max = 24 * 60) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
};

const toBool01 = (v: unknown) => {
  if (v === true) return true;
  if (v === false) return false;
  return Number(v ?? 0) === 1;
};

const toTimeMinutes = (hm: string) => {
  const m = /^\d{2}:\d{2}$/.exec(hm);
  if (!m) return NaN;
  const [hh, mm] = hm.split(':').map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  return hh * 60 + mm;
};

type WhEditRow = {
  id: string;
  dow: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  break_minutes: number;
  capacity: number;
  is_active: boolean;
};

export type WeeklyWorkingHoursTabProps = {
  resourceId: string;
  hasResourceId: boolean;
  disabled: boolean;
  resourceType?: ResourceType;

  onEditDay?: (args: { dow: number; wh_id?: string }) => void;
};

export const WeeklyWorkingHoursTab: React.FC<WeeklyWorkingHoursTabProps> = ({
  resourceId,
  hasResourceId,
  disabled,
  onEditDay,
}) => {
  // ✅ i18n setup (ui_appointment)
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_appointment', locale as any);

  const t = useCallback(
    (key: string, fallback: string) => {
      const v = safeStr(ui(key, fallback));
      return isValidUiText(v, key) ? v : fallback;
    },
    [ui],
  );

  // ✅ DOW labels i18n
  const DOWS = useMemo(
    () => [
      { value: 1, label: t('ui_dow_1', 'Pazartesi') },
      { value: 2, label: t('ui_dow_2', 'Salı') },
      { value: 3, label: t('ui_dow_3', 'Çarşamba') },
      { value: 4, label: t('ui_dow_4', 'Perşembe') },
      { value: 5, label: t('ui_dow_5', 'Cuma') },
      { value: 6, label: t('ui_dow_6', 'Cumartesi') },
      { value: 7, label: t('ui_dow_7', 'Pazar') },
    ],
    [t],
  );

  const whArgs = useMemo(
    () => (hasResourceId ? ({ resource_id: resourceId } as any) : undefined),
    [hasResourceId, resourceId],
  );

  const whQuery = useListWorkingHoursAdminQuery(
    whArgs as any,
    { skip: !whArgs, refetchOnMountOrArgChange: true } as any,
  );

  const whRows = useMemo(() => {
    const list: any[] = (whQuery.data as any) ?? [];
    return [...list]
      .map((r) => ({
        id: toStr(r.id),
        dow: clampInt(r.dow, 1, 1, 7),
        start_time: normalizeHm(r.start_time),
        end_time: normalizeHm(r.end_time),
        slot_minutes: clampInt(r.slot_minutes, 60, 1, 24 * 60),
        break_minutes: clampInt(r.break_minutes, 0, 0, 24 * 60),
        capacity: clampInt(r.capacity, 1, 0, 999),
        is_active: toBool01(r.is_active),
      }))
      .sort((a, b) =>
        a.dow !== b.dow ? a.dow - b.dow : toTimeMinutes(a.start_time) - toTimeMinutes(b.start_time),
      );
  }, [whQuery.data]);

  const [whEdit, setWhEdit] = useState<Record<string, WhEditRow>>({});
  useEffect(() => {
    const next: Record<string, WhEditRow> = {};
    for (const r of whRows) next[r.id] = { ...r };
    setWhEdit(next);
  }, [whRows]);

  const [upsertWH, { isLoading: isSavingWh }] = useUpsertWorkingHourAdminMutation();
  const [deleteWH, { isLoading: isDeletingWh }] = useDeleteWorkingHourAdminMutation();

  const busy = disabled || whQuery.isLoading || whQuery.isFetching || isSavingWh || isDeletingWh;

  const [newWh, setNewWh] = useState<AdminUpsertWorkingHourPayload>(() => ({
    resource_id: resourceId || ('00000000-0000-0000-0000-000000000000' as any),
    dow: 1,
    start_time: '10:00' as any,
    end_time: '18:00' as any,
    slot_minutes: 60,
    break_minutes: 0,
    capacity: 1,
    is_active: true,
  }));

  useEffect(() => {
    if (!hasResourceId) return;
    setNewWh((p) => ({ ...p, resource_id: resourceId }) as any);
  }, [hasResourceId, resourceId]);

  const validateRange = (start: string, end: string) => {
    const sMin = toTimeMinutes(start);
    const eMin = toTimeMinutes(end);
    return Number.isFinite(sMin) && Number.isFinite(eMin) && eMin > sMin;
  };

  const handleAdd = async () => {
    if (!hasResourceId) return;
    const start = normalizeHm(newWh.start_time);
    const end = normalizeHm(newWh.end_time);

    if (!validateRange(start, end)) {
      toast.error(
        t(
          'ui_admin_wh_err_range',
          'Başlangıç/bitiş saati geçersiz. (Bitiş, başlangıçtan büyük olmalı)',
        ),
      );
      return;
    }

    try {
      await upsertWH({
        resource_id: resourceId,
        dow: clampInt(newWh.dow, 1, 1, 7),
        start_time: start as any,
        end_time: end as any,
        slot_minutes: clampInt(newWh.slot_minutes, 60, 1, 24 * 60),
        break_minutes: clampInt(newWh.break_minutes, 0, 0, 24 * 60),
        capacity: clampInt(newWh.capacity, 1, 0, 999),
        is_active: toBool01(newWh.is_active),
      } as any).unwrap();

      toast.success(t('ui_admin_wh_added', 'Çalışma aralığı eklendi.'));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.message ||
          t('ui_admin_wh_add_failed', 'Çalışma aralığı eklenemedi.'),
      );
    }
  };

  const handleUpdate = async (row: WhEditRow) => {
    if (!hasResourceId) return;
    const start = normalizeHm(row.start_time);
    const end = normalizeHm(row.end_time);

    if (!validateRange(start, end)) {
      toast.error(t('ui_admin_wh_err_invalid_range', 'Başlangıç/bitiş saati geçersiz.'));
      return;
    }

    try {
      await upsertWH({
        id: row.id as any,
        resource_id: resourceId,
        dow: clampInt(row.dow, 1, 1, 7),
        start_time: start as any,
        end_time: end as any,
        slot_minutes: clampInt(row.slot_minutes, 60, 1, 24 * 60),
        break_minutes: clampInt(row.break_minutes, 0, 0, 24 * 60),
        capacity: clampInt(row.capacity, 1, 0, 999),
        is_active: !!row.is_active,
      } as any).unwrap();

      toast.success(t('ui_admin_wh_updated', 'Çalışma aralığı güncellendi.'));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.message ||
          t('ui_admin_wh_update_failed', 'Çalışma aralığı güncellenemedi.'),
      );
    }
  };

  const handleDelete = async (row: WhEditRow) => {
    const dayLabel = DOWS.find((x) => x.value === row.dow)?.label || String(row.dow);

    const ok = window.confirm(
      t(
        'ui_admin_wh_delete_confirm',
        `Bu çalışma aralığını silmek üzeresin.\n\nGün: ${dayLabel}\nSaat: ${row.start_time} - ${row.end_time}\n\nDevam edilsin mi?`,
      ),
    );
    if (!ok) return;

    try {
      await deleteWH({ id: String(row.id), resource_id: resourceId } as any).unwrap();
      toast.success(t('ui_admin_wh_deleted', 'Çalışma aralığı silindi.'));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.message ||
          t('ui_admin_wh_delete_failed', 'Çalışma aralığı silinemedi.'),
      );
    }
  };

  const handleEditDay = (row: WhEditRow) => {
    onEditDay?.({ dow: row.dow, wh_id: row.id });
  };

  return (
    <>
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
        <div>
          <div className="small fw-semibold">
            {t('ui_admin_wh_title', 'Haftalık Çalışma Saatleri')}
          </div>
          <div className="text-muted small">
            {t(
              'ui_admin_wh_desc',
              'Bu aralıklar günlük seans üretiminin kaynağıdır. (Seans dk + Ara dk)',
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {busy ? (
            <span className="badge bg-secondary small">
              {t('ui_admin_loading', 'Yükleniyor...')}
            </span>
          ) : null}

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => whQuery.refetch()}
            disabled={busy}
          >
            {t('ui_admin_refresh', 'Yenile')}
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: 180 }}>{t('ui_admin_col_day', 'Gün')}</th>
              <th style={{ width: 120 }}>{t('ui_admin_col_start', 'Başlangıç')}</th>
              <th style={{ width: 120 }}>{t('ui_admin_col_end', 'Bitiş')}</th>
              <th style={{ width: 120 }}>{t('ui_admin_col_session', 'Seans (dk)')}</th>
              <th style={{ width: 120 }}>{t('ui_admin_col_break', 'Ara (dk)')}</th>
              <th style={{ width: 110 }}>{t('ui_admin_col_capacity', 'Kapasite')}</th>
              <th style={{ width: 90 }}>{t('ui_admin_col_active', 'Aktif')}</th>
              <th className="text-end" style={{ width: 260 }}>
                {t('ui_admin_col_actions', 'İşlemler')}
              </th>
            </tr>
          </thead>

          <tbody>
            {whRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted small p-3">
                  {t(
                    'ui_admin_wh_empty',
                    'Henüz çalışma aralığı yok. Aşağıdan yeni aralık ekleyebilirsin.',
                  )}
                </td>
              </tr>
            ) : null}

            {whRows.map((row) => {
              const r = whEdit[row.id] || row;
              return (
                <tr key={row.id}>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={r.dow}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, dow: Number(e.target.value) },
                        }))
                      }
                    >
                      {DOWS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={r.start_time}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, start_time: e.target.value },
                        }))
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={r.end_time}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, end_time: e.target.value },
                        }))
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={r.slot_minutes}
                      min={1}
                      max={24 * 60}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, slot_minutes: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={r.break_minutes}
                      min={0}
                      max={24 * 60}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, break_minutes: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={r.capacity}
                      min={0}
                      max={999}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, capacity: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>

                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!r.is_active}
                        disabled={busy}
                        onChange={(e) =>
                          setWhEdit((p) => ({
                            ...p,
                            [row.id]: { ...r, is_active: e.target.checked },
                          }))
                        }
                      />
                    </div>
                  </td>

                  <td className="text-end">
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={busy || !onEditDay}
                        onClick={() => handleEditDay(r)}
                        title={t(
                          'ui_admin_wh_edit_day_hint',
                          'Bu günün günlük seanslarını düzenle',
                        )}
                      >
                        {t('ui_admin_btn_edit', 'Düzenle')}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        disabled={busy}
                        onClick={() => void handleUpdate(r)}
                      >
                        {t('ui_admin_btn_save', 'Kaydet')}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        disabled={busy}
                        onClick={() => void handleDelete(r)}
                      >
                        {t('ui_admin_btn_delete', 'Sil')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <hr className="my-3" />

      <div className="small fw-semibold mb-2">
        {t('ui_admin_wh_add_title', 'Yeni Çalışma Aralığı Ekle')}
      </div>

      <div className="row g-2 align-items-end">
        <div className="col-12 col-md-3">
          <label className="form-label small mb-1">{t('ui_admin_lbl_day', 'Gün')}</label>
          <select
            className="form-select form-select-sm"
            value={newWh.dow}
            onChange={(e) => setNewWh((p) => ({ ...p, dow: Number(e.target.value) }) as any)}
            disabled={busy}
          >
            {DOWS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-2">
          <label className="form-label small mb-1">{t('ui_admin_lbl_start', 'Başlangıç')}</label>
          <input
            type="time"
            className="form-control form-control-sm"
            value={String(newWh.start_time)}
            onChange={(e) => setNewWh((p) => ({ ...p, start_time: e.target.value }) as any)}
            disabled={busy}
          />
        </div>

        <div className="col-6 col-md-2">
          <label className="form-label small mb-1">{t('ui_admin_lbl_end', 'Bitiş')}</label>
          <input
            type="time"
            className="form-control form-control-sm"
            value={String(newWh.end_time)}
            onChange={(e) => setNewWh((p) => ({ ...p, end_time: e.target.value }) as any)}
            disabled={busy}
          />
        </div>

        <div className="col-6 col-md-2">
          <label className="form-label small mb-1">{t('ui_admin_lbl_session', 'Seans (dk)')}</label>
          <input
            type="number"
            className="form-control form-control-sm"
            value={Number(newWh.slot_minutes ?? 60)}
            min={1}
            max={24 * 60}
            onChange={(e) =>
              setNewWh((p) => ({ ...p, slot_minutes: Number(e.target.value) }) as any)
            }
            disabled={busy}
          />
        </div>

        <div className="col-6 col-md-1">
          <label className="form-label small mb-1">{t('ui_admin_lbl_break', 'Ara')}</label>
          <input
            type="number"
            className="form-control form-control-sm"
            value={Number(newWh.break_minutes ?? 0)}
            min={0}
            max={24 * 60}
            onChange={(e) =>
              setNewWh((p) => ({ ...p, break_minutes: Number(e.target.value) }) as any)
            }
            disabled={busy}
          />
        </div>

        <div className="col-6 col-md-1">
          <label className="form-label small mb-1">{t('ui_admin_lbl_capacity', 'Kapasite')}</label>
          <input
            type="number"
            className="form-control form-control-sm"
            value={Number(newWh.capacity ?? 1)}
            min={0}
            max={999}
            onChange={(e) => setNewWh((p) => ({ ...p, capacity: Number(e.target.value) }) as any)}
            disabled={busy}
          />
        </div>

        <div className="col-6 col-md-1">
          <label className="form-label small mb-1">{t('ui_admin_lbl_active', 'Aktif')}</label>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={toBool01(newWh.is_active)}
              onChange={(e) => setNewWh((p) => ({ ...p, is_active: e.target.checked }) as any)}
              disabled={busy}
            />
          </div>
        </div>

        <div className="col-12 col-md-2 text-end">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handleAdd}
            disabled={busy}
          >
            {t('ui_admin_btn_add', 'Ekle')}
          </button>
        </div>
      </div>
    </>
  );
};
