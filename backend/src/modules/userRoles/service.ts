// =============================================================
// FILE: src/modules/userRoles/service.ts
// =============================================================

import { db } from "@/db/client";
import { userRoles } from "./schema";
import { eq } from "drizzle-orm";
import type { RoleName } from "./validation";

const ROLE_WEIGHT: Record<RoleName, number> = {
  admin: 3,
  moderator: 2,
  user: 1,
};

/** Kullanıcının rollerini çekip en yüksek öncelikli olanı döndürür. */
export async function getPrimaryRole(userId: string): Promise<RoleName> {
  if (!userId) return "user";

  let rows: Array<{ role: string }> = [];
  try {
    rows = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.user_id, userId));
  } catch {
    return "user";
  }

  if (!rows?.length) return "user";

  let best: RoleName = "user";
  let bestWeight = 0;

  for (const r of rows) {
    const w = ROLE_WEIGHT[r.role as RoleName] ?? 0;
    if (w > bestWeight) {
      best = r.role as RoleName;
      bestWeight = w;
    }
  }
  return best;
}
