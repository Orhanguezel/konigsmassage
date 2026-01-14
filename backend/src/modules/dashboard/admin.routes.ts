// ===================================================================
// FILE: src/modules/dashboard/admin.routes.ts
// FINAL — Königsmassage Admin Dashboard Analytics Routes
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { getDashboardAnalyticsAdmin } from './admin.controller';

const BASE = '/dashboard';

export async function registerDashboardAdmin(app: FastifyInstance) {
  app.get(`${BASE}/analytics`, { preHandler: [requireAuth] }, getDashboardAnalyticsAdmin);
}
