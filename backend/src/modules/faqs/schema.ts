// ===================================================================
// FILE: src/modules/faqs/schema.ts
// FINAL — NO category/sub_category
// ===================================================================

import {
  mysqlTable,
  char,
  varchar,
  tinyint,
  datetime,
  index,
  uniqueIndex,
  customType,
  int,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

/** LONGTEXT */
const longtext = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'longtext';
  },
});

export const faqs = mysqlTable(
  'faqs',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    is_active: tinyint('is_active').notNull().default(1),
    display_order: int('display_order').notNull().default(0),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('faqs_active_idx').on(t.is_active),
    index('faqs_order_idx').on(t.display_order),
    index('faqs_created_idx').on(t.created_at),
    index('faqs_updated_idx').on(t.updated_at),
  ],
);

export const faqsI18n = mysqlTable(
  'faqs_i18n',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    faq_id: char('faq_id', { length: 36 })
      .notNull()
      .references(() => faqs.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    locale: varchar('locale', { length: 10 }).notNull(),

    question: varchar('question', { length: 500 }).notNull(),
    answer: longtext('answer').notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('ux_faqs_i18n_parent_locale').on(t.faq_id, t.locale),
    uniqueIndex('ux_faqs_i18n_locale_slug').on(t.locale, t.slug),
    index('faqs_i18n_locale_idx').on(t.locale),
    index('faqs_i18n_slug_idx').on(t.slug),
  ],
);

export type FaqRow = typeof faqs.$inferSelect;
export type NewFaqRow = typeof faqs.$inferInsert;

export type FaqI18nRow = typeof faqsI18n.$inferSelect;
export type NewFaqI18nRow = typeof faqsI18n.$inferInsert;
