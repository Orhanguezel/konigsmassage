// =============================================================
// FILE: src/modules/resources/controller.ts
// FINAL — LOCKED — Public resources controller (active only)
// =============================================================

import type { RouteHandler } from 'fastify';
import { publicListResourcesQuerySchema } from './validation';
import { listResourcesPublic } from './repository';

export const listResourcesPublicHandler: RouteHandler = async (req, reply) => {
  try {
    const q = publicListResourcesQuerySchema.parse((req as any).query ?? {});
    const rows = await listResourcesPublic({ type: q.type });
    return reply.send(rows);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resources_public_list_failed' } });
  }
};
