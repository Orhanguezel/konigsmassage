// src/modules/siteSettings/controller.ts

import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { eq, like, inArray, asc, and } from "drizzle-orm";
import { siteSettings } from "./schema";
import { normalizeLocale } from "@/core/i18n";

import { buildLocaleFallbackChain,getAppLocalesMeta, getEffectiveDefaultLocale } from "@/modules/siteSettings/service";

function parseDbValue(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function rowToDto(r: typeof siteSettings.$inferSelect) {
  return {
    id: r.id,
    key: r.key,
    locale: r.locale,
    value: parseDbValue(r.value),
    created_at: (r as any).created_at?.toISOString?.(),
    updated_at: (r as any).updated_at?.toISOString?.(),
  };
}

function normalizeLooseLocale(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return normalizeLocale(s) || s.toLowerCase();
}

// GET /site_settings?locale=de&prefix=foo
export const listSiteSettings: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    locale?: string;
    prefix?: string;
    key?: string;
    key_in?: string;
    order?: string;
    limit?: string | number;
    offset?: string | number;
  };

  const requested = normalizeLooseLocale(q.locale) ?? normalizeLooseLocale((req as any).locale);
  const fallbacks = await buildLocaleFallbackChain({ requested });

  const conds: any[] = [];
  if (q.prefix) conds.push(like(siteSettings.key, `${q.prefix}%`));
  if (q.key) conds.push(eq(siteSettings.key, q.key));
  if (q.key_in) {
    const keys = q.key_in
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (keys.length) conds.push(inArray(siteSettings.key, keys));
  }

  const rows = await db
    .select()
    .from(siteSettings)
    .where(conds.length ? ((conds.length === 1 ? conds[0] : and(...conds)) as any) : undefined)
    .orderBy(asc(siteSettings.key));

  const map = new Map<string, any>();
  const uniqueKeys = Array.from(new Set(rows.map((r) => r.key)));

  for (const k of uniqueKeys) {
    const cands = rows.filter((r) => r.key === k);
    const byLocale = new Map(cands.map((r) => [r.locale, r]));

    for (const l of fallbacks) {
      const r = byLocale.get(l);
      if (r) {
        map.set(k, rowToDto(r));
        break;
      }
    }
  }

  return reply.send(Array.from(map.values()));
};

// GET /site_settings/:key?locale=de
export const getSiteSettingByKey: RouteHandler = async (req, reply) => {
  const { key } = req.params as { key: string };
  const qLocale = (req.query as any)?.locale as string | undefined;

  const requested = normalizeLooseLocale(qLocale) ?? normalizeLooseLocale((req as any).locale);
  const fallbacks = await buildLocaleFallbackChain({ requested });

  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
  const byLocale = new Map(rows.map((r) => [r.locale, r]));

  for (const l of fallbacks) {
    const found = byLocale.get(l);
    if (found) return reply.send(rowToDto(found));
  }

  return reply.code(404).send({ error: { message: "not_found" } });
};



export const getAppLocalesPublic: RouteHandler = async (_req, reply) => {
  const metas = await getAppLocalesMeta();
  return reply.send(metas);
};

export const getDefaultLocalePublic: RouteHandler = async (_req, reply) => {
  const def = await getEffectiveDefaultLocale();
  return reply.send(def);
};

