// =============================================================
// FILE: src/modules/userRoles/router.ts
// =============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';
import { listUserRoles, createUserRole, deleteUserRole } from './controller';

export async function registerUserRoles(app: FastifyInstance) {
  const BASE = '/user_roles';

  // Admin guard: önce auth, sonra admin; reply.sent kontrolü konigsmassage pattern
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;
    await requireAdmin(req, reply);
  };

  // Public list (örn: FE bazı durumlarda okuyabilir) – rate limit ile
  app.get(
    BASE,
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' },
      },
    },
    listUserRoles,
  );

  // Admin uçları
  app.post(
    BASE,
    {
      preHandler: adminGuard,
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' },
      },
    },
    createUserRole,
  );

  app.delete(
    `${BASE}/:id`,
    {
      preHandler: adminGuard,
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' },
      },
    },
    deleteUserRole,
  );
}
