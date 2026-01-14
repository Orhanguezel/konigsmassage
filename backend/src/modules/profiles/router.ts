// src/modules/profiles/router.ts
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { getMyProfile, upsertMyProfile, type ProfileUpsertRequest } from './controller';

export async function registerProfiles(app: FastifyInstance) {
  app.get('/profiles/me', { preHandler: [requireAuth] }, getMyProfile);

  app.put<{ Body: ProfileUpsertRequest }>(
    '/profiles/me',
    { preHandler: [requireAuth] },
    upsertMyProfile,
  );
}
