// =============================================================
// FILE: src/components/containers/appointment/_utils/WeeklyPlanTable.tsx
// FINAL — Weekly plan table (i18n DOW labels via t())
// =============================================================

'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { ResourceWorkingHourDto } from '@/integrations/types';

import { isValidHm, safeStr, buildDowLabels } from '../_utils/appointmentHelpers';

type DayCell = {
  dow: number;
  rangeText: string;
  sessions: string[];
};

export type WeeklyPlanTableProps = {
  resourceId: string;
  selectedDate: string; // kept for API compatibility (not used)
  workingHours: ResourceWorkingHourDto[];
  whLoading: boolean;
  whError: boolean;
  t: (key: string, fallback: string) => string;
};

const HEADER_DAYS: number[] = [1, 2, 3, 4, 5, 6, 7];

function toHm(v: unknown): string {
  if (v instanceof Date) {
    const hh = String(v.getHours()).padStart(2, '0');
    const mm = String(v.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s.includes('T') && s.includes(':')) return (s.split('T')[1] ?? '').slice(0, 5);
  return s.slice(0, 5);
}

function isActive01(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  return Number(v ?? 0) === 1;
}

function hmToMinutes(hm: string): number {
  if (!isValidHm(hm)) return NaN;
  const [h, m] = hm.split(':').map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function minutesToHm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function mergeRanges(ranges: Array<[string, string]>): Array<[string, string]> {
  const sorted = ranges
    .filter(([a, b]) => isValidHm(a) && isValidHm(b) && a < b)
    .sort((x, y) => x[0].localeCompare(y[0]));

  const out: Array<[string, string]> = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (!last) out.push([s, e]);
    else if (s <= last[1]) last[1] = e > last[1] ? e : last[1];
    else out.push([s, e]);
  }
  return out;
}

function generateSessionsForRange(
  startHm: string,
  endHm: string,
  slotMinutes: number,
  breakMinutes: number,
): string[] {
  const start = hmToMinutes(startHm);
  const end = hmToMinutes(endHm);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const slot = Math.max(1, Math.trunc(slotMinutes));
  const step = Math.max(1, slot + Math.max(0, Math.trunc(breakMinutes)));

  const out: string[] = [];
  for (let t = start; t + slot <= end; t += step) {
    out.push(minutesToHm(t));
    if (out.length > 500) break;
  }
  return out;
}

function buildTemplateForDow(
  wh: ResourceWorkingHourDto[],
  dow: number,
): Pick<DayCell, 'rangeText' | 'sessions'> {
  const items = (wh || [])
    .filter((x) => Number((x as any).dow) === dow)
    .filter((x) => isActive01((x as any).is_active));

  if (!items.length) return { rangeText: '-', sessions: [] };

  const ranges = items
    .map((x) => [toHm((x as any).start_time), toHm((x as any).end_time)] as [string, string])
    .filter(([a, b]) => isValidHm(a) && isValidHm(b) && a < b);

  const merged = mergeRanges(ranges);
  const rangeText =
    merged.length && merged[0][0] && merged[merged.length - 1][1]
      ? `${merged[0][0]}–${merged[merged.length - 1][1]}`
      : '-';

  const all: string[] = [];
  for (const it of items) {
    all.push(
      ...generateSessionsForRange(
        toHm((it as any).start_time),
        toHm((it as any).end_time),
        Number((it as any).slot_minutes ?? 60),
        Number((it as any).break_minutes ?? 0),
      ),
    );
  }

  const sessions = Array.from(new Set(all))
    .filter((x) => isValidHm(x))
    .sort((a, b) => a.localeCompare(b));

  return { rangeText, sessions };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export const WeeklyPlanTable: React.FC<WeeklyPlanTableProps> = ({
  resourceId,
  workingHours,
  whLoading,
  whError,
  t,
}) => {
  const rid = safeStr(resourceId);

  // ✅ i18n DOW labels (from ui_appointment) + TR fallback
  const dowLabels = useMemo(() => buildDowLabels(t), [t]);

  // cache per therapist to avoid blinking
  const whCacheRef = useRef<Record<string, ResourceWorkingHourDto[]>>({});
  useEffect(() => {
    if (!rid) return;
    if (Array.isArray(workingHours) && workingHours.length > 0) {
      whCacheRef.current[rid] = workingHours;
    }
  }, [rid, workingHours]);

  const effectiveWh: ResourceWorkingHourDto[] = useMemo(() => {
    if (!rid) return [];
    if (Array.isArray(workingHours) && workingHours.length > 0) return workingHours;
    return whCacheRef.current[rid] || [];
  }, [rid, workingHours]);

  const cells = useMemo(() => {
    const map: Record<number, DayCell> = {};
    for (const dow of HEADER_DAYS) {
      const tpl = buildTemplateForDow(effectiveWh, dow);
      map[dow] = { dow, rangeText: tpl.rangeText, sessions: tpl.sessions };
    }
    return map;
  }, [effectiveWh]);

  if (!rid) {
    return (
      <div className="alert alert-light mb-0">
        {t('ui_appointment_weekly_pick_therapist', 'Select a therapist to view the weekly plan.')}
      </div>
    );
  }

  return (
    <div className="ens-weeklyPlanTable">
      {whError ? (
        <div className="alert alert-warning mb-0">
          {t('ui_appointment_weekly_wh_error', 'Working hours could not be loaded.')}
        </div>
      ) : null}

      {/* Desktop / Tablet: table */}
      <div className="ens-weeklyPlanDesktop">
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                {HEADER_DAYS.map((dow) => (
                  <th key={dow} className="text-center text-nowrap">
                    {dowLabels[dow] || String(dow)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                {HEADER_DAYS.map((dow) => {
                  const cell = cells[dow];
                  const rangeText = cell?.rangeText ?? '-';
                  const sessions = cell?.sessions ?? [];

                  return (
                    <td key={dow} className="text-center align-top">
                      <div className="ens-dayCell">
                        <div className="ens-range">{rangeText}</div>

                        {sessions.length ? (
                          <div className="ens-sessionGrid">
                            {sessions.map((tm) => (
                              <span key={tm} className="ens-chip">
                                {tm}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="ens-empty">-</div>
                        )}

                        {whLoading && rangeText === '-' ? (
                          <div className="ens-loading">
                            {t('ui_appointment_weekly_wh_loading', 'Loading...')}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Small screens: stacked layout */}
      <div className="ens-weeklyPlanMobile">
        <div className="ens-stack">
          {HEADER_DAYS.map((dow) => {
            const cell = cells[dow];
            const sessions = cell?.sessions ?? [];
            const rangeText = cell?.rangeText ?? '-';

            return (
              <div key={dow} className="ens-row">
                <div className="ens-day">
                  <div className="ens-dayName">{dowLabels[dow] || String(dow)}</div>
                  <div className="ens-dayRange">{rangeText}</div>
                </div>

                <div className="ens-times">
                  {sessions.length ? (
                    chunk(sessions, 4).map((line, idx) => (
                      <div key={idx} className="ens-timesLine">
                        {line.map((tm) => (
                          <span key={tm} className="ens-chip">
                            {tm}
                          </span>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="ens-empty">-</div>
                  )}

                  {whLoading && rangeText === '-' ? (
                    <div className="ens-loading">
                      {t('ui_appointment_weekly_wh_loading', 'Loading...')}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
