// =============================================================
// FILE: src/modules/audit/schema.ts
// konigsmassage – Audit Schema (Drizzle ORM)
// FIX: LONGTEXT via customType + proper index() usage
// =============================================================

import { mysqlTable, varchar, bigint, int, datetime, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { longtext } from './_longtext';

export const auditRequestLogs = mysqlTable(
  'audit_request_logs',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),

    req_id: varchar('req_id', { length: 64 }).notNull(),
    method: varchar('method', { length: 16 }).notNull(),

    url: longtext('url').notNull(), // LONGTEXT
    path: varchar('path', { length: 255 }).notNull(),

    status_code: int('status_code').notNull(),
    response_time_ms: int('response_time_ms').notNull().default(0),

    ip: varchar('ip', { length: 64 }).notNull(),
    user_agent: longtext('user_agent'), // LONGTEXT
    referer: longtext('referer'), // LONGTEXT

    user_id: varchar('user_id', { length: 64 }),
    is_admin: int('is_admin').notNull().default(0),

    country: varchar('country', { length: 8 }),
    city: varchar('city', { length: 64 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    idx_created: index('audit_request_logs_created_idx').on(t.created_at),
    idx_user: index('audit_request_logs_user_idx').on(t.user_id),
    idx_path: index('audit_request_logs_path_idx').on(t.path),
    idx_ip: index('audit_request_logs_ip_idx').on(t.ip),
  }),
);

export const auditAuthEvents = mysqlTable(
  'audit_auth_events',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),

    event: varchar('event', { length: 32 }).notNull(),
    user_id: varchar('user_id', { length: 64 }),
    email: varchar('email', { length: 255 }),

    ip: varchar('ip', { length: 64 }).notNull(),
    user_agent: longtext('user_agent'), // LONGTEXT

    country: varchar('country', { length: 8 }),
    city: varchar('city', { length: 64 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    idx_created: index('audit_auth_events_created_idx').on(t.created_at),
    idx_event: index('audit_auth_events_event_idx').on(t.event),
    idx_user: index('audit_auth_events_user_idx').on(t.user_id),
    idx_ip: index('audit_auth_events_ip_idx').on(t.ip),
  }),
);

export type AuditRequestLogRow = typeof auditRequestLogs.$inferSelect;
export type NewAuditRequestLogRow = typeof auditRequestLogs.$inferInsert;

export type AuditAuthEventRow = typeof auditAuthEvents.$inferSelect;
export type NewAuditAuthEventRow = typeof auditAuthEvents.$inferInsert;
