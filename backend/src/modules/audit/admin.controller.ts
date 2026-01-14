// =============================================================
// FILE: src/modules/audit/admin.controller.ts
// konigsmassage – Audit Admin Controller
// FIX:
//  - list endpoints always return { items, total }
//  - daily endpoint always returns { days: [...] }
// =============================================================

import type { RouteHandler } from 'fastify';

import {
  auditAuthEventsListQuerySchema,
  auditRequestLogsListQuerySchema,
  auditMetricsDailyQuerySchema,
  type AuditAuthEventsListQuery,
  type AuditRequestLogsListQuery,
  type AuditMetricsDailyQuery,
  isTruthyBoolLike,
} from './validation';

import { listAuditAuthEvents, listAuditRequestLogs, getAuditMetricsDaily } from './repository';
import { setContentRange } from '@/common/utils/contentRange';

type ListResponse<T> = { items: T[]; total: number };

function coerceListResult<T>(r: any): ListResponse<T> {
  if (!r) return { items: [], total: 0 };
  if (Array.isArray(r)) return { items: r as T[], total: r.length };

  if (Array.isArray(r.items)) {
    return {
      items: r.items as T[],
      total: Number.isFinite(Number(r.total)) ? Number(r.total) : r.items.length,
    };
  }

  if (Array.isArray(r.data)) {
    return {
      items: r.data as T[],
      total: Number.isFinite(Number(r.total)) ? Number(r.total) : r.data.length,
    };
  }

  return { items: [], total: 0 };
}

export const listAuditRequestLogsAdmin: RouteHandler = async (req, reply) => {
  const parsed = auditRequestLogsListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
  }

  const q = parsed.data as AuditRequestLogsListQuery;

  const raw = await listAuditRequestLogs(q);
  const { items, total } = coerceListResult<any>(raw);

  const offset = q.offset ?? 0;
  const limit = q.limit ?? items.length ?? 0;

  setContentRange(reply, offset, limit, total);
  reply.header('x-total-count', String(total ?? 0));
  return reply.send({ items, total });
};

export const listAuditAuthEventsAdmin: RouteHandler = async (req, reply) => {
  const parsed = auditAuthEventsListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
  }

  const q = parsed.data as AuditAuthEventsListQuery;

  const raw = await listAuditAuthEvents(q);
  const { items, total } = coerceListResult<any>(raw);

  const offset = q.offset ?? 0;
  const limit = q.limit ?? items.length ?? 0;

  setContentRange(reply, offset, limit, total);
  reply.header('x-total-count', String(total ?? 0));
  return reply.send({ items, total });
};

export const getAuditMetricsDailyAdmin: RouteHandler = async (req, reply) => {
  const parsed = auditMetricsDailyQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
  }

  const q = parsed.data as AuditMetricsDailyQuery;
  const onlyAdmin =
    typeof q.only_admin === 'undefined' ? undefined : isTruthyBoolLike(q.only_admin);

  const raw = await getAuditMetricsDaily({
    days: q.days,
    only_admin: onlyAdmin,
    path_prefix: q.path_prefix?.trim() ? q.path_prefix.trim() : undefined,
  });

  const days = Array.isArray((raw as any)?.days)
    ? (raw as any).days
    : Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.items)
    ? (raw as any).items
    : Array.isArray((raw as any)?.data)
    ? (raw as any).data
    : [];

  return reply.send({ days });
};
