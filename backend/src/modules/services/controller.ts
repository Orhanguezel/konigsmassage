// src/modules/services/controller.ts
// =============================================================
// FINAL — Public Services Controller (NO category/sub_category)
// =============================================================

import type { RouteHandler } from 'fastify';

import { serviceListQuerySchema, type ServiceListQuery } from './validation';
import {
  listServices,
  getServiceMergedById,
  getServiceMergedBySlug,
  listServiceImages,
} from './repository';

import {
  LOCALES,
  DEFAULT_LOCALE,
  normalizeLocale,
  ensureLocalesLoadedFromSettings,
} from '@/core/i18n';

type LocaleCode = string;
type LocaleQueryLike = { locale?: string; default_locale?: string };

function normalizeLooseLocale(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return normalizeLocale(s) || s.toLowerCase();
}

function pickSupportedLocale(raw?: string | null): string | null {
  const n = normalizeLooseLocale(raw);
  if (!n) return null;
  return LOCALES.includes(n) ? n : null;
}

async function resolveLocalesPublic(
  req: any,
  query?: LocaleQueryLike,
): Promise<{ locale: LocaleCode; def: LocaleCode }> {
  await ensureLocalesLoadedFromSettings();

  const q = query ?? ((req.query ?? {}) as LocaleQueryLike);

  const reqCandidate = pickSupportedLocale(q.locale) || pickSupportedLocale(req.locale) || null;
  const defCandidate = pickSupportedLocale(q.default_locale) || null;

  const safeDefault =
    defCandidate ||
    (LOCALES.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : null) ||
    (LOCALES[0] ?? 'de');

  const safeLocale = reqCandidate || safeDefault;

  return { locale: safeLocale, def: safeDefault };
}

/* ----------------------------- LIST (PUBLIC) ----------------------------- */

export const listServicesPublic: RouteHandler<{ Querystring: ServiceListQuery }> = async (
  req,
  reply,
) => {
  const parsed = serviceListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'invalid_query', issues: parsed.error.issues } });
  }

  const q = parsed.data;
  const { locale, def } = await resolveLocalesPublic(req, {
    locale: q.locale,
    default_locale: q.default_locale,
  });

  // Public default: aktif kayıtlar
  const isActive = typeof q.is_active === 'undefined' ? true : q.is_active;

  const { items, total } = await listServices({
    locale,
    defaultLocale: def,
    orderParam: typeof q.order === 'string' ? q.order : undefined,
    sort: q.sort,
    order: q.orderDir,
    limit: q.limit,
    offset: q.offset,
    q: q.q,
    type: q.type,
    featured: q.featured,
    is_active: isActive,
  });

  reply.header('x-total-count', String(total ?? 0));
  return reply.send(items);
};

/* ----------------------------- GET BY ID (PUBLIC) ----------------------------- */

export const getServicePublic: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { locale, def } = await resolveLocalesPublic(req);

  const row = await getServiceMergedById(locale, def, req.params.id);
  if (!row || row.is_active !== 1) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  return reply.send(row);
};

/* ----------------------------- GET BY SLUG (PUBLIC) ----------------------------- */

export const getServiceBySlugPublic: RouteHandler<{ Params: { slug: string } }> = async (
  req,
  reply,
) => {
  const { locale, def } = await resolveLocalesPublic(req);

  const row = await getServiceMergedBySlug(locale, def, req.params.slug);
  if (!row || row.is_active !== 1) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  return reply.send(row);
};

/* ----------------------------- IMAGES (PUBLIC) ----------------------------- */

export const listServiceImagesPublic: RouteHandler<{ Params: { id: string } }> = async (
  req,
  reply,
) => {
  const { locale, def } = await resolveLocalesPublic(req);

  const rows = await listServiceImages({
    serviceId: req.params.id,
    locale,
    defaultLocale: def,
    onlyActive: true,
  });

  return reply.send(rows);
};
