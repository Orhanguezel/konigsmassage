// =============================================================
// FILE: src/modules/audit/requestLogger.plugin.ts
// konigsmassage – Request Logger Plugin (Fastify onResponse)
// =============================================================

import type { FastifyPluginAsync } from 'fastify';
import { writeRequestAuditLog, shouldSkipAuditLog } from './service';

type RequestLoggerOpts = Record<never, never>;

export const requestLoggerPlugin: FastifyPluginAsync<RequestLoggerOpts> = async (app, _opts) => {
  app.addHook('onResponse', async (req, reply) => {
    try {
      if (shouldSkipAuditLog(req)) return;

      const reqId = String((req as any).id || (req as any).reqId || '');
      const elapsed =
        typeof (reply as any).elapsedTime === 'number' ? (reply as any).elapsedTime : 0;

      await writeRequestAuditLog({
        req,
        reply,
        reqId,
        responseTimeMs: elapsed,
      });
    } catch (err) {
      (req as any).log?.warn?.({ err }, 'audit_request_log_failed');
    }
  });
};
