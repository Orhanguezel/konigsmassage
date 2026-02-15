// =============================================================
// FILE: src/modules/customPages/validation.ts
// FINAL — module_key parent'ta, LONGTEXT JSON-string columns ile uyumlu
// =============================================================

import { z } from 'zod';
import {
  boolLike,
  LOCALE_LIKE,
  UUID36,
  URL2000,
  SLUG,
  UrlArrayLike,
  UuidArrayLike,
} from '@/modules/_shared';

const MODULE_KEY = z.string().trim().min(1).max(100);

/** LIST query (public/admin ortak) */
export const customPageListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at', 'display_order', 'order_num']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  is_published: boolLike.optional(),
  featured: boolLike.optional(),
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
  featured: boolLike.optional().default(false),

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
  featured: boolLike.optional().default(false),

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
  featured: boolLike.optional(),

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
