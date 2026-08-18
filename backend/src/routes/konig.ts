import type { FastifyInstance } from 'fastify';
import { registerGutschein } from '@/modules/gutschein/router';
import { registerGutscheinAdmin } from '@/modules/gutschein/admin.routes';
import { registerReportsAdmin } from '@/modules/reports/admin.routes';

export async function registerKonigRoutes(api: FastifyInstance) {
  await registerGutschein(api);

  // NOT: /custom_pages alias'i artik @vps/shared-backend/modules/customPages
  // tarafindan dogrudan sunuluyor (hem tire hem alt-cizgi). Buradaki redirect
  // kopyasi FST_ERR_DUPLICATED_ROUTE'a yol aciyordu.
}

export async function registerKonigAdmin(adminApi: FastifyInstance) {
  await adminApi.register(registerGutscheinAdmin);
  await adminApi.register(registerReportsAdmin);
}
