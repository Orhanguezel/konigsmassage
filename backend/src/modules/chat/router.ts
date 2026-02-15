// =============================================================
// FILE: src/modules/chat/router.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import { chatController } from "./controller";

const BASE = "/chat";

export async function registerChat(app: FastifyInstance) {
  const c = chatController(app);

  // REST
  app.get(`${BASE}/threads`, { config: { auth: true } }, c.listThreads);
  app.post(`${BASE}/threads`, { config: { auth: true } }, c.createOrGetThread);

  app.get(`${BASE}/threads/:id/messages`, { config: { auth: true } }, c.listMessages);
  app.post(`${BASE}/threads/:id/messages`, { config: { auth: true } }, c.postMessage);
  app.post(`${BASE}/threads/:id/request-admin`, { config: { auth: true } }, c.requestAdminHandoff);

  // WS upgrade route is optional and only enabled if websocket plugin is already registered.
  if ((app as any).websocketServer) {
    (app as any).get(
      `${BASE}/ws`,
      { websocket: true, config: { auth: true } },
      c.chatWs,
    );
  }
}
