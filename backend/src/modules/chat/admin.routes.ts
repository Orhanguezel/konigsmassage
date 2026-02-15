// =============================================================
// FILE: src/modules/chat/admin.routes.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import { chatAdminController } from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";

const BASE = "/chat/threads";
const KNOWLEDGE_BASE = "/chat/knowledge";

export async function registerChatAdmin(app: FastifyInstance) {
  const c = chatAdminController(app);

  app.get(`${BASE}`, { preHandler: [requireAuth, requireAdmin] }, c.adminListThreads);

  app.get(
    `${BASE}/:id/messages`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminListMessages,
  );

  app.post(
    `${BASE}/:id/messages`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminPostMessage,
  );

  app.post(`${BASE}/:id/takeover`, { preHandler: [requireAuth, requireAdmin] }, c.adminTakeOverThread);

  app.post(
    `${BASE}/:id/release-to-ai`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminReleaseToAi,
  );

  app.patch(
    `${BASE}/:id/ai-provider`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminSetAiProvider,
  );

  app.get(
    `${KNOWLEDGE_BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminListAiKnowledge,
  );

  app.get(
    `${KNOWLEDGE_BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminGetAiKnowledge,
  );

  app.post(
    `${KNOWLEDGE_BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminCreateAiKnowledge,
  );

  app.patch(
    `${KNOWLEDGE_BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminUpdateAiKnowledge,
  );

  app.delete(
    `${KNOWLEDGE_BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminDeleteAiKnowledge,
  );
}
