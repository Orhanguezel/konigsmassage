// src/modules/orders/controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { orders, orderItems, userAddresses, paymentGateways, payments, type NewOrderItem } from "./schema";
import { and, eq, desc } from "drizzle-orm";
import { IyzicoService, resolveIyzicoLocale } from "./iyzico.service";
import { addressCreateSchema, orderCreateSchema } from "./validation";
import { DEFAULT_LOCALE } from "@/core/i18n";

/** JWT payload'dan user bilgilerini normalize et.
 * Fastify-jwt sub → userId olarak map eder; id alanı payload'da olmayabilir.
 */
function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? "") as string;
  const email = (u?.email ?? "") as string;
  const full_name = (u?.full_name ?? u?.name ?? null) as string | null;
  const phone = (u?.phone ?? null) as string | null;
  return { id, email, full_name, phone };
}

/** Yardımcı: istekten locale çıkar (query > req.locale > DEFAULT_LOCALE) */
function resolveLocale(req: { query?: unknown; locale?: string }): string {
  const fromQuery = ((req.query as Record<string, string> | undefined)?.locale ?? "").trim().toLowerCase();
  if (fromQuery) return fromQuery;
  const fromReq = (req.locale ?? "").trim().toLowerCase();
  if (fromReq) return fromReq;
  return (DEFAULT_LOCALE || "tr").toLowerCase();
}

/** List Payment Gateways */
export const listGateways: RouteHandler = async (_req, reply) => {
  const rows = await db.select().from(paymentGateways).where(eq(paymentGateways.is_active, 1));
  return reply.send(rows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    is_test_mode: !!r.is_test_mode,
  })));
};

/** Create Address */
export const createAddress: RouteHandler = async (req, reply) => {
  const user = getUser(req);

  const parsed = addressCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
  }
  const body = parsed.data;
  const id = randomUUID();

  // If set to default, unset others
  if (body.is_default) {
    await db.update(userAddresses).set({ is_default: 0 }).where(eq(userAddresses.user_id, user.id));
  }

  await db.insert(userAddresses).values({
    id,
    user_id: user.id,
    title: body.title,
    full_name: body.full_name,
    phone: body.phone,
    email: body.email ?? null,
    address_line: body.address_line,
    city: body.city,
    district: body.district,
    postal_code: body.postal_code ?? null,
    is_default: body.is_default ? 1 : 0,
  });

  return reply.send({ success: true, id });
};

/** List Addresses */
export const listAddresses: RouteHandler = async (req, reply) => {
  const user = getUser(req);
  const rows = await db.select().from(userAddresses).where(eq(userAddresses.user_id, user.id)).orderBy(desc(userAddresses.is_default));
  return reply.send(rows);
};

/** Create Order */
export const createOrder: RouteHandler = async (req, reply) => {
  const user = getUser(req);

  const parsed = orderCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
  }
  const body = parsed.data;

  // 1. Resolve Gateway
  const [gateway] = await db.select().from(paymentGateways)
    .where(and(eq(paymentGateways.slug, body.payment_gateway_slug), eq(paymentGateways.is_active, 1)))
    .limit(1);

  if (!gateway) return reply.code(400).send({ error: "Invalid payment gateway" });

  // 2. Calculate Total & Build Items
  let totalAmount = 0;
  const itemsToInsert: NewOrderItem[] = [];

  for (const item of body.items) {
    const price = item.price;
    const qty   = item.quantity;
    totalAmount += price * qty;

    itemsToInsert.push({
      id:          randomUUID(),
      order_id:    "",
      item_type:   item.item_type ?? "service",
      item_ref_id: item.item_ref_id ?? null,
      title:       item.title,
      quantity:    qty,
      price:       price.toFixed(2),
      currency:    item.currency ?? body.currency ?? "EUR",
    });
  }

  if (itemsToInsert.length === 0) return reply.code(400).send({ error: "No valid items" });

  const orderId     = randomUUID();
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 3. Insert Order
  await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      id:                  orderId,
      user_id:             user.id,
      order_number:        orderNumber,
      status:              "pending",
      total_amount:        totalAmount.toFixed(2),
      currency:            body.currency ?? itemsToInsert[0].currency ?? "EUR",
      shipping_address_id: body.shipping_address_id ?? null,
      billing_address_id:  body.billing_address_id ?? body.shipping_address_id ?? null,
      payment_gateway_id:  gateway.id,
      payment_status:      "unpaid",
      order_notes:         body.order_notes ?? null,
    });

    for (const oi of itemsToInsert) {
      await tx.insert(orderItems).values({ ...oi, order_id: orderId });
    }
  });

  return reply.send({ success: true, order_id: orderId, order_number: orderNumber });
};

