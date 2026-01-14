// =============================================================
// FILE: src/modules/customPages/validation.ts
// FINAL — module_key parent'ta, LONGTEXT JSON-string columns ile uyumlu
// - images/storage_image_ids: array OR JSON-string OR null
// - URL/UUID validation tutarlı
// - category/subcategory kaldırıldı
// =============================================================

import { z } from 'zod';
import { normalizeLocale } from '@/core/i18n';

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

const LOCALE_LIKE = z
  .string()
  .trim()
  .min(1)
  .transform((s) => normalizeLocale(s) || s.toLowerCase());

const UUID36 = z.string().length(36);
const URL2000 = z.string().trim().max(2000).url('Geçersiz URL');

const SLUG = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug sadece küçük harf, rakam ve tire içermelidir')
  .trim();

const MODULE_KEY = z.string().trim().min(1).max(100);

/** JSON-string veya array kabul eden helper */
function parseJsonArrayString(input: string): string[] {
  const s = input.trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x ?? '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

const UrlArrayLike = z
  .union([z.array(URL2000), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return parseJsonArrayString(val);
    return null;
  })
  .refine((v) => v === null || Array.isArray(v), 'images formatı geçersiz');

const UuidArrayLike = z
  .union([z.array(UUID36), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return parseJsonArrayString(val);
    return null;
  })
  .refine((v) => v === null || Array.isArray(v), 'storage_image_ids formatı geçersiz');

/** LIST query (public/admin ortak) */
export const customPageListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at', 'display_order', 'order_num']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  is_published: boolLike.optional(),
  q: z.string().optional(),
  slug: z.string().optional(),
  select: z.string().optional(),

  /** parent filter */
  module_key: MODULE_KEY.optional(),

  locale: LOCALE_LIKE.optional(),
  default_locale: LOCALE_LIKE.optional(),
});

export type CustomPageListQuery = z.infer<typeof customPageListQuerySchema>;

/** Parent (dil-bağımsız) create/update */
export const upsertCustomPageParentBodySchema = z.object({
  module_key: MODULE_KEY.optional(),

  is_published: boolLike.optional().default(false),

  featured_image: URL2000.nullable().optional(),
  featured_image_asset_id: UUID36.nullable().optional(),

  display_order: z.coerce.number().int().min(0).optional(),
  order_num: z.coerce.number().int().min(0).optional(),

  image_url: URL2000.nullable().optional(),
  storage_asset_id: UUID36.nullable().optional(),

  /** ✅ array OR JSON-string OR null */
  images: UrlArrayLike.optional(),
  storage_image_ids: UuidArrayLike.optional(),
});

export type UpsertCustomPageParentBody = z.infer<typeof upsertCustomPageParentBodySchema>;

export const patchCustomPageParentBodySchema = upsertCustomPageParentBodySchema.partial();
export type PatchCustomPageParentBody = z.infer<typeof patchCustomPageParentBodySchema>;

/** i18n create/update */
export const upsertCustomPageI18nBodySchema = z.object({
  locale: LOCALE_LIKE.optional(),

  title: z.string().min(1).max(255).trim(),
  slug: SLUG,

  /** content: HTML string (server packContent ile JSON-string'e çeviriyor) */
  content: z.string().min(1),

  summary: z.string().max(1000).nullable().optional(),
  featured_image_alt: z.string().max(255).nullable().optional(),

  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),

  tags: z.string().max(1000).nullable().optional(),
});

export type UpsertCustomPageI18nBody = z.infer<typeof upsertCustomPageI18nBodySchema>;

export const patchCustomPageI18nBodySchema = z.object({
  locale: LOCALE_LIKE.optional(),

  title: z.string().min(1).max(255).trim().optional(),
  slug: SLUG.optional(),

  content: z.string().min(1).optional(),

  summary: z.string().max(1000).nullable().optional(),
  featured_image_alt: z.string().max(255).nullable().optional(),

  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),

  tags: z.string().max(1000).nullable().optional(),
});

export type PatchCustomPageI18nBody = z.infer<typeof patchCustomPageI18nBodySchema>;

/** Backward-compatible: tek body */
export const upsertCustomPageBodySchema = upsertCustomPageI18nBodySchema.extend({
  module_key: MODULE_KEY.optional(),

  is_published: boolLike.optional().default(false),

  featured_image: URL2000.nullable().optional(),
  featured_image_asset_id: UUID36.nullable().optional(),

  display_order: z.coerce.number().int().min(0).optional(),
  order_num: z.coerce.number().int().min(0).optional(),

  image_url: URL2000.nullable().optional(),
  storage_asset_id: UUID36.nullable().optional(),

  /** ✅ array OR JSON-string OR null */
  images: UrlArrayLike.optional(),
  storage_image_ids: UuidArrayLike.optional(),
});

export type UpsertCustomPageBody = z.infer<typeof upsertCustomPageBodySchema>;

export const patchCustomPageBodySchema = patchCustomPageI18nBodySchema.extend({
  module_key: MODULE_KEY.optional(),

  is_published: boolLike.optional(),

  featured_image: URL2000.nullable().optional(),
  featured_image_asset_id: UUID36.nullable().optional(),

  display_order: z.coerce.number().int().min(0).optional(),
  order_num: z.coerce.number().int().min(0).optional(),

  image_url: URL2000.nullable().optional(),
  storage_asset_id: UUID36.nullable().optional(),

  /** ✅ array OR JSON-string OR null */
  images: UrlArrayLike.optional(),
  storage_image_ids: UuidArrayLike.optional(),
});

export type PatchCustomPageBody = z.infer<typeof patchCustomPageBodySchema>;

/** BY-SLUG params */
export const customPageBySlugParamsSchema = z.object({
  slug: z.string().min(1),
});

/** BY-SLUG query */
export const customPageBySlugQuerySchema = z.object({
  locale: LOCALE_LIKE.optional(),
  default_locale: LOCALE_LIKE.optional(),
});

export type CustomPageBySlugParams = z.infer<typeof customPageBySlugParamsSchema>;
export type CustomPageBySlugQuery = z.infer<typeof customPageBySlugQuerySchema>;
