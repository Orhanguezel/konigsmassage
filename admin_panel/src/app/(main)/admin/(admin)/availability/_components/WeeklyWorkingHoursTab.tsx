// =============================================================
// FILE: src/components/admin/availability/tabs/WeeklyWorkingHoursTab.tsx
// FINAL — Weekly working hours CRUD tab (+ Edit Day action) — i18n via ui_appointment
// =============================================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { AdminUpsertWorkingHourPayload, ResourceType } from '@/integrations/shared';
import { clampInt, hmToMinutes, normalizeHm, toActiveBool } from '@/integrations/shared';
import {
  useListWorkingHoursAdminQuery,
  useUpsertWorkingHourAdminMutation,
  useDeleteWorkingHourAdminMutation,
} from '@/integrations/hooks';

// ✅ i18n (same pattern as Appointment)
import { useLocaleShort } from '../../../../../../i18n/useLocaleShort';
import { useUiSection } from '../../../../../../i18n/uiDb';
import { isValidUiText } from '../../../../../../i18n/uiText';

// ✅ helper
const toStr = (v: unknown) => String(v ?? '').trim();
const safeStr = toStr; // Alias for compatibility

const toTimeMinutes = (hm: string) => hmToMinutes(hm);

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
        is_active: toActiveBool(r.is_active),
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
        is_active: toActiveBool(newWh.is_active),
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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">
            {t('ui_admin_wh_title', 'Haftalık Çalışma Saatleri')}
          </div>
          <div className="text-xs text-muted-foreground">
            {t(
              'ui_admin_wh_desc',
              'Bu aralıklar günlük seans üretiminin kaynağıdır. (Seans dk + Ara dk)',
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {busy ? (
            <Badge variant="secondary" className="text-xs">
              {t('ui_admin_loading', 'Yükleniyor...')}
            </Badge>
          ) : null}

          <Button variant="outline" size="sm" onClick={() => whQuery.refetch()} disabled={busy}>
            {t('ui_admin_refresh', 'Yenile')}
          </Button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 180 }}>{t('ui_admin_col_day', 'Gün')}</TableHead>
              <TableHead style={{ width: 120 }}>{t('ui_admin_col_start', 'Başlangıç')}</TableHead>
              <TableHead style={{ width: 120 }}>{t('ui_admin_col_end', 'Bitiş')}</TableHead>
              <TableHead style={{ width: 120 }}>{t('ui_admin_col_session', 'Seans (dk)')}</TableHead>
              <TableHead style={{ width: 120 }}>{t('ui_admin_col_break', 'Ara (dk)')}</TableHead>
              <TableHead style={{ width: 110 }}>{t('ui_admin_col_capacity', 'Kapasite')}</TableHead>
              <TableHead style={{ width: 90 }}>{t('ui_admin_col_active', 'Aktif')}</TableHead>
              <TableHead className="text-right" style={{ width: 260 }}>
                {t('ui_admin_col_actions', 'İşlemler')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {whRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-sm text-muted-foreground">
                  {t(
                    'ui_admin_wh_empty',
                    'Henüz çalışma aralığı yok. Aşağıdan yeni aralık ekleyebilirsin.',
                  )}
                </TableCell>
              </TableRow>
            ) : null}

            {whRows.map((row) => {
              const r = whEdit[row.id] || row;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Select
                      value={String(r.dow)}
                      onValueChange={(v) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, dow: Number(v) },
                        }))
                      }
                      disabled={busy}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOWS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Input
                      type="time"
                      value={r.start_time}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, start_time: e.target.value },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="time"
                      value={r.end_time}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, end_time: e.target.value },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
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
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
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
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
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
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={!!r.is_active}
                      disabled={busy}
                      onCheckedChange={(v) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, is_active: v },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || !onEditDay}
                        onClick={() => handleEditDay(r)}
                        title={t(
                          'ui_admin_wh_edit_day_hint',
                          'Bu günün günlük seanslarını düzenle',
                        )}
                      >
                        {t('ui_admin_btn_edit', 'Düzenle')}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleUpdate(r)}
                      >
                        {t('ui_admin_btn_save', 'Kaydet')}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleDelete(r)}
                      >
                        {t('ui_admin_btn_delete', 'Sil')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Separator className="my-4" />

      <div className="text-sm font-semibold mb-2">
        {t('ui_admin_wh_add_title', 'Yeni Çalışma Aralığı Ekle')}
      </div>

      <div className="grid gap-3 md:grid-cols-8">
        <div className="space-y-2 md:col-span-2">
          <Label>{t('ui_admin_lbl_day', 'Gün')}</Label>
          <Select
            value={String(newWh.dow)}
            onValueChange={(v) => setNewWh((p) => ({ ...p, dow: Number(v) }) as any)}
            disabled={busy}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOWS.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('ui_admin_lbl_start', 'Başlangıç')}</Label>
          <Input
            type="time"
            value={String(newWh.start_time)}
            onChange={(e) => setNewWh((p) => ({ ...p, start_time: e.target.value }) as any)}
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('ui_admin_lbl_end', 'Bitiş')}</Label>
          <Input
            type="time"
            value={String(newWh.end_time)}
            onChange={(e) => setNewWh((p) => ({ ...p, end_time: e.target.value }) as any)}
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('ui_admin_lbl_session', 'Seans (dk)')}</Label>
          <Input
            type="number"
            value={Number(newWh.slot_minutes ?? 60)}
            min={1}
            max={24 * 60}
            onChange={(e) =>
              setNewWh((p) => ({ ...p, slot_minutes: Number(e.target.value) }) as any)
            }
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('ui_admin_lbl_break', 'Ara')}</Label>
          <Input
            type="number"
            value={Number(newWh.break_minutes ?? 0)}
            min={0}
            max={24 * 60}
            onChange={(e) =>
              setNewWh((p) => ({ ...p, break_minutes: Number(e.target.value) }) as any)
            }
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('ui_admin_lbl_capacity', 'Kapasite')}</Label>
          <Input
            type="number"
            value={Number(newWh.capacity ?? 1)}
            min={0}
            max={999}
            onChange={(e) => setNewWh((p) => ({ ...p, capacity: Number(e.target.value) }) as any)}
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('ui_admin_lbl_active', 'Aktif')}</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={toActiveBool(newWh.is_active)}
              onCheckedChange={(v) => setNewWh((p) => ({ ...p, is_active: v }) as any)}
              disabled={busy}
            />
          </div>
        </div>

        <div className="md:col-span-1 flex items-end justify-end">
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={busy}>
            {t('ui_admin_btn_add', 'Ekle')}
          </Button>
        </div>
      </div>
    </>
  );
};
