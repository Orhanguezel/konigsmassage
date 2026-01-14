// =============================================================
// FILE: src/modules/customPages/controller.ts
// FINAL — query parse safe + locale resolution unchanged
// - category/subcategory kaldırıldı
// =============================================================

import type { RouteHandler } from 'fastify';
import { listCustomPages, getCustomPageMergedById, getCustomPageMergedBySlug } from './repository';
import { customPageBySlugParamsSchema, customPageBySlugQuerySchema } from './validation';

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

type ListQuery = {
  order?: string;
  sort?: 'created_at' | 'updated_at' | 'display_order' | 'order_num';
  orderDir?: 'asc' | 'desc';
  limit?: string | number;
  offset?: string | number;
  is_published?: '0' | '1' | 'true' | 'false';
  q?: string;
  slug?: string;

  module_key?: string;

  locale?: string;
  default_locale?: string;
};

export const listPages: RouteHandler<{ Querystring: ListQuery }> = async (req, reply) => {
  const q = (req.query ?? {}) as ListQuery;

  const limitNum = q.limit != null && q.limit !== '' ? Number(q.limit) : undefined;
  const offsetNum = q.offset != null && q.offset !== '' ? Number(q.offset) : undefined;

  const { locale, def } = await resolveLocales(req, {
    locale: q.locale,
    default_locale: q.default_locale,
  });

  const { items, total } = await listCustomPages({
    orderParam: typeof q.order === 'string' ? q.order : undefined,
    sort: q.sort,
    order: q.orderDir,
    limit: Number.isFinite(limitNum as number) ? (limitNum as number) : undefined,
    offset: Number.isFinite(offsetNum as number) ? (offsetNum as number) : undefined,
    is_published: q.is_published,
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
  Querystring?: { locale?: string; default_locale?: string };
}> = async (req, reply) => {
  const { locale, def } = await resolveLocales(req, req.query as any);

  const row = await getCustomPageMergedById(locale, def, req.params.id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(row);
};

export const getPageBySlug: RouteHandler<{
  Params: { slug: string };
  Querystring?: { locale?: string; default_locale?: string };
}> = async (req, reply) => {
  const { slug } = customPageBySlugParamsSchema.parse(req.params ?? {});
  const parsedQ = customPageBySlugQuerySchema.safeParse(req.query ?? {});
  const q = parsedQ.success ? parsedQ.data : {};

  const { locale, def } = await resolveLocales(req, {
    locale: q.locale,
    default_locale: q.default_locale,
  });

  const row = await getCustomPageMergedBySlug(locale, def, slug);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(row);
};
