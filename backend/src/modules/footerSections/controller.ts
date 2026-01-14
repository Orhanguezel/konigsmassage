// ===================================================================
// FILE: src/modules/footerSections/controller.ts (PUBLIC)
// ===================================================================

import type { RouteHandler } from 'fastify';
import { DEFAULT_LOCALE } from '@/core/i18n';
import {
  listFooterSections,
  getFooterSectionMergedById,
  getFooterSectionMergedBySlug,
} from './repository';
import { footerSectionListQuerySchema, type FooterSectionListQuery } from './validation';

/** Yardımcı: istekten locale çıkar (query > req.locale > DEFAULT_LOCALE) */
function resolveLocale(req: any, qLocale?: string | null): string {
  const fromQuery = (qLocale || (req.query as any)?.locale) as string | undefined;

  const cleanedQuery = fromQuery?.split(',')[0].trim().toLowerCase();
  if (cleanedQuery) return cleanedQuery;

  const fromReq = (req as any).locale as string | undefined;
  if (fromReq && fromReq.trim()) return fromReq.trim().toLowerCase();

  return (DEFAULT_LOCALE || 'de').toLowerCase();
}

/** LIST (public) */
export const listFooterSectionsPublic: RouteHandler<{
  Querystring: FooterSectionListQuery & { locale?: string };
}> = async (req, reply) => {
  const parsed = footerSectionListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_query', issues: parsed.error.issues },
    });
  }
  const q = parsed.data;

  const effectiveLocale = resolveLocale(req, (q as any).locale);
  const defaultLocale = (DEFAULT_LOCALE || 'de').toLowerCase();

  const { items, total } = await listFooterSections({
    ...q,
    locale: effectiveLocale,
    defaultLocale,
  });

  reply.header('x-total-count', String(total ?? 0));
  return reply.send(items);
};

/** GET BY ID (public) */
export const getFooterSectionPublic: RouteHandler<{
  Params: { id: string };
  Querystring: { locale?: string };
}> = async (req, reply) => {
  const effectiveLocale = resolveLocale(req, (req.query as any)?.locale);
  const defaultLocale = (DEFAULT_LOCALE || 'de').toLowerCase();

  const row = await getFooterSectionMergedById(effectiveLocale, defaultLocale, req.params.id);
  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }
  return reply.send(row);
};

/** GET BY SLUG (public) */
export const getFooterSectionBySlugPublic: RouteHandler<{
  Params: { slug: string };
  Querystring: { locale?: string };
}> = async (req, reply) => {
  const effectiveLocale = resolveLocale(req, (req.query as any)?.locale);
  const defaultLocale = (DEFAULT_LOCALE || 'de').toLowerCase();

  const row = await getFooterSectionMergedBySlug(effectiveLocale, defaultLocale, req.params.slug);
  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }
  return reply.send(row);
};
