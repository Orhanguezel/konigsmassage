// ===================================================================
// FILE: src/modules/dashboard/_queries/bookings.analytics.ts
// FINAL — Bookings analytics queries (uses bookings schema exactly)
// ===================================================================

import { db } from '@/db/client';
import { sql, and } from 'drizzle-orm';
import { bookings } from '@/modules/bookings/schema';
import type { TrendBucket } from '@/modules/_shared';

export function bookingsWindowWhere(fromYmd: string, toYmdExclusive: string) {
  // bookings.appointment_date = varchar(10) 'YYYY-MM-DD'
  return and(
    sql`${bookings.appointment_date} IS NOT NULL`,
    sql`${bookings.appointment_date} >= ${fromYmd} AND ${bookings.appointment_date} < ${toYmdExclusive}`,
  );
}

export function bucketExpr(bucket: TrendBucket) {
  // appointment_date is varchar; for day we can just use the string itself
  if (bucket === 'day') return sql<string>`${bookings.appointment_date}`;

  // week over a date string: STR_TO_DATE('YYYY-MM-DD', '%Y-%m-%d')
  // WEEK(...,3) ISO-ish; consistent with earlier approach
  return sql<string>`
    CONCAT(
      YEAR(STR_TO_DATE(${bookings.appointment_date}, '%Y-%m-%d')),
      '-W',
      LPAD(WEEK(STR_TO_DATE(${bookings.appointment_date}, '%Y-%m-%d'), 3), 2, '0')
    )
  `;
}

export async function getBookingTotals(fromYmd: string, toYmdExclusive: string) {
  const where = bookingsWindowWhere(fromYmd, toYmdExclusive);

  const rows = await db
    .select({
      bookings_total: sql<number>`COUNT(*)`,
      bookings_new: sql<number>`SUM(CASE WHEN ${bookings.status} = 'new' THEN 1 ELSE 0 END)`,
      bookings_confirmed: sql<number>`SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END)`,
      bookings_completed: sql<number>`SUM(CASE WHEN ${bookings.status} = 'completed' THEN 1 ELSE 0 END)`,
      bookings_cancelled: sql<number>`SUM(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 ELSE 0 END)`,
    })
    .from(bookings)
    .where(where)
    .limit(1);

  const r = rows[0] ?? ({} as any);

  const total = Number(r.bookings_total ?? 0) || 0;
  const n = Number(r.bookings_new ?? 0) || 0;
  const c = Number(r.bookings_confirmed ?? 0) || 0;
  const comp = Number(r.bookings_completed ?? 0) || 0;
  const canc = Number(r.bookings_cancelled ?? 0) || 0;

  return {
    bookings_total: total,
    bookings_new: n,
    bookings_confirmed: c,
    bookings_completed: comp,
    bookings_cancelled: canc,
    bookings_other: Math.max(0, total - (n + c + comp + canc)),
  };
}

export async function getBookingTrend(
  fromYmd: string,
  toYmdExclusive: string,
  bucket: TrendBucket,
) {
  const where = bookingsWindowWhere(fromYmd, toYmdExclusive);
  const bExpr = bucketExpr(bucket);

  const rows = await db
    .select({
      bucket: bExpr,
      bookings_total: sql<number>`COUNT(*)`,
      bookings_new: sql<number>`SUM(CASE WHEN ${bookings.status} = 'new' THEN 1 ELSE 0 END)`,
      bookings_confirmed: sql<number>`SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END)`,
      bookings_completed: sql<number>`SUM(CASE WHEN ${bookings.status} = 'completed' THEN 1 ELSE 0 END)`,
      bookings_cancelled: sql<number>`SUM(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 ELSE 0 END)`,
    })
    .from(bookings)
    .where(where)
    .groupBy(bExpr)
    .orderBy(bExpr);

  return rows.map((r: any) => ({
    bucket: String(r.bucket ?? ''),
    bookings_total: Number(r.bookings_total ?? 0) || 0,
    bookings_new: Number(r.bookings_new ?? 0) || 0,
    bookings_confirmed: Number(r.bookings_confirmed ?? 0) || 0,
    bookings_completed: Number(r.bookings_completed ?? 0) || 0,
    bookings_cancelled: Number(r.bookings_cancelled ?? 0) || 0,
  }));
}

export async function getBookingAggByResource(fromYmd: string, toYmdExclusive: string) {
  const where = bookingsWindowWhere(fromYmd, toYmdExclusive);

  const rows = await db
    .select({
      resource_id: bookings.resource_id,
      bookings_total: sql<number>`COUNT(*)`,
      bookings_new: sql<number>`SUM(CASE WHEN ${bookings.status} = 'new' THEN 1 ELSE 0 END)`,
      bookings_confirmed: sql<number>`SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END)`,
      bookings_completed: sql<number>`SUM(CASE WHEN ${bookings.status} = 'completed' THEN 1 ELSE 0 END)`,
      bookings_cancelled: sql<number>`SUM(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 ELSE 0 END)`,
    })
    .from(bookings)
    .where(where)
    .groupBy(bookings.resource_id);

  return rows.map((r: any) => ({
    resource_id: String(r.resource_id ?? ''),
    bookings_total: Number(r.bookings_total ?? 0) || 0,
    bookings_new: Number(r.bookings_new ?? 0) || 0,
    bookings_confirmed: Number(r.bookings_confirmed ?? 0) || 0,
    bookings_completed: Number(r.bookings_completed ?? 0) || 0,
    bookings_cancelled: Number(r.bookings_cancelled ?? 0) || 0,
  }));
}
