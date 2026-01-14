// =============================================================
// FILE: src/components/admin/availability/tabs/DailyPlanTab.tsx
// FINAL — Daily plan tab (select WH range + preview + DB plan)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { AdminOverrideSlotPayload, PlannedSlotDto } from '@/integrations/types';
import {
  useListWorkingHoursAdminQuery,
  useGetDailyPlanAdminQuery,
  useGenerateSlotsAdminMutation,
  useOverrideDayAdminMutation,
  useOverrideSlotAdminMutation,
} from '@/integrations/rtk/hooks';

const toStr = (v: unknown) => String(v ?? '').trim();
const pad2 = (n: number) => String(n).padStart(2, '0');

const normalizeYmd = (v: unknown): string => {
  const s = toStr(v);
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // dd.mm.yyyy -> yyyy-mm-dd (defensive)
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const normalizeHm = (v: unknown): string => {
  const s = toStr(v);
  if (!s) return '00:00';
  if (s.includes('T') && s.includes(':')) return (s.split('T')[1] || '').slice(0, 5) || '00:00';
  return s.slice(0, 5);
};

const toTimeMinutes = (hm: string) => {
  const m = /^\d{2}:\d{2}$/.exec(hm);
  if (!m) return NaN;
  const [hh, mm] = hm.split(':').map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  return hh * 60 + mm;
};

const fromMinutes = (mins: number) => {
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
};

const todayYmd = () => normalizeYmd(new Date().toISOString());

const formatCapacity = (cap: number, reserved: number) => {
  const c = Number(cap ?? 0);
  const r = Number(reserved ?? 0);
  if (c <= 0) return '-';
  return `${r}/${c}`;
};

const getDow1to7 = (ymd: string): number => {
  // JS: 0=Sun..6=Sat  -> 1=Mon..7=Sun
  const d = new Date(`${ymd}T00:00:00`);
  const js = d.getDay();
  if (js === 0) return 7;
  return js;
};

type WhRow = {
  id: string;
  dow: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  break_minutes: number;
  capacity: number;
  is_active: boolean;
};

type PreviewSession = {
  time: string;
  wh_id: string;
  capacity: number;
  slot_minutes: number;
  break_minutes: number;
  range: string;
};

export type DailyPlanTabProps = {
  resourceId: string;
  hasResourceId: boolean;
  disabled: boolean;

  // Weekly tab'dan "Düzenle" ile gelince
  initialDow?: number;
  initialWhId?: string;
};

function DailyPlanHeader(props: {
  busy: boolean;
  effectiveDate: string;
  dayDow: number;
  onChangeDate: (ymd: string) => void;
  onRefresh: () => void;
  onGenerate: () => void;
  onCloseDay: () => void;
  onOpenDay: () => void;
}) {
  const {
    busy,
    effectiveDate,
    dayDow,
    onChangeDate,
    onRefresh,
    onGenerate,
    onCloseDay,
    onOpenDay,
  } = props;

  return (
    <>
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
        <div>
          <div className="small fw-semibold">Günlük Plan</div>
          <div className="text-muted small">
            Seçilen güne göre haftalık plandan seanslar çıkarılır. DB’ye yazmak için “Slot Üret”
            kullan.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {busy ? <span className="badge bg-secondary small">Yükleniyor...</span> : null}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={busy}
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="row g-2 align-items-end">
        <div className="col-12 col-md-4">
          <label className="form-label small mb-1">Tarih</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={effectiveDate}
            onChange={(e) => onChangeDate(e.target.value)}
            disabled={busy}
          />
          <div className="form-text small">
            Gün: <strong>{dayDow}</strong> (1=Pt … 7=Pz)
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div className="d-flex justify-content-md-end gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={onGenerate}
              disabled={busy}
            >
              Slot Üret
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={onCloseDay}
              disabled={busy}
            >
              Günü Kapat
            </button>
            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={onOpenDay}
              disabled={busy}
            >
              Günü Aç
            </button>
          </div>
          <div className="text-muted small mt-1 text-md-end">
            Not: Onay anında kapasite tekrar kontrol edilir (backend kuralı).
          </div>
        </div>
      </div>

      <hr className="my-3" />
    </>
  );
}

function PreviewSessionsTable(props: {
  busy: boolean;
  whForDay: WhRow[];
  selectedWhId: string;
  onSelectWhId: (id: string) => void;
  preview: PreviewSession[];
}) {
  const { busy, whForDay, selectedWhId, onSelectWhId, preview } = props;

  const hasRanges = whForDay.length > 0;
  const hasPreview = preview.length > 0;

  return (
    <>
      <div className="mb-2">
        <div className="small fw-semibold">Seans Önizleme (Haftalık Plandan)</div>
        <div className="text-muted small">
          Önizleme sadece UI içindir. Public saatler için DB planı doldurmak gerekir.
        </div>
      </div>

      {!hasRanges ? (
        <div className="alert alert-light border small">
          Bu gün için aktif haftalık çalışma aralığı yok. (DOW eşleşmiyor veya aralık pasif)
        </div>
      ) : (
        <>
          <div className="row g-2 align-items-end mb-2">
            <div className="col-12 col-md-6">
              <label className="form-label small mb-1">Çalışma Aralığı</label>
              <select
                className="form-select form-select-sm"
                value={selectedWhId}
                onChange={(e) => onSelectWhId(e.target.value)}
                disabled={busy}
              >
                <option value="">Aralık seçin</option>
                {whForDay.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.start_time}-{wh.end_time} • {wh.slot_minutes}dk + {wh.break_minutes}dk •
                    kap:
                    {wh.capacity}
                  </option>
                ))}
              </select>
              <div className="form-text small">
                Aynı gün içinde birden fazla aralık varsa, günlük seansları aralık bazında yönet.
              </div>
            </div>
          </div>

          {!selectedWhId ? (
            <div className="alert alert-light border small">Önizleme için bir aralık seç.</div>
          ) : !hasPreview ? (
            <div className="alert alert-light border small">
              Seçilen aralık için seans üretilemedi. (Saatler/slot dk/ara dk kontrol et)
            </div>
          ) : (
            <div className="table-responsive mb-3">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 120 }}>Saat</th>
                    <th style={{ width: 120 }}>Kapasite</th>
                    <th>Aralık</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((s) => (
                    <tr key={`${s.wh_id}:${s.time}`}>
                      <td className="text-nowrap">
                        <span className="badge bg-light text-dark border">{s.time}</span>
                      </td>
                      <td className="text-nowrap small">{s.capacity}</td>
                      <td className="text-muted small">{s.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

function DbPlanTable(props: {
  busy: boolean;
  planRows: PlannedSlotDto[];
  onToggle: (row: PlannedSlotDto) => void;
}) {
  const { busy, planRows, onToggle } = props;
  const hasPlan = planRows.length > 0;

  return (
    <>
      <div className="mb-2">
        <div className="small fw-semibold">DB Plan (Slot Kayıtları)</div>
        <div className="text-muted small">Public “müsait saatler” buradan okunur.</div>
      </div>

      {!hasPlan ? (
        <div className="alert alert-warning small mb-0">
          DB plan boş. Önizleme görüyorsan “Slot Üret” ile DB’ye yazdırmalısın.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 110 }}>Saat</th>
                <th style={{ width: 140 }}>Kapasite</th>
                <th style={{ width: 140 }}>Durum</th>
                <th className="text-end" style={{ width: 160 }}>
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {planRows.map((p) => {
                const time = normalizeHm((p as any).time);
                const isActive = Number((p as any).is_active ?? 0) === 1;
                const cap = Number((p as any).capacity ?? 0);
                const reserved = Number((p as any).reserved_count ?? 0);
                const available = !!(p as any).available;

                return (
                  <tr key={String((p as any).id || `${time}:${toStr((p as any).slot_id || '')}`)}>
                    <td className="text-nowrap">
                      <span className="badge bg-light text-dark border">{time}</span>
                    </td>
                    <td className="text-nowrap small">
                      {formatCapacity(cap, reserved)}
                      {cap > 0 ? <span className="text-muted ms-2">(dolu/toplam)</span> : null}
                    </td>
                    <td className="text-nowrap">
                      {isActive ? (
                        available ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Açık
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                            Dolu
                          </span>
                        )
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                          Kapalı
                        </span>
                      )}
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className={
                          'btn btn-sm ' + (isActive ? 'btn-outline-danger' : 'btn-outline-success')
                        }
                        onClick={() => onToggle(p)}
                        disabled={busy}
                      >
                        {isActive ? 'Kapat' : 'Aç'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="alert alert-light border mt-3 mb-0 small">
        <div className="fw-semibold mb-1">Net Kural</div>
        <ul className="mb-0 ps-3">
          <li>Haftalık plan: seans üretiminin kaynağı (UI önizleme buradan).</li>
          <li>DB plan: public’in gerçek kaynağı (müsait saatler buradan seçilir).</li>
          <li>Plan boşsa public’te saat görünmez. Bu yüzden üretim şart.</li>
        </ul>
      </div>
    </>
  );
}

export const DailyPlanTab: React.FC<DailyPlanTabProps> = ({
  resourceId,
  hasResourceId,
  disabled,
  initialDow,
  initialWhId,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => todayYmd());
  const effectiveDate = useMemo(() => normalizeYmd(selectedDate) || todayYmd(), [selectedDate]);
  const dayDow = useMemo(() => getDow1to7(effectiveDate), [effectiveDate]);

  // Weekly hours
  const whArgs = useMemo(
    () => (hasResourceId ? ({ resource_id: resourceId } as any) : undefined),
    [hasResourceId, resourceId],
  );
  const whQuery = useListWorkingHoursAdminQuery(
    whArgs as any,
    { skip: !whArgs, refetchOnMountOrArgChange: true } as any,
  );

  const whRows: WhRow[] = useMemo(() => {
    const list: any[] = (whQuery.data as any) ?? [];
    return [...list].map((r) => ({
      id: toStr(r.id),
      dow: Number(r.dow ?? 1),
      start_time: normalizeHm(r.start_time),
      end_time: normalizeHm(r.end_time),
      slot_minutes: Number(r.slot_minutes ?? 60),
      break_minutes: Number(r.break_minutes ?? 0),
      capacity: Number(r.capacity ?? 1),
      is_active: Number(r.is_active ?? 0) === 1,
    }));
  }, [whQuery.data]);

  // Active WH ranges for this day
  const whForDay = useMemo(() => {
    const d = Number(initialDow ?? dayDow);
    return whRows
      .filter((r) => r.is_active)
      .filter((r) => Number(r.dow) === d)
      .sort((a, b) => toTimeMinutes(a.start_time) - toTimeMinutes(b.start_time));
  }, [whRows, dayDow, initialDow]);

  // Selected WH for preview
  const [selectedWhId, setSelectedWhId] = useState<string>('');

  // When coming from Weekly "Düzenle", preselect
  useEffect(() => {
    if (initialWhId) {
      setSelectedWhId(String(initialWhId));
      return;
    }
    // default: first range
    if (!selectedWhId && whForDay.length) setSelectedWhId(whForDay[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWhId, whForDay.length]);

  const selectedWh = useMemo(
    () => whForDay.find((x) => x.id === selectedWhId) || null,
    [whForDay, selectedWhId],
  );

  // PREVIEW from selected WH
  const preview: PreviewSession[] = useMemo(() => {
    if (!selectedWh) return [];
    const wh = selectedWh;

    const out: PreviewSession[] = [];
    const s = toTimeMinutes(wh.start_time);
    const e = toTimeMinutes(wh.end_time);

    const slotLen = Math.max(1, Number(wh.slot_minutes ?? 60));
    const step = Math.max(1, slotLen + Math.max(0, Number(wh.break_minutes ?? 0)));

    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return [];

    for (let t = s; t + slotLen <= e; t += step) {
      out.push({
        time: fromMinutes(t),
        wh_id: wh.id,
        capacity: Math.max(0, Number(wh.capacity ?? 1)),
        slot_minutes: slotLen,
        break_minutes: Math.max(0, Number(wh.break_minutes ?? 0)),
        range: `${wh.start_time}-${wh.end_time} • ${slotLen}dk + ${Math.max(
          0,
          Number(wh.break_minutes ?? 0),
        )}dk`,
      });
    }

    return out.sort((a, b) => toTimeMinutes(a.time) - toTimeMinutes(b.time));
  }, [selectedWh]);

  // DB plan
  const planArgs = useMemo(
    () => (hasResourceId ? ({ resource_id: resourceId, date: effectiveDate } as any) : undefined),
    [hasResourceId, resourceId, effectiveDate],
  );

  const planQuery = useGetDailyPlanAdminQuery(
    planArgs as any,
    { skip: !planArgs, refetchOnMountOrArgChange: true } as any,
  );

  const planRows: PlannedSlotDto[] = useMemo(() => {
    const list: PlannedSlotDto[] = (planQuery.data as any) ?? [];
    return [...list].sort(
      (a, b) =>
        toTimeMinutes(normalizeHm((a as any).time)) - toTimeMinutes(normalizeHm((b as any).time)),
    );
  }, [planQuery.data]);

  const [generateSlots, { isLoading: isGenerating }] = useGenerateSlotsAdminMutation();
  const [overrideDay, { isLoading: isOverridingDay }] = useOverrideDayAdminMutation();
  const [overrideSlot, { isLoading: isOverridingSlot }] = useOverrideSlotAdminMutation();

  const busy =
    disabled ||
    whQuery.isLoading ||
    whQuery.isFetching ||
    planQuery.isLoading ||
    planQuery.isFetching ||
    isGenerating ||
    isOverridingDay ||
    isOverridingSlot;

  const handleGenerate = async () => {
    if (!hasResourceId) return;
    try {
      const res = await generateSlots({
        resource_id: resourceId,
        date: effectiveDate,
      } as any).unwrap();
      toast.success(
        `Slot üretimi tamam. Oluşan=${(res as any)?.created ?? 0}, Plan=${
          (res as any)?.planned ?? 0
        }`,
      );
      await planQuery.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Slot üretimi başarısız.');
    }
  };

  const handleOverrideDay = async (isActive: boolean) => {
    if (!hasResourceId) return;
    try {
      const res = await overrideDay({
        resource_id: resourceId,
        date: effectiveDate,
        is_active: isActive,
      } as any).unwrap();
      toast.success(`Gün güncellendi. updated=${(res as any)?.updated ?? 0}`);
      await planQuery.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Gün override edilemedi.');
    }
  };

  const handleToggleSlot = async (row: PlannedSlotDto) => {
    if (!hasResourceId) return;
    const time = normalizeHm((row as any).time);
    if (!time) return;

    const nextActive = !(Number((row as any).is_active ?? 0) === 1);
    const reserved = Number((row as any).reserved_count ?? 0);

    if (!nextActive && reserved > 0) {
      const ok = window.confirm(
        `Bu slotta ${reserved} onaylı rezervasyon var.\nSlotu kapatırsan bu randevular için aksiyon gerekebilir.\n\nDevam edilsin mi?`,
      );
      if (!ok) return;
    }

    const payload: AdminOverrideSlotPayload = {
      resource_id: resourceId as any,
      date: effectiveDate as any,
      time: time as any,
      is_active: nextActive,
    };

    try {
      await overrideSlot(payload as any).unwrap();
      toast.success('Slot güncellendi.');
      await planQuery.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Slot güncellenemedi.');
    }
  };

  return (
    <>
      <DailyPlanHeader
        busy={busy}
        effectiveDate={effectiveDate}
        dayDow={dayDow}
        onChangeDate={(v) => setSelectedDate(normalizeYmd(v) || todayYmd())}
        onRefresh={() => planQuery.refetch()}
        onGenerate={handleGenerate}
        onCloseDay={() => void handleOverrideDay(false)}
        onOpenDay={() => void handleOverrideDay(true)}
      />

      <PreviewSessionsTable
        busy={busy}
        whForDay={whForDay}
        selectedWhId={selectedWhId}
        onSelectWhId={setSelectedWhId}
        preview={preview}
      />

      <DbPlanTable busy={busy} planRows={planRows} onToggle={handleToggleSlot} />
    </>
  );
};
