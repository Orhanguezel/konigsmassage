// =============================================================
// FILE: src/modules/audit/repository.ts
// konigsmassage – Audit Repository (Drizzle queries)
//   - listAuditRequestLogs
//   - listAuditAuthEvents
//   - getAuditMetricsDaily
// =============================================================

import { db } from '@/db/client';
import { and, asc, desc, eq, like, or, sql, type SQL, gte, lte } from 'drizzle-orm';

import {
  auditRequestLogs,
  auditAuthEvents,
  type AuditRequestLogRow,
  type AuditAuthEventRow,
} from './schema';

import type {
  AuditRequestLogsListQuery,
  AuditAuthEventsListQuery,
  AuditMetricsDailyQuery,
} from './validation';

import { isTruthyBoolLike } from './validation';

function parseDateTime3(s: string) {
  return sql`CAST(${s} AS DATETIME(3))`;
}

/* -------------------------------------------------------------
 * LIST – Request logs
 * ------------------------------------------------------------- */
export async function listAuditRequestLogs(
  q: AuditRequestLogsListQuery,
): Promise<{ items: AuditRequestLogRow[]; total: number }> {
  const conds: (SQL | undefined)[] = [];

  if (q.q && q.q.trim()) {
    const s = `%${q.q.trim()}%`;
    conds.push(or(like(auditRequestLogs.path, s), like(auditRequestLogs.url, s)));
  }

  if (q.method && q.method.trim()) {
    conds.push(eq(auditRequestLogs.method, q.method.trim().toUpperCase()));
  }

  if (typeof q.status_code === 'number') {
    conds.push(eq(auditRequestLogs.status_code, q.status_code));
  }

  if (q.user_id) conds.push(eq(auditRequestLogs.user_id, q.user_id));
  if (q.ip) conds.push(eq(auditRequestLogs.ip, q.ip));

  if (typeof q.only_admin !== 'undefined' && isTruthyBoolLike(q.only_admin)) {
    conds.push(eq(auditRequestLogs.is_admin, 1));
  }

  if (q.created_from && q.created_from.trim()) {
    conds.push(gte(auditRequestLogs.created_at, parseDateTime3(q.created_from.trim())));
  }
  if (q.created_to && q.created_to.trim()) {
    conds.push(lte(auditRequestLogs.created_at, parseDateTime3(q.created_to.trim())));
  }

  const whereCond =
    conds.length > 0 ? (and(...(conds.filter(Boolean) as SQL[])) as SQL) : undefined;

  const take = q.limit ?? 50;
  const skip = q.offset ?? 0;

  const sort = q.sort ?? 'created_at';
  const dir = q.orderDir ?? 'desc';

  const orderExpr: SQL =
    sort === 'response_time_ms'
      ? dir === 'asc'
        ? asc(auditRequestLogs.response_time_ms)
        : desc(auditRequestLogs.response_time_ms)
      : sort === 'status_code'
      ? dir === 'asc'
        ? asc(auditRequestLogs.status_code)
        : desc(auditRequestLogs.status_code)
      : dir === 'asc'
      ? asc(auditRequestLogs.created_at)
      : desc(auditRequestLogs.created_at);

  const baseQuery = db.select().from(auditRequestLogs);
  const rowsQuery = whereCond ? baseQuery.where(whereCond as SQL) : baseQuery;

  const items = await rowsQuery
    .orderBy(orderExpr, desc(auditRequestLogs.id))
    .limit(take)
    .offset(skip);

  const countBase = db.select({ c: sql<number>`COUNT(*)` }).from(auditRequestLogs);
  const countQuery = whereCond ? countBase.where(whereCond as SQL) : countBase;

  const cnt = await countQuery;
  const total = Number(cnt[0]?.c ?? 0);

  return { items: items as AuditRequestLogRow[], total };
}

/* -------------------------------------------------------------
 * LIST – Auth events
 * ------------------------------------------------------------- */
export async function listAuditAuthEvents(
  q: AuditAuthEventsListQuery,
): Promise<{ items: AuditAuthEventRow[]; total: number }> {
  const conds: (SQL | undefined)[] = [];

  if (q.event) conds.push(eq(auditAuthEvents.event, q.event));
  if (q.user_id) conds.push(eq(auditAuthEvents.user_id, q.user_id));
  if (q.email) conds.push(eq(auditAuthEvents.email, q.email));
  if (q.ip) conds.push(eq(auditAuthEvents.ip, q.ip));

  if (q.created_from && q.created_from.trim()) {
    conds.push(gte(auditAuthEvents.created_at, parseDateTime3(q.created_from.trim())));
  }
  if (q.created_to && q.created_to.trim()) {
    conds.push(lte(auditAuthEvents.created_at, parseDateTime3(q.created_to.trim())));
  }

  const whereCond =
    conds.length > 0 ? (and(...(conds.filter(Boolean) as SQL[])) as SQL) : undefined;

  const take = q.limit ?? 50;
  const skip = q.offset ?? 0;

  const dir = q.orderDir ?? 'desc';
  const orderExpr: SQL =
    dir === 'asc' ? asc(auditAuthEvents.created_at) : desc(auditAuthEvents.created_at);

  const baseQuery = db.select().from(auditAuthEvents);
  const rowsQuery = whereCond ? baseQuery.where(whereCond as SQL) : baseQuery;

  const items = await rowsQuery
    .orderBy(orderExpr, desc(auditAuthEvents.id))
    .limit(take)
    .offset(skip);

  const countBase = db.select({ c: sql<number>`COUNT(*)` }).from(auditAuthEvents);
  const countQuery = whereCond ? countBase.where(whereCond as SQL) : countBase;

  const cnt = await countQuery;
  const total = Number(cnt[0]?.c ?? 0);

  return { items: items as AuditAuthEventRow[], total };
}

