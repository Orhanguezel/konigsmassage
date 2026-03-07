// src/modules/orders/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "@/common/middleware/auth";

export async function registerOrders(app: FastifyInstance) {
  const BASE = "/orders";

  // ── Sabit path'ler ÖNCE — /:id parametresinden önce kaydedilmeli ──

  // Addresses
  app.get(`${BASE}/addresses`, { preHandler: [requireAuth] }, controller.listAddresses);
  app.post(`${BASE}/addresses`, { preHandler: [requireAuth] }, controller.createAddress);

  // Gateways (sabit → /:id'den önce)
  app.get(`${BASE}/gateways`, controller.listGateways);

  // Callback (sabit → /:id/... den önce)
  app.post(`${BASE}/iyzico/callback`, controller.iyzicoCallback);

  // ── Orders list & create (trailing slash olmadan) ──
  app.get(BASE, { preHandler: [requireAuth] }, controller.listOrders);
  app.post(BASE, { preHandler: [requireAuth] }, controller.createOrder);

  // ── Dinamik parametreli path'ler EN SONDA ──
  app.post<{ Params: { id: string } }>(`${BASE}/:id/init-iyzico`, { preHandler: [requireAuth] }, controller.initIyzico);
  app.get<{ Params: { id: string } }>(`${BASE}/:id`, { preHandler: [requireAuth] }, controller.getOrderDetail);
}
