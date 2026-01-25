// =============================================================
// FILE: src/components/admin/site-settings/structured/BusinessHoursStructuredForm.tsx
// FINAL — Next 14 + TS strict friendly (no implicit any)
// - zod refine callback typed
// - seed/value normalization
// - removes unnecessary `any` casts
// =============================================================

'use client';

import React, { useMemo } from 'react';
import { z } from 'zod';

// -------------------------------------------
// Schema
// -------------------------------------------
const dayEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
type DayKey = z.infer<typeof dayEnum>;

const hhmm = z
  .string()
  .trim()
  .refine(
    (s: string) => /^\d{2}:\d{2}$/.test(s),
    'Saat formatı HH:MM olmalı (örn 09:00)',
  );

export const businessHourRowSchema = z
  .object({
    day: dayEnum,
    open: hhmm,
    close: hhmm,
    closed: z.boolean().default(false),
  })
  .strict();

export type BusinessHourRow = z.infer<typeof businessHourRowSchema>;

export const businessHoursSchema = z.array(businessHourRowSchema).default([]);

export type BusinessHoursFormState = z.infer<typeof businessHoursSchema>;

// -------------------------------------------
// Props
// -------------------------------------------
export type BusinessHoursStructuredFormProps = {
  value: unknown;
  onChange: (next: BusinessHoursFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: BusinessHoursFormState;
};

// -------------------------------------------
// Helpers
// -------------------------------------------
const DEFAULT_SEED: BusinessHoursFormState = [
  { day: 'mon', open: '09:00', close: '18:00', closed: false },
  { day: 'tue', open: '09:00', close: '18:00', closed: false },
  { day: 'wed', open: '09:00', close: '18:00', closed: false },
  { day: 'thu', open: '09:00', close: '18:00', closed: false },
  { day: 'fri', open: '09:00', close: '18:00', closed: false },
  { day: 'sat', open: '10:00', close: '14:00', closed: false },
  { day: 'sun', open: '00:00', close: '00:00', closed: true },
];

export function businessHoursObjToForm(
  v: unknown,
  seed: BusinessHoursFormState,
): BusinessHoursFormState {
  const base = Array.isArray(v) ? v : seed;
  const parsed = businessHoursSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function businessHoursFormToObj(s: BusinessHoursFormState): BusinessHoursFormState {
  // Ensures strict schema shape + defaults
  return businessHoursSchema.parse(
    (s ?? []).map((r: BusinessHourRow) => ({
      day: r.day,
      open: r.open,
      close: r.close,
      closed: Boolean(r.closed),
    })),
  );
}

// -------------------------------------------
// Component
// -------------------------------------------
export const BusinessHoursStructuredForm: React.FC<BusinessHoursStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const seedResolved = useMemo<BusinessHoursFormState>(() => {
    const base = Array.isArray(seed) && seed.length ? seed : DEFAULT_SEED;
    const parsed = businessHoursSchema.safeParse(base);
    return parsed.success ? parsed.data : DEFAULT_SEED;
  }, [seed]);

  const form = useMemo<BusinessHoursFormState>(() => {
    return businessHoursObjToForm(value, seedResolved);
  }, [value, seedResolved]);

  const dayLabel: Record<DayKey, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  };

  const setRow = (idx: number, patch: Partial<BusinessHourRow>) => {
    const next: BusinessHoursFormState = form.map((row: BusinessHourRow, i: number) =>
      i === idx ? ({ ...row, ...patch } as BusinessHourRow) : row,
    );
    onChange(next);
  };

  const addRow = () => {
    const next: BusinessHoursFormState = [
      ...(form ?? []),
      { day: 'mon', open: '09:00', close: '18:00', closed: false },
    ];
    onChange(next);
  };

  const removeRow = (idx: number) => {
    const next: BusinessHoursFormState = (form ?? []).filter((i: number) => i !== idx);
    onChange(next);
  };

  return (
    <div>
      <div className="alert alert-info small py-2">
        Saat formatı HH:MM. “Closed” seçilirse gün kapalıdır.
      </div>

      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th style={{ width: 160 }}>Gün</th>
              <th style={{ width: 160 }}>Açılış</th>
              <th style={{ width: 160 }}>Kapanış</th>
              <th style={{ width: 120 }}>Kapalı</th>
              <th className="text-end"> </th>
            </tr>
          </thead>
          <tbody>
            {form.map((r: BusinessHourRow, idx: number) => (
              <tr key={`${r.day}_${idx}`}>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={r.day}
                    onChange={(e) => setRow(idx, { day: e.target.value as DayKey })}
                    disabled={disabled}
                  >
                    {dayEnum.options.map((d: DayKey) => (
                      <option key={d} value={d}>
                        {dayLabel[d]}
                      </option>
                    ))}
                  </select>

                  {errors?.[`${idx}.day`] && (
                    <div className="text-danger small">{errors[`${idx}.day`]}</div>
                  )}
                </td>

                <td>
                  <input
                    className="form-control form-control-sm font-monospace"
                    value={r.open}
                    onChange={(e) => setRow(idx, { open: e.target.value })}
                    placeholder="09:00"
                    disabled={disabled || Boolean(r.closed)}
                  />
                  {errors?.[`${idx}.open`] && (
                    <div className="text-danger small">{errors[`${idx}.open`]}</div>
                  )}
                </td>

                <td>
                  <input
                    className="form-control form-control-sm font-monospace"
                    value={r.close}
                    onChange={(e) => setRow(idx, { close: e.target.value })}
                    placeholder="18:00"
                    disabled={disabled || Boolean(r.closed)}
                  />
                  {errors?.[`${idx}.close`] && (
                    <div className="text-danger small">{errors[`${idx}.close`]}</div>
                  )}
                </td>

                <td>
                  <label className="form-check small">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={Boolean(r.closed)}
                      onChange={(e) => setRow(idx, { closed: e.target.checked })}
                      disabled={disabled}
                    />
                    <span className="ms-1">closed</span>
                  </label>
                </td>

                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeRow(idx)}
                    disabled={disabled}
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {errors?.form && <div className="text-danger small">{errors.form}</div>}
      </div>

      <div className="d-flex justify-content-end">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={addRow}
          disabled={disabled}
        >
          Satır Ekle
        </button>
      </div>
    </div>
  );
};

BusinessHoursStructuredForm.displayName = 'BusinessHoursStructuredForm';
