// ===================================================================
// FILE: src/modules/faqs/validation.ts
// FINAL — NO category/sub_category
// - locale artık LIST query’de de destekli (RTK query ?locale=.. ile uyumlu)
// - LOCALES runtime değiştiği için LOCALE_SCHEMA "string + refine" ile yapılır
// ===================================================================

import { z } from 'zod';
import { isSupported, normalizeLocale } from '@/core/i18n';

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

/** runtime LOCALES ile uyumlu locale validator */
export const LOCALE_SCHEMA = z
  .string()
  .trim()
  .transform((v) => normalizeLocale(v) || '')
  .refine((v) => !!v && isSupported(v), 'unsupported_locale');

/** slug validator */
const SLUG = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug sadece küçük harf, rakam ve tire içermelidir')
  .trim();

/** LIST query (public/admin ortak) */
export const faqListQuerySchema = z.object({
  // Sıralama
  order: z.string().optional(), // "created_at.asc"
  sort: z.enum(['created_at', 'updated_at', 'display_order']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),

  // Paging
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  // Filtreler
  is_active: boolLike.optional(),
  q: z.string().optional(),
  slug: z.string().optional(),

  // Opt select
  select: z.string().optional(),

  // ✅ RTK uyumu: /admin/faqs?locale=de
  locale: LOCALE_SCHEMA.optional(),
});
export type FaqListQuery = z.infer<typeof faqListQuerySchema>;

/** Parent create/update (dil bağımsız) */
export const upsertFaqParentBodySchema = z.object({
  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional(),
});
export type UpsertFaqParentBody = z.infer<typeof upsertFaqParentBodySchema>;

export const patchFaqParentBodySchema = upsertFaqParentBodySchema.partial();
export type PatchFaqParentBody = z.infer<typeof patchFaqParentBodySchema>;

/** Translation (i18n) */
export const upsertFaqI18nBodySchema = z.object({
  locale: LOCALE_SCHEMA.optional(),
  question: z.string().min(1).max(500).trim(),
  answer: z.string().min(1),
  slug: SLUG,
});
export type UpsertFaqI18nBody = z.infer<typeof upsertFaqI18nBodySchema>;

export const patchFaqI18nBodySchema = z.object({
  locale: LOCALE_SCHEMA.optional(),
  question: z.string().min(1).max(500).trim().optional(),
  answer: z.string().min(1).optional(),
  slug: SLUG.optional(),
});
export type PatchFaqI18nBody = z.infer<typeof patchFaqI18nBodySchema>;

/** Backward-compatible: tek body */
export const upsertFaqBodySchema = z.object({
  // i18n
  question: z.string().min(1).max(500).trim(),
  answer: z.string().min(1),
  slug: SLUG,
  locale: LOCALE_SCHEMA.optional(),

  // parent
  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional(),
});
export type UpsertFaqBody = z.infer<typeof upsertFaqBodySchema>;

export const patchFaqBodySchema = z.object({
  // i18n
  question: z.string().min(1).max(500).trim().optional(),
  answer: z.string().min(1).optional(),
  slug: SLUG.optional(),
  locale: LOCALE_SCHEMA.optional(),

  // parent
  is_active: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).optional(),
});
export type PatchFaqBody = z.infer<typeof patchFaqBodySchema>;
