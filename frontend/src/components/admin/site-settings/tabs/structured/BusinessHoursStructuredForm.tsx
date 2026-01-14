// =============================================================
// FILE: src/components/admin/site-settings/structured/BusinessHoursStructuredForm.tsx
// =============================================================

'use client';

import React from 'react';
import { z } from 'zod';

const dayEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
const hhmm = z
  .string()
  .trim()
  .refine((s) => /^\d{2}:\d{2}$/.test(s), 'Saat formatı HH:MM olmalı (örn 09:00)');

export const businessHourRowSchema = z
  .object({
    day: dayEnum,
    open: hhmm,
    close: hhmm,
    closed: z.boolean().default(false),
  })
  .strict();

export const businessHoursSchema = z.array(businessHourRowSchema).default([]);

export type BusinessHoursFormState = z.infer<typeof businessHoursSchema>;

export type BusinessHoursStructuredFormProps = {
  value: any;
  onChange: (next: BusinessHoursFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: BusinessHoursFormState;
};

export function businessHoursObjToForm(
  v: any,
  seed: BusinessHoursFormState,
): BusinessHoursFormState {
  const base = Array.isArray(v) ? v : seed;
  const parsed = businessHoursSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function businessHoursFormToObj(s: BusinessHoursFormState) {
  return businessHoursSchema.parse(
    (s || []).map((r) => ({
      day: r.day,
      open: r.open,
      close: r.close,
      closed: !!r.closed,
    })),
  );
}

export const BusinessHoursStructuredForm: React.FC<BusinessHoursStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const s = (seed ||
    ([
      { day: 'mon', open: '09:00', close: '18:00', closed: false },
      { day: 'tue', open: '09:00', close: '18:00', closed: false },
      { day: 'wed', open: '09:00', close: '18:00', closed: false },
      { day: 'thu', open: '09:00', close: '18:00', closed: false },
      { day: 'fri', open: '09:00', close: '18:00', closed: false },
      { day: 'sat', open: '10:00', close: '14:00', closed: false },
      { day: 'sun', open: '00:00', close: '00:00', closed: true },
    ] as any)) as BusinessHoursFormState;

  const form = businessHoursObjToForm(value, s);

  const dayLabel: Record<string, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  };

  const setRow = (idx: number, patch: Partial<(typeof form)[number]>) => {
    const next = [...form];
    next[idx] = { ...next[idx], ...patch } as any;
    onChange(next);
  };

  const addRow = () => {
    onChange([
      ...(form || []),
      { day: 'mon', open: '09:00', close: '18:00', closed: false } as any,
    ]);
  };

  const removeRow = (idx: number) => {
    const next = [...form];
    next.splice(idx, 1);
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
            {form.map((r, idx) => (
              <tr key={`${r.day}_${idx}`}>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={r.day}
                    onChange={(e) => setRow(idx, { day: e.target.value as any })}
                    disabled={disabled}
                  >
                    {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((d) => (
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
                    disabled={disabled || !!r.closed}
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
                    disabled={disabled || !!r.closed}
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
                      checked={!!r.closed}
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
