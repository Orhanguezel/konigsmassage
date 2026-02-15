// =============================================================
// FILE: src/modules/audit/admin.routes.ts
// konigsmassage – Audit Admin Routes (Viewer)
//   - Mounted under /api/admin
//   - Final URLs:
//       GET /api/admin/audit/request-logs
//       GET /api/admin/audit/auth-events
//       GET /api/admin/audit/metrics/daily
// =============================================================

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// Fallback guards (only used if app.requireAuth/requireAdmin not present)
import { requireAuth as requireAuthMw } from '@/common/middleware/auth';
import { requireAdmin as requireAdminMw } from '@/common/middleware/roles';

import {
  listAuditAuthEventsAdmin,
  listAuditRequestLogsAdmin,
  getAuditMetricsDailyAdmin,
  getAuditGeoStatsAdmin,
  clearAuditLogsAdmin,
} from './admin.controller';

const BASE = '/audit';

export async function registerAuditAdmin(app: FastifyInstance) {
  const requireAuth = (app as any).requireAuth as
    | ((req: FastifyRequest, reply: FastifyReply) => Promise<void>)
    | undefined;

  const requireAdmin = (app as any).requireAdmin as
    | ((req: FastifyRequest, reply: FastifyReply) => Promise<void>)
    | undefined;

  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    if (typeof requireAuth === 'function') {
      await requireAuth(req, reply);
      if (reply.sent) return;
    } else {
      await requireAuthMw(req, reply);
      if (reply.sent) return;
    }

    if (typeof requireAdmin === 'function') {
      await requireAdmin(req, reply);
    } else {
      await requireAdminMw(req, reply);
    }
  };

  const ph = { preHandler: adminGuard, config: { auth: true, admin: true } };

  // GET /api/admin/audit/request-logs
  app.get(`${BASE}/request-logs`, ph, listAuditRequestLogsAdmin);

  // GET /api/admin/audit/auth-events
  app.get(`${BASE}/auth-events`, ph, listAuditAuthEventsAdmin);

  // GET /api/admin/audit/metrics/daily
  app.get(`${BASE}/metrics/daily`, ph, getAuditMetricsDailyAdmin);

  // GET /api/admin/audit/geo-stats
  app.get(`${BASE}/geo-stats`, ph, getAuditGeoStatsAdmin);

  // DELETE /api/admin/audit/clear?target=all|requests|auth
  app.delete(`${BASE}/clear`, ph, clearAuditLogsAdmin);
}
