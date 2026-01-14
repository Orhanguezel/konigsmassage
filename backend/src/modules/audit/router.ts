// =============================================================
// FILE: src/modules/audit/router.ts
// konigsmassage – Audit Module Router (Single Entry Point)
//   - Attach requestLoggerPlugin ONCE at /api scope
//   - Mount admin endpoints under /api/admin/audit/*
// =============================================================

import type { FastifyInstance } from 'fastify';

import { requestLoggerPlugin } from './requestLogger.plugin';
import { registerAuditAdmin } from './admin.routes';
import { registerAuditStream } from './stream.routes';

export async function registerAudit(api: FastifyInstance, _opts?: unknown) {
  // attach request logger once (for /api scope)
  await api.register(requestLoggerPlugin, {});

  // mount admin endpoints under /api/admin/audit/*
  await api.register(registerAuditAdmin, {});
  await api.register(registerAuditStream, {});
}
