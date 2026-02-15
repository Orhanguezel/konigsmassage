// =============================================================
// FILE: src/modules/customPages/admin.controller.ts
// FINAL — module_key parent + LONGTEXT JSON-string arrays (images/storage_image_ids)
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
import { packContent, resolveRequestLocales, toBool, type LocaleQueryLike } from '@/modules/_shared';

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

  const { locale, def } = await resolveRequestLocales(req, {
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
    featured: q.featured,
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
  const { locale, def } = await resolveRequestLocales(req, req.query as any);

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

  const { locale, def } = await resolveRequestLocales(req, {
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

  const { locale: primaryLocale, def } = await resolveRequestLocales(req, {
    locale: (b as any).locale,
    default_locale: (b as any).default_locale,
  });

  try {
    const id = randomUUID();
    const now = new Date();

    // ✅ Parent insert
    const parentValues: Record<string, any> = {
      id,
      module_key: b.module_key ?? '',

      is_published: toBool(b.is_published) ? 1 : 0,
      featured: toBool(b.featured) ? 1 : 0,

      display_order: b.display_order ?? 0,
      order_num: b.order_num ?? 0,

      featured_image: b.featured_image ?? null,
      featured_image_asset_id: b.featured_image_asset_id ?? null,
      
      image_url: b.image_url ?? null,
      storage_asset_id: b.storage_asset_id ?? null,
      
      images: b.images ?? [],
      storage_image_ids: b.storage_image_ids ?? [],

      created_at: now,
      updated_at: now,
    };

    await createCustomPageParent(parentValues as any);

    const basePayload = {
      title: b.title,
      slug: b.slug,
      content: packContent(b.content),

      summary: b.summary ?? null,
      featured_image_alt: b.featured_image_alt ?? null,
      meta_title: b.meta_title ?? null,
      meta_description: b.meta_description ?? null,
      tags: b.tags ?? null,
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

  const { locale, def } = await resolveRequestLocales(req, {
    locale: b.locale,
    default_locale: (b as any).default_locale, // validation schema might not have default_locale in body, but logic allows it
  });

  try {
    const parentPatch: Record<string, any> = {};

    if (b.module_key !== undefined) parentPatch.module_key = b.module_key;
    if (b.is_published !== undefined) parentPatch.is_published = toBool(b.is_published) ? 1 : 0;
    if (b.featured !== undefined) parentPatch.featured = toBool(b.featured) ? 1 : 0;
    
    if (b.featured_image !== undefined) parentPatch.featured_image = b.featured_image ?? null;
    if (b.featured_image_asset_id !== undefined) parentPatch.featured_image_asset_id = b.featured_image_asset_id ?? null;
    
    if (b.display_order !== undefined) parentPatch.display_order = b.display_order;
    if (b.order_num !== undefined) parentPatch.order_num = b.order_num;
    
    if (b.image_url !== undefined) parentPatch.image_url = b.image_url ?? null;
    if (b.storage_asset_id !== undefined) parentPatch.storage_asset_id = b.storage_asset_id ?? null;

    if (b.images !== undefined) parentPatch.images = b.images ?? [];
    if (b.storage_image_ids !== undefined) parentPatch.storage_image_ids = b.storage_image_ids ?? [];

    if (Object.keys(parentPatch).length > 0) {
      await updateCustomPageParent(req.params.id, parentPatch as any);
    }

    const hasI18nFields =
      b.title !== undefined ||
      b.slug !== undefined ||
      b.content !== undefined ||
      b.summary !== undefined ||
      b.featured_image_alt !== undefined ||
      b.meta_title !== undefined ||
      b.meta_description !== undefined ||
      b.tags !== undefined;

    if (hasI18nFields) {
      const existing = await getCustomPageI18nRow(req.params.id, locale);

      if (!existing) {
        if (!b.title || !b.slug || !b.content) {
          return reply
            .code(400)
            .send({ error: { message: 'missing_required_translation_fields' } });
        }

        await upsertCustomPageI18n(req.params.id, locale, {
          title: b.title,
          slug: b.slug,
          content: packContent(b.content),
          summary: b.summary ?? null,
          featured_image_alt: b.featured_image_alt ?? null,
          meta_title: b.meta_title ?? null,
          meta_description: b.meta_description ?? null,
          tags: b.tags ?? null,
        });
      } else {
        await upsertCustomPageI18n(req.params.id, locale, {
          title: b.title,
          slug: b.slug,
          content: b.content ? packContent(b.content) : undefined,
          summary: b.summary,
          featured_image_alt: b.featured_image_alt,
          meta_title: b.meta_title,
          meta_description: b.meta_description,
          tags: b.tags,
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
