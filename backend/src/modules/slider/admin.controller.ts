// =============================================================
// FILE: src/modules/slider/admin.controller.ts
// Slider – admin controller (core/i18n runtime locale aware) [FINAL]
// =============================================================
import type { RouteHandler } from 'fastify';

import {
  adminListQuerySchema,
  idParamSchema,
  createSchema,
  updateSchema,
  reorderSchema,
  setStatusSchema,
  setImageSchema,
  type AdminListQuery,
  type CreateBody,
  type UpdateBody,
  type SetImageBody,
} from './validation';

import {
  repoListAdmin,
  repoGetById,
  repoCreate,
  repoUpdate,
  repoDelete,
  repoReorder,
  repoSetStatus,
  repoSetImage,
  type RowWithAsset,
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

function pickSupportedLocale(raw?: unknown): string | null {
  const n = normalizeLooseLocale(raw);
  if (!n) return null;
  return LOCALES.includes(n) ? n : null;
}

async function resolveLocales(
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

const toAdminView = (row: RowWithAsset) => {
  const base = row.sl;
  const t = row.i18n;

  return {
    id: base.id,
    uuid: base.uuid,

    locale: t.locale,
    name: t.name,
    slug: t.slug,
    description: t.description ?? null,

    image_url: base.image_url ?? null,
    image_asset_id: base.image_asset_id ?? null,
    image_effective_url: row.asset_url ?? base.image_url ?? null,

    alt: t.alt ?? null,
    buttonText: t.buttonText ?? null,
    buttonLink: t.buttonLink ?? null,

    featured: !!base.featured,
    is_active: !!base.is_active,
    display_order: base.display_order,

    created_at: base.created_at,
    updated_at: base.updated_at,
  };
};

/** GET /admin/sliders */
export const adminListSlides: RouteHandler = async (req, reply) => {
  const parsed = adminListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_query', issues: parsed.error.flatten() },
    });
  }

  const q = parsed.data as AdminListQuery;
  const { locale, def } = await resolveLocales(req, {
    locale: q.locale,
    default_locale: q.default_locale,
  });

  const rows = await repoListAdmin({ ...q, locale, default_locale: def } as any);
  return rows.map(toAdminView);
};

/** GET /admin/sliders/:id?locale=tr&default_locale=de */
export const adminGetSlide: RouteHandler = async (req, reply) => {
  const v = idParamSchema.safeParse(req.params);
  if (!v.success) return reply.code(400).send({ error: { message: 'invalid_params' } });

  const q = (req.query ?? {}) as Record<string, unknown>;
  const { locale, def } = await resolveLocales(req, {
    locale: q.locale as any,
    default_locale: q.default_locale as any,
  });

  const row = await repoGetById(v.data.id, locale, def);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return toAdminView(row);
};

/** POST /admin/sliders */
export const adminCreateSlide: RouteHandler = async (req, reply) => {
  const b = createSchema.safeParse(req.body);
  if (!b.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: b.error.flatten() },
    });
  }

  const { locale } = await resolveLocales(req, { locale: (b.data as any).locale });

  try {
    const created = await repoCreate(b.data as CreateBody, locale);
    return reply.code(201).send(toAdminView(created));
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'slug_locale_already_exists' } });
    }
    (req as any).log?.error?.({ err }, 'slider_create_failed');
    return reply.code(500).send({ error: { message: 'slider_create_failed' } });
  }
};

/** PATCH /admin/sliders/:id */
export const adminUpdateSlide: RouteHandler = async (req, reply) => {
  const p = idParamSchema.safeParse(req.params);
  if (!p.success) return reply.code(400).send({ error: { message: 'invalid_params' } });

  const b = updateSchema.safeParse(req.body);
  if (!b.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: b.error.flatten() },
    });
  }

  const { locale, def } = await resolveLocales(req, { locale: (b.data as any).locale });

  try {
    const updated = await repoUpdate(p.data.id, b.data as UpdateBody, locale, def);
    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });
    return toAdminView(updated);
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'slug_locale_already_exists' } });
    }
    (req as any).log?.error?.({ err }, 'slider_update_failed');
    return reply.code(500).send({ error: { message: 'slider_update_failed' } });
  }
};

/** DELETE /admin/sliders/:id */
export const adminDeleteSlide: RouteHandler = async (req, reply) => {
  const p = idParamSchema.safeParse(req.params);
  if (!p.success) return reply.code(400).send({ error: { message: 'invalid_params' } });

  await repoDelete(p.data.id);
  return reply.send({ ok: true });
};

/** POST /admin/sliders/reorder */
export const adminReorderSlides: RouteHandler = async (req, reply) => {
  const b = reorderSchema.safeParse(req.body);
  if (!b.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: b.error.flatten() },
    });
  }
  await repoReorder(b.data.ids);
  return reply.send({ ok: true });
};

/** POST /admin/sliders/:id/status */
export const adminSetStatus: RouteHandler = async (req, reply) => {
  const p = idParamSchema.safeParse(req.params);
  if (!p.success) return reply.code(400).send({ error: { message: 'invalid_params' } });

  const b = setStatusSchema.safeParse(req.body);
  if (!b.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: b.error.flatten() },
    });
  }

  const { locale, def } = await resolveLocales(req);
  const updated = await repoSetStatus(p.data.id, b.data.is_active, locale, def);
  if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });

  return toAdminView(updated);
};

/** PATCH /admin/sliders/:id/image */
export const adminSetSliderImage: RouteHandler = async (req, reply) => {
  const p = idParamSchema.safeParse(req.params);
  if (!p.success) return reply.code(400).send({ error: { message: 'invalid_params' } });

  const b = setImageSchema.safeParse(req.body);
  if (!b.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: b.error.flatten() },
    });
  }

  const { locale, def } = await resolveLocales(req);
  const updated = await repoSetImage(p.data.id, b.data as SetImageBody, locale, def);

  if (!updated) {
    return reply.code(404).send({ error: { message: 'not_found_or_asset_missing' } });
  }

  return toAdminView(updated);
};
