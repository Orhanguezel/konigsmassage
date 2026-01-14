// =============================================================
// FILE: src/modules/review/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  boolean,
  int,
  tinyint,
  timestamp,
} from "drizzle-orm/mysql-core";

export const reviews = mysqlTable("reviews", {
  id: char("id", { length: 36 }).primaryKey().notNull(),

  target_type: varchar("target_type", { length: 50 }).notNull(),
  target_id: char("target_id", { length: 36 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),

  rating: tinyint("rating").notNull(), // 1..5

  is_active: boolean("is_active").notNull().default(true),
  is_approved: boolean("is_approved").notNull().default(false),
  display_order: int("display_order").notNull().default(0),

  likes_count: int("likes_count").notNull().default(0),
  dislikes_count: int("dislikes_count").notNull().default(0),
  helpful_count: int("helpful_count").notNull().default(0),

  submitted_locale: varchar("submitted_locale", { length: 8 }).notNull(),

  created_at: timestamp("created_at", { fsp: 3 })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { fsp: 3 })
    .notNull()
    .defaultNow()
    .onUpdateNow(),
});

// I18N TABLO: review_i18n
export const reviewTranslations = mysqlTable("review_i18n", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  review_id: char("review_id", { length: 36 }).notNull(),
  locale: varchar("locale", { length: 8 }).notNull(),

  // NULL olabilir → default/null vermeye gerek yok, MySQL'de zaten DEFAULT NULL
  title: varchar("title", { length: 255 }),
  comment: text("comment").notNull(),
  admin_reply: text("admin_reply"),

  created_at: timestamp("created_at", { fsp: 3 })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { fsp: 3 })
    .notNull()
    .defaultNow()
    .onUpdateNow(),
});

// Önerilen indexler / constraintler migration SQL'de (060_reviews.sql)

export type ReviewRow = typeof reviews.$inferSelect;
export type ReviewInsert = typeof reviews.$inferInsert;

export type ReviewTranslationRow = typeof reviewTranslations.$inferSelect;
export type ReviewTranslationInsert = typeof reviewTranslations.$inferInsert;

/** FE/Public View tipi (coalesced) */
export type ReviewView = ReviewRow & {
  comment: string | null;
  locale_resolved: string | null;
};
