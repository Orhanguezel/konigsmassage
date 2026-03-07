// =============================================================
// FILE: src/modules/resources/repository.ts
// FINAL — LOCKED — Resources repository (generic CRUD + capacity)
// - Fixes ResourceType narrowing for DTOs
// =============================================================

import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db/client';
import { resources, resourcesI18n, type ResourceRow } from './schema';
import type { AdminListResourcesQuery } from './validation';

import { toActive01, safeTrim } from '@/modules/_shared';
import { buildLocaleFallbackChain, getDefaultLocale } from '@/modules/siteSettings/service';

import type {
  ResourceAdminCreateInput,
  ResourceAdminUpdatePatch,
  ResourceAdminListItemDTO,
  ResourceI18nDTO,
  ResourcePublicItemDTO,
  ResourceType,
} from '@/modules/_shared';

// ✅ single source of truth for narrowing
const RESOURCE_TYPES = new Set<ResourceType>([
  'therapist',
  'doctor',
  'table',
  'room',
  'staff',
  'other',
]);

function coerceResourceType(v: unknown): ResourceType {
  const s = safeTrim(v) as ResourceType;
  return RESOURCE_TYPES.has(s) ? s : 'other';
}

function coerceCapacity(v: unknown): number {
  const n = Number(v ?? 1);
  if (!Number.isFinite(n)) return 1;
  const x = Math.floor(n);
  return x >= 1 ? x : 1;
}

function normalizeLocale(v: unknown): string {
  return safeTrim(v).toLowerCase();
}

function pickCanonicalTitle(args: {
  explicit?: unknown;
  i18n?: Array<{ locale: string; title: string }> | undefined;
  defaultLocale: string;
}): string {
  const explicit = safeTrim(args.explicit);
  if (explicit) return explicit;
  const list = Array.isArray(args.i18n) ? args.i18n : [];
  const wanted = normalizeLocale(args.defaultLocale) || 'de';
  const preferred =
    list.find((row) => normalizeLocale(row.locale) === wanted && safeTrim(row.title)) ??
    list.find((row) => normalizeLocale(row.locale) === 'de' && safeTrim(row.title)) ??
    list.find((row) => safeTrim(row.title));
  return safeTrim(preferred?.title);
}

function normalizeI18nInput(rows?: Array<{ locale: string; title: string }>): Array<{ locale: string; title: string }> {
  if (!Array.isArray(rows)) return [];
  const map = new Map<string, string>();
  for (const row of rows) {
    const locale = normalizeLocale(row?.locale);
    const title = safeTrim(row?.title);
    if (!locale || !title) continue;
    map.set(locale, title);
  }
  return Array.from(map.entries()).map(([locale, title]) => ({ locale, title }));
}

async function listResourceI18n(resourceIds: string[]): Promise<ResourceI18nDTO[]> {
  const ids = resourceIds.map((id) => safeTrim(id)).filter(Boolean);
  if (!ids.length) return [];

  const rows = await db
    .select()
    .from(resourcesI18n)
    .where(inArray(resourcesI18n.resource_id, ids));

  return rows.map((row) => ({
    id: String(row.id),
    resource_id: String(row.resource_id),
    locale: normalizeLocale(row.locale),
    title: safeTrim(row.title),
    created_at: (row as any).created_at,
    updated_at: (row as any).updated_at,
  }));
}

async function replaceResourceI18n(resourceId: string, rows?: Array<{ locale: string; title: string }>) {
  const rid = safeTrim(resourceId);
  if (!rid) return;

  const normalized = normalizeI18nInput(rows);
  await db.delete(resourcesI18n).where(eq(resourcesI18n.resource_id, rid));
  if (!normalized.length) return;

  const now = new Date() as any;
  await db.insert(resourcesI18n).values(
    normalized.map((row) => ({
      id: randomUUID(),
      resource_id: rid,
      locale: row.locale,
      title: row.title,
      created_at: now,
      updated_at: now,
    })) as any,
  );
}

