// ===================================================================
// FILE: src/modules/telegram/admin.controller.ts
// Telegram admin controller (inbound list + autoreply)
// ===================================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { TelegramInboundListQuerySchema, TelegramAutoReplyUpdateBodySchema } from './validation';
import { TelegramAdminRepo } from './repository';

export const TelegramAdminController = {
  async listInbound(req: FastifyRequest, reply: FastifyReply) {
    try {
      const q = TelegramInboundListQuerySchema.parse((req as any).query ?? {});
      const result = await TelegramAdminRepo.listInbound(q);
      return reply.code(200).send(result);
    } catch (e: unknown) {
      const err = e as { name?: string; issues?: unknown };
      if (err?.name === 'ZodError') {
        return reply
          .code(400)
          .send({ error: { message: 'validation_error', details: (err as any).issues } });
      }
      req.log.error(e, 'GET /admin/telegram/inbound failed');
      return reply.code(500).send({ message: 'İşlem gerçekleştirilemedi.' });
    }
  },

  async getAutoReply(req: FastifyRequest, reply: FastifyReply) {
    try {
      const cfg = await TelegramAdminRepo.getAutoReply();
      return reply.code(200).send(cfg);
    } catch (e: unknown) {
      req.log.error(e, 'GET /admin/telegram/autoreply failed');
      return reply.code(500).send({ message: 'İşlem gerçekleştirilemedi.' });
    }
  },

  async updateAutoReply(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = TelegramAutoReplyUpdateBodySchema.parse((req as any).body ?? {});
      const result = await TelegramAdminRepo.upsertAutoReply(body);
      return reply.code(200).send(result);
    } catch (e: unknown) {
      const err = e as { name?: string; issues?: unknown };
      if (err?.name === 'ZodError') {
        return reply
          .code(400)
          .send({ error: { message: 'validation_error', details: (err as any).issues } });
      }
      req.log.error(e, 'POST /admin/telegram/autoreply failed');
      return reply.code(500).send({ message: 'İşlem gerçekleştirilemedi.' });
    }
  },
};
