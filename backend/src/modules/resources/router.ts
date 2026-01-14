// src/modules/resources/router.ts
import type { FastifyInstance } from 'fastify';
import { listResourcesPublicHandler } from './controller';

export async function registerResources(app: FastifyInstance) {
  const BASE = '/resources';
  app.get(BASE, listResourcesPublicHandler);
}
