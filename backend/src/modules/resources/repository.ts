// =============================================================
// FILE: src/modules/resources/repository.ts
// FINAL — LOCKED — Resources repository (generic CRUD + capacity)
// - Fixes ResourceType narrowing for DTOs
// =============================================================

import { randomUUID } from 'crypto';
import { and, asc, desc, eq, like, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { resources, type ResourceRow } from './schema';
import type { AdminListResourcesQuery } from './validation';

import { toActive01, safeTrim } from '@/modules/_shared';

import type {
  ResourceAdminCreateInput,
  ResourceAdminUpdatePatch,
  ResourceAdminListItemDTO,
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
  const where: SQL[] = [];

  if (q.type) where.push(eq(resources.type, safeTrim(q.type)));

  const act = toActive01(q.is_active);
  if (typeof act !== 'undefined') where.push(eq(resources.is_active, act));

  if (q.external_ref_id) where.push(eq(resources.external_ref_id, safeTrim(q.external_ref_id)));

  if (q.q) {
    const s = `%${safeTrim(q.q)}%`;
    where.push(like(resources.title, s));
  }

  const { col, order } = mapSort(q);

  const base = db
    .select({
      id: resources.id,
      type: resources.type,
      title: resources.title,
      capacity: resources.capacity,
      external_ref_id: resources.external_ref_id,
      is_active: resources.is_active,
      created_at: resources.created_at,
      updated_at: resources.updated_at,
    })
    .from(resources)
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
  return (row ?? null) as ResourceRow | null;
}

export async function createResourceAdmin(args: ResourceAdminCreateInput) {
  const id = randomUUID();

  const type = coerceResourceType(args.type);
  const title = safeTrim(args.title);
  const capacity = coerceCapacity(args.capacity);

  await db.insert(resources).values({
    id,
    type,
    title,
    capacity,
    external_ref_id: args.external_ref_id ? safeTrim(args.external_ref_id) : null,
    is_active: typeof args.is_active === 'number' ? args.is_active : 1,
  } as any);

  return await getResourceByIdAdmin(id);
}

export async function updateResourceByIdAdmin(id: string, patch: ResourceAdminUpdatePatch) {
  const rid = safeTrim(id);
  if (!rid) return null;

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
}): Promise<ResourcePublicItemDTO[]> {
  const where: SQL[] = [eq(resources.is_active, 1)];

  if (args?.type) where.push(eq(resources.type, safeTrim(args.type)));

  const rows = await db
    .select({
      id: resources.id,
      type: resources.type,
      title: resources.title,
      capacity: resources.capacity,
      external_ref_id: resources.external_ref_id,
    })
    .from(resources)
    .where(and(...where))
    .orderBy(asc(resources.title));

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
