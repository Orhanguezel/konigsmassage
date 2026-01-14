// =============================================================
// FILE: src/modules/slider/controller.ts  (PUBLIC) [FINAL]
// =============================================================
import type { RouteHandler } from 'fastify';

import { publicListQuerySchema, idOrSlugParamSchema, type PublicListQuery } from './validation';
import { repoListPublic, repoGetBySlug, type RowWithAsset } from './repository';

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

function pickSupportedLocale(raw?: unknown): string | null {
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

/** FE SlideData (public) */
type SlideData = {
  id: string;
  title: string;
  description: string;
  image: string;
  alt?: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
  priority?: 'low' | 'medium' | 'high';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  locale: string;
};

const rowToPublic = (row: RowWithAsset): SlideData => {
  const base = row.sl;
  const t = row.i18n;
  const url = row.asset_url ?? base.image_url ?? '';

  return {
    id: String(base.id),
    title: t.name,
    description: t.description ?? '',
    image: url,
    alt: t.alt ?? undefined,
    buttonText: t.buttonText ?? 'İncele',
    buttonLink: t.buttonLink ?? '',
    isActive: !!base.is_active,
    order: base.display_order ?? 0,
    priority: base.featured ? 'high' : 'medium',
    showOnMobile: true,
    showOnDesktop: true,
    locale: t.locale,
  };
};

/** GET /sliders (public, sadece aktifler, locale + default_locale fallback) */
export const listPublicSlides: RouteHandler = async (req, reply) => {
  const parsed = publicListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_query', issues: parsed.error.flatten() },
    });
  }

  const q = parsed.data as PublicListQuery;
  const { locale, def } = await resolveLocalesPublic(req, {
    locale: (q as any).locale,
    default_locale: (q as any).default_locale,
  });

  const rows = await repoListPublic({
    ...q,
    locale,
    default_locale: def,
  } as any);

  return rows.map(rowToPublic);
};

/** GET /sliders/:idOrSlug?locale=tr&default_locale=de */
export const getPublicSlide: RouteHandler = async (req, reply) => {
  const v = idOrSlugParamSchema.safeParse(req.params);
  if (!v.success) {
    return reply.code(400).send({ error: { message: 'invalid_params' } });
  }

  const slug = v.data.idOrSlug;

  const q = (req.query ?? {}) as Record<string, unknown>;
  const { locale, def } = await resolveLocalesPublic(req, {
    locale: q.locale as any,
    default_locale: q.default_locale as any,
  });

  const row = await repoGetBySlug(slug, locale, def);
  if (!row || !row.sl?.is_active) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  return rowToPublic(row);
};
