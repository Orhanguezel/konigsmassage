// =============================================================
// FILE: src/modules/slider/admin.routes.ts  (ADMIN ROUTES)
// =============================================================
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";

import {
  adminListSlides,
  adminGetSlide,
  adminCreateSlide,
  adminUpdateSlide,
  adminDeleteSlide,
  adminReorderSlides,
  adminSetStatus,
  adminSetSliderImage,
} from "./admin.controller";

export async function registerSliderAdmin(app: FastifyInstance) {
  const BASE = "/sliders";

  // ✔ Tek guard: önce auth, sonra admin. reply.sent pattern.
  const adminGuard = async (
    req: FastifyRequest,
    reply: FastifyReply,
  ) => {
    await requireAuth(req, reply);
    if (reply.sent) return;
    await requireAdmin(req, reply);
  };

  // LIST
  app.get(
    `${BASE}`,
    {
      preHandler: adminGuard,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    adminListSlides,
  );

  // DETAIL (id + optional locale query)
  app.get(
    `${BASE}/:id`,
    {
      preHandler: adminGuard,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    adminGetSlide,
  );

  // CREATE
  app.post(
    `${BASE}`,
    {
      preHandler: adminGuard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    adminCreateSlide,
  );

  // UPDATE (partial + locale i18n upsert)
  app.patch(
    `${BASE}/:id`,
    {
      preHandler: adminGuard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    adminUpdateSlide,
  );

  // DELETE
  app.delete(
    `${BASE}/:id`,
    {
      preHandler: adminGuard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    adminDeleteSlide,
  );

  // REORDER (parent id listesi)
  app.post(
    `${BASE}/reorder`,
    {
      preHandler: adminGuard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    adminReorderSlides,
  );

  // STATUS (parent is_active)
  app.post(
    `${BASE}/:id/status`,
    {
      preHandler: adminGuard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    adminSetStatus,
  );

  // IMAGE (storage ile set/kaldır – parent)
  app.patch(
    `${BASE}/:id/image`,
    {
      preHandler: adminGuard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    adminSetSliderImage,
  );
}
