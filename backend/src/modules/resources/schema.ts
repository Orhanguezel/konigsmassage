// =============================================================
// FILE: src/modules/resources/schema.ts
// FINAL — LOCKED — Resources schema (generic + capacity)
// =============================================================

import { mysqlTable, char, varchar, tinyint, datetime, int, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';



export const resources = mysqlTable(
  'resources',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    type: varchar('type', { length: 24 }).notNull().default('other'),

    // UI label
    title: varchar('title', { length: 190 }).notNull(),

    // Capacity of the resource (parallel bookings allowed for same slot)
    capacity: int('capacity', { unsigned: true }).notNull().default(1),

    // optional: link to users or external modules (doctor user_id, therapist user_id, table_id etc.)
    external_ref_id: char('external_ref_id', { length: 36 }),

    is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('resources_active_idx').on(t.is_active),
    index('resources_type_idx').on(t.type),
    index('resources_title_idx').on(t.title),
    index('resources_capacity_idx').on(t.capacity),
    index('resources_external_idx').on(t.external_ref_id),
  ],
);

export type ResourceRow = typeof resources.$inferSelect;
export type NewResourceRow = typeof resources.$inferInsert;
