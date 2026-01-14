// ===================================================================
// FILE: src/modules/dashboard/_queries/resources.lookup.ts
// FINAL — Resource name lookup (resources.title)
// ===================================================================

import { db } from '@/db/client';
import { inArray } from 'drizzle-orm';
import { resources } from '@/modules/resources/schema';

export async function getResourceNameMap(resourceIds: string[]) {
  if (!resourceIds.length) return new Map<string, string>();

  const rows = await db
    .select({
      id: resources.id,
      title: resources.title,
    })
    .from(resources)
    .where(inArray(resources.id, resourceIds));

  return new Map(rows.map((r) => [String(r.id), String(r.title ?? '—')]));
}
