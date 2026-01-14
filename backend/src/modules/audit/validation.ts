// =============================================================
// FILE: src/modules/audit/validation.ts
// =============================================================

import { z } from 'zod';

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

// ✅ herkes aynı helper’ı kullansın (repo/controller/service)
export const isTruthyBoolLike = (v: any) => v === true || v === 1 || v === '1' || v === 'true';

export const AUDIT_AUTH_EVENTS = ['login_success', 'login_failed', 'logout'] as const;
export type AuditAuthEvent = (typeof AUDIT_AUTH_EVENTS)[number];
export const AUDIT_AUTH_EVENT_ENUM = z.enum(AUDIT_AUTH_EVENTS);

/* -------------------------------------------------------------
 * ADMIN – Request logs list query
 * ------------------------------------------------------------- */
export const auditRequestLogsListQuerySchema = z.object({
  q: z.string().optional(),
  method: z.string().max(16).optional(),
  status_code: z.coerce.number().int().min(100).max(599).optional(),

  user_id: z.string().max(64).optional(),
  ip: z.string().max(64).optional(),

  only_admin: boolLike.optional(),

  created_from: z.string().optional(),
  created_to: z.string().optional(),

  sort: z.enum(['created_at', 'response_time_ms', 'status_code']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),

  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type AuditRequestLogsListQuery = z.infer<typeof auditRequestLogsListQuerySchema>;

/* -------------------------------------------------------------
 * ADMIN – Auth events list query
 * ------------------------------------------------------------- */
export const auditAuthEventsListQuerySchema = z.object({
  event: AUDIT_AUTH_EVENT_ENUM.optional(),
  user_id: z.string().max(64).optional(),
  email: z.string().max(255).optional(),
  ip: z.string().max(64).optional(),

  created_from: z.string().optional(),
  created_to: z.string().optional(),

  sort: z.enum(['created_at']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),

  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type AuditAuthEventsListQuery = z.infer<typeof auditAuthEventsListQuerySchema>;

/* -------------------------------------------------------------
 * ADMIN – Metrics daily query
 * GET /audit/metrics/daily?days=14&only_admin=true&path_prefix=/api
 * ------------------------------------------------------------- */
export const auditMetricsDailyQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
  only_admin: boolLike.optional(),
  path_prefix: z.string().max(255).optional(),
});

export type AuditMetricsDailyQuery = z.infer<typeof auditMetricsDailyQuerySchema>;
