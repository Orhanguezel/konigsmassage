// ===================================================================
// FILE: src/modules/footerSections/validation.ts
// ===================================================================

import { z } from "zod";
import { LOCALES } from "@/core/i18n";

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal("0"),
  z.literal("1"),
  z.literal("true"),
  z.literal("false"),
]);

const LOCALE_ENUM = z.enum(LOCALES as unknown as [string, ...string[]]);

/* ----------------------- LIST QUERY ----------------------- */

export const footerSectionListQuerySchema = z.object({
  order: z.string().optional(), // "display_order.asc" | "created_at.desc" vs.
  sort: z.enum(["display_order", "created_at", "updated_at"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  is_active: boolLike.optional(),
  q: z.string().optional(),
  slug: z.string().optional(),
});

export type FooterSectionListQuery = z.infer<
  typeof footerSectionListQuerySchema
>;

/* ------------------- Parent create/update ------------------ */

export const upsertFooterSectionParentBodySchema = z.object({
  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional(),
});
export type UpsertFooterSectionParentBody = z.infer<
  typeof upsertFooterSectionParentBodySchema
>;
export const patchFooterSectionParentBodySchema =
  upsertFooterSectionParentBodySchema.partial();
export type PatchFooterSectionParentBody = z.infer<
  typeof patchFooterSectionParentBodySchema
>;

/* ------------------- i18n create/update -------------------- */

export const upsertFooterSectionI18nBodySchema = z.object({
  locale: LOCALE_ENUM.optional(),
  title: z.string().min(1).max(150).trim(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "slug sadece küçük harf, rakam ve tire içermelidir",
    )
    .trim(),
  description: z.string().max(10000).optional().nullable(),
});
export type UpsertFooterSectionI18nBody = z.infer<
  typeof upsertFooterSectionI18nBodySchema
>;

export const patchFooterSectionI18nBodySchema = z.object({
  locale: LOCALE_ENUM.optional(),
  title: z.string().min(1).max(150).trim().optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "slug sadece küçük harf, rakam ve tire içermelidir",
    )
    .trim()
    .optional(),
  description: z.string().max(10000).optional().nullable(),
});
export type PatchFooterSectionI18nBody = z.infer<
  typeof patchFooterSectionI18nBodySchema
>;

/* ------------------- Legacy combined body ------------------ */

export const upsertFooterSectionBodySchema = z.object({
  // i18n
  title: z.string().min(1).max(150).trim(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "slug sadece küçük harf, rakam ve tire içermelidir",
    )
    .trim(),
  description: z.string().max(10000).optional().nullable(),
  locale: LOCALE_ENUM.optional(),

  // parent
  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional(),
});
export type UpsertFooterSectionBody = z.infer<
  typeof upsertFooterSectionBodySchema
>;

export const patchFooterSectionBodySchema = z.object({
  // i18n
  title: z.string().min(1).max(150).trim().optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "slug sadece küçük harf, rakam ve tire içermelidir",
    )
    .trim()
    .optional(),
  description: z.string().max(10000).optional().nullable(),
  locale: LOCALE_ENUM.optional(),

  // parent
  is_active: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).optional(),
});
export type PatchFooterSectionBody = z.infer<
  typeof patchFooterSectionBodySchema
>;
