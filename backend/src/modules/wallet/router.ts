import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import * as controller from './controller';

export async function registerWallet(app: FastifyInstance) {
  const BASE = '/wallet';

  app.get(BASE, { preHandler: [requireAuth] }, controller.getMyWallet);
  app.get(`${BASE}/transactions`, { preHandler: [requireAuth] }, controller.listMyTransactions);

  app.get(`${BASE}/deposit-methods`, { preHandler: [requireAuth] }, controller.getDepositMethods);
  app.post(`${BASE}/deposits`, { preHandler: [requireAuth] }, controller.createDepositRequest);
  app.post(`${BASE}/deposits/:id/paypal/capture`, { preHandler: [requireAuth] }, controller.captureDepositPaypal);
}
