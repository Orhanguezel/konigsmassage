// src/modules/orders/schema.ts
import { mysqlTable, char, varchar, decimal, text, datetime, index, foreignKey, tinyint, int } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "../auth/schema";

// 1. Payment Gateways
export const paymentGateways = mysqlTable(
  "payment_gateways",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    is_active: tinyint("is_active").notNull().default(1),
    is_test_mode: tinyint("is_test_mode").notNull().default(1),
    config: text("config"), // JSON
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("payment_gateways_slug_unique").on(t.slug),
  ]
);

// 2. User Addresses
export const userAddresses = mysqlTable(
  "user_addresses",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    full_name: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    address_line: text("address_line").notNull(),
    city: varchar("city", { length: 128 }).notNull(),
    district: varchar("district", { length: 128 }).notNull(),
    postal_code: varchar("postal_code", { length: 32 }),
    is_default: tinyint("is_default").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("user_addresses_user_id_idx").on(t.user_id),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: "fk_user_addresses_user",
    }).onDelete("cascade").onUpdate("cascade"),
  ]
);

// 3. Orders
export const orders = mysqlTable(
  "orders",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    order_number: varchar("order_number", { length: 50 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    total_amount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("EUR"),
    shipping_address_id: char("shipping_address_id", { length: 36 }),
    billing_address_id: char("billing_address_id", { length: 36 }),
    payment_gateway_id: char("payment_gateway_id", { length: 36 }),
    payment_status: varchar("payment_status", { length: 50 }).notNull().default("unpaid"),
    order_notes: text("order_notes"),
    transaction_id: varchar("transaction_id", { length: 255 }),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("orders_number_unique").on(t.order_number),
    index("orders_user_id_idx").on(t.user_id),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: "fk_orders_user",
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      columns: [t.payment_gateway_id],
      foreignColumns: [paymentGateways.id],
      name: "fk_orders_gateway",
    }).onDelete("set null").onUpdate("cascade"),
  ]
);

// 4. Order Items
export const orderItems = mysqlTable(
  "order_items",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    order_id: char("order_id", { length: 36 }).notNull(),
    item_type:   varchar("item_type", { length: 50 }).notNull().default("service"), // service | gutschein | other
    item_ref_id: char("item_ref_id", { length: 36 }),  // generische Referenz (nullable)
    title:    varchar("title", { length: 255 }).notNull(),
    quantity: int("quantity").notNull().default(1),
    price:    decimal("price", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("EUR"),
    options:  text("options"), // JSON
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.order_id),
    index("order_items_item_type_idx").on(t.item_type),
    foreignKey({
      columns: [t.order_id],
      foreignColumns: [orders.id],
      name: "fk_order_items_order",
    }).onDelete("cascade").onUpdate("cascade"),
  ]
);

// 5. Payments
export const payments = mysqlTable(
  "payments",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    order_id: char("order_id", { length: 36 }).notNull(),
    gateway_id: char("gateway_id", { length: 36 }).notNull(),
    transaction_id: varchar("transaction_id", { length: 255 }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("TRY"),
    status: varchar("status", { length: 50 }).notNull(),
    raw_response: text("raw_response"), // JSON
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("payments_order_id_idx").on(t.order_id),
    foreignKey({
      columns: [t.order_id],
      foreignColumns: [orders.id],
      name: "fk_payments_order",
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      columns: [t.gateway_id],
      foreignColumns: [paymentGateways.id],
      name: "fk_payments_gateway",
    }).onDelete("cascade").onUpdate("cascade"),
  ]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
