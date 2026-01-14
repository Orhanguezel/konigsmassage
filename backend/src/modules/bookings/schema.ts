// =============================================================
// FILE: src/modules/bookings/schema.ts
// FINAL — Bookings schema (NO booking_i18n)
// =============================================================

import { mysqlTable, char, varchar, text, tinyint, datetime, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';



export const bookings = mysqlTable(
  'bookings',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    // customer
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 190 }).notNull(),
    phone: varchar('phone', { length: 32 }).notNull(),

    // customer locale (only this)
    locale: varchar('locale', { length: 10 }).notNull().default('de'),

    customer_message: text('customer_message'),

    // subject (service)
    service_id: char('service_id', { length: 36 }),

    // resource
    resource_id: char('resource_id', { length: 36 }).notNull(),

    // slot binding (availability.resource_slots.id)
    slot_id: char('slot_id', { length: 36 }),

    appointment_date: varchar('appointment_date', { length: 10 }).notNull(), // YYYY-MM-DD
    appointment_time: varchar('appointment_time', { length: 5 }), // HH:mm

    status: varchar('status', { length: 24 }).notNull().default('new'),
    is_read: tinyint('is_read', { unsigned: true }).notNull().default(0),

    admin_note: text('admin_note'),
    decided_at: datetime('decided_at', { fsp: 3 }),
    decided_by: varchar('decided_by', { length: 120 }),
    decision_note: text('decision_note'),

    // email tracking
    email_last_sent_at: datetime('email_last_sent_at', { fsp: 3 }),
    email_last_template_key: varchar('email_last_template_key', { length: 120 }),
    email_last_to: varchar('email_last_to', { length: 190 }),
    email_last_subject: varchar('email_last_subject', { length: 255 }),
    email_last_error: text('email_last_error'),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('bookings_created_idx').on(t.created_at),
    index('bookings_status_idx').on(t.status),
    index('bookings_email_idx').on(t.email),

    index('bookings_service_idx').on(t.service_id),
    index('bookings_resource_idx').on(t.resource_id),
    index('bookings_resource_date_time_idx').on(
      t.resource_id,
      t.appointment_date,
      t.appointment_time,
    ),

    index('bookings_slot_idx').on(t.slot_id),
    index('bookings_date_idx').on(t.appointment_date),
    index('bookings_date_time_idx').on(t.appointment_date, t.appointment_time),
    index('bookings_locale_idx').on(t.locale),
  ],
);

export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;
