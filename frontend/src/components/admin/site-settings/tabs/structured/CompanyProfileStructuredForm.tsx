// =============================================================
// FILE: src/components/admin/site-settings/structured/CompanyProfileStructuredForm.tsx
// =============================================================

'use client';

import React from 'react';
import { z } from 'zod';

export const companyProfileSchema = z
  .object({
    company_name: z.string().trim().optional(),
    slogan: z.string().trim().optional(),
    about: z.string().trim().optional(),
  })
  .strict();

export type CompanyProfileFormState = z.infer<typeof companyProfileSchema>;

export type CompanyProfileStructuredFormProps = {
  value: any;
  onChange: (next: CompanyProfileFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: CompanyProfileFormState;
};

const safeObj = (v: any) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

export function companyObjToForm(v: any, seed: CompanyProfileFormState): CompanyProfileFormState {
  const base = safeObj(v) || seed;
  const parsed = companyProfileSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function companyFormToObj(s: CompanyProfileFormState) {
  return companyProfileSchema.parse({
    company_name: s.company_name?.trim() || '',
    slogan: s.slogan?.trim() || '',
    about: s.about?.trim() || '',
  });
}

export const CompanyProfileStructuredForm: React.FC<CompanyProfileStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const s = (seed || {
    company_name: 'konigsmassage',
    slogan: '',
    about: '',
  }) as CompanyProfileFormState;
  const form = companyObjToForm(value, s);

  return (
    <div>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small">Şirket Adı</label>
          <input
            className="form-control form-control-sm"
            value={form.company_name || ''}
            onChange={(e) => onChange({ ...form, company_name: e.target.value })}
            disabled={disabled}
          />
          {errors?.company_name && <div className="text-danger small">{errors.company_name}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label small">Slogan</label>
          <input
            className="form-control form-control-sm"
            value={form.slogan || ''}
            onChange={(e) => onChange({ ...form, slogan: e.target.value })}
            disabled={disabled}
          />
          {errors?.slogan && <div className="text-danger small">{errors.slogan}</div>}
        </div>

        <div className="col-12">
          <label className="form-label small">Hakkımızda</label>
          <textarea
            className="form-control form-control-sm"
            rows={6}
            value={form.about || ''}
            onChange={(e) => onChange({ ...form, about: e.target.value })}
            disabled={disabled}
          />
          {errors?.about && <div className="text-danger small">{errors.about}</div>}
        </div>
      </div>
    </div>
  );
};

CompanyProfileStructuredForm.displayName = 'CompanyProfileStructuredForm';
