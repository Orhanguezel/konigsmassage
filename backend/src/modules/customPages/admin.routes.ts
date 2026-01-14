// src/modules/customPages/admin.routes.ts

import type { FastifyInstance } from 'fastify';
import {
  listPagesAdmin,
  getPageAdmin,
  getPageBySlugAdmin,
  createPageAdmin,
  updatePageAdmin,
  removePageAdmin,
  reorderCustomPagesAdmin,
} from './admin.controller';

const BASE = '/custom_pages';

export async function registerCustomPagesAdmin(app: FastifyInstance) {
  app.get(`${BASE}`, { config: { auth: true, admin: true } }, listPagesAdmin);

  app.get(`${BASE}/:id`, { config: { auth: true, admin: true } }, getPageAdmin);

  app.get(`${BASE}/by-slug/:slug`, { config: { auth: true, admin: true } }, getPageBySlugAdmin);

  app.post(`${BASE}`, { config: { auth: true, admin: true } }, createPageAdmin);

  app.patch(`${BASE}/:id`, { config: { auth: true, admin: true } }, updatePageAdmin);

  app.delete(`${BASE}/:id`, { config: { auth: true, admin: true } }, removePageAdmin);

  app.post(`${BASE}/reorder`, { config: { auth: true, admin: true } }, reorderCustomPagesAdmin);
}
