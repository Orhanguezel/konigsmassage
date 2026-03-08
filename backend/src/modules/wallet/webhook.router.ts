// src/modules/wallet/webhook.router.ts
// PayPal webhook route (public — no auth required)

import type { FastifyInstance } from 'fastify';
import { paypalWebhookHandler } from './webhook.controller';

export async function registerPaypalWebhook(app: FastifyInstance) {
  app.post('/paypal/webhook', { config: { public: true } }, paypalWebhookHandler);
}
