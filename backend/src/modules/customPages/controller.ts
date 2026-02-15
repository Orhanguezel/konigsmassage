// =============================================================
// FILE: src/modules/customPages/controller.ts
// FINAL — query parse safe + locale resolution unchanged
// - category/subcategory kaldırıldı
// =============================================================

import type { RouteHandler } from 'fastify';
import { listCustomPages, getCustomPageMergedById, getCustomPageMergedBySlug } from './repository';
import {
  customPageBySlugParamsSchema,
  customPageBySlugQuerySchema,
  customPageListQuerySchema,
  type CustomPageListQuery,
} from './validation';
import { resolveRequestLocales, type LocaleQueryLike } from '@/modules/_shared';

export const listPages: RouteHandler<{ Querystring: CustomPageListQuery }> = async (req, reply) => {
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

  reply.header('x-total-count', String(total ?? 0));
  return reply.send(items);
};

export const getPage: RouteHandler<{
  Params: { id: string };
  Querystring?: LocaleQueryLike;
}> = async (req, reply) => {
  const { locale, def } = await resolveRequestLocales(req, req.query as any);

  const row = await getCustomPageMergedById(locale, def, req.params.id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(row);
};

export const getPageBySlug: RouteHandler<{
  Params: { slug: string };
  Querystring?: LocaleQueryLike;
}> = async (req, reply) => {
  const { slug } = customPageBySlugParamsSchema.parse(req.params ?? {});
  const parsedQ = customPageBySlugQuerySchema.safeParse(req.query ?? {});
  const q = parsedQ.success ? parsedQ.data : {};

  const { locale, def } = await resolveRequestLocales(req, {
    locale: q.locale,
    default_locale: q.default_locale,
  });

  const row = await getCustomPageMergedBySlug(locale, def, slug);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(row);
};
