// ===================================================================
// FILE: src/modules/dashboard/_queries/services.lookup.ts
// Service name lookup (services_i18n, de-first fallback)
// ===================================================================

import { db } from '@/db/client';
import { servicesI18n } from '@/modules/services/schema';
import { and, inArray, sql } from 'drizzle-orm';

export async function getServiceNameMap(serviceIds: string[]) {
  if (!serviceIds.length) return new Map<string, string>();

  const rows = await db
    .select({
      service_id: servicesI18n.service_id,
      name: servicesI18n.name,
      locale: servicesI18n.locale,
    })
    .from(servicesI18n)
    .where(
      and(
        inArray(servicesI18n.service_id, serviceIds),
        sql`${servicesI18n.locale} IN ('de', 'en', 'tr')`,
      ),
    );

  const map = new Map<string, string>();
  for (const locale of ['de', 'en', 'tr']) {
    for (const row of rows) {
      const id = String(row.service_id ?? '');
      if (!id || map.has(id)) continue;
      if (String(row.locale ?? '') === locale) {
        map.set(id, String(row.name ?? '—'));
      }
    }
  }

  for (const row of rows) {
    const id = String(row.service_id ?? '');
    if (!id || map.has(id)) continue;
    map.set(id, String(row.name ?? '—'));
  }

  return map;
}
