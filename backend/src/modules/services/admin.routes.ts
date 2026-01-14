// src/modules/services/admin.routes.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import {
  listServicesAdmin,
  getServiceAdmin,
  getServiceBySlugAdmin,
  createServiceAdmin,
  updateServiceAdmin,
  removeServiceAdmin,
  listServiceImagesAdmin,
  createServiceImageAdmin,
  updateServiceImageAdmin,
  removeServiceImageAdmin,
  reorderServicesAdmin,
} from "./admin.controller";

const BASE = "/services";

export async function registerServicesAdmin(app: FastifyInstance) {
  // services
  app.get(`${BASE}`, { config: { auth: true } }, listServicesAdmin);
  app.get(`${BASE}/:id`, { config: { auth: true } }, getServiceAdmin);
  app.get(
    `${BASE}/by-slug/:slug`,
    { config: { auth: true } },
    getServiceBySlugAdmin,
  );

  app.post(`${BASE}`, { config: { auth: true } }, createServiceAdmin);
  app.patch(`${BASE}/:id`, { config: { auth: true } }, updateServiceAdmin);
  app.delete(`${BASE}/:id`, { config: { auth: true } }, removeServiceAdmin);

  // gallery
  app.get(
    `${BASE}/:id/images`,
    { config: { auth: true } },
    listServiceImagesAdmin,
  );
  app.post(
    `${BASE}/:id/images`,
    { config: { auth: true } },
    createServiceImageAdmin,
  );
  app.patch(
    `${BASE}/:id/images/:imageId`,
    { config: { auth: true } },
    updateServiceImageAdmin,
  );
  app.delete(
    `${BASE}/:id/images/:imageId`,
    { config: { auth: true } },
    removeServiceImageAdmin,
  );
   // reorder (display_order)
  app.post(
    `${BASE}/reorder`,
    { config: { auth: true } },
    reorderServicesAdmin,
  );
}