/* -------------------------------------------------------------
 * Geo Stats: group by country
 * ------------------------------------------------------------- */
export type AuditGeoStatsRow = {
  country: string;
  count: number;
  unique_ips: number;
};

export type AuditGeoStatsQuery = {
  days?: number;
  only_admin?: any;
  source?: 'requests' | 'auth';
};

export async function getAuditGeoStats(
  q: AuditGeoStatsQuery,
): Promise<AuditGeoStatsRow[]> {
  const days = Math.max(1, Math.min(90, Number(q.days ?? 30)));
  const startExpr = sql`DATE_SUB(UTC_DATE(), INTERVAL ${days - 1} DAY)`;

  const useAuth = q.source === 'auth';
  const table = useAuth ? auditAuthEvents : auditRequestLogs;

  const conds: (SQL | undefined)[] = [];
  conds.push(sql`DATE(${table.created_at}) >= ${startExpr}`);
  conds.push(sql`${table.country} IS NOT NULL AND ${table.country} != ''`);

  if (!useAuth && typeof q.only_admin !== 'undefined' && isTruthyBoolLike(q.only_admin)) {
    conds.push(eq(auditRequestLogs.is_admin, 1));
  }

  const whereCond = and(...(conds.filter(Boolean) as SQL[]));

  const rows = await db
    .select({
      country: table.country,
      count: sql<number>`COUNT(*)`,
      unique_ips: sql<number>`COUNT(DISTINCT ${table.ip})`,
    })
    .from(table)
    .where(whereCond)
    .groupBy(table.country)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(200);

  return rows.map((r: any) => ({
    country: String(r.country ?? ''),
    count: Number(r.count ?? 0),
    unique_ips: Number(r.unique_ips ?? 0),
  }));
}

/* -------------------------------------------------------------
 * CLEAR – Tüm audit loglarını sil
 * ------------------------------------------------------------- */
export type ClearAuditTarget = 'requests' | 'auth' | 'all';

export async function clearAuditLogs(
  target: ClearAuditTarget = 'all',
): Promise<{ deletedRequests: number; deletedAuth: number }> {
  let deletedRequests = 0;
  let deletedAuth = 0;

  if (target === 'requests' || target === 'all') {
    const countRes = await db.select({ c: sql<number>`COUNT(*)` }).from(auditRequestLogs);
    deletedRequests = Number(countRes[0]?.c ?? 0);
    await db.execute(sql`TRUNCATE TABLE audit_request_logs`);
  }

  if (target === 'auth' || target === 'all') {
    const countRes = await db.select({ c: sql<number>`COUNT(*)` }).from(auditAuthEvents);
    deletedAuth = Number(countRes[0]?.c ?? 0);
    await db.execute(sql`TRUNCATE TABLE audit_auth_events`);
  }

  return { deletedRequests, deletedAuth };
}

/* -------------------------------------------------------------
 * Metrics: daily aggregation (requests, unique_ips, errors)
 * ------------------------------------------------------------- */
export type AuditMetricsDailyRow = {
  date: string; // "YYYY-MM-DD"
  requests: number;
  unique_ips: number;
  errors: number;
};

export async function getAuditMetricsDaily(
  q: AuditMetricsDailyQuery,
): Promise<{ days: AuditMetricsDailyRow[] }> {
  const conds: (SQL | undefined)[] = [];

  const days = Math.max(1, Math.min(90, Number(q.days ?? 14)));
  const startExpr = sql`DATE_SUB(UTC_DATE(), INTERVAL ${days - 1} DAY)`;

  // DATE(created_at) >= start
  conds.push(sql`DATE(${auditRequestLogs.created_at}) >= ${startExpr}`);

  if (typeof q.only_admin !== 'undefined' && isTruthyBoolLike(q.only_admin)) {
    conds.push(eq(auditRequestLogs.is_admin, 1));
  }

  if (q.path_prefix && q.path_prefix.trim()) {
    conds.push(like(auditRequestLogs.path, `${q.path_prefix.trim()}%`));
  }

  const whereCond = and(...(conds.filter(Boolean) as SQL[]));

  const rows = await db
    .select({
      date: sql<string>`DATE(${auditRequestLogs.created_at})`,
      requests: sql<number>`COUNT(*)`,
      unique_ips: sql<number>`COUNT(DISTINCT ${auditRequestLogs.ip})`,
      errors: sql<number>`SUM(CASE WHEN ${auditRequestLogs.status_code} >= 400 THEN 1 ELSE 0 END)`,
    })
    .from(auditRequestLogs)
    .where(whereCond)
    .groupBy(sql`DATE(${auditRequestLogs.created_at})`)
    .orderBy(sql`DATE(${auditRequestLogs.created_at}) ASC`);

  const daysOut: AuditMetricsDailyRow[] = rows.map((r: any) => ({
    date: String(r.date),
    requests: Number(r.requests ?? 0),
    unique_ips: Number(r.unique_ips ?? 0),
    errors: Number(r.errors ?? 0),
  }));

  return { days: daysOut };
}
