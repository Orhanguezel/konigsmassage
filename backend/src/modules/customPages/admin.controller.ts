// =============================================================
// FILE: src/modules/customPages/admin.controller.ts
// FINAL — module_key parent + LONGTEXT JSON-string arrays (images/storage_image_ids)
// - category/subcategory kaldırıldı
// =============================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';

import {
  listCustomPages,
  getCustomPageMergedById,
  getCustomPageMergedBySlug,
  createCustomPageParent,
  upsertCustomPageI18n,
  updateCustomPageParent,
  deleteCustomPageParent,
  getCustomPageI18nRow,
  packContent,
  reorderCustomPages,
} from './repository';

import {
  customPageListQuerySchema,
  customPageBySlugQuerySchema,
  upsertCustomPageBodySchema,
  patchCustomPageBodySchema,
  type CustomPageListQuery,
  type UpsertCustomPageBody,
  type PatchCustomPageBody,
} from './validation';

import { setContentRange } from '@/common/utils/contentRange';

import {
  LOCALES,
  DEFAULT_LOCALE,
  normalizeLocale,
  ensureLocalesLoadedFromSettings,
} from '@/core/i18n';

type LocaleCode = string;
type LocaleQueryLike = { locale?: string; default_locale?: string };

const toBool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

function normalizeLooseLocale(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return normalizeLocale(s) || s.toLowerCase();
}

function pickSafeDefault(): string {
  const base = normalizeLocale(DEFAULT_LOCALE) || DEFAULT_LOCALE || 'de';
  if (LOCALES.includes(base)) return base;
  return LOCALES[0] || 'de';
}

async function resolveLocales(
  req: any,
  query?: LocaleQueryLike,
): Promise<{ locale: LocaleCode; def: LocaleCode }> {
  await ensureLocalesLoadedFromSettings();

  const q = query ?? ((req.query ?? {}) as LocaleQueryLike);

  const reqRaw = normalizeLooseLocale(q.locale) ?? normalizeLooseLocale(req.locale);
  const defRawFromQuery = normalizeLooseLocale(q.default_locale);

  const safeDefault = pickSafeDefault();
  const safeLocale = reqRaw && LOCALES.includes(reqRaw) ? reqRaw : safeDefault;
  const safeDef =
    defRawFromQuery && LOCALES.includes(defRawFromQuery) ? defRawFromQuery : safeDefault;

  return { locale: safeLocale, def: safeDef };
}

const normalizeArrayPatch = (v: unknown): string[] | undefined => {
  // undefined => do not touch
  if (typeof v === 'undefined') return undefined;
  // null => clear
  if (v === null) return [];
  // array => keep
  if (Array.isArray(v)) return v.map((x) => String(x ?? '')).filter(Boolean);
  // otherwise ignore
  return undefined;
};

/* ----------------------------- list/get ----------------------------- */

export const listPagesAdmin: RouteHandler<{ Querystring: CustomPageListQuery }> = async (
  req,
  reply,
) => {
  const parsed = customPageListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_query', issues: parsed.error.issues },
    });
  }

  const q = parsed.data;

  const { locale, def } = await resolveLocales(req, {
    locale: q.locale,
    default_locale: q.default_locale,
  });

  const { items, total } = await listCustomPages({
    orderParam: typeof q.order === 'string' ? q.order : undefined,
    sort: q.sort,
    order: q.orderDir,
    limit: q.limit,
    offset: q.offset,
    is_published: q.is_published,
    q: q.q,
    slug: q.slug,
    module_key: q.module_key,
    locale,
    defaultLocale: def,
  });

  const offset = q.offset ?? 0;
  const limit = q.limit ?? items.length ?? 0;

  setContentRange(reply, offset, limit, total);
  reply.header('x-total-count', String(total ?? 0));
  return reply.send(items);
};

