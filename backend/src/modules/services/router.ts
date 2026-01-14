// src/modules/services/router.ts
// =============================================================

import type { FastifyInstance } from 'fastify';
import {
  listServicesPublic,
  getServicePublic,
  getServiceBySlugPublic,
  listServiceImagesPublic,
} from './controller';

const BASE = '/services';

export async function registerServices(app: FastifyInstance) {
  app.get(`${BASE}`, { config: { public: true } }, listServicesPublic);
  app.get(`${BASE}/:id`, { config: { public: true } }, getServicePublic);
  app.get(`${BASE}/by-slug/:slug`, { config: { public: true } }, getServiceBySlugPublic);

  // gallery (public)
  app.get(`${BASE}/:id/images`, { config: { public: true } }, listServiceImagesPublic);
}
