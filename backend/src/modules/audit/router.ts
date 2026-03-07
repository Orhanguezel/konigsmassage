// =============================================================
// FILE: src/modules/audit/router.ts
// konigsmassage – Audit Module Router (Single Entry Point)
//   - Attach requestLoggerPlugin ONCE at /api scope
//   - Mount admin endpoints under /api/admin/audit/*
// =============================================================

import type { FastifyInstance } from 'fastify';

import { env } from '@/core/env';
import { requestLoggerPlugin } from './requestLogger.plugin';
import { registerAuditAdmin } from './admin.routes';
import { registerAuditStream } from './stream.routes';
import { purgeAuditLogsOlderThan } from './repository';

let retentionStarted = false;

function startAuditRetention(api: FastifyInstance) {
  if (retentionStarted) return;
  retentionStarted = true;

  const retentionDays = Math.max(1, Number(env.AUDIT_RETENTION_DAYS || 90));
  const everyMinutes = Math.max(5, Number(env.AUDIT_RETENTION_CLEANUP_MINUTES || 360));

  const run = async () => {
    try {
      const result = await purgeAuditLogsOlderThan(retentionDays);
      const total =
        Number(result.deletedRequests ?? 0) +
        Number(result.deletedAuth ?? 0) +
        Number(result.deletedEvents ?? 0);

      if (total > 0) {
        api.log.info(
          {
            retentionDays,
            deletedRequests: result.deletedRequests,
            deletedAuth: result.deletedAuth,
            deletedEvents: result.deletedEvents,
          },
          'audit_retention_cleanup_completed',
        );
      }
    } catch (err) {
      api.log.warn({ err, retentionDays }, 'audit_retention_cleanup_failed');
    }
  };

  void run();
  const timer = setInterval(() => {
    void run();
  }, everyMinutes * 60 * 1000);
  timer.unref?.();
}

export async function registerAudit(api: FastifyInstance, _opts?: unknown) {
  // attach request logger once (for /api scope)
  await api.register(requestLoggerPlugin, {});
  startAuditRetention(api);

  // mount admin endpoints under /api/admin/audit/*
  await api.register(registerAuditAdmin, { prefix: '/admin' });
  await api.register(registerAuditStream, { prefix: '/admin' });
}
