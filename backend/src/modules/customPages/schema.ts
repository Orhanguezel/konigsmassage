// =============================================================
// FILE: src/modules/customPages/schema.ts
// FINAL — MariaDB/MySQL compatible (LONGTEXT JSON-string columns)
// =============================================================

import {
  mysqlTable,
  char,
  varchar,
  tinyint,
  datetime,
  uniqueIndex,
  index,
  int,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { longtext, longtextJsonStringArray } from '@/modules/_shared';

export const customPages = mysqlTable(
  'custom_pages',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    /** module_key parent'ta */
    module_key: varchar('module_key', { length: 100 }).notNull().default(''),

    // dil bağımsız
    is_published: tinyint('is_published').notNull().default(0),
    featured: tinyint('featured').notNull().default(0),

    /** sıralama */
    display_order: int('display_order').notNull().default(0),
    order_num: int('order_num').notNull().default(0),

    /** kapak */
    featured_image: varchar('featured_image', { length: 500 }),
    featured_image_asset_id: char('featured_image_asset_id', { length: 36 }),

    /** legacy / serbest URL */
    image_url: longtext('image_url'),
    storage_asset_id: char('storage_asset_id', { length: 36 }),

    /**
     * ✅ DB: LONGTEXT DEFAULT '[]'
     * ✅ App: string[]
     */
    images: longtextJsonStringArray('images'),
    storage_image_ids: longtextJsonStringArray('storage_image_ids'),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),

    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('custom_pages_created_idx').on(t.created_at),
    index('custom_pages_updated_idx').on(t.updated_at),
    index('custom_pages_is_published_idx').on(t.is_published),
    index('custom_pages_featured_idx').on(t.featured),

    index('custom_pages_module_key_idx').on(t.module_key),

    index('custom_pages_featured_asset_idx').on(t.featured_image_asset_id),
    index('custom_pages_storage_asset_idx').on(t.storage_asset_id),

    index('custom_pages_display_order_idx').on(t.display_order),
    index('custom_pages_order_num_idx').on(t.order_num),
  ],
);

export const customPagesI18n = mysqlTable(
  'custom_pages_i18n',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    page_id: char('page_id', { length: 36 })
      .notNull()
      .references(() => customPages.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    locale: varchar('locale', { length: 10 }).notNull(),

    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),

    /** DB: LONGTEXT JSON-string {"html":"..."} */
    content: longtext('content').notNull(),

    summary: varchar('summary', { length: 1000 }),
    featured_image_alt: varchar('featured_image_alt', { length: 255 }),

    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),

    tags: varchar('tags', { length: 1000 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('ux_custom_pages_i18n_parent_locale').on(t.page_id, t.locale),
    uniqueIndex('ux_custom_pages_i18n_locale_slug').on(t.locale, t.slug),
    index('custom_pages_i18n_page_idx').on(t.page_id),
    index('custom_pages_i18n_locale_idx').on(t.locale),
    index('custom_pages_i18n_slug_idx').on(t.slug),
  ],
);

export type CustomPageRow = typeof customPages.$inferSelect;
export type NewCustomPageRow = typeof customPages.$inferInsert;

export type CustomPageI18nRow = typeof customPagesI18n.$inferSelect;
export type NewCustomPageI18nRow = typeof customPagesI18n.$inferInsert;
