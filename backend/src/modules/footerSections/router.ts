// ===================================================================
// FILE: src/modules/footerSections/router.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import {
  listFooterSectionsPublic,
  getFooterSectionPublic,
  getFooterSectionBySlugPublic,
} from "./controller";

const BASE = "/footer_sections";

export async function registerFooterSections(app: FastifyInstance) {
  app.get(`${BASE}`, { config: { public: true } }, listFooterSectionsPublic);
  app.get(
    `${BASE}/:id`,
    { config: { public: true } },
    getFooterSectionPublic,
  );
  app.get(
    `${BASE}/by-slug/:slug`,
    { config: { public: true } },
    getFooterSectionBySlugPublic,
  );
}
