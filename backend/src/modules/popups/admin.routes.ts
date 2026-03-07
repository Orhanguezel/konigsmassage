// =============================================================
// FILE: src/modules/popups/admin.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import {
  adminListPopups,
  adminGetPopup,
  adminCreatePopup,
  adminUpdatePopup,
  adminDeletePopup,
  adminReorderPopups,
  adminSetPopupStatus,
} from "./admin.controller";

export async function registerPopupsAdmin(app: FastifyInstance) {
  const BASE = "/popups";

  app.get<{ Querystring: unknown }>(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListPopups
  );

  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminGetPopup
  );

  app.post<{ Body: unknown }>(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreatePopup
  );

  app.patch<{ Params: { id: string }; Body: unknown }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminUpdatePopup
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeletePopup
  );

  app.post<{ Body: unknown }>(
    `${BASE}/reorder`,
    { preHandler: [requireAuth, requireAdmin] },
    adminReorderPopups
  );

  app.patch<{ Params: { id: string }; Body: unknown }>(
    `${BASE}/:id/status`,
    { preHandler: [requireAuth, requireAdmin] },
    adminSetPopupStatus
  );
}
