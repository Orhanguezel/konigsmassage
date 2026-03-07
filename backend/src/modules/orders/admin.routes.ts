// src/modules/orders/admin.routes.ts
import type { FastifyInstance, RouteHandler } from "fastify";
import { db } from "@/db/client";
import { orders, orderItems, payments, paymentGateways } from "./schema";
import { users } from "../auth/schema";
import { eq, desc, sql, like, or, and } from "drizzle-orm";
import { z } from "zod";

const BASE = "/orders";

const orderStatusSchema = z.object({
  status:         z.enum(["pending", "processing", "completed", "cancelled", "refunded"]).optional(),
  payment_status: z.enum(["unpaid", "paid", "failed", "refunded"]).optional(),
  admin_note:     z.string().max(2000).optional().nullish(),
});

// ── List Orders ───────────────────────────────────────────────────────────────
const listOrdersAdmin: RouteHandler = async (req, reply) => {
  const { page = "1", limit = "20", status, payment_status, q } = req.query as Record<string, string>;
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const conditions: ReturnType<typeof eq>[] = [];
  if (status)         conditions.push(eq(orders.status, status));
  if (payment_status) conditions.push(eq(orders.payment_status, payment_status));
  if (q) {
    conditions.push(
      or(
        like(orders.order_number, `%${q}%`),
        like(users.email, `%${q}%`),
      ) as any,
    );
  }

  const base = db
    .select({
      id:             orders.id,
      order_number:   orders.order_number,
      status:         orders.status,
      payment_status: orders.payment_status,
      total_amount:   orders.total_amount,
      currency:       orders.currency,
      transaction_id: orders.transaction_id,
      user_id:        orders.user_id,
      user_email:     users.email,
      user_name:      users.full_name,
      order_notes:    orders.order_notes,
      created_at:     orders.created_at,
      updated_at:     orders.updated_at,
    })
    .from(orders)
    .leftJoin(users, eq(orders.user_id, users.id))
    .orderBy(desc(orders.created_at))
    .limit(limitNum)
    .offset(offset);

  const rows = conditions.length
    ? await base.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    : await base;

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(orders);

  reply.header("x-total-count", String(count));
  return reply.send({ data: rows, page: pageNum, limit: limitNum, total: count });
};

// ── Get Single Order ──────────────────────────────────────────────────────────
const getOrderAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const [order] = await db
    .select({
      id:             orders.id,
      order_number:   orders.order_number,
      status:         orders.status,
      payment_status: orders.payment_status,
      total_amount:   orders.total_amount,
      currency:       orders.currency,
      transaction_id: orders.transaction_id,
      order_notes:    orders.order_notes,
      user_id:        orders.user_id,
      user_email:     users.email,
      user_name:      users.full_name,
      created_at:     orders.created_at,
      updated_at:     orders.updated_at,
    })
    .from(orders)
    .leftJoin(users, eq(orders.user_id, users.id))
    .where(eq(orders.id, req.params.id))
    .limit(1);

  if (!order) return reply.code(404).send({ error: "order_not_found" });

  const items       = await db.select().from(orderItems).where(eq(orderItems.order_id, order.id));
  const orderPayments = await db.select().from(payments).where(eq(payments.order_id, order.id));

  return reply.send({ ...order, items, payments: orderPayments });
};

// ── Update Order Status ───────────────────────────────────────────────────────
const updateOrderAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const parsed = orderStatusSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });

  const updates: Record<string, unknown> = {};
  if (parsed.data.status         !== undefined) updates.status         = parsed.data.status;
  if (parsed.data.payment_status !== undefined) updates.payment_status = parsed.data.payment_status;
  if (parsed.data.admin_note     !== undefined) updates.order_notes    = parsed.data.admin_note ?? null;

  if (Object.keys(updates).length === 0)
    return reply.code(400).send({ error: "no_fields_to_update" });

  await db.update(orders).set(updates).where(eq(orders.id, req.params.id));
  return reply.send({ success: true });
};

// ── List Payment Gateways (admin) ─────────────────────────────────────────────
const listGatewaysAdmin: RouteHandler = async (_req, reply) => {
  const rows = await db.select().from(paymentGateways).orderBy(paymentGateways.name);
  return reply.send(rows);
};

const createGatewayAdmin: RouteHandler = async (req, reply) => {
  const schema = z.object({
    name:         z.string().min(1).max(255),
    slug:         z.string().min(1).max(100),
    is_active:    z.coerce.number().int().min(0).max(1).default(1),
    is_test_mode: z.coerce.number().int().min(0).max(1).default(1),
    config:       z.record(z.unknown()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });

  const { randomUUID } = await import("crypto");
  const id = randomUUID();
  await db.insert(paymentGateways).values({
    id,
    name:         parsed.data.name,
    slug:         parsed.data.slug,
    is_active:    parsed.data.is_active,
    is_test_mode: parsed.data.is_test_mode,
    config:       parsed.data.config ? JSON.stringify(parsed.data.config) : null,
  });
  return reply.code(201).send({ success: true, id });
};

const updateGatewayAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const schema = z.object({
    name:         z.string().min(1).max(255).optional(),
    is_active:    z.coerce.number().int().min(0).max(1).optional(),
    is_test_mode: z.coerce.number().int().min(0).max(1).optional(),
    config:       z.record(z.unknown()).optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });

  const updates: Record<string, unknown> = {};
  if (parsed.data.name         !== undefined) updates.name         = parsed.data.name;
  if (parsed.data.is_active    !== undefined) updates.is_active    = parsed.data.is_active;
  if (parsed.data.is_test_mode !== undefined) updates.is_test_mode = parsed.data.is_test_mode;
  if (parsed.data.config       !== undefined)
    updates.config = parsed.data.config ? JSON.stringify(parsed.data.config) : null;

  if (Object.keys(updates).length === 0)
    return reply.code(400).send({ error: "no_fields_to_update" });

  await db.update(paymentGateways).set(updates).where(eq(paymentGateways.id, req.params.id));
  return reply.send({ success: true });
};

// ── Refund Order ──────────────────────────────────────────────────────────────
const refundOrderAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const schema = z.object({
    reason: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success)
    return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });

  const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
  if (!order) return reply.code(404).send({ error: "order_not_found" });
  if (order.payment_status !== "paid")
    return reply.code(400).send({ error: "order_not_paid" });

  // Update order status
  await db.update(orders).set({
    status: "refunded",
    payment_status: "refunded",
    order_notes: parsed.data.reason
      ? `${order.order_notes ? order.order_notes + "\n" : ""}[REFUND] ${parsed.data.reason}`
      : order.order_notes,
  }).where(eq(orders.id, req.params.id));

  return reply.send({ success: true });
};

// ── Route Registration ────────────────────────────────────────────────────────
export async function registerOrdersAdmin(app: FastifyInstance) {
  app.get(BASE,                          { config: { auth: true } }, listOrdersAdmin);
  app.get(`${BASE}/:id`,                 { config: { auth: true } }, getOrderAdmin);
  app.patch(`${BASE}/:id`,               { config: { auth: true } }, updateOrderAdmin);
  app.post(`${BASE}/:id/refund`,         { config: { auth: true } }, refundOrderAdmin);

  app.get("/payment-gateways",           { config: { auth: true } }, listGatewaysAdmin);
  app.post("/payment-gateways",          { config: { auth: true } }, createGatewayAdmin);
  app.patch("/payment-gateways/:id",     { config: { auth: true } }, updateGatewayAdmin);
}
