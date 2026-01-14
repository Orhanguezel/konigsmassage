// =============================================================
// FILE: src/components/admin/site-settings/structured/UiHeaderStructuredForm.tsx
// =============================================================

'use client';

import React from 'react';
import { z } from 'zod';

export const uiHeaderSchema = z
  .object({
    nav_home: z.string().trim().optional(),
    nav_products: z.string().trim().optional(),
    nav_services: z.string().trim().optional(),
    nav_contact: z.string().trim().optional(),
    cta_label: z.string().trim().optional(),
  })
  .strict();

export type UiHeaderFormState = z.infer<typeof uiHeaderSchema>;

export type UiHeaderStructuredFormProps = {
  value: any;
  onChange: (next: UiHeaderFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: UiHeaderFormState;
};

const safeObj = (v: any) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

export function uiHeaderObjToForm(v: any, seed: UiHeaderFormState): UiHeaderFormState {
  const base = safeObj(v) || seed;
  const parsed = uiHeaderSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function uiHeaderFormToObj(s: UiHeaderFormState) {
  return uiHeaderSchema.parse({
    nav_home: s.nav_home?.trim() || '',
    nav_products: s.nav_products?.trim() || '',
    nav_services: s.nav_services?.trim() || '',
    nav_contact: s.nav_contact?.trim() || '',
    cta_label: s.cta_label?.trim() || '',
  });
}

export const UiHeaderStructuredForm: React.FC<UiHeaderStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const s = (seed || {
    nav_home: 'Home',
    nav_products: 'Products',
    nav_services: 'Services',
    nav_contact: 'Contact',
    cta_label: 'Get Offer',
  }) as UiHeaderFormState;

  const form = uiHeaderObjToForm(value, s);

  const fields = [
    ['nav_home', 'Menü: Home'],
    ['nav_products', 'Menü: Products'],
    ['nav_services', 'Menü: Services'],
    ['nav_contact', 'Menü: Contact'],
    ['cta_label', 'CTA Label'],
  ] as const;

  return (
    <div>
      <div className="alert alert-info small py-2">
        Header navigasyon ve CTA label metinleri. Dil bazlı override için locale satırı kullan.
      </div>

      <div className="row g-3">
        {fields.map(([k, label]) => (
          <div className="col-md-6" key={k}>
            <label className="form-label small">{label}</label>
            <input
              className="form-control form-control-sm"
              value={(form as any)[k] || ''}
              onChange={(e) => onChange({ ...(form as any), [k]: e.target.value })}
              disabled={disabled}
            />
            {errors?.[k] && <div className="text-danger small">{errors[k]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

UiHeaderStructuredForm.displayName = 'UiHeaderStructuredForm';