function mapSort(q: AdminListResourcesQuery) {
  const sort = q.sort || 'created_at';
  const order = (q.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  const col =
    sort === 'updated_at'
      ? resources.updated_at
      : sort === 'title'
      ? resources.title
      : sort === 'type'
      ? resources.type
      : sort === 'capacity'
      ? resources.capacity
      : resources.created_at;

  return { col, order };
}

export async function listResourcesAdmin(
  q: AdminListResourcesQuery,
): Promise<ResourceAdminListItemDTO[]> {
  const defaultLocale = normalizeLocale(await getDefaultLocale(null)) || 'de';
  const iDef = alias(resourcesI18n, 'ri_def');
  const where: SQL[] = [];

  if (q.type) where.push(eq(resources.type, safeTrim(q.type)));

  const act = toActive01(q.is_active);
  if (typeof act !== 'undefined') where.push(eq(resources.is_active, act));

  if (q.external_ref_id) where.push(eq(resources.external_ref_id, safeTrim(q.external_ref_id)));

  if (q.q) {
    const s = `%${safeTrim(q.q)}%`;
    where.push(
      or(
        like(resources.title, s),
        like(iDef.title, s),
      ) as SQL,
    );
  }

  const { col, order } = mapSort(q);

  const base = db
    .select({
      id: resources.id,
      type: resources.type,
      title: sql<string>`COALESCE(${iDef.title}, ${resources.title})`.as('title'),
      capacity: resources.capacity,
      external_ref_id: resources.external_ref_id,
      is_active: resources.is_active,
      created_at: resources.created_at,
      updated_at: resources.updated_at,
    })
    .from(resources)
    .leftJoin(iDef, and(eq(iDef.resource_id, resources.id), eq(iDef.locale, defaultLocale)))
    .limit(q.limit)
    .offset(q.offset)
    .orderBy(order === 'asc' ? asc(col) : desc(col));

  const rows = where.length ? await base.where(and(...where)) : await base;

  return rows.map((r) => {
    const title = safeTrim(r.title);
    const type = coerceResourceType(r.type);
    const capacity = coerceCapacity(r.capacity);

    const dto: ResourceAdminListItemDTO = {
      id: String(r.id),
      type, // ✅ ResourceType
      title,
      capacity,
      external_ref_id: r.external_ref_id ? String(r.external_ref_id) : null,
      is_active: Number(r.is_active ?? 0) === 1 ? 1 : 0,
      created_at: (r as any).created_at,
      updated_at: (r as any).updated_at,
      label: title || String(r.id),
    };

    return dto;
  });
}

export async function getResourceByIdAdmin(id: string): Promise<ResourceRow | null> {
  const rid = safeTrim(id);
  if (!rid) return null;

  const [row] = await db.select().from(resources).where(eq(resources.id, rid)).limit(1);
  if (!row) return null;
  const i18n = await listResourceI18n([rid]);
  return { ...(row as any), i18n } as ResourceRow | null;
}

export async function createResourceAdmin(args: ResourceAdminCreateInput) {
  const id = randomUUID();
  const defaultLocale = normalizeLocale(await getDefaultLocale(null)) || 'de';

  const type = coerceResourceType(args.type);
  const title = pickCanonicalTitle({
    explicit: args.title,
    i18n: args.i18n,
    defaultLocale,
  });
  const capacity = coerceCapacity(args.capacity);

  await db.insert(resources).values({
    id,
    type,
    title,
    capacity,
    external_ref_id: args.external_ref_id ? safeTrim(args.external_ref_id) : null,
    is_active: typeof args.is_active === 'number' ? args.is_active : 1,
  } as any);
  await replaceResourceI18n(id, normalizeI18nInput(args.i18n).length ? args.i18n : [{ locale: defaultLocale, title }]);

  return await getResourceByIdAdmin(id);
}

export async function updateResourceByIdAdmin(id: string, patch: ResourceAdminUpdatePatch) {
  const rid = safeTrim(id);
  if (!rid) return null;
  const defaultLocale = normalizeLocale(await getDefaultLocale(null)) || 'de';

  const clean: any = {};

  if (Object.prototype.hasOwnProperty.call(patch, 'type')) {
    clean.type = coerceResourceType((patch as any).type);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'title')) {
    const t = safeTrim((patch as any).title);
    if (t) clean.title = t;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'capacity')) {
    clean.capacity = coerceCapacity((patch as any).capacity);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'external_ref_id')) {
    clean.external_ref_id = (patch as any).external_ref_id
      ? safeTrim((patch as any).external_ref_id)
      : null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'is_active')) {
    const a = Number((patch as any).is_active) === 1 ? 1 : 0;
    clean.is_active = a;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'i18n')) {
    const normalized = normalizeI18nInput((patch as any).i18n);
    const canonical = pickCanonicalTitle({
      explicit: clean.title,
      i18n: normalized,
      defaultLocale,
    });
    if (canonical) clean.title = canonical;
    await replaceResourceI18n(rid, normalized);
  }

  // no-op guard
  if (!Object.keys(clean).length) return await getResourceByIdAdmin(rid);

  clean.updated_at = new Date() as any;

  await db.update(resources).set(clean).where(eq(resources.id, rid));
  return await getResourceByIdAdmin(rid);
}

export async function deleteResourceByIdAdmin(id: string) {
  const rid = safeTrim(id);
  if (!rid) return;
  await db.delete(resources).where(eq(resources.id, rid));
}

/* -------------------- public -------------------- */

export async function listResourcesPublic(args?: {
  type?: string;
  locale?: string;
}): Promise<ResourcePublicItemDTO[]> {
  const locale = normalizeLocale(args?.locale) || 'de';
  const [defaultLocale, fallbacks] = await Promise.all([
    getDefaultLocale(null),
    buildLocaleFallbackChain({ requested: locale }),
  ]);
  const resolvedDefault = normalizeLocale(defaultLocale) || 'de';
  const resolvedRequested = fallbacks.find((loc) => loc !== '*' && normalizeLocale(loc)) || locale;
  const iReq = alias(resourcesI18n, 'ri_req');
  const iDef = alias(resourcesI18n, 'ri_def');
  const where: SQL[] = [eq(resources.is_active, 1)];

  if (args?.type) where.push(eq(resources.type, safeTrim(args.type)));

  const rows = await db
    .select({
      id: resources.id,
      type: resources.type,
      title: sql<string>`COALESCE(${iReq.title}, ${iDef.title}, ${resources.title})`.as('title'),
      capacity: resources.capacity,
      external_ref_id: resources.external_ref_id,
    })
    .from(resources)
    .leftJoin(iReq, and(eq(iReq.resource_id, resources.id), eq(iReq.locale, resolvedRequested)))
    .leftJoin(iDef, and(eq(iDef.resource_id, resources.id), eq(iDef.locale, resolvedDefault)))
    .where(and(...where))
    .orderBy(asc(sql`COALESCE(${iReq.title}, ${iDef.title}, ${resources.title})`));

  return rows.map((r) => {
    const title = safeTrim(r.title);
    const type = coerceResourceType(r.type);
    const capacity = coerceCapacity(r.capacity);

    const dto: ResourcePublicItemDTO = {
      id: String(r.id),
      type, // ✅ ResourceType
      title,
      capacity,
      external_ref_id: r.external_ref_id ? String(r.external_ref_id) : null,
      label: title || String(r.id),
    };

    return dto;
  });
}
