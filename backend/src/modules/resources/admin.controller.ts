// =============================================================
// FILE: src/modules/resources/admin.controller.ts
// FINAL — LOCKED — Admin resources controller
// =============================================================

import type { RouteHandler } from 'fastify';

import {
  adminListResourcesQuerySchema,
  adminCreateResourceBodySchema,
  adminUpdateResourceBodySchema,
  
} from './validation';

import {
  listResourcesAdmin,
  getResourceByIdAdmin,
  createResourceAdmin,
  updateResourceByIdAdmin,
  deleteResourceByIdAdmin,
} from './repository';

import { toActive01 } from '@/modules/_shared';

const safeText = (v: unknown) => String(v ?? '').trim();

export const listResourcesAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const q = adminListResourcesQuerySchema.parse((req as any).query ?? {});
    const rows = await listResourcesAdmin(q);
    return reply.send(rows);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resources_list_failed' } });
  }
};

export const getResourceAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const row = await getResourceByIdAdmin(id);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resource_get_failed' } });
  }
};

export const createResourceAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const body = adminCreateResourceBodySchema.parse(req.body ?? {});
    const isActive = typeof body.is_active === 'undefined' ? 1 : toActive01(body.is_active) ?? 1;

    const capacityRaw = typeof body.capacity === 'number' ? body.capacity : 1;
    const capacity = Number.isFinite(capacityRaw) && capacityRaw >= 1 ? Math.floor(capacityRaw) : 1;

    const created = await createResourceAdmin({
      type: body.type ?? 'other',
      title: body.title,
      capacity,
      external_ref_id: body.external_ref_id ? String(body.external_ref_id) : null,
      is_active: isActive,
    });

    return reply.code(201).send(created);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resource_create_failed' } });
  }
};

export const updateResourceAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const body = adminUpdateResourceBodySchema.parse(req.body ?? {});
    const existing = await getResourceByIdAdmin(id);
    if (!existing) return reply.code(404).send({ error: { message: 'not_found' } });

    const patch: any = {};

    if (Object.prototype.hasOwnProperty.call(body, 'type')) {
      patch.type = body.type ? safeText(body.type) : 'other';
    }

    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      if (typeof body.title === 'string' && body.title.trim()) patch.title = safeText(body.title);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'capacity')) {
      if (typeof body.capacity === 'number') {
        const c = Math.floor(body.capacity);
        if (Number.isFinite(c) && c >= 1) patch.capacity = c;
      }
      // null gönderilirse capacity'yi bozmayalım: update yapmıyoruz
    }

    if (Object.prototype.hasOwnProperty.call(body, 'external_ref_id')) {
      patch.external_ref_id = body.external_ref_id ? safeText(body.external_ref_id) : null;
    }

    if (typeof body.is_active !== 'undefined') {
      const a = toActive01(body.is_active);
      if (typeof a !== 'undefined') patch.is_active = a;
    }

    const updated = await updateResourceByIdAdmin(id, patch);
    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resource_update_failed' } });
  }
};

export const deleteResourceAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const existing = await getResourceByIdAdmin(id);
    if (!existing) return reply.code(404).send({ error: { message: 'not_found' } });

    await deleteResourceByIdAdmin(id);
    return reply.code(204).send();
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resource_delete_failed' } });
  }
};
