// ===================================================================
// FILE: src/modules/dashboard/_queries/availability.analytics.ts
// FINAL — Availability analytics (resourceSlots + slotReservations)
// ===================================================================

import { db } from '@/db/client';
import { sql, and, eq, inArray } from 'drizzle-orm';
import { resourceSlots, slotReservations } from '@/modules/availability/schema';

export function slotsWindowWhere(fromYmd: string, toYmdExclusive: string) {
  // resourceSlots.slot_date = DATE
  return and(
    sql`${resourceSlots.slot_date} IS NOT NULL`,
    sql`${resourceSlots.slot_date} >= ${fromYmd} AND ${resourceSlots.slot_date} < ${toYmdExclusive}`,
  );
}

export async function getSlotsTotals(fromYmd: string, toYmdExclusive: string) {
  const where = slotsWindowWhere(fromYmd, toYmdExclusive);

  const [countRow] = await db
    .select({ c: sql<number>`COUNT(*)` })
    .from(resourceSlots)
    .where(where)
    .limit(1);

  const [reservedRow] = await db
    .select({
      s: sql<number>`COALESCE(SUM(${slotReservations.reserved_count}), 0)`,
    })
    .from(slotReservations)
    .innerJoin(resourceSlots, eq(slotReservations.slot_id, resourceSlots.id))
    .where(where)
    .limit(1);

  return {
    slots_total: Number(countRow?.c ?? 0) || 0,
    slots_reserved: Number(reservedRow?.s ?? 0) || 0,
  };
}

export async function getSlotsAggByResource(
  fromYmd: string,
  toYmdExclusive: string,
  resourceIds: string[],
) {
  if (!resourceIds.length)
    return new Map<string, { slots_total: number; slots_reserved: number }>();

  const where = and(
    slotsWindowWhere(fromYmd, toYmdExclusive),
    inArray(resourceSlots.resource_id, resourceIds),
  );

  const rows = await db
    .select({
      resource_id: resourceSlots.resource_id,
      slots_total: sql<number>`COUNT(*)`,
      slots_reserved: sql<number>`COALESCE(SUM(${slotReservations.reserved_count}), 0)`,
    })
    .from(resourceSlots)
    .leftJoin(slotReservations, eq(slotReservations.slot_id, resourceSlots.id))
    .where(where)
    .groupBy(resourceSlots.resource_id);

  return new Map(
    rows.map((r: any) => [
      String(r.resource_id ?? ''),
      {
        slots_total: Number(r.slots_total ?? 0) || 0,
        slots_reserved: Number(r.slots_reserved ?? 0) || 0,
      },
    ]),
  );
}