export const getPageAdmin: RouteHandler<{
  Params: { id: string };
  Querystring?: LocaleQueryLike;
}> = async (req, reply) => {
  const { locale, def } = await resolveLocales(req, req.query as any);

  const row = await getCustomPageMergedById(locale, def, req.params.id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(row);
};

export const getPageBySlugAdmin: RouteHandler<{
  Params: { slug: string };
  Querystring?: LocaleQueryLike;
}> = async (req, reply) => {
  const parsedQ = customPageBySlugQuerySchema.safeParse(req.query ?? {});
  const q = parsedQ.success ? parsedQ.data : {};

  const { locale, def } = await resolveLocales(req, {
    locale: q.locale,
    default_locale: q.default_locale,
  });

  const row = await getCustomPageMergedBySlug(locale, def, req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(row);
};

/* ----------------------------- create/update/delete ----------------------------- */

export const createPageAdmin: RouteHandler<{ Body: UpsertCustomPageBody }> = async (req, reply) => {
  const parsed = upsertCustomPageBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.issues },
    });
  }
  const b = parsed.data;

  const { locale: primaryLocale, def } = await resolveLocales(req, {
    locale: (b as any).locale,
    default_locale: (b as any).default_locale,
  });

  try {
    const id = randomUUID();
    const now = new Date();

    // ✅ Parent insert: only include fields intentionally (avoid undefined leakage)
    const parentValues: Record<string, any> = {
      id,

      module_key: typeof (b as any).module_key === 'string' ? (b as any).module_key.trim() : '',

      is_published: toBool(b.is_published) ? 1 : 0,

      display_order: typeof b.display_order !== 'undefined' ? (b.display_order as number) : 0,
      order_num: typeof b.order_num !== 'undefined' ? (b.order_num as number) : 0,

      created_at: now as any,
      updated_at: now as any,
    };

    if (typeof b.featured_image !== 'undefined')
      parentValues.featured_image = b.featured_image ?? null;
    if (typeof b.featured_image_asset_id !== 'undefined')
      parentValues.featured_image_asset_id = b.featured_image_asset_id ?? null;

    if (typeof b.image_url !== 'undefined') parentValues.image_url = b.image_url ?? null;
    if (typeof b.storage_asset_id !== 'undefined')
      parentValues.storage_asset_id = b.storage_asset_id ?? null;

    // ✅ arrays (LONGTEXT JSON-string columns): schema expects string[]
    if (typeof (b as any).images !== 'undefined') parentValues.images = (b as any).images ?? [];
    if (typeof (b as any).storage_image_ids !== 'undefined')
      parentValues.storage_image_ids = (b as any).storage_image_ids ?? [];

    await createCustomPageParent(parentValues as any);

    const basePayload = {
      title: b.title.trim(),
      slug: b.slug.trim(),
      content: packContent(b.content),

      summary: typeof b.summary === 'string' ? b.summary.trim() : b.summary ?? null,
      featured_image_alt:
        typeof b.featured_image_alt === 'string'
          ? b.featured_image_alt.trim()
          : b.featured_image_alt ?? null,
      meta_title: typeof b.meta_title === 'string' ? b.meta_title.trim() : b.meta_title ?? null,
      meta_description:
        typeof b.meta_description === 'string'
          ? b.meta_description.trim()
          : b.meta_description ?? null,
      tags: typeof b.tags === 'string' ? b.tags.trim() : b.tags ?? null,
    };

    await upsertCustomPageI18n(id, primaryLocale, basePayload);

    // fallback düzgün çalışsın diye default locale’a kopyala
    if (primaryLocale !== def) {
      await upsertCustomPageI18n(id, def, basePayload);
    }

    const row = await getCustomPageMergedById(primaryLocale, def, id);
    return reply.code(201).send(row);
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'slug_already_exists' } });
    }
    req.log.error({ err }, 'custom_pages_create_failed');
    return reply.code(500).send({ error: { message: 'custom_pages_create_failed' } });
  }
};

