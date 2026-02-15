// ===================================================================
// FILE: src/modules/telegram/admin.routes.ts
// Telegram admin routes
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';
import { TelegramAdminController } from './admin.controller';
import { telegramEventCtrl, telegramSendCtrl, telegramTestCtrl } from './controller';

const BASE = '/telegram';

export async function registerTelegramAdmin(app: FastifyInstance) {
  const guards = { preHandler: [requireAuth, requireAdmin] };

  app.get(`${BASE}/inbound`, guards, TelegramAdminController.listInbound);

  app.get(`${BASE}/autoreply`, guards, TelegramAdminController.getAutoReply);
  app.post(`${BASE}/autoreply`, guards, TelegramAdminController.updateAutoReply);

  app.post(`${BASE}/test`, guards, telegramTestCtrl);
  app.post(`${BASE}/send`, guards, telegramSendCtrl);
  app.post(`${BASE}/event`, guards, telegramEventCtrl);
}
