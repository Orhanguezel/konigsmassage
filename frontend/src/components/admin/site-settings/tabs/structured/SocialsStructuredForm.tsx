
// =============================================================
// FILE: src/components/admin/site-settings/structured/SocialsStructuredForm.tsx
// =============================================================

"use client";

import React from "react";
import { z } from "zod";

export const socialsSchema = z
  .object({
    instagram: z.string().trim().optional(),
    facebook: z.string().trim().optional(),
    linkedin: z.string().trim().optional(),
    youtube: z.string().trim().optional(),
    x: z.string().trim().optional(),
  })
  .strict();

export type SocialsFormState = z.infer<typeof socialsSchema>;

export type SocialsStructuredFormProps = {
  value: any;
  onChange: (next: SocialsFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: SocialsFormState;
};

const safeObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

export function socialsObjToForm(v: any, seed: SocialsFormState): SocialsFormState {
  const base = safeObj(v) || seed;
  const parsed = socialsSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function socialsFormToObj(s: SocialsFormState) {
  return socialsSchema.parse({
    instagram: s.instagram?.trim() || "",
    facebook: s.facebook?.trim() || "",
    linkedin: s.linkedin?.trim() || "",
    youtube: s.youtube?.trim() || "",
    x: s.x?.trim() || "",
  });
}

export const SocialsStructuredForm: React.FC<SocialsStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const s =
    (seed || { instagram: "", facebook: "", linkedin: "", youtube: "", x: "" }) as SocialsFormState;
  const form = socialsObjToForm(value, s);

  const fields = [
    ["instagram", "Instagram"],
    ["facebook", "Facebook"],
    ["linkedin", "LinkedIn"],
    ["youtube", "YouTube"],
    ["x", "X (Twitter)"],
  ] as const;

  return (
    <div>
      <div className="alert alert-info small py-2">
        Sosyal linkleri tam URL (https://...) veya kullanıcı adı olarak girebilirsin.
      </div>

      <div className="row g-3">
        {fields.map(([k, label]) => (
          <div className="col-md-6" key={k}>
            <label className="form-label small">{label}</label>
            <input
              className="form-control form-control-sm"
              value={(form as any)[k] || ""}
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

SocialsStructuredForm.displayName = "SocialsStructuredForm";