export const updatePageAdmin: RouteHandler<{
  Params: { id: string };
  Body: PatchCustomPageBody;
}> = async (req, reply) => {
  const parsed = patchCustomPageBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.issues },
    });
  }
  const b = parsed.data;

  const { locale, def } = await resolveLocales(req, {
    locale: (b as any).locale,
    default_locale: (b as any).default_locale,
  });

  try {
    const parentPatch: Record<string, any> = {};

    // ✅ module_key patch
    if (typeof (b as any).module_key !== 'undefined') {
      const mk = typeof (b as any).module_key === 'string' ? (b as any).module_key.trim() : '';
      parentPatch.module_key = mk;
    }

    if (typeof b.is_published !== 'undefined')
      parentPatch.is_published = toBool(b.is_published) ? 1 : 0;

    if (typeof b.featured_image !== 'undefined')
      parentPatch.featured_image = b.featured_image ?? null;
    if (typeof b.featured_image_asset_id !== 'undefined')
      parentPatch.featured_image_asset_id = b.featured_image_asset_id ?? null;

    if (typeof b.display_order !== 'undefined')
      parentPatch.display_order = b.display_order as number;
    if (typeof b.order_num !== 'undefined') parentPatch.order_num = b.order_num as number;

    if (typeof b.image_url !== 'undefined') parentPatch.image_url = b.image_url ?? null;
    if (typeof b.storage_asset_id !== 'undefined')
      parentPatch.storage_asset_id = b.storage_asset_id ?? null;

    // ✅ arrays
    const imagesPatch = normalizeArrayPatch((b as any).images);
    if (typeof imagesPatch !== 'undefined') parentPatch.images = imagesPatch;

    const storageIdsPatch = normalizeArrayPatch((b as any).storage_image_ids);
    if (typeof storageIdsPatch !== 'undefined') parentPatch.storage_image_ids = storageIdsPatch;

    if (Object.keys(parentPatch).length > 0) {
      await updateCustomPageParent(req.params.id, parentPatch as any);
    }

    const hasI18nFields =
      typeof b.title !== 'undefined' ||
      typeof b.slug !== 'undefined' ||
      typeof b.content !== 'undefined' ||
      typeof b.summary !== 'undefined' ||
      typeof b.featured_image_alt !== 'undefined' ||
      typeof b.meta_title !== 'undefined' ||
      typeof b.meta_description !== 'undefined' ||
      typeof b.tags !== 'undefined';

    if (hasI18nFields) {
      const existing = await getCustomPageI18nRow(req.params.id, locale);

      if (!existing) {
        if (!b.title || !b.slug || !b.content) {
          return reply
            .code(400)
            .send({ error: { message: 'missing_required_translation_fields' } });
        }

        await upsertCustomPageI18n(req.params.id, locale, {
          title: b.title.trim(),
          slug: b.slug.trim(),
          content: packContent(b.content),

          summary: typeof b.summary === 'string' ? b.summary.trim() : b.summary ?? null,
          featured_image_alt:
            typeof b.featured_image_alt === 'string'
              ? b.featured_image_alt.trim()
              : b.featured_image_alt ?? null,
          meta_title: typeof b.meta_title === 'string' ? b.meta_title.trim() : b.meta_title ?? null,
          meta_description:
            typeof b.meta_description === 'string'
              ? b.meta_description.trim()
              : b.meta_description ?? null,
          tags: typeof b.tags === 'string' ? b.tags.trim() : b.tags ?? null,
        });
      } else {
        await upsertCustomPageI18n(req.params.id, locale, {
          title: typeof b.title === 'string' ? b.title.trim() : undefined,
          slug: typeof b.slug === 'string' ? b.slug.trim() : undefined,
          content: typeof b.content === 'string' ? packContent(b.content) : undefined,

          summary:
            typeof b.summary !== 'undefined'
              ? typeof b.summary === 'string'
                ? b.summary.trim()
                : b.summary ?? null
              : undefined,

          featured_image_alt:
            typeof b.featured_image_alt !== 'undefined'
              ? typeof b.featured_image_alt === 'string'
                ? b.featured_image_alt.trim()
                : b.featured_image_alt ?? null
              : undefined,

          meta_title:
            typeof b.meta_title !== 'undefined'
              ? typeof b.meta_title === 'string'
                ? b.meta_title.trim()
                : b.meta_title ?? null
              : undefined,

          meta_description:
            typeof b.meta_description !== 'undefined'
              ? typeof b.meta_description === 'string'
                ? b.meta_description.trim()
                : b.meta_description ?? null
              : undefined,

          tags:
            typeof b.tags !== 'undefined'
              ? typeof b.tags === 'string'
                ? b.tags.trim()
                : b.tags ?? null
              : undefined,
        });
      }
    }

    const row = await getCustomPageMergedById(locale, def, req.params.id);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(row);
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'slug_already_exists' } });
    }
    req.log.error({ err }, 'custom_pages_update_failed');
    return reply.code(500).send({ error: { message: 'custom_pages_update_failed' } });
  }
};

export const removePageAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteCustomPageParent(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.code(204).send();
};

export const reorderCustomPagesAdmin: RouteHandler<{
  Body: { items?: { id?: string; display_order?: number }[] };
}> = async (req, reply) => {
  const body = (req.body ?? {}) as { items?: { id?: string; display_order?: number }[] };

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return reply.code(400).send({
      error: { message: 'invalid_body', detail: 'items boş olamaz' },
    });
  }

  const normalized = body.items
    .map((item) => ({
      id: String(item.id ?? '').trim(),
      display_order: typeof item.display_order === 'number' ? item.display_order : 0,
    }))
    .filter((x) => x.id.length > 0);

  if (!normalized.length) {
    return reply.code(400).send({
      error: { message: 'invalid_body', detail: 'geçerli id bulunamadı' },
    });
  }

  await reorderCustomPages(normalized);
  return reply.code(204).send();
};
