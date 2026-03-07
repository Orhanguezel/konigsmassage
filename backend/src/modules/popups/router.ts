// =============================================================
// FILE: src/modules/popups/router.ts  — Public
// =============================================================
import type { FastifyInstance } from "fastify";
import { listPopups } from "./controller";

export async function registerPopups(app: FastifyInstance) {
  app.get("/popups", { config: { public: true } }, listPopups);
}
