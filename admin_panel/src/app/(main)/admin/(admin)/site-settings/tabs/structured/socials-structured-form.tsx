
// =============================================================
// FILE: src/components/admin/site-settings/structured/SocialsStructuredForm.tsx
// =============================================================

"use client";

import React from "react";
import { z } from "zod";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          Sosyal linkleri tam URL (https://...) veya kullanıcı adı olarak girebilirsin.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map(([k, label]) => (
          <div className="space-y-2" key={k}>
            <Label htmlFor={`social-${k}`} className="text-sm">{label}</Label>
            <Input
              id={`social-${k}`}
              className="h-8"
              value={(form as any)[k] || ""}
              onChange={(e) => onChange({ ...(form as any), [k]: e.target.value })}
              disabled={disabled}
            />
            {errors?.[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

SocialsStructuredForm.displayName = "SocialsStructuredForm";