/** Initialize Iyzico Session */
export const initIyzico: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const user = getUser(req);
  const orderId = req.params.id;

  // Locale: istek dilinden çözümle
  const requestLocale = resolveLocale(req);
  const iyzicoLocale = resolveIyzicoLocale(requestLocale);

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.user_id !== user.id) return reply.code(404).send({ error: "Order not found" });

  const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.slug, "iyzico")).limit(1);
  if (!gateway) return reply.code(400).send({ error: "Iyzico gateway not configured" });

  const config = (() => {
    const fromDb = JSON.parse(gateway.config || "{}") as Partial<{ apiKey: string; secretKey: string; baseUrl: string }>;
    return {
      apiKey:     fromDb.apiKey     ?? process.env.IYZICO_API_KEY    ?? "",
      secretKey:  fromDb.secretKey  ?? process.env.IYZICO_SECRET_KEY ?? "",
      baseUrl:    fromDb.baseUrl    ?? (process.env.IYZICO_TEST_MODE === "false"
                    ? "https://api.iyzipay.com"
                    : "https://sandbox-api.iyzipay.com"),
    };
  })();
  const iyzico = new IyzicoService(config);

  const [address] = await db.select().from(userAddresses)
    .where(eq(userAddresses.id, order.shipping_address_id || ""))
    .limit(1);

  const oItems = await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));

  const conversationId = `conv_${order.order_number}`;
  const amount = order.total_amount;

  try {
    const result = await iyzico.initializeCheckoutForm({
      locale: iyzicoLocale,
      conversationId,
      price: amount,
      paidPrice: amount,
      currency: order.currency,
      basketId: order.order_number,
      callbackUrl: `${process.env.BACKEND_URL}/api/orders/iyzico/callback?order_id=${orderId}`,
      buyer: {
        id: user.id,
        name: user.full_name?.split(" ")[0] || "Müşteri",
        surname: user.full_name?.split(" ").slice(1).join(" ") || ".",
        gsmNumber: user.phone || address?.phone || "+905000000000",
        email: user.email,
        identityNumber: "11111111111",
        lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
        registrationDate: new Date().toISOString().slice(0, 19).replace("T", " "),
        registrationAddress: address?.address_line || "Adres belirtilmedi",
        ip: req.ip,
        city: address?.city || "İstanbul",
        country: "Turkey",
        zipCode: address?.postal_code || "34000",
      },
      shippingAddress: {
        contactName: address?.full_name || user.full_name || "Müşteri",
        city: address?.city || "İstanbul",
        country: "Turkey",
        address: address?.address_line || "Adres belirtilmedi",
        zipCode: address?.postal_code || "34000",
      },
      billingAddress: {
        contactName: address?.full_name || user.full_name || "Müşteri",
        city: address?.city || "İstanbul",
        country: "Turkey",
        address: address?.address_line || "Adres belirtilmedi",
        zipCode: address?.postal_code || "34000",
      },
      basketItems: oItems.length > 0 ? oItems.map(i => ({
        id: i.id,
        name: i.title,
        category1: "Property",
        itemType: "PHYSICAL" as const,
        price: i.price,
      })) : [{
        id: orderId,
        name: `Order #${order.order_number}`,
        category1: "Payment",
        itemType: "VIRTUAL" as const,
        price: amount,
      }],
    });

    if (result["status"] === "success") {
      return reply.send({
        success: true,
        checkout_url: result["paymentPageUrl"],
        token: result["token"],
      });
    } else {
      return reply.code(400).send({ error: result["errorMessage"] });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Iyzico error";
    return reply.code(500).send({ error: msg });
  }
};

/** Iyzico Callback */
export const iyzicoCallback: RouteHandler = async (req, reply) => {
  const { order_id } = req.query as { order_id: string };
  const { token } = req.body as { token: string };

  const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.slug, "iyzico")).limit(1);
  const config = (() => {
    const fromDb = JSON.parse(gateway?.config || "{}") as Partial<{ apiKey: string; secretKey: string; baseUrl: string }>;
    return {
      apiKey:    fromDb.apiKey    ?? process.env.IYZICO_API_KEY    ?? "",
      secretKey: fromDb.secretKey ?? process.env.IYZICO_SECRET_KEY ?? "",
      baseUrl:   fromDb.baseUrl   ?? (process.env.IYZICO_TEST_MODE === "false"
                   ? "https://api.iyzipay.com"
                   : "https://sandbox-api.iyzipay.com"),
    };
  })();
  const iyzico = new IyzicoService(config);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const result = await iyzico.retrieveCheckoutResult(token);

    const isPaid = result["status"] === "success" && result["paymentStatus"] === "SUCCESS";
    const dbStatus  = isPaid ? "paid" : "failed";
    const payStatus = isPaid ? "success" : "failure";

    await db.update(orders).set({
      payment_status: dbStatus,
      status: isPaid ? "processing" : "pending",
      transaction_id: (result["paymentId"] as string | undefined) || token,
    }).where(eq(orders.id, order_id));

    await db.insert(payments).values({
      id: randomUUID(),
      order_id,
      gateway_id: gateway?.id || "",
      amount: (result["paidPrice"] as string | undefined) || "0",
      currency: (result["currency"] as string | undefined) || "TRY",
      status: payStatus,
      transaction_id: (result["paymentId"] as string | undefined) || token,
      raw_response: JSON.stringify(result),
    });

    const redirectUrl = isPaid
      ? `${siteUrl}/siparis/basarili?order_id=${order_id}`
      : `${siteUrl}/sepet?payment=failed&order_id=${order_id}`;

    return reply.redirect(redirectUrl);
  } catch {
    return reply.redirect(`${siteUrl}/sepet?payment=error`);
  }
};

/** List Orders */
export const listOrders: RouteHandler = async (req, reply) => {
  const user = getUser(req);
  const rows = await db.select().from(orders).where(eq(orders.user_id, user.id)).orderBy(desc(orders.created_at));
  return reply.send(rows);
};

/** Get Order Detail */
export const getOrderDetail: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const user = getUser(req);
  const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
  if (!order || order.user_id !== user.id) return reply.code(404).send({ error: "Order not found" });

  const items = await db.select().from(orderItems).where(eq(orderItems.order_id, order.id));

  return reply.send({ ...order, items });
};
