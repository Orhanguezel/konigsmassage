// ===================================================================
// FILE: src/modules/reports/repository.ts
// ===================================================================

import { db } from '@/db/client';
import { bookings } from '@/modules/bookings/schema';
import { sql, and, gte, lte, eq, type SQL } from 'drizzle-orm';

export interface ReportParams {
  from?: string;
  to?: string;
  role?: string;
}

export async function getKpiData(from?: string, to?: string) {
  const where: SQL[] = [];
  if (from) where.push(gte(bookings.appointment_date, from));
  if (to) where.push(lte(bookings.appointment_date, to));

  // Daily KPI
  const daily = await db
    .select({
      bucket: bookings.appointment_date,
      orders_total: sql<number>`count(*)`,
      delivered_orders: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      cancelled_orders: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
    })
    .from(bookings)
    .where(where.length ? and(...where) : undefined)
    .groupBy(bookings.appointment_date)
    .orderBy(bookings.appointment_date);

  return daily.map((r) => ({
    period: 'day',
    bucket: r.bucket,
    orders_total: Number(r.orders_total),
    delivered_orders: Number(r.delivered_orders),
    chickens_delivered: 0, // Not applicable
    success_rate: r.orders_total > 0 ? Number(r.delivered_orders) / Number(r.orders_total) : 0,
  }));
}

export async function getUsersPerformanceData(from?: string, to?: string, role?: string) {
  const where: SQL[] = [];
  if (from) where.push(gte(bookings.appointment_date, from));
  if (to) where.push(lte(bookings.appointment_date, to));

  // In this project, "users" performance is "resource" performance
  const data = await db
    .select({
      user_id: bookings.resource_id,
      orders_total: sql<number>`count(*)`,
      delivered_orders: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      cancelled_orders: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
    })
    .from(bookings)
    .where(where.length ? and(...where) : undefined)
    .groupBy(bookings.resource_id);

  return data.map((r) => ({
    user_id: r.user_id,
    role: 'resource',
    orders_total: Number(r.orders_total),
    delivered_orders: Number(r.delivered_orders),
    cancelled_orders: Number(r.cancelled_orders),
    chickens_delivered: 0,
    success_rate: r.orders_total > 0 ? Number(r.delivered_orders) / Number(r.orders_total) : 0,
    incentive_amount_total: 0,
    incentive_deliveries_count: 0,
    incentive_chickens_count: 0,
  }));
}

export async function getLocationsData(from?: string, to?: string) {
  const where: SQL[] = [];
  if (from) where.push(gte(bookings.appointment_date, from));
  if (to) where.push(lte(bookings.appointment_date, to));

  // Locations grouped by locale since we don't have city/district
  const data = await db
    .select({
      locale: bookings.locale,
      orders_total: sql<number>`count(*)`,
      delivered_orders: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      cancelled_orders: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
    })
    .from(bookings)
    .where(where.length ? and(...where) : undefined)
    .groupBy(bookings.locale);

  return data.map((r) => ({
    city_id: r.locale,
    city_name: r.locale.toUpperCase(),
    district_id: null,
    district_name: null,
    orders_total: Number(r.orders_total),
    delivered_orders: Number(r.delivered_orders),
    cancelled_orders: Number(r.cancelled_orders),
    chickens_delivered: 0,
    success_rate: r.orders_total > 0 ? Number(r.delivered_orders) / Number(r.orders_total) : 0,
  }));
}
