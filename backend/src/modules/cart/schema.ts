// src/modules/cart/schema.ts
import { mysqlTable, char, int, text, datetime, index, foreignKey } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { properties } from "../proporties/schema";
import { users } from "../auth/schema";

/** CART ITEMS (DB kolonu: options; API'de selected_options olarak map'lenecek) */
export const cartItems = mysqlTable(
  'cart_items',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull(),
    property_id: char('property_id', { length: 36 }).notNull(),
    quantity: int('quantity').notNull().default(1),
    options: text('options').$type<string | null>(),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('cart_items_user_idx').on(t.user_id),
    index('cart_items_property_idx').on(t.property_id),

    foreignKey({
      columns: [t.property_id],
      foreignColumns: [properties.id],
      name: 'fk_cart_items_property_id_properties_id',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),

    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: 'fk_cart_items_user_id_users_id',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

// Tipler
export type CartItemRow   = typeof cartItems.$inferSelect;
export type CartItem      = typeof cartItems.$inferSelect;
export type NewCartItem   = typeof cartItems.$inferInsert;
export type CartItemInsert = typeof cartItems.$inferInsert;
