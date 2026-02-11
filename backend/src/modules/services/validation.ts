// src/modules/services/validation.ts
// =============================================================
// FINAL — Services validation (NO category/sub_category)
// =============================================================

import { z } from 'zod';

/* ------- shared ------- */
export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

/**
 * Locale doğrulaması (ASYNC olamaz, DB okuyamaz)
 * Bu yüzden burada sadece format kontrolü yapıyoruz.
 * Gerçek "destekli mi?" kontrolü controller'da runtime LOCALES üzerinden yapılır.
 */
const LOCALE_SCHEMA = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-zA-Z]{2,3}([_-][a-zA-Z0-9]{2,8})?$/, 'invalid_locale');

/* ------- enums ------- */
const SERVICE_TYPES = [
  'massage',
  'facial',
  'body_treatment',
  'scrub',
  'pack',
  'wellness',
  'other',
] as const;

export const ServiceTypeEnum = z.enum(SERVICE_TYPES);

/* ------- list (public/admin) ------- */
export const serviceListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at', 'display_order']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  // filters
  q: z.string().optional(),
  type: ServiceTypeEnum.optional(),

  featured: boolLike.optional(),
  is_active: boolLike.optional(),

  // i18n (statik enum yok)
  locale: LOCALE_SCHEMA.optional(),
  default_locale: LOCALE_SCHEMA.optional(),
});
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;

/* ------- parent (non-i18n) ------- */
export const upsertServiceParentBodySchema = z.object({
  type: ServiceTypeEnum.optional().default('other'),

  featured: boolLike.optional().default(false),
  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional().default(1),

  // cover (legacy + storage)
  featured_image: z.string().url().max(500).nullable().optional(),
  image_url: z.string().url().max(500).nullable().optional(),
  image_asset_id: z.string().length(36).nullable().optional(),

  // technical fields (non-i18n)
  area: z.string().max(255).nullable().optional(),
  duration: z.string().max(255).nullable().optional(),
  maintenance: z.string().max(255).nullable().optional(),
  season: z.string().max(255).nullable().optional(),
  thickness: z.string().max(255).nullable().optional(),
  equipment: z.string().max(255).nullable().optional(),
});
export type UpsertServiceParentBody = z.infer<typeof upsertServiceParentBodySchema>;

export const patchServiceParentBodySchema = upsertServiceParentBodySchema.partial();
export type PatchServiceParentBody = z.infer<typeof patchServiceParentBodySchema>;

/* ------- i18n (service) ------- */
export const upsertServiceI18nBodySchema = z.object({
  locale: LOCALE_SCHEMA.optional(),

  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug sadece küçük harf, rakam ve tire içermelidir')
    .optional(),

  description: z.string().optional(),
  material: z.string().max(255).optional(),
  price: z.string().max(128).optional(),
  includes: z.string().max(255).optional(),
  warranty: z.string().max(128).optional(),
  image_alt: z.string().max(255).optional(),

  tags: z.string().max(255).optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
  meta_keywords: z.string().max(255).optional(),

  /** create: aynı içeriği tüm dillere kopyala? (default: true) */
  replicate_all_locales: z.coerce.boolean().default(true).optional(),
});
export type UpsertServiceI18nBody = z.infer<typeof upsertServiceI18nBodySchema>;

export const patchServiceI18nBodySchema = z.object({
  locale: LOCALE_SCHEMA.optional(),

  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug sadece küçük harf, rakam ve tire içermelidir')
    .optional(),

  description: z.string().optional(),
  material: z.string().max(255).optional(),
  price: z.string().max(128).optional(),
  includes: z.string().max(255).optional(),
  warranty: z.string().max(128).optional(),
  image_alt: z.string().max(255).optional(),

  tags: z.string().max(255).optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
  meta_keywords: z.string().max(255).optional(),

  /** patch: tüm dillere uygula? (default: false) */
  apply_all_locales: z.coerce.boolean().default(false).optional(),
});
export type PatchServiceI18nBody = z.infer<typeof patchServiceI18nBodySchema>;

/* ------- combined (service) ------- */
export const upsertServiceBodySchema = upsertServiceParentBodySchema.merge(
  upsertServiceI18nBodySchema,
);
export type UpsertServiceBody = z.infer<typeof upsertServiceBodySchema>;

export const patchServiceBodySchema = patchServiceParentBodySchema.merge(
  patchServiceI18nBodySchema,
);
export type PatchServiceBody = z.infer<typeof patchServiceBodySchema>;

/* ------- images (gallery) ------- */
const upsertServiceImageBodyBase = z.object({
  image_asset_id: z.string().length(36).nullable().optional(),
  image_url: z.string().url().max(500).nullable().optional(),

  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional().default(0),

  title: z.string().max(255).nullable().optional(),
  alt: z.string().max(255).nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  locale: LOCALE_SCHEMA.optional(),

  replicate_all_locales: z.coerce.boolean().default(true).optional(),
  apply_all_locales: z.coerce.boolean().default(false).optional(),
});

export const upsertServiceImageBodySchema = upsertServiceImageBodyBase.superRefine((b, ctx) => {
  if (!b.image_asset_id && !b.image_url) {
    ctx.addIssue({
      code: 'custom',
      message: 'image_asset_id_or_url_required',
      path: ['image_asset_id'],
    });
  }
});
export type UpsertServiceImageBody = z.infer<typeof upsertServiceImageBodySchema>;

export const patchServiceImageBodySchema = upsertServiceImageBodyBase.partial();
export type PatchServiceImageBody = z.infer<typeof patchServiceImageBodySchema>;
