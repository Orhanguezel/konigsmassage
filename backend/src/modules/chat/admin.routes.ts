// =============================================================
// FILE: src/modules/chat/admin.routes.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import { chatAdminController } from "./admin.controller";

const BASE = "/chat/threads";

export async function registerChatAdmin(app: FastifyInstance) {
  const c = chatAdminController(app);

  // existing guards (adjust import paths to your project)
  const { requireAuth, requireAdmin } = (app as any);

  app.get(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminListThreads,
  );

  app.get(
    `${BASE}/:id/messages`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminListMessages,
  );
}
