// ===================================================================
// FILE: src/modules/footerSections/admin.routes.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  listFooterSectionsAdmin,
  getFooterSectionAdmin,
  getFooterSectionBySlugAdmin,
  createFooterSectionAdmin,
  updateFooterSectionAdmin,
  removeFooterSectionAdmin,
} from "./admin.controller";

const BASE = "/footer_sections";

export async function registerFooterSectionsAdmin(app: FastifyInstance) {
  app.get(`${BASE}`, { preHandler: [requireAuth] }, listFooterSectionsAdmin);
  app.get(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    getFooterSectionAdmin,
  );
  app.get(
    `${BASE}/by-slug/:slug`,
    { preHandler: [requireAuth] },
    getFooterSectionBySlugAdmin,
  );
  app.post(
    `${BASE}`,
    { preHandler: [requireAuth] },
    createFooterSectionAdmin,
  );
  app.patch(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    updateFooterSectionAdmin,
  );
  app.delete(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    removeFooterSectionAdmin,
  );
}
