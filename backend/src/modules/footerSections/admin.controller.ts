// ===================================================================
// FILE: src/modules/footerSections/admin.controller.ts
// FIX:
//  - DEFAULT_LOCALE kaldırıldı (statik yok)
//  - defaultLocale DB’den okunuyor (site_settings.default_locale, locale='*')
//  - locale: öncelik -> query/body locale > req.locale > db defaultLocale
//  - locale normalize: de-DE -> de
// ===================================================================

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { normalizeLocale } from "@/core/i18n";

import {
  listFooterSections,
  getFooterSectionMergedById,
  getFooterSectionMergedBySlug,
  createFooterSectionParent,
  updateFooterSectionParent,
  deleteFooterSectionParent,
  upsertFooterSectionI18n,
  getFooterSectionI18nRow,
} from "./repository";

import {
  footerSectionListQuerySchema,
  upsertFooterSectionBodySchema,
  patchFooterSectionBodySchema,
  type FooterSectionListQuery,
  type UpsertFooterSectionBody,
  type PatchFooterSectionBody,
} from "./validation";

// ✅ dinamik default_locale için siteSettings service
import {
  getDefaultLocale as getDefaultLocaleFromSiteSettings,
  PREFERRED_FALLBACK_LOCALE,
} from "@/modules/siteSettings/service";

const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

/** de-DE -> de, TR -> tr */
function normalizeLooseLocale(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;

  // normalizeLocale senin core/i18n fonksiyonun; yoksa lower fallback
  const norm = normalizeLocale(s) || s.toLowerCase();

  // normalizeLocale "de-de" döndürürse prefix al
  const out = norm.includes("-") ? norm.split("-")[0] : norm;
  return out || null;
}

/** default_locale DB’den */
async function getDbDefaultLocale(): Promise<string> {
  const raw = await getDefaultLocaleFromSiteSettings(null);
  const norm = normalizeLooseLocale(raw);
  return norm || PREFERRED_FALLBACK_LOCALE || "de";
}

/**
 * Admin request için locale çöz:
 * - explicit (query/body) > req.locale > db default_locale
 */
async function resolveLocales(req: any): Promise<{ locale: string; defaultLocale: string }> {
  const defaultLocale = await getDbDefaultLocale();

  const qLocale = normalizeLooseLocale(req?.query?.locale);
  const bLocale = normalizeLooseLocale(req?.body?.locale);
  const reqLocale = normalizeLooseLocale(req?.locale);

  const locale = bLocale || qLocale || reqLocale || defaultLocale;

  return { locale, defaultLocale };
}

/** LIST (admin) – coalesced */
export const listFooterSectionsAdmin: RouteHandler = async (req, reply) => {
  const parsed = footerSectionListQuerySchema.safeParse(
    (req.query ?? {}) as FooterSectionListQuery,
  );

  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: "invalid_query", issues: parsed.error.issues },
    });
  }

  const q = parsed.data;

  const { locale, defaultLocale } = await resolveLocales(req as any);

  // ✅ locale artık statik değil
  const { items, total } = await listFooterSections({
    ...q,
    locale,
    defaultLocale,
  });

  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** GET BY ID (admin) – coalesced */
export const getFooterSectionAdmin: RouteHandler = async (req, reply) => {
  const { id } = (req.params ?? {}) as { id: string };

  const { locale, defaultLocale } = await resolveLocales(req as any);

  const row = await getFooterSectionMergedById(locale, defaultLocale, id);
  if (!row) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }
  return reply.send(row);
};

/** GET BY SLUG (admin) – coalesced */
export const getFooterSectionBySlugAdmin: RouteHandler = async (req, reply) => {
  const { slug } = (req.params ?? {}) as { slug: string };

  const { locale, defaultLocale } = await resolveLocales(req as any);

  const row = await getFooterSectionMergedBySlug(locale, defaultLocale, slug);
  if (!row) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }
  return reply.send(row);
};

/** CREATE (admin) */
export const createFooterSectionAdmin: RouteHandler = async (req, reply) => {
  const parsed = upsertFooterSectionBodySchema.safeParse(
    (req.body ?? {}) as UpsertFooterSectionBody,
  );
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: "invalid_body", issues: parsed.error.issues },
    });
  }

  const b = parsed.data;

  // ✅ locale çöz: body.locale > query.locale > req.locale > db default_locale
  const { locale, defaultLocale } = await resolveLocales(req as any);

  try {
    const id = randomUUID();
    const now = new Date() as any;

    await createFooterSectionParent({
      id,
      is_active: toBool(b.is_active) ? 1 : 0,
      display_order: typeof b.display_order === "number" ? b.display_order : 0,
      created_at: now,
      updated_at: now,
    });

    await upsertFooterSectionI18n(id, locale, {
      title: b.title.trim(),
      slug: b.slug.trim(),
      description:
        typeof b.description === "string" ? b.description : b.description ?? null,
    });

    const row = await getFooterSectionMergedById(locale, defaultLocale, id);
    return reply.code(201).send(row);
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "footer_sections_create_failed");
    return reply.code(500).send({ error: { message: "footer_sections_create_failed" } });
  }
};

/** UPDATE (admin, partial) */
export const updateFooterSectionAdmin: RouteHandler = async (req, reply) => {
  const { id } = (req.params ?? {}) as { id: string };

  const parsed = patchFooterSectionBodySchema.safeParse(
    (req.body ?? {}) as PatchFooterSectionBody,
  );
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: "invalid_body", issues: parsed.error.issues },
    });
  }

  const b = parsed.data;

  // ✅ locale çöz (patch body locale gelirse o locale translation patch’ler)
  const { locale, defaultLocale } = await resolveLocales(req as any);

  try {
    // parent patch
    if (typeof b.is_active !== "undefined" || typeof b.display_order !== "undefined") {
      await updateFooterSectionParent(id, {
        is_active:
          typeof b.is_active !== "undefined" ? (toBool(b.is_active) ? 1 : 0) : undefined,
        display_order: typeof b.display_order === "number" ? b.display_order : undefined,
      } as any);
    }

    // i18n patch
    const hasI18nFields =
      typeof b.title !== "undefined" ||
      typeof b.slug !== "undefined" ||
      typeof b.description !== "undefined";

    if (hasI18nFields) {
      const exists = await getFooterSectionI18nRow(id, locale);

      if (!exists) {
        // yeni translation ekleniyorsa title+slug şart
        if (!b.title || !b.slug) {
          return reply.code(400).send({
            error: { message: "missing_required_translation_fields" },
          });
        }

        await upsertFooterSectionI18n(id, locale, {
          title: b.title!.trim(),
          slug: b.slug!.trim(),
          description:
            typeof b.description === "string" ? b.description : b.description ?? null,
        });
      } else {
        await upsertFooterSectionI18n(id, locale, {
          title: typeof b.title === "string" ? b.title.trim() : undefined,
          slug: typeof b.slug === "string" ? b.slug.trim() : undefined,
          description:
            typeof b.description !== "undefined" ? (b.description ?? null) : undefined,
        });
      }
    }

    const row = await getFooterSectionMergedById(locale, defaultLocale, id);
    if (!row) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }
    return reply.send(row);
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "footer_sections_update_failed");
    return reply.code(500).send({ error: { message: "footer_sections_update_failed" } });
  }
};

/** DELETE (admin) */
export const removeFooterSectionAdmin: RouteHandler = async (req, reply) => {
  const { id } = (req.params ?? {}) as { id: string };

  const affected = await deleteFooterSectionParent(id);
  if (!affected) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }
  return reply.code(204).send();
};
