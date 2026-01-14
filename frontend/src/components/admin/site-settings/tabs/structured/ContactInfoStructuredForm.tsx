
// =============================================================
// FILE: src/components/admin/site-settings/structured/ContactInfoStructuredForm.tsx
// =============================================================

"use client";

import React from "react";
import { z } from "zod";

export const contactInfoSchema = z
  .object({
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    address: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
  })
  .strict();

export type ContactInfoFormState = z.infer<typeof contactInfoSchema>;

export type ContactInfoStructuredFormProps = {
  value: any;
  onChange: (next: ContactInfoFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: ContactInfoFormState;
};

const safeObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

export function contactObjToForm(v: any, seed: ContactInfoFormState): ContactInfoFormState {
  const base = safeObj(v) || seed;
  const parsed = contactInfoSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function contactFormToObj(s: ContactInfoFormState) {
  return contactInfoSchema.parse({
    phone: s.phone?.trim() || "",
    email: s.email?.trim() || "",
    address: s.address?.trim() || "",
    whatsapp: s.whatsapp?.trim() || "",
  });
}

export const ContactInfoStructuredForm: React.FC<ContactInfoStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const s = (seed || { phone: "", email: "", address: "", whatsapp: "" }) as ContactInfoFormState;
  const form = contactObjToForm(value, s);

  return (
    <div>
      <div className="alert alert-info small py-2">
        İletişim bilgileri. Boş bırakılan alanlar frontend’de boş string olarak kaydedilir.
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small">Telefon</label>
          <input
            className="form-control form-control-sm"
            value={form.phone || ""}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            disabled={disabled}
          />
          {errors?.phone && <div className="text-danger small">{errors.phone}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label small">E-posta</label>
          <input
            className="form-control form-control-sm"
            value={form.email || ""}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            disabled={disabled}
          />
          {errors?.email && <div className="text-danger small">{errors.email}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label small">WhatsApp</label>
          <input
            className="form-control form-control-sm"
            value={form.whatsapp || ""}
            onChange={(e) => onChange({ ...form, whatsapp: e.target.value })}
            disabled={disabled}
          />
          {errors?.whatsapp && <div className="text-danger small">{errors.whatsapp}</div>}
        </div>

        <div className="col-12">
          <label className="form-label small">Adres</label>
          <textarea
            className="form-control form-control-sm"
            rows={3}
            value={form.address || ""}
            onChange={(e) => onChange({ ...form, address: e.target.value })}
            disabled={disabled}
          />
          {errors?.address && <div className="text-danger small">{errors.address}</div>}
        </div>
      </div>
    </div>
  );
};

ContactInfoStructuredForm.displayName = "ContactInfoStructuredForm";
