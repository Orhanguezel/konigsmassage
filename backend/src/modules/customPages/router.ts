// src/modules/customPages/router.ts

import type { FastifyInstance } from "fastify";
import { listPages, getPage, getPageBySlug } from "./controller";

const BASE = "/custom_pages";

export async function registerCustomPages(app: FastifyInstance) {
  app.get(`${BASE}`, { config: { public: true } }, listPages);
  app.get(`${BASE}/:id`, { config: { public: true } }, getPage);
  app.get(
    `${BASE}/by-slug/:slug`,
    { config: { public: true } },
    getPageBySlug,
  );
}
